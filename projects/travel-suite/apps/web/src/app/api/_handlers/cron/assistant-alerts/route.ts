/* ------------------------------------------------------------------
 * Cron endpoint -- Proactive Alerts
 *
 * Triggers `generateAndQueueAlerts()` to detect and queue WhatsApp
 * alerts for issues needing operator attention. Designed to run
 * periodically (e.g. every 4 hours via Vercel Cron or scheduler).
 *
 * Auth follows the same pattern as schedule-followups:
 *   - CRON_SECRET / NOTIFICATION_CRON_SECRET header or bearer
 *   - HMAC-signed request
 *   - Admin bearer token
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronSecretBearer, isCronSecretHeader } from "@/lib/security/cron-auth";
import { isServiceRoleBearer } from "@/lib/security/service-role-auth";
import { generateAndQueueAlerts } from "@/lib/assistant/alerts";

// ---------------------------------------------------------------------------
// Auth helpers (mirrors schedule-followups pattern)
// ---------------------------------------------------------------------------

const supabaseAdmin = createAdminClient();

async function isAdminBearerToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.substring(7);

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) return false;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  return profile?.role === "admin" || profile?.role === "super_admin";
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const headerSecret =
      request.headers.get("x-cron-secret") ||
      request.headers.get("x-notification-cron-secret") ||
      "";

    const secretAuthorized = isCronSecretHeader(headerSecret);
    const bearerCronAuthorized = isCronSecretBearer(authHeader);
    const adminAuthorized = await isAdminBearerToken(authHeader);

    if (
      !secretAuthorized &&
      !bearerCronAuthorized &&
      !adminAuthorized
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateAndQueueAlerts();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate alerts",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
