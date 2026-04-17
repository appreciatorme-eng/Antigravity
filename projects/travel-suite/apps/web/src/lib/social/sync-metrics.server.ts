import { createAdminClient } from "@/lib/supabase/admin";
import { fetchInstagramInsights, fetchFacebookInsights } from "@/lib/social/fetch-insights.server";
import { logError, logEvent } from "@/lib/observability/logger";

type QueueItemRow = {
    id: string;
    post_id: string;
    platform: string;
    platform_post_id: string | null;
    social_posts: {
        organization_id: string;
    } | Array<{ organization_id: string }>;
};

export type SocialMetricsSyncResult = {
    success: boolean;
    fetched: number;
    errors: number;
    rate_limited: boolean;
    timed_out: boolean;
    inspected: number;
};

export type SocialMetricsSyncOptions = {
    maxDurationMs?: number;
    lookbackDays?: number;
    limit?: number;
    loggerPrefix?: string;
};

export async function syncSocialMetrics(options: SocialMetricsSyncOptions = {}): Promise<SocialMetricsSyncResult> {
    const supabase = createAdminClient();
    const lookbackDays = Number.isFinite(options.lookbackDays) ? Math.max(1, Number(options.lookbackDays)) : 30;
    const limit = Number.isFinite(options.limit) ? Math.max(1, Number(options.limit)) : 100;
    const maxDurationMs = Number.isFinite(options.maxDurationMs) ? Math.max(5_000, Number(options.maxDurationMs)) : 50_000;
    const loggerPrefix = options.loggerPrefix ?? "[social-sync-metrics]";

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - lookbackDays);

    const { data: queueItems, error: fetchError } = await supabase
        .from("social_post_queue")
        .select("id, post_id, platform, platform_post_id, social_posts!inner(organization_id)")
        .eq("status", "sent")
        .not("platform_post_id", "is", null)
        .gte("updated_at", threshold.toISOString())
        .order("updated_at", { ascending: false })
        .limit(limit);

    if (fetchError) throw fetchError;

    if (!queueItems || queueItems.length === 0) {
        return {
            success: true,
            fetched: 0,
            errors: 0,
            rate_limited: false,
            timed_out: false,
            inspected: 0,
        };
    }

    let successCount = 0;
    let errorCount = 0;
    let rateLimited = false;
    let timedOut = false;
    const startTime = Date.now();

    for (const item of queueItems as unknown as QueueItemRow[]) {
        if (Date.now() - startTime > maxDurationMs) {
            timedOut = true;
            logEvent("warn", `${loggerPrefix} max duration reached`, {
                inspected: successCount + errorCount,
                fetched: successCount,
                errors: errorCount,
                maxDurationMs,
            });
            break;
        }
        if (!item.platform_post_id) continue;

        const post = Array.isArray(item.social_posts) ? item.social_posts[0] : item.social_posts;
        if (!post) continue;

        try {
            let insights;

            if (item.platform === "instagram") {
                insights = await fetchInstagramInsights(item.platform_post_id, post.organization_id);
            } else if (item.platform === "facebook") {
                insights = await fetchFacebookInsights(item.platform_post_id, post.organization_id);
            } else {
                continue;
            }

            if (!insights.success) {
                if (insights.error === "rate_limit") {
                    rateLimited = true;
                    break;
                }
                if (insights.error === "deleted" || insights.error === "not_found" || insights.error === "permission_denied") {
                    continue;
                }
                errorCount += 1;
                continue;
            }

            const data = insights.data;
            let engagement = 0;
            let impressions = 0;
            let reach = 0;
            let likes = 0;
            let comments = 0;
            let shares = 0;

            if (item.platform === "instagram") {
                const igData = data as { engagement: number; impressions: number; reach: number };
                engagement = igData.engagement;
                impressions = igData.impressions;
                reach = igData.reach;
            } else {
                const fbData = data as { likes: number; comments: number; shares: number };
                likes = fbData.likes;
                comments = fbData.comments;
                shares = fbData.shares;
                engagement = likes + comments + shares;
            }

            const engagementRate = reach > 0 ? (engagement / reach) * 100 : 0;
            const rawSupabase = supabase as unknown as {
                from: (relation: string) => {
                    upsert: (values: unknown, options?: unknown) => Promise<{ error: unknown }>;
                };
            };
            const { error: upsertError } = await rawSupabase
                .from("social_post_metrics")
                .upsert(
                    {
                        queue_id: item.id,
                        post_id: item.post_id,
                        platform: item.platform,
                        likes,
                        comments,
                        shares,
                        reach,
                        impressions,
                        engagement_rate: Math.round(engagementRate * 100) / 100,
                        fetched_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "queue_id",
                    },
                );

            if (upsertError) {
                logError(`${loggerPrefix} failed to upsert metrics for queue ${item.id}`, upsertError);
                errorCount += 1;
                continue;
            }

            successCount += 1;
        } catch (error) {
            logError(`${loggerPrefix} error processing queue ${item.id}`, error);
            errorCount += 1;
        }
    }

    return {
        success: true,
        fetched: successCount,
        errors: errorCount,
        rate_limited: rateLimited,
        timed_out: timedOut,
        inspected: successCount + errorCount,
    };
}
