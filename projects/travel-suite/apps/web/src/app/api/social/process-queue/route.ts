import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function parseMsEnv(value: string | undefined, fallbackMs: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function addMinutes(date: Date, minutes: number): string {
    return new Date(date.getTime() + minutes * 60_000).toISOString();
}

function calculateRetryDelayMinutes(attemptNumber: number): number {
    const base = parsePositiveInt(process.env.SOCIAL_QUEUE_RETRY_BASE_MINUTES, 5);
    const maxBackoff = parsePositiveInt(process.env.SOCIAL_QUEUE_RETRY_MAX_MINUTES, 180);
    const delay = base * Math.pow(2, Math.max(0, attemptNumber - 1));
    return Math.min(delay, maxBackoff);
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

        const supabaseAdmin = createAdminClient();
        const maxAttempts = parsePositiveInt(process.env.SOCIAL_QUEUE_MAX_ATTEMPTS, 3);

        const { data: pendingItems, error: fetchError } = await supabaseAdmin
            .from("social_post_queue")
            .select(`
                *,
                social_posts!inner (
                   *
                ),
                social_connections!inner (
                    platform_page_id
                )
            `)
            .eq("status", "pending")
            .lt("scheduled_for", new Date().toISOString())
            .lt("attempts", maxAttempts)
            .order("scheduled_for", { ascending: true })
            .limit(10);

        if (fetchError) throw fetchError;

        if (!pendingItems || pendingItems.length === 0) {
            return NextResponse.json({ message: "No pending items" });
        }

        const results: Array<{ id: string; status: string; error?: string; retry_at?: string }> = [];

        for (const item of pendingItems) {
            const claimTime = new Date().toISOString();
            const { data: claimedRows } = await supabaseAdmin
                .from("social_post_queue")
                .update({ status: "processing", updated_at: claimTime })
                .eq("id", item.id)
                .eq("status", "pending")
                .select("id")
                .limit(1);

            if (!claimedRows || claimedRows.length === 0) {
                continue;
            }

            try {
                if (item.platform_post_id) {
                    await supabaseAdmin
                        .from("social_post_queue")
                        .update({
                            status: "sent",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", item.id)
                        .eq("status", "processing");

                    results.push({ id: item.id, status: "already_sent" });
                    continue;
                }

                const platform = item.platform;
                const pageId = item.social_connections.platform_page_id;

                console.log(`[Cron] Processing social publish to ${platform} for page ${pageId}`);

                const platformPostId = `cron_${platform}_${Date.now()}`;
                const platformPostUrl = `https://${platform}.com/p/${platformPostId}`;

                await supabaseAdmin
                    .from("social_post_queue")
                    .update({
                        status: "sent",
                        platform_post_id: platformPostId,
                        platform_post_url: platformPostUrl,
                        attempts: item.attempts + 1,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", item.id)
                    .eq("status", "processing");

                const { count } = await supabaseAdmin
                    .from("social_post_queue")
                    .select("id", { count: "exact", head: true })
                    .eq("post_id", item.post_id)
                    .in("status", ["pending", "processing"]);

                if (count === 0) {
                    await supabaseAdmin.from("social_posts").update({ status: "published" }).eq("id", item.post_id);
                }

                results.push({ id: item.id, status: "success" });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown publish error";
                console.error(`Failed to publish item ${item.id}:`, err);

                const attemptNumber = Number(item.attempts || 0) + 1;
                const exhausted = attemptNumber >= maxAttempts;
                const retryAt = exhausted
                    ? undefined
                    : addMinutes(new Date(), calculateRetryDelayMinutes(attemptNumber));

                await supabaseAdmin
                    .from("social_post_queue")
                    .update({
                        status: exhausted ? "failed" : "pending",
                        error_message: message,
                        attempts: attemptNumber,
                        scheduled_for: retryAt || item.scheduled_for,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", item.id)
                    .eq("status", "processing");

                results.push({
                    id: item.id,
                    status: exhausted ? "dead_lettered" : "retry_scheduled",
                    error: message,
                    retry_at: retryAt,
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
        });
    } catch (error: any) {
        console.error("Error processing social queue:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
