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
import { apiError } from "@/lib/api-response";
import { isCronSecretBearer, isCronSecretHeader } from "@/lib/security/cron-auth";
import { isAdminBearerToken } from "@/lib/security/admin-bearer-auth";
import { generateAndQueueAlerts } from "@/lib/assistant/alerts";
import { safeErrorMessage } from "@/lib/security/safe-error";

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
      return apiError("Unauthorized", 401);
    }

    const result = await generateAndQueueAlerts();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Failed to generate alerts"),
      },
      { status: 500 },
    );
  }
}
