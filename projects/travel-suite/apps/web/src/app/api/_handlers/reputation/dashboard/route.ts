import { apiSuccess, apiError } from "@/lib/api/response";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { REPUTATION_REVIEW_SELECT } from "@/lib/reputation/selects";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { calculateHealthScore } from "@/lib/reputation/score-calculator";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/reputation/constants";
import type {
  ReputationPlatform,
  ReputationReview,
  PlatformBreakdown,
  ReputationDashboardData,
  ReputationHealthScoreFactors,
} from "@/lib/reputation/types";
import { logError } from "@/lib/observability/logger";

const getCachedReputationDashboard = unstable_cache(
  async (organizationId: string) => {
    const supabase = createAdminClient();

    // Admin client is typed with Database generic, reputation_reviews is in generated types
    const { data: allReviewsData, error } = await supabase
      .from("reputation_reviews")
      .select(REPUTATION_REVIEW_SELECT)
      .eq("organization_id", organizationId)
      .order("review_date", { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    // DB row `platform` is string; ReputationReview uses the narrower ReputationPlatform union
    const reviews = (allReviewsData ?? []) as unknown as ReputationReview[];

    const totalReviews = reviews.length;
    const overallRating =
      totalReviews > 0
        ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(2))
        : 0;

    const respondedReviews = reviews.filter((review) => review.response_status === "responded");
    const respondedCount = respondedReviews.length;
    const responseRate = totalReviews > 0 ? Math.round((respondedCount / totalReviews) * 100) : 0;

    const responseTimes = respondedReviews
      .map((review) => {
        if (!review.response_posted_at || !review.review_date) return null;

        const reviewedAt = new Date(review.review_date);
        const respondedAt = new Date(review.response_posted_at);
        const deltaHours = (respondedAt.getTime() - reviewedAt.getTime()) / (1000 * 60 * 60);

        return Number.isFinite(deltaHours) && deltaHours >= 0 ? deltaHours : null;
      })
      .filter((value): value is number => value !== null);

    const avgResponseTimeHours =
      responseTimes.length > 0
        ? Number((responseTimes.reduce((total, hours) => total + hours, 0) / responseTimes.length).toFixed(2))
        : null;

    const platformMap = new Map<ReputationPlatform, { total: number; ratingSum: number }>();
    for (const review of reviews) {
      const platform = review.platform as ReputationPlatform;
      const existing = platformMap.get(platform) ?? { total: 0, ratingSum: 0 };
      platformMap.set(platform, {
        total: existing.total + 1,
        ratingSum: existing.ratingSum + review.rating,
      });
    }

    const platformBreakdown: PlatformBreakdown[] = Array.from(platformMap.entries()).map(([platform, data]) => ({
      platform,
      rating: Number((data.ratingSum / data.total).toFixed(2)),
      count: data.total,
      label: PLATFORM_LABELS[platform] ?? platform,
      color: PLATFORM_COLORS[platform] ?? "#6b7280",
    }));

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviews) {
      const key = Math.max(1, Math.min(5, Math.round(review.rating)));
      ratingDistribution[key] = (ratingDistribution[key] ?? 0) + 1;
    }

    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    for (const review of reviews) {
      const label = review.sentiment_label;
      if (label === "positive") sentimentBreakdown.positive += 1;
      else if (label === "negative") sentimentBreakdown.negative += 1;
      else sentimentBreakdown.neutral += 1;
    }

    const recentReviews = reviews.slice(0, 5);
    const attentionCount = reviews.filter((review) => review.requires_attention).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentMonthReviews = reviews.filter((review) => new Date(review.review_date) >= thirtyDaysAgo);

    const positiveCount = sentimentBreakdown.positive;
    const totalWithSentiment =
      sentimentBreakdown.positive + sentimentBreakdown.neutral + sentimentBreakdown.negative;
    const sentimentRatio = totalWithSentiment > 0 ? positiveCount / totalWithSentiment : 0.5;

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
      npsScore: null,
      healthScore,
      healthFactors,
      platformBreakdown,
      ratingDistribution,
      sentimentBreakdown,
      recentReviews,
      attentionCount,
      trendsData: [],
    };

    return dashboardData;
  },
  ["reputation-dashboard"],
  { revalidate: 300, tags: ["reputation"] },
);

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const dashboardData = await getCachedReputationDashboard(auth.organizationId!);
    return apiSuccess(dashboardData);
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    logError("Error fetching reputation dashboard", error);
    return apiError(message, 500);
  }
}
