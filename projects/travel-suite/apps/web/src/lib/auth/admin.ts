import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";

type RequestLike = Request & {
  headers: {
    get(name: string): string | null;
  };
};

type AdminRole = "admin" | "super_admin";

type AdminProfile = {
  id: string;
  role: string | null;
  organization_id: string | null;
};

type RequireAdminFailure = {
  ok: false;
  response: NextResponse;
};

type RequireAdminSuccess = {
  ok: true;
  userId: string;
  organizationId: string | null;
  isSuperAdmin: boolean;
  role: AdminRole;
  profile: AdminProfile;
  adminClient: ReturnType<typeof createAdminClient>;
};

export type RequireAdminResult = RequireAdminFailure | RequireAdminSuccess;

type RequireAdminOptions = {
  requireOrganization?: boolean;
};

const ANON_AUTH_FAILURE_SAMPLE_RATE = 0.2;
const AUTH_FAILURE_TELEMETRY_LIMIT = 15;
const AUTH_FAILURE_TELEMETRY_WINDOW_MS = 5 * 60 * 1000;

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function routePathFromRequest(request: RequestLike): string {
  try {
    return new URL(request.url).pathname || "unknown";
  } catch {
    return "unknown";
  }
}

function normalizeBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

function parseRole(input: string | null): AdminRole | null {
  const role = (input || "").toLowerCase();
  if (role === "admin") return "admin";
  if (role === "super_admin") return "super_admin";
  return null;
}

function sanitizeKv(value: string): string {
  return value.replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

function getClientIp(request: RequestLike): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first?.trim()) return first.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

function shouldRecordAuthFailure(params: {
  userId?: string | null;
  reason: string;
}): boolean {
  if (params.userId) return true;
  if (params.reason !== "missing_or_invalid_auth") return true;
  return Math.random() < ANON_AUTH_FAILURE_SAMPLE_RATE;
}

async function recordAdminAuthFailure(params: {
  adminClient: ReturnType<typeof createAdminClient>;
  request: RequestLike;
  reason: string;
  userId?: string | null;
  organizationId?: string | null;
}) {
  try {
    if (
      !shouldRecordAuthFailure({ userId: params.userId, reason: params.reason })
    ) {
      return;
    }

    const route = routePathFromRequest(params.request);
    const method = (params.request.method || "GET").toUpperCase();
    const clientIp = getClientIp(params.request);
    const telemetryFingerprint = [
      params.userId ? `user:${params.userId}` : `ip:${clientIp}`,
      params.reason,
      method,
      route,
      params.organizationId || "unknown",
    ].join("|");

    const telemetryLimit = await enforceRateLimit({
      identifier: telemetryFingerprint,
      limit: AUTH_FAILURE_TELEMETRY_LIMIT,
      windowMs: AUTH_FAILURE_TELEMETRY_WINDOW_MS,
      prefix: "admin_auth_failure_telemetry",
    });
    if (!telemetryLimit.success) {
      return;
    }

    const nowIso = new Date().toISOString();
    const body = [
      `reason=${sanitizeKv(params.reason)}`,
      `route=${sanitizeKv(route)}`,
      `method=${sanitizeKv(method)}`,
      `organization_id=${sanitizeKv(params.organizationId || "unknown")}`,
    ].join("|");

    await params.adminClient.from("notification_logs").insert({
      notification_type: "admin_auth_failure",
      recipient_id: params.userId || null,
      recipient_type: "admin",
      title: "Admin access denied",
      body,
      status: "failed",
      sent_at: nowIso,
    });
  } catch {
    // Auth-failure telemetry is best-effort.
  }
}

async function getUserIdFromRequest(
  request: RequestLike,
  adminClient: ReturnType<typeof createAdminClient>,
) {
  const token = normalizeBearerToken(request.headers.get("authorization"));

  if (token) {
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);
    if (!authError && user) {
      return user.id;
    }
  }

  try {
    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function requireAdmin(
  request: RequestLike,
  options: RequireAdminOptions = {},
): Promise<RequireAdminResult> {
  const requireOrganization = options.requireOrganization !== false;
  const adminClient = createAdminClient();
  const userId = await getUserIdFromRequest(request, adminClient);
  if (!userId) {
    void recordAdminAuthFailure({
      adminClient,
      request,
      reason: "missing_or_invalid_auth",
    });
    return {
      ok: false,
      response: jsonError("Unauthorized", 401),
    };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    void recordAdminAuthFailure({
      adminClient,
      request,
      userId,
      reason: "profile_missing_or_unreadable",
    });
    return {
      ok: false,
      response: jsonError("Forbidden", 403),
    };
  }

  const parsedRole = parseRole(profile.role);
  if (!parsedRole) {
    void recordAdminAuthFailure({
      adminClient,
      request,
      userId,
      organizationId: profile.organization_id,
      reason: "role_not_admin",
    });
    return {
      ok: false,
      response: jsonError("Forbidden", 403),
    };
  }

  if (
    requireOrganization &&
    !profile.organization_id &&
    parsedRole !== "super_admin"
  ) {
    void recordAdminAuthFailure({
      adminClient,
      request,
      userId,
      reason: "organization_not_configured",
    });
    return {
      ok: false,
      response: jsonError("Admin organization not configured", 400),
    };
  }

  return {
    ok: true,
    userId,
    organizationId: profile.organization_id,
    isSuperAdmin: parsedRole === "super_admin",
    role: parsedRole,
    profile,
    adminClient,
  };
}
