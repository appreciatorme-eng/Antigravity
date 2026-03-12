/* ------------------------------------------------------------------
 * Cron endpoint -- Proactive Alerts
 *
 * Triggers `generateAndQueueAlerts()` to detect and queue WhatsApp
 * alerts for issues needing operator attention. Designed to run
 * periodically (e.g. every 4 hours via Vercel Cron or scheduler).
 *
 * Auth follows the shared cron authorization helper:
 *   - CRON_SECRET / NOTIFICATION_CRON_SECRET header or bearer
 *   - HMAC-signed request with replay detection
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { generateAndQueueAlerts } from "@/lib/assistant/alerts";
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
