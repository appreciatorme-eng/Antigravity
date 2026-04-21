/* ------------------------------------------------------------------
 * Cron endpoint -- Morning Briefing
 *
 * Triggers `generateAndQueueBriefings()` to queue WhatsApp briefings
 * for every eligible operator. Designed to be called once daily
 * (e.g. 07:00 local time via Vercel Cron or an external scheduler).
 *
 * Auth follows the shared cron authorization helper:
 *   - CRON_SECRET / NOTIFICATION_CRON_SECRET header or bearer
 *   - HMAC-signed request with replay detection
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { generateAndQueueBriefings } from "@/lib/assistant/briefing";
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

    const result = await generateAndQueueBriefings();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Failed to generate briefings"),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
