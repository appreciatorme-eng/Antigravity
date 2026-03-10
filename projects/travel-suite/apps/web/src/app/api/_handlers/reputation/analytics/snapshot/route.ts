import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { calculateHealthScore } from "@/lib/reputation/score-calculator";
import type {
  ReputationPlatform,
  ReputationReview,
  ReputationHealthScoreFactors,
} from "@/lib/reputation/types";

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

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const orgId = profile.organization_id;
    const today = new Date().toISOString().split("T")[0];

    // Fetch all reviews for the org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allReviews, error: reviewsError } = await (supabase as any)
      .from("reputation_reviews")
      .select("*")
      .eq("organization_id", orgId);

    if (reviewsError) {
      throw reviewsError;
    }

    const reviews: ReputationReview[] = allReviews ?? [];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: requestsSent } = await (supabase as any)
      .from("reputation_campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "sent");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: requestsConverted } = await (supabase as any)
      .from("reputation_campaign_sends")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("review_submitted", true);

    const snapshotData = {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: snapshot, error: upsertError } = await (supabase as any)
      .from("reputation_snapshots")
      .upsert(snapshotData, {
        onConflict: "organization_id,snapshot_date",
      })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ snapshot });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error generating reputation snapshot:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
