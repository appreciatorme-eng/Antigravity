/* ------------------------------------------------------------------
 * Cron endpoint — Social Metrics Sync
 *
 * Runs daily at 02:00 UTC. Fetches performance metrics for all published
 * posts from the last 30 days via Meta Graph API and stores them in
 * social_post_metrics. Handles rate limiting gracefully by stopping
 * processing and resuming on the next run.
 *
 * Auth uses the shared cron authorization helper with replay detection.
 * Max duration is 60s (Vercel Hobby plan limit).
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { logError } from "@/lib/observability/logger";
import { syncSocialMetrics } from "@/lib/social/sync-metrics.server";

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
    const result = await syncSocialMetrics({
      maxDurationMs: 50_000,
      lookbackDays: 30,
      limit: 100,
      loggerPrefix: "[cron/social-sync-metrics]",
    });

    return NextResponse.json({
      ...result,
    });
  } catch (error) {
    logError("[cron/social-sync-metrics] Fatal error", error);
    return NextResponse.json(
      {
        error: safeErrorMessage(error, "Failed to sync social metrics"),
      },
      { status: 500 }
    );
  }
}
