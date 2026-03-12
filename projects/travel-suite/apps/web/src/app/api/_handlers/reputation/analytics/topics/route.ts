import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";

const PERIOD_DAYS: Record<string, number> = {
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

interface TopicResult {
  topic: string;
  count: number;
  avgSentiment: number;
}

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

    const days = PERIOD_DAYS[period] ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const { data: reviews, error } = await supabase
      .from("reputation_reviews")
      .select("ai_topics, sentiment_score")
      .eq("organization_id", profile.organization_id)
      .gte("review_date", startDateStr);

    if (error) {
      throw error;
    }

    // Aggregate topics
    const topicMap = new Map<string, { count: number; sentimentSum: number }>();

    for (const review of reviews ?? []) {
      const topics: string[] = review.ai_topics ?? [];
      const sentimentScore: number = review.sentiment_score ?? 0;

      for (const topic of topics) {
        const existing = topicMap.get(topic) ?? { count: 0, sentimentSum: 0 };
        topicMap.set(topic, {
          count: existing.count + 1,
          sentimentSum: existing.sentimentSum + sentimentScore,
        });
      }
    }

    const topics: TopicResult[] = Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        avgSentiment: Number((data.sentimentSum / data.count).toFixed(3)),
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ topics });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error fetching reputation topics:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
