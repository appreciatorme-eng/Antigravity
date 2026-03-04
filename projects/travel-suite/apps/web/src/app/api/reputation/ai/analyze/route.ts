import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { resolveOrganizationPlan } from "@/lib/subscriptions/limits";
import {
  reserveDailySpendUsd,
  getEstimatedRequestCostUsd,
  getPlanDailySpendCapUsd,
  getEmergencyDailySpendCapUsd,
} from "@/lib/cost/spend-guardrails";
import { REPUTATION_TIER_LIMITS } from "@/lib/reputation/constants";
import type { AIAnalysisResult } from "@/lib/reputation/types";

export const maxDuration = 30;

const GEMINI_MODEL = "gemini-2.0-flash";

const AI_TOPICS_LIST = [
  "hotel_quality",
  "transport",
  "driver_behavior",
  "food",
  "itinerary_planning",
  "value_for_money",
  "guide_quality",
  "safety",
  "communication",
  "booking_process",
  "weather",
  "cleanliness",
  "punctuality",
  "flexibility",
  "local_experience",
] as const;

function buildAnalysisPrompt(text: string, rating?: number): string {
  const ratingContext = rating != null ? `\nThe reviewer gave a rating of ${rating}/5.` : "";

  return `You are a travel industry review analyst. Analyze the following customer review and return a JSON object with exactly these fields:

- sentiment_score: a number from -1.0 (most negative) to 1.0 (most positive)
- sentiment_label: one of "positive", "neutral", or "negative"
- topics: an array of relevant topics from this list ONLY: ${AI_TOPICS_LIST.join(", ")}
- summary: a 1-2 sentence summary of the review highlighting key points
- requires_attention: boolean, true if the review contains a complaint that needs urgent action, mentions safety issues, threatens legal action, or mentions specific employee misconduct
- attention_reason: a brief reason string if requires_attention is true, otherwise null

Review text:
"""
${text}
"""${ratingContext}

Respond ONLY with valid JSON. No markdown, no code fences, no explanation.`;
}

function parseAnalysisResponse(rawText: string): AIAnalysisResult {
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  const sentimentScore = Math.max(-1, Math.min(1, Number(parsed.sentiment_score) || 0));

  const validLabels = ["positive", "neutral", "negative"] as const;
  const sentimentLabel = validLabels.includes(parsed.sentiment_label)
    ? (parsed.sentiment_label as (typeof validLabels)[number])
    : sentimentScore > 0.2
      ? "positive"
      : sentimentScore < -0.2
        ? "negative"
        : "neutral";

  const validTopics = new Set<string>(AI_TOPICS_LIST);
  const topics = Array.isArray(parsed.topics)
    ? parsed.topics.filter((t: unknown) => typeof t === "string" && validTopics.has(t))
    : [];

  return {
    sentiment_score: sentimentScore,
    sentiment_label: sentimentLabel,
    topics,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    requires_attention: Boolean(parsed.requires_attention),
    attention_reason:
      parsed.requires_attention && typeof parsed.attention_reason === "string"
        ? parsed.attention_reason
        : null,
  };
}

export async function POST(req: Request) {
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

    const organizationId = profile.organization_id;

    // Resolve tier and check if sentiment analysis is allowed
    const { tier } = await resolveOrganizationPlan(supabase, organizationId);
    const tierLimits = REPUTATION_TIER_LIMITS[tier] ?? REPUTATION_TIER_LIMITS.free;

    if (!tierLimits.sentimentAnalysis) {
      return NextResponse.json(
        { error: "Sentiment analysis requires a Pro or Enterprise plan" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reviewId, text, rating } = body as {
      reviewId?: string;
      text?: string;
      rating?: number;
    };

    let reviewText = text ?? "";
    let reviewRating = rating;
    let targetReviewId = reviewId;

    // If reviewId is provided, fetch the review
    if (reviewId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: review, error: reviewError } = await (supabase as any)
        .from("reputation_reviews")
        .select("id, comment, rating, organization_id")
        .eq("id", reviewId)
        .eq("organization_id", organizationId)
        .single();

      if (reviewError || !review) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      reviewText = review.comment ?? "";
      reviewRating = review.rating;
      targetReviewId = review.id;
    }

    if (!reviewText || typeof reviewText !== "string" || reviewText.trim().length === 0) {
      return NextResponse.json(
        { error: "Review text is required (provide reviewId or text)" },
        { status: 400 }
      );
    }

    // Cost guard
    const costPerRequest = getEstimatedRequestCostUsd("ai_image");
    const planCap = getPlanDailySpendCapUsd("ai_image", tier);
    const emergencyCap = await getEmergencyDailySpendCapUsd("ai_image");

    const reservation = await reserveDailySpendUsd(organizationId, "ai_image", costPerRequest, {
      planCapUsd: planCap,
      emergencyCapUsd: emergencyCap,
    });

    if (!reservation.allowed) {
      return NextResponse.json(
        { error: "Daily AI spend limit reached. Please try again tomorrow." },
        { status: 429 }
      );
    }

    // Call Gemini
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = buildAnalysisPrompt(reviewText, reviewRating);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const analysis = parseAnalysisResponse(responseText);

    // Update the review in DB if we have a reviewId
    if (targetReviewId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("reputation_reviews")
        .update({
          sentiment_score: analysis.sentiment_score,
          sentiment_label: analysis.sentiment_label,
          ai_topics: analysis.topics,
          ai_summary: analysis.summary,
          requires_attention: analysis.requires_attention,
          attention_reason: analysis.attention_reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetReviewId)
        .eq("organization_id", organizationId);
    }

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error analyzing review:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
