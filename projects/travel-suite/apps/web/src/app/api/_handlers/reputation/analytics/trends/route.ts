import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReputationPlatform, TrendDataPoint } from "@/lib/reputation/types";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

export async function GET(req: Request) {
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

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "30d";
    const platform = url.searchParams.get("platform") as ReputationPlatform | null;

    const days = PERIOD_DAYS[period] ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const orgId = profile.organization_id;

    // Try snapshots first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: snapshots, error: snapError } = await (supabase as any)
      .from("reputation_snapshots")
      .select("*")
      .eq("organization_id", orgId)
      .gte("snapshot_date", startDateStr)
      .order("snapshot_date", { ascending: true });

    if (snapError) {
      throw snapError;
    }

    if (snapshots && snapshots.length > 0) {
      const trends: TrendDataPoint[] = snapshots.map((s: Record<string, unknown>) => ({
        date: s.snapshot_date,
        rating: s.overall_rating,
        reviewCount: s.total_review_count,
        healthScore: s.health_score,
        positive: Number(s.positive_count ?? 0),
        neutral: Number(s.neutral_count ?? 0),
        negative: Number(s.negative_count ?? 0),
      }));

      return NextResponse.json({ trends });
    }

    // Fallback: compute from reputation_reviews grouped by date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reviewQuery = (supabase as any)
      .from("reputation_reviews")
      .select("rating, review_date, sentiment_label")
      .eq("organization_id", orgId)
      .gte("review_date", startDateStr)
      .order("review_date", { ascending: true });

    if (platform) {
      reviewQuery = reviewQuery.eq("platform", platform);
    }

    const { data: reviews, error: revError } = await reviewQuery;

    if (revError) {
      throw revError;
    }

    // Group reviews by date
    const dateMap = new Map<
      string,
      {
        ratings: number[];
        count: number;
        positive: number;
        neutral: number;
        negative: number;
      }
    >();

    for (const review of reviews ?? []) {
      const dateKey = review.review_date.split("T")[0];
      const entry = dateMap.get(dateKey) ?? {
        ratings: [],
        count: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      const sentiment = review.sentiment_label;

      dateMap.set(dateKey, {
        ratings: [...entry.ratings, review.rating],
        count: entry.count + 1,
        positive: entry.positive + (sentiment === "positive" ? 1 : 0),
        neutral:
          entry.neutral +
          (sentiment !== "positive" && sentiment !== "negative" ? 1 : 0),
        negative: entry.negative + (sentiment === "negative" ? 1 : 0),
      });
    }

    const trends: TrendDataPoint[] = Array.from(dateMap.entries()).map(
      ([date, data]) => {
        const avgRating =
          data.ratings.length > 0
            ? Number(
                (
                  data.ratings.reduce((s, r) => s + r, 0) / data.ratings.length
                ).toFixed(2)
              )
            : 0;

        return {
          date,
          rating: avgRating,
          reviewCount: data.count,
          healthScore: 0, // Cannot compute full health score without response data
          positive: data.positive,
          neutral: data.neutral,
          negative: data.negative,
        };
      }
    );

    return NextResponse.json({ trends });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching reputation trends:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
