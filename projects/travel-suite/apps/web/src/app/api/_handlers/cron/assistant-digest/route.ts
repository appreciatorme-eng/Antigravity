/* ------------------------------------------------------------------
 * Cron endpoint -- Weekly Insights Digest
 *
 * Triggers `generateAndQueueDigests()` to queue WhatsApp digest
 * messages for every eligible operator. Designed to run once weekly
 * (e.g. Monday 03:00 UTC / 08:30 IST via Vercel Cron or scheduler).
 *
 * Cron schedule: 0 3 * * 1
 *
 * Auth follows the same pattern as assistant-briefing / assistant-alerts:
 *   - CRON_SECRET / NOTIFICATION_CRON_SECRET header or bearer
 *   - HMAC-signed request
 *   - Admin bearer token
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import {
  isCronSecretBearer,
  isCronSecretHeader,
} from "@/lib/security/cron-auth";
import { isAdminBearerToken } from "@/lib/security/admin-bearer-auth";
import { generateAndQueueDigests } from "@/lib/assistant/weekly-digest";
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

    const result = await generateAndQueueDigests();

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Failed to generate weekly digests"),
      },
      { status: 500 },
    );
  }
}
