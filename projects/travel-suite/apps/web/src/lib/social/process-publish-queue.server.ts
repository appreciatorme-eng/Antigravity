/* ------------------------------------------------------------------
 * Social Publish Queue Processor
 *
 * Core logic for processing pending social media posts from the queue.
 * Handles Instagram and Facebook publishing via Meta Graph API with
 * retry logic and exponential backoff for failed attempts.
 *
 * This module is called by both:
 * - /api/social/process-queue (manual/webhook trigger)
 * - /api/cron/social-publish-queue (scheduled cron job)
 * ------------------------------------------------------------------ */

import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";
import { publishToInstagram } from "./publish-instagram.server";
import { publishToFacebook } from "./publish-facebook.server";

const SOCIAL_QUEUE_PROCESS_SELECT = [
    "attempts",
    "id",
    "platform",
    "platform_post_id",
    "post_id",
    "scheduled_for",
    "social_posts!inner(id, organization_id, caption_facebook, rendered_image_url, rendered_image_urls)",
    "social_connections!inner(platform_page_id)",
].join(", ");

type SocialQueueProcessRow = {
    attempts: number | null;
    id: string;
    platform: string;
    platform_post_id: string | null;
    post_id: string;
    scheduled_for: string | null;
    social_posts: {
        id: string;
        organization_id: string;
        caption_facebook: string | null;
        rendered_image_url: string | null;
        rendered_image_urls: string[] | null;
    };
    social_connections: {
        platform_page_id: string;
    };
};

export type ProcessQueueResult = {
    success: boolean;
    processed: number;
    results: Array<{
        id: string;
        status: string;
        error?: string;
        retry_at?: string;
    }>;
};

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

export async function processSocialPublishQueue(): Promise<ProcessQueueResult> {
    const supabaseAdmin = createAdminClient();
    const maxAttempts = parsePositiveInt(process.env.SOCIAL_QUEUE_MAX_ATTEMPTS, 3);

    const { data: pendingItems, error: fetchError } = await supabaseAdmin
        .from("social_post_queue")
        .select(SOCIAL_QUEUE_PROCESS_SELECT)
        .eq("status", "pending")
        .lt("scheduled_for", new Date().toISOString())
        .lt("attempts", maxAttempts)
        .order("scheduled_for", { ascending: true })
        .limit(10);
    const queueItems = (pendingItems as unknown as SocialQueueProcessRow[] | null) ?? [];

    if (fetchError) throw fetchError;

    if (queueItems.length === 0) {
        return {
            success: true,
            processed: 0,
            results: [],
        };
    }

    const results: Array<{ id: string; status: string; error?: string; retry_at?: string }> = [];
    const sentPostIds = new Set<string>();

    for (const item of queueItems) {
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

                sentPostIds.add(item.post_id);
                results.push({ id: item.id, status: "already_sent" });
                continue;
            }

            // Publish to platform using Meta Graph API
            let publishResult;

            if (item.platform === "instagram") {
                publishResult = await publishToInstagram(item.id);
            } else if (item.platform === "facebook") {
                const post = Array.isArray(item.social_posts)
                    ? item.social_posts[0]
                    : item.social_posts;
                const connection = Array.isArray(item.social_connections)
                    ? item.social_connections[0]
                    : item.social_connections;

                if (!post || !connection) {
                    throw new Error("Post or connection data missing");
                }

                const imageUrls = post.rendered_image_urls || (post.rendered_image_url ? [post.rendered_image_url] : []);

                publishResult = await publishToFacebook(
                    post.organization_id,
                    {
                        message: post.caption_facebook || undefined,
                        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                    },
                    connection.platform_page_id
                );
            } else {
                throw new Error(`Unsupported platform: ${item.platform}`);
            }

            if (!publishResult.success) {
                throw new Error(publishResult.error || "Publishing failed");
            }

            await supabaseAdmin
                .from("social_post_queue")
                .update({
                    status: "sent",
                    platform_post_id: publishResult.platformPostId ?? null,
                    platform_post_url: publishResult.platformPostUrl ?? null,
                    attempts: (item.attempts ?? 0) + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", item.id)
                .eq("status", "processing");

            sentPostIds.add(item.post_id);
            results.push({ id: item.id, status: "success" });
        } catch (err: unknown) {
            const internalMessage = err instanceof Error ? err.message : "Unknown publish error";
            logError(`Failed to publish item ${item.id}`, err);

            const attemptNumber = Number(item.attempts || 0) + 1;
            const exhausted = attemptNumber >= maxAttempts;
            const retryAt = exhausted
                ? undefined
                : addMinutes(new Date(), calculateRetryDelayMinutes(attemptNumber));

            await supabaseAdmin
                .from("social_post_queue")
                .update({
                    status: exhausted ? "failed" : "pending",
                    error_message: internalMessage,
                    attempts: attemptNumber,
                    scheduled_for: retryAt ?? item.scheduled_for ?? undefined,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", item.id)
                .eq("status", "processing");

            results.push({
                id: item.id,
                status: exhausted ? "dead_lettered" : "retry_scheduled",
                error: "Failed to process queue item",
                retry_at: retryAt,
            });
        }
    }

    if (sentPostIds.size > 0) {
        const postIdList = [...sentPostIds];
        const { data: remaining } = await supabaseAdmin
            .from("social_post_queue")
            .select("post_id")
            .in("post_id", postIdList)
            .in("status", ["pending", "processing"]);

        const stillPending = new Set((remaining ?? []).map((r: { post_id: string }) => r.post_id));
        const fullyPublished = postIdList.filter((id) => !stillPending.has(id));

        if (fullyPublished.length > 0) {
            await supabaseAdmin
                .from("social_posts")
                .update({ status: "published" })
                .in("id", fullyPublished);
        }
    }

    return {
        success: true,
        processed: results.length,
        results,
    };
}
