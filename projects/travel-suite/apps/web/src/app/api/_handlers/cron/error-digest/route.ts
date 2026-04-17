// POST /api/cron/error-digest — weekly Slack digest of open/investigating errors.
// Scheduled: 0 3 * * 1 (Monday 03:00 UTC = 08:30 IST)
// Auth: x-cron-secret header (same pattern as other cron handlers)

import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { runErrorDigest } from "@/lib/platform/error-digest";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const cronAuth = await authorizeCronRequest(request, {
        secretHeaderNames: ["x-cron-secret"],
        replayWindowMs: 10 * 60 * 1000,
    });

    if (!cronAuth.authorized) {
        return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
    }

    const result = await runErrorDigest();
    return NextResponse.json({ ok: true, ...result });
}
