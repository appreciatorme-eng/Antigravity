/* ------------------------------------------------------------------
 * Cron endpoint -- Weekly Insights Digest
 *
 * Triggers `generateAndQueueDigests()` to queue WhatsApp digest
 * messages for every eligible operator. Designed to run once weekly
 * (e.g. Monday 03:00 UTC / 08:30 IST via Vercel Cron or scheduler).
 *
 * Cron schedule: 0 3 * * 1
 *
 * Auth follows the shared cron authorization helper:
 *   - CRON_SECRET / NOTIFICATION_CRON_SECRET header or bearer
 *   - HMAC-signed request with replay detection
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { generateAndQueueDigests } from "@/lib/assistant/weekly-digest";
import { safeErrorMessage } from "@/lib/security/safe-error";

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const cronAuth = await authorizeCronRequest(request, {
      secretHeaderNames: ["x-cron-secret", "x-notification-cron-secret"],
      replayWindowMs: 10 * 60 * 1000,
    });
    if (!cronAuth.authorized) {
      return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
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
