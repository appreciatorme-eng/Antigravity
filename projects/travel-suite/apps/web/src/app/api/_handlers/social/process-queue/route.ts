import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { logError } from "@/lib/observability/logger";
import { processSocialPublishQueue } from "@/lib/social/process-publish-queue.server";

function parseMsEnv(value: string | undefined, fallbackMs: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
}

export async function POST(req: Request) {
    try {
        const cronAuth = await authorizeCronRequest(req, {
            secretHeaderName: "x-social-cron-secret",
            idempotencyHeaderName: "x-cron-idempotency-key",
            replayWindowMs: parseMsEnv(process.env.SOCIAL_CRON_REPLAY_WINDOW_MS, 10 * 60_000),
            maxClockSkewMs: parseMsEnv(process.env.SOCIAL_CRON_MAX_CLOCK_SKEW_MS, 5 * 60_000),
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
    } catch (error: unknown) {
        logError("Error processing social queue", error);
        return apiError("Failed to process queue item", 500);
    }
}
