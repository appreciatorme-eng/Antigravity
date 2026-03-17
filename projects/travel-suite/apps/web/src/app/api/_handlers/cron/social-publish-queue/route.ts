/* ------------------------------------------------------------------
 * Cron endpoint — Social Publish Queue
 *
 * Runs every 15 minutes to process pending social media posts from the
 * queue. Checks for posts scheduled in the past that haven't been
 * published yet, and publishes them to Instagram or Facebook via the
 * Meta Graph API.
 *
 * Auth uses the shared cron authorization helper with replay detection.
 * Max duration is 60s (Vercel Hobby plan limit).
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { processSocialPublishQueue } from "@/lib/social/process-publish-queue.server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const cronAuth = await authorizeCronRequest(request, {
      secretHeaderNames: ["x-cron-secret", "x-social-cron-secret"],
      replayWindowMs: 10 * 60 * 1000,
    });
    if (!cronAuth.authorized) {
      return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
    }

    const result = await processSocialPublishQueue();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      results: result.results,
    });
  } catch (error) {
    logError("[cron/social-publish-queue] Fatal error", error);
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Failed to process social publish queue"),
      },
      { status: 500 },
    );
  }
}
