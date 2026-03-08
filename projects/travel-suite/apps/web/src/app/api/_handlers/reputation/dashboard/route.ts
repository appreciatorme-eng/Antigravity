import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateHealthScore } from "@/lib/reputation/score-calculator";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/reputation/constants";
import type {
  ReputationPlatform,
  ReputationReview,
  PlatformBreakdown,
  ReputationDashboardData,
  ReputationHealthScoreFactors,
} from "@/lib/reputation/types";

export async function GET() {
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

    // Fetch all reviews for this org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allReviews, error } = await (supabase as any)
      .from("reputation_reviews")
      .select("*")
      .eq("organization_id", orgId)
      .order("review_date", { ascending: false });

    if (error) {
      throw error;
    }

    const reviews: ReputationReview[] = allReviews ?? [];

    // Overall avg rating
    const totalReviews = reviews.length;
    const overallRating =
      totalReviews > 0
        ? Number(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(2)
          )
        : 0;

    // Response rate
    const respondedReviews = reviews.filter(
      (r) => r.response_status === "responded"
    );
    const respondedCount = respondedReviews.length;
    const responseRate =
      totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

    const responseTimes = respondedReviews
      .map((review) => {
        if (!review.response_posted_at || !review.review_date) return null;

        const reviewedAt = new Date(review.review_date);
        const respondedAt = new Date(review.response_posted_at);
        const deltaHours =
          (respondedAt.getTime() - reviewedAt.getTime()) / (1000 * 60 * 60);

        return Number.isFinite(deltaHours) && deltaHours >= 0 ? deltaHours : null;
      })
      .filter((value): value is number => value !== null);

    const avgResponseTimeHours =
      responseTimes.length > 0
        ? Number(
            (
              responseTimes.reduce((total, hours) => total + hours, 0) /
              responseTimes.length
            ).toFixed(2)
          )
        : null;

    // Platform breakdown
    const platformMap = new Map<
      ReputationPlatform,
      { total: number; ratingSum: number }
    >();

    for (const review of reviews) {
      const platform = review.platform as ReputationPlatform;
      const existing = platformMap.get(platform) ?? { total: 0, ratingSum: 0 };
      platformMap.set(platform, {
        total: existing.total + 1,
        ratingSum: existing.ratingSum + review.rating,
      });
    }

    const platformBreakdown: PlatformBreakdown[] = Array.from(
      platformMap.entries()
    ).map(([platform, data]) => ({
      platform,
      rating: Number((data.ratingSum / data.total).toFixed(2)),
      count: data.total,
      label: PLATFORM_LABELS[platform] ?? platform,
      color: PLATFORM_COLORS[platform] ?? "#6b7280",
    }));

    // Rating distribution (1-5)
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviews) {
      const key = Math.max(1, Math.min(5, Math.round(review.rating)));
      ratingDistribution[key] = (ratingDistribution[key] ?? 0) + 1;
    }

    // Sentiment breakdown
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    for (const review of reviews) {
      const label = review.sentiment_label;
      if (label === "positive") sentimentBreakdown.positive += 1;
      else if (label === "negative") sentimentBreakdown.negative += 1;
      else sentimentBreakdown.neutral += 1;
    }

    // Recent reviews (last 5)
    const recentReviews = reviews.slice(0, 5);

    // Attention count
    const attentionCount = reviews.filter((r) => r.requires_attention).length;

    // Calculate health score
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMonthReviews = reviews.filter(
      (r) => new Date(r.review_date) >= thirtyDaysAgo
    );

    const positiveCount = sentimentBreakdown.positive;
    const totalWithSentiment =
      sentimentBreakdown.positive +
      sentimentBreakdown.neutral +
      sentimentBreakdown.negative;
    const sentimentRatio =
      totalWithSentiment > 0 ? positiveCount / totalWithSentiment : 0.5;

    const healthFactors: ReputationHealthScoreFactors = {
      avgRating: overallRating,
      responseRate,
      avgResponseTimeHours,
      reviewVelocity: recentMonthReviews.length,
      sentimentRatio,
    };

    const healthScore = calculateHealthScore(healthFactors);

    const dashboardData: ReputationDashboardData = {
      overallRating,
      totalReviews,
      responseRate,
      npsScore: null, // NPS computed from campaign sends, not available here
      healthScore,
      healthFactors,
      platformBreakdown,
      ratingDistribution,
      sentimentBreakdown,
      recentReviews,
      attentionCount,
      trendsData: [], // trends require snapshot history, populated in Phase 2
    };

    return NextResponse.json(dashboardData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching reputation dashboard:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
