import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { calculateHealthScore } from "@/lib/reputation/score-calculator";
import { REPUTATION_REVIEW_SELECT, REPUTATION_SNAPSHOT_SELECT } from "@/lib/reputation/selects";
import type {
  ReputationPlatform,
  ReputationReview,
  ReputationHealthScoreFactors,
} from "@/lib/reputation/types";
import type { Database } from "@/lib/database.types";

type SnapshotRow = Database["public"]["Tables"]["reputation_snapshots"]["Row"];

const PLATFORMS: ReputationPlatform[] = [
  "google",
  "tripadvisor",
  "facebook",
  "makemytrip",
  "internal",
];

interface PlatformStats {
  rating: number;
  count: number;
}

function computePlatformStats(
  reviews: ReputationReview[],
  platform: ReputationPlatform
): PlatformStats {
  const filtered = reviews.filter((r) => r.platform === platform);
  if (filtered.length === 0) {
    return { rating: 0, count: 0 };
  }
  const avgRating =
    filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length;
  return {
    rating: Number(avgRating.toFixed(2)),
    count: filtered.length,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    const { data: snapshotData, error: snapshotError } = await supabase
      .from("reputation_snapshots")
      .select(REPUTATION_SNAPSHOT_SELECT)
      .eq("organization_id", profile.organization_id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const snapshot = snapshotData as unknown as SnapshotRow | null;

    if (snapshotError) {
      throw snapshotError;
    }

    return NextResponse.json({ snapshot: snapshot ?? null });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error fetching reputation snapshot:", error);
    return apiError(message, 500);
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    const orgId = profile.organization_id;
    const today = new Date().toISOString().split("T")[0];

    // Fetch all reviews for the org
    const { data: allReviewsData, error: reviewsError } = await supabase
      .from("reputation_reviews")
      .select(REPUTATION_REVIEW_SELECT)
      .eq("organization_id", orgId);

    if (reviewsError) {
      throw reviewsError;
    }

    // DB row `platform` is string; ReputationReview uses the narrower ReputationPlatform union
    const reviews = (allReviewsData ?? []) as unknown as ReputationReview[];
    const totalReviews = reviews.length;

    // Per-platform stats
    const platformStats: Record<string, PlatformStats> = {};
    for (const platform of PLATFORMS) {
      platformStats[platform] = computePlatformStats(reviews, platform);
    }

    // Overall rating
    const overallRating =
      totalReviews > 0
        ? Number(
            (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(2)
          )
        : 0;

    // Sentiment counts
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    for (const review of reviews) {
      if (review.sentiment_label === "positive") positiveCount += 1;
      else if (review.sentiment_label === "negative") negativeCount += 1;
      else neutralCount += 1;
    }

    // Response rate and avg response time
    const respondedReviews = reviews.filter(
      (r) => r.response_status === "responded"
    );
    const responseRate =
      totalReviews > 0
        ? Math.round((respondedReviews.length / totalReviews) * 100)
        : 0;

    // Avg response time in hours (from review created_at to response_posted_at)
    let avgResponseTimeHours = 12; // default
    const reviewsWithResponseTime = respondedReviews.filter(
      (r) => r.response_posted_at && r.created_at
    );
    if (reviewsWithResponseTime.length > 0) {
      const totalHours = reviewsWithResponseTime.reduce((sum, r) => {
        const created = new Date(r.created_at).getTime();
        const responded = new Date(r.response_posted_at!).getTime();
        const hours = Math.max(0, (responded - created) / (1000 * 60 * 60));
        return sum + hours;
      }, 0);
      avgResponseTimeHours = Number(
        (totalHours / reviewsWithResponseTime.length).toFixed(1)
      );
    }

    // Review velocity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = reviews.filter(
      (r) => new Date(r.review_date) >= thirtyDaysAgo
    );

    // Sentiment ratio
    const totalWithSentiment = positiveCount + neutralCount + negativeCount;
    const sentimentRatio =
      totalWithSentiment > 0 ? positiveCount / totalWithSentiment : 0.5;

    // Health score
    const healthFactors: ReputationHealthScoreFactors = {
      avgRating: overallRating,
      responseRate,
      avgResponseTimeHours,
      reviewVelocity: recentReviews.length,
      sentimentRatio,
    };
    const healthScore = calculateHealthScore(healthFactors);

    // Review request stats (from campaign sends)
    const { count: requestsSent } = await supabase
      .from("reputation_campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "sent");

    const { count: requestsConverted } = await supabase
      .from("reputation_campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("review_submitted", true);

    const nextSnapshot = {
      organization_id: orgId,
      snapshot_date: today,
      google_rating: platformStats["google"].rating,
      google_count: platformStats["google"].count,
      tripadvisor_rating: platformStats["tripadvisor"].rating,
      tripadvisor_count: platformStats["tripadvisor"].count,
      facebook_rating: platformStats["facebook"].rating,
      facebook_count: platformStats["facebook"].count,
      makemytrip_rating: platformStats["makemytrip"].rating,
      makemytrip_count: platformStats["makemytrip"].count,
      internal_rating: platformStats["internal"].rating,
      internal_count: platformStats["internal"].count,
      overall_rating: overallRating,
      total_review_count: totalReviews,
      positive_count: positiveCount,
      neutral_count: neutralCount,
      negative_count: negativeCount,
      response_rate: responseRate,
      avg_response_time_hours: avgResponseTimeHours,
      nps_score: null,
      review_requests_sent: requestsSent ?? 0,
      review_requests_converted: requestsConverted ?? 0,
      health_score: healthScore,
    };

    // Upsert: if a snapshot for today already exists, update it
    const { data: snapshotRowData, error: upsertError } = await supabase
      .from("reputation_snapshots")
      .upsert(nextSnapshot, {
        onConflict: "organization_id,snapshot_date",
      })
      .select(REPUTATION_SNAPSHOT_SELECT)
      .single();
    const snapshot = snapshotRowData as unknown as SnapshotRow | null;

    if (upsertError || !snapshot) {
      throw upsertError;
    }

    return NextResponse.json({ snapshot });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error generating reputation snapshot:", error);
    return apiError(message, 500);
  }
}
