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
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { fetchInstagramInsights, fetchFacebookInsights } from "@/lib/social/fetch-insights.server";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 60;

type QueueItemRow = {
  id: string;
  post_id: string;
  platform: string;
  platform_post_id: string | null;
  social_posts: {
    organization_id: string;
  } | Array<{ organization_id: string }>;
};

export async function POST(request: NextRequest) {
  try {
    const cronAuth = await authorizeCronRequest(request, {
      secretHeaderNames: ["x-cron-secret", "x-social-cron-secret"],
      replayWindowMs: 10 * 60 * 1000,
    });
    if (!cronAuth.authorized) {
      return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
    }

    const supabase = createAdminClient();

    // Fetch published posts from last 30 days that have been sent
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: queueItems, error: fetchError } = await supabase
      .from("social_post_queue")
      .select("id, post_id, platform, platform_post_id, social_posts!inner(organization_id)")
      .eq("status", "sent")
      .not("platform_post_id", "is", null)
      .gte("updated_at", thirtyDaysAgo.toISOString())
      .order("updated_at", { ascending: false })
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({
        success: true,
        fetched: 0,
        errors: 0,
        rate_limited: false,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    let rateLimited = false;

    for (const item of queueItems as unknown as QueueItemRow[]) {
      if (!item.platform_post_id) {
        continue;
      }

      const post = Array.isArray(item.social_posts) ? item.social_posts[0] : item.social_posts;
      if (!post) {
        continue;
      }

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

          // Skip non-critical errors (deleted posts, permission issues)
          if (insights.error === "deleted" || insights.error === "not_found" || insights.error === "permission_denied") {
            continue;
          }

          errorCount++;
          continue;
        }

        // Calculate engagement rate
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

        // Upsert to social_post_metrics (bypass TypeScript until DB types are regenerated)
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
            }
          );

        if (upsertError) {
          logError(`[cron/social-sync-metrics] Failed to upsert metrics for queue ${item.id}`, upsertError);
          errorCount++;
          continue;
        }

        successCount++;
      } catch (err) {
        logError(`[cron/social-sync-metrics] Error processing queue ${item.id}`, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      fetched: successCount,
      errors: errorCount,
      rate_limited: rateLimited,
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
