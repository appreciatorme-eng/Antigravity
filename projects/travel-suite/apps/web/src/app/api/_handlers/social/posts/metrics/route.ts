import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    // Get postId from query params
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return apiError("postId query parameter is required", 400);
    }

    // Verify user has access to the organization that owns this post
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    // Verify the post belongs to the user's organization
    const { data: post } = await supabase
      .from("social_posts")
      .select("id, organization_id")
      .eq("id", postId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!post) {
      return apiError("Post not found or access denied", 404);
    }

    // Fetch metrics for this post - RLS will enforce org access
    // Query social_post_metrics via queue_id since metrics are stored per queue item
    const { data: metricsData, error } = await supabase
      .from("social_post_queue")
      .select(`
        id,
        platform,
        status,
        platform_post_id,
        platform_post_url,
        social_post_metrics (
          id,
          platform,
          likes,
          comments,
          shares,
          reach,
          impressions,
          engagement_rate,
          fetched_at,
          created_at
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to flatten metrics
    const metrics = metricsData?.map(queue => {
      const metric = Array.isArray(queue.social_post_metrics)
        ? queue.social_post_metrics[0]
        : queue.social_post_metrics;

      return {
        queue_id: queue.id,
        platform: queue.platform,
        status: queue.status,
        platform_post_id: queue.platform_post_id,
        platform_post_url: queue.platform_post_url,
        metrics: metric || null,
      };
    }) || [];

    return apiSuccess({ metrics });

  } catch (error) {
    logError("Error fetching post metrics", error);
    return apiError("Failed to fetch post metrics", 500);
  }
}
