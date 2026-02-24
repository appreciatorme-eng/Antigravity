import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  SERVICE_REGION_OPTIONS,
  SPECIALTY_OPTIONS,
  mergeMarketplaceOptions,
  normalizeMarketplaceOptionList,
} from "@/lib/marketplace-options";
import { getCachedJson, setCachedJson } from "@/lib/cache/upstash";
import { sanitizeText } from "@/lib/security/sanitize";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import {
  getRequestContext,
  getRequestId,
  logError,
  logEvent,
} from "@/lib/observability/logger";

const supabaseAdmin = createAdminClient();
const CACHE_KEY = "marketplace:options:v1";
const CACHE_TTL_SECONDS = 60 * 60;
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
};

type DynamicOptionCatalog = {
  service_regions: string[];
  specialties: string[];
};

type MarketplaceProfileOptionRow = {
  service_regions: unknown;
  specialties: unknown;
};

type MarketplaceOptionRow = {
  kind?: unknown;
  value?: unknown;
  label?: unknown;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown error";
}

function isMissingRelationError(error: unknown, relation: string): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string; details?: string; hint?: string };
  const blob = `${record.message || ""} ${record.details || ""} ${record.hint || ""}`.toLowerCase();
  return (
    record.code === "42P01" ||
    blob.includes(`relation "${relation.toLowerCase()}" does not exist`) ||
    blob.includes(`could not find the table '${relation.toLowerCase()}'`)
  );
}

function appendOption(target: Map<string, string>, value: unknown) {
  const normalized = sanitizeText(value, { maxLength: 80 });
  if (!normalized) return;
  const key = normalized.toLowerCase();
  if (!target.has(key)) {
    target.set(key, normalized);
  }
}

async function getAuthContext(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data?.user) {
      return { user: data.user };
    }
  }

  const serverClient = await createServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  return { user: user || null };
}

async function loadFromMarketplaceOptionsTable(): Promise<DynamicOptionCatalog | null> {
  const queryClient = supabaseAdmin as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          limit: (count: number) => Promise<{
            data: MarketplaceOptionRow[] | null;
            error: unknown;
          }>;
        };
      };
    };
  };

  const { data, error } = await queryClient
    .from("marketplace_options")
    .select("kind, value, label, is_active")
    .eq("is_active", true)
    .limit(1000);

  if (error) {
    if (isMissingRelationError(error, "marketplace_options")) {
      return null;
    }
    throw new Error(getErrorMessage(error));
  }

  const regions = new Map<string, string>();
  const specialties = new Map<string, string>();

  for (const row of data || []) {
    const kind = sanitizeText(row.kind, { maxLength: 40 }).toLowerCase();
    const label = sanitizeText(row.label ?? row.value, { maxLength: 80 });
    if (!label) continue;

    if (kind === "service_region" || kind === "region" || kind === "service_regions") {
      appendOption(regions, label);
      continue;
    }

    if (kind === "specialty" || kind === "specialties") {
      appendOption(specialties, label);
    }
  }

  return {
    service_regions: Array.from(regions.values()),
    specialties: Array.from(specialties.values()),
  };
}

async function loadFromMarketplaceProfiles(): Promise<DynamicOptionCatalog> {
  const { data, error } = await supabaseAdmin
    .from("marketplace_profiles")
    .select("service_regions, specialties")
    .limit(2000);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const regions = new Map<string, string>();
  const specialties = new Map<string, string>();
  for (const row of (data || []) as MarketplaceProfileOptionRow[]) {
    for (const region of normalizeMarketplaceOptionList(row.service_regions, 120)) {
      appendOption(regions, region);
    }
    for (const specialty of normalizeMarketplaceOptionList(row.specialties, 120)) {
      appendOption(specialties, specialty);
    }
  }

  return {
    service_regions: Array.from(regions.values()),
    specialties: Array.from(specialties.values()),
  };
}

function withRequestId(body: unknown, requestId: string, init?: ResponseInit) {
  const payload =
    body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), request_id: requestId }
      : body;
  const response = NextResponse.json(payload, init);
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const requestContext = getRequestContext(request, requestId);
  try {
    const { user } = await getAuthContext(request);
    if (!user) {
      logEvent("warn", "Marketplace options unauthorized", requestContext);
      return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
    }

    const refresh = request.nextUrl.searchParams.get("refresh");
    const forceRefresh = refresh === "1" || refresh === "true";

    if (!forceRefresh) {
      const cached = await getCachedJson<{
        service_regions: string[];
        specialties: string[];
        source: string;
        generated_at: string;
      }>(CACHE_KEY);
      if (cached) {
        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace options served from cache", {
          ...requestContext,
          user_id: user.id,
          source: cached.source,
          durationMs,
        });
        void captureOperationalMetric("api.marketplace.options.get", {
          request_id: requestId,
          user_id: user.id,
          source: cached.source,
          cache_hit: true,
          duration_ms: durationMs,
        });
        return withRequestId(cached, requestId, { headers: CACHE_HEADERS });
      }
    }

    let source = "defaults";
    let dynamic: DynamicOptionCatalog = { service_regions: [], specialties: [] };

    const fromTable = await loadFromMarketplaceOptionsTable();
    if (fromTable) {
      dynamic = fromTable;
      source = "marketplace_options";
    } else {
      dynamic = await loadFromMarketplaceProfiles();
      if (dynamic.service_regions.length > 0 || dynamic.specialties.length > 0) {
        source = "marketplace_profiles";
      }
    }

    const payload = {
      service_regions: mergeMarketplaceOptions(SERVICE_REGION_OPTIONS, dynamic.service_regions),
      specialties: mergeMarketplaceOptions(SPECIALTY_OPTIONS, dynamic.specialties),
      source,
      generated_at: new Date().toISOString(),
    };

    await setCachedJson(CACHE_KEY, payload, CACHE_TTL_SECONDS);
    const durationMs = Date.now() - startedAt;
    logEvent("info", "Marketplace options generated", {
      ...requestContext,
      user_id: user.id,
      source,
      service_regions: payload.service_regions.length,
      specialties: payload.specialties.length,
      durationMs,
    });
    void captureOperationalMetric("api.marketplace.options.get", {
      request_id: requestId,
      user_id: user.id,
      source,
      cache_hit: false,
      service_regions: payload.service_regions.length,
      specialties: payload.specialties.length,
      duration_ms: durationMs,
    });
    return withRequestId(payload, requestId, { headers: CACHE_HEADERS });
  } catch (error) {
    const message = getErrorMessage(error);
    logError("Marketplace options fetch failed", error, requestContext);
    void captureOperationalMetric("api.marketplace.options.get.error", {
      request_id: requestId,
      error: message,
    });
    return withRequestId(
      {
        service_regions: SERVICE_REGION_OPTIONS,
        specialties: SPECIALTY_OPTIONS,
        source: "fallback_defaults",
        warning: message,
      },
      requestId,
      { status: 200, headers: CACHE_HEADERS }
    );
  }
}
