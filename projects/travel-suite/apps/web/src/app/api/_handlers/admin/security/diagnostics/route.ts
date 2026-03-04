import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const SECURITY_DIAGNOSTICS_RATE_LIMIT_MAX = 30;
const SECURITY_DIAGNOSTICS_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function attachRateLimitHeaders(
  response: NextResponse,
  rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
  response.headers.set("retry-after", String(retryAfterSeconds));
  response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
  response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
  response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
  return response;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
    }

    if (!admin.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: SECURITY_DIAGNOSTICS_RATE_LIMIT_MAX,
      windowMs: SECURITY_DIAGNOSTICS_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:security:diagnostics",
    });
    if (!rateLimit.success) {
      const response = NextResponse.json(
        { error: "Too many security diagnostics requests. Please retry later." },
        { status: 429 }
      );
      return attachRateLimitHeaders(response, rateLimit);
    }

    const now = Date.now();
    const fiveMinAgoIso = new Date(now - 5 * 60 * 1000).toISOString();
    const oneHourAgoIso = new Date(now - 60 * 60 * 1000).toISOString();

    const [
      { count: access5m = 0 },
      { count: access1h = 0 },
      { data: uniqueIps = [] },
      { data: topTokens = [] },
      { data: rlsDiagnostics, error: rlsError },
    ] = await Promise.all([
      admin.adminClient
        .from("trip_location_share_access_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", fiveMinAgoIso),
      admin.adminClient
        .from("trip_location_share_access_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgoIso),
      admin.adminClient
        .from("trip_location_share_access_logs")
        .select("ip_hash")
        .gte("created_at", oneHourAgoIso)
        .limit(5000),
      admin.adminClient
        .from("trip_location_share_access_logs")
        .select("share_token_hash")
        .gte("created_at", oneHourAgoIso)
        .limit(5000),
      admin.adminClient.rpc("get_rls_diagnostics"),
    ]);

    if (rlsError) {
      return NextResponse.json({ error: rlsError.message }, { status: 500 });
    }

    const uniqueIpCount = new Set((uniqueIps || []).map((row) => row.ip_hash)).size;

    const tokenCountMap = new Map<string, number>();
    for (const row of topTokens || []) {
      tokenCountMap.set(row.share_token_hash, (tokenCountMap.get(row.share_token_hash) || 0) + 1);
    }

    const topShareHashes = Array.from(tokenCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hash, count]) => ({ hash_prefix: hash.slice(0, 12), count }));

    return NextResponse.json({
      checked_at: new Date().toISOString(),
      cron_auth: {
        legacy_secret_configured: Boolean(process.env.NOTIFICATION_CRON_SECRET),
        signing_secret_configured: Boolean(process.env.NOTIFICATION_SIGNING_SECRET),
        service_role_bearer_supported: true,
      },
      live_share_rate_limit: {
        threshold_per_minute: 40,
        access_requests_last_5m: Number(access5m || 0),
        access_requests_last_1h: Number(access1h || 0),
        unique_ip_hashes_last_1h: uniqueIpCount,
        top_share_hash_prefixes_last_1h: topShareHashes,
      },
      rls: rlsDiagnostics,
      firebase_edge_function: {
        service_account_secret_configured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
        project_id_configured: Boolean(process.env.FIREBASE_PROJECT_ID),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
