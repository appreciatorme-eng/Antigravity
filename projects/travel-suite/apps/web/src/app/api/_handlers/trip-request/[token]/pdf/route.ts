import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_ITINERARY_BRANDING,
  normalizeItineraryTemplateId,
} from "@/components/pdf/itinerary-types";
import { apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";
import {
  normalizeServerPdfItinerary,
  renderItineraryPdfBuffer,
  sanitizeItineraryPdfFileName,
} from "@/lib/pdf/itinerary-pdf-server";
import { enforcePublicRouteRateLimit } from "@/lib/security/public-rate-limit";
import { loadTripRequestBusinessBranding } from "@/lib/whatsapp/trip-intake.server";
import type { ItineraryResult } from "@/types/itinerary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TRIP_REQUEST_TOKEN_REGEX = /^[A-Za-z0-9_-]{16,200}$/;
const TRIP_REQUEST_PDF_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_TRIP_REQUEST_PDF_RATE_LIMIT_MAX || "20",
);
const TRIP_REQUEST_PDF_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_TRIP_REQUEST_PDF_RATE_LIMIT_WINDOW_MS || 60_000,
);

function readErrorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { message?: unknown; details?: unknown; hint?: unknown };
  return [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function isMissingFormTokenColumnError(error: unknown): boolean {
  const text = readErrorText(error);
  return text.includes("form_token") && (text.includes("column") || text.includes("schema cache"));
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeItinerary(record: {
  raw_data: unknown;
  trip_title: string | null;
  destination: string | null;
  duration_days: number | null;
  summary: string | null;
}): ItineraryResult {
  const raw = (record.raw_data && typeof record.raw_data === "object" ? record.raw_data : {}) as Partial<ItineraryResult>;
  return {
    ...raw,
    trip_title: raw.trip_title || record.trip_title || "Trip Itinerary",
    destination: raw.destination || record.destination || "Destination",
    duration_days: raw.duration_days || record.duration_days || raw.days?.length || 1,
    summary: raw.summary || record.summary || "Detailed itinerary enclosed.",
    days: Array.isArray(raw.days) ? raw.days : [],
  } as ItineraryResult;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!TRIP_REQUEST_TOKEN_REGEX.test(token)) {
    return apiError("Invalid trip request token", 400);
  }

  const rateLimitResponse = await enforcePublicRouteRateLimit(request, {
    identifier: `${token}:pdf`,
    limit: TRIP_REQUEST_PDF_RATE_LIMIT_MAX,
    windowMs: TRIP_REQUEST_PDF_RATE_LIMIT_WINDOW_MS,
    prefix: "public:trip-request:pdf",
    message: "Too many PDF requests. Please try again later.",
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const admin = createAdminClient();

  const { data: draft, error: draftError } = await admin
    .from("assistant_trip_requests")
    .select("organization_id, client_name, created_itinerary_id, status")
    .eq("form_token", token)
    .maybeSingle();

  let resolvedDraft = draft;
  if ((!resolvedDraft || draftError) && (isMissingFormTokenColumnError(draftError) || isUuidLike(token))) {
    const { data: fallbackDraft, error: fallbackError } = await admin
      .from("assistant_trip_requests")
      .select("organization_id, client_name, created_itinerary_id, status")
      .eq("id", token)
      .maybeSingle();

    if (!fallbackError && fallbackDraft) {
      resolvedDraft = fallbackDraft;
    }
  }

  if (!resolvedDraft || resolvedDraft.status !== "completed" || !resolvedDraft.created_itinerary_id) {
    return apiError("Trip request PDF not found", 404);
  }

  const { data: itinerary, error: itineraryError } = await admin
    .from("itineraries")
    .select("user_id, raw_data, trip_title, destination, duration_days, summary")
    .eq("id", resolvedDraft.created_itinerary_id)
    .maybeSingle();

  if (itineraryError || !itinerary) {
    return apiError("Itinerary not found", 404);
  }

  const businessBranding = await loadTripRequestBusinessBranding({
    organizationId: resolvedDraft.organization_id,
    operatorUserId: (itinerary as { user_id?: string | null }).user_id ?? null,
  });

  const { data: shared } = await admin
    .from("shared_itineraries")
    .select("template_id")
    .eq("itinerary_id", resolvedDraft.created_itinerary_id)
    .maybeSingle();

  try {
    const normalizedItinerary = normalizeServerPdfItinerary(
      normalizeItinerary(itinerary as {
        raw_data: unknown;
        trip_title: string | null;
        destination: string | null;
        duration_days: number | null;
        summary: string | null;
      }),
    );
    const fileName = `${sanitizeItineraryPdfFileName(
      normalizedItinerary.trip_title || "trip-itinerary",
    )}.pdf`;
    const pdf = await renderItineraryPdfBuffer({
      itinerary: normalizedItinerary,
      requestUrl: request.url,
      template: normalizeItineraryTemplateId(
        (shared as { template_id?: string | null } | null)?.template_id
          ?? null,
      ),
      branding: {
        ...DEFAULT_ITINERARY_BRANDING,
        companyName: businessBranding.organizationName || DEFAULT_ITINERARY_BRANDING.companyName,
        logoUrl: businessBranding.organizationLogoUrl || null,
        primaryColor: businessBranding.organizationPrimaryColor || DEFAULT_ITINERARY_BRANDING.primaryColor,
        contactPhone: businessBranding.organizationContactPhone || null,
        contactEmail: businessBranding.organizationContactEmail || null,
        clientName: resolvedDraft.client_name || null,
      },
      fileName,
      skipImageEnrichment: true,
    });

    return new NextResponse(new Uint8Array(pdf.buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
        "X-Itinerary-PDF-Renderer": pdf.renderer,
        ...(pdf.printErrorMessage
          ? { "X-Itinerary-PDF-Error": encodeURIComponent(pdf.printErrorMessage).slice(0, 240) }
          : {}),
      },
    });
  } catch (error) {
    logError("[trip-request] failed to render PDF", error, { token });
    return apiError("Failed to render itinerary PDF", 500);
  }
}
