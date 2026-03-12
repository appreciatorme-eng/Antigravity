import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
  reserveDailySpendUsd,
  getEstimatedRequestCostUsd,
  getPlanDailySpendCapUsd,
  getEmergencyDailySpendCapUsd,
} from "@/lib/cost/spend-guardrails";
import { resolveOrganizationPlan } from "@/lib/subscriptions/limits";
import { REPUTATION_TIER_LIMITS } from "@/lib/reputation/constants";
import type { AIAnalysisResult } from "@/lib/reputation/types";

export const maxDuration = 300;

const GEMINI_MODEL = "gemini-2.0-flash";
const BATCH_LIMIT = 50;
const DELAY_BETWEEN_CALLS_MS = 200;

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

interface BatchReviewRow {
  id: string;
  organization_id: string;
  comment: string | null;
  title: string | null;
  rating: number;
}

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateCronAuth(req: Request): boolean {
  // Check for Vercel cron secret or internal API key
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check x-api-key header as fallback
  const apiKey = req.headers.get("x-api-key");
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (internalApiKey && apiKey === internalApiKey) {
    return true;
  }

  // In development, allow without auth
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  if (!validateCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "AI service is not configured" },
      { status: 503 }
    );
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  let analyzed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const supabase = await createClient();

    // Fetch unanalyzed reviews across all organizations
    const { data: rawReviews, error: fetchError } = await supabase
      .from("reputation_reviews")
      .select("id, organization_id, comment, title, rating")
      .is("sentiment_score", null)
      .not("comment", "is", null)
      .order("created_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (fetchError) {
      throw fetchError;
    }

    const reviews = (rawReviews ?? []) as BatchReviewRow[];

    if (reviews.length === 0) {
      return NextResponse.json({ analyzed: 0, skipped: 0, errors: 0 });
    }

    // Cache org tier lookups to avoid repeated queries
    const orgTierCache = new Map<string, string>();

    for (const review of reviews) {
      try {
        const reviewText = review.comment ?? review.title ?? "";
        if (!reviewText.trim()) {
          skipped += 1;
          continue;
        }

        // Get org tier (cached)
        let tier = orgTierCache.get(review.organization_id);
        if (!tier) {
          const resolved = await resolveOrganizationPlan(supabase, review.organization_id);
          tier = resolved.tier;
          orgTierCache.set(review.organization_id, tier);
        }

        const tierLimits = REPUTATION_TIER_LIMITS[tier] ?? REPUTATION_TIER_LIMITS.free;

        // Skip orgs without sentiment analysis access
        if (!tierLimits.sentimentAnalysis) {
          skipped += 1;
          continue;
        }

        // Cost guard per review
        const costPerRequest = getEstimatedRequestCostUsd("ai_image");
        const planCap = getPlanDailySpendCapUsd(
          "ai_image",
          tier as "free" | "pro" | "enterprise"
        );
        const emergencyCap = await getEmergencyDailySpendCapUsd("ai_image");

        const reservation = await reserveDailySpendUsd(
          review.organization_id,
          "ai_image",
          costPerRequest,
          { planCapUsd: planCap, emergencyCapUsd: emergencyCap }
        );

        if (!reservation.allowed) {
          skipped += 1;
          continue;
        }

        // Call Gemini
        const prompt = buildAnalysisPrompt(reviewText, review.rating);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const analysis = parseAnalysisResponse(responseText);

        // Update the review
        await supabase
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
          .eq("id", review.id);

        analyzed += 1;

        // Rate limiting between calls
        await delay(DELAY_BETWEEN_CALLS_MS);
      } catch (reviewError) {
        console.error(`Error analyzing review ${review.id}:`, reviewError);
        errors += 1;
      }
    }

    return NextResponse.json({ analyzed, skipped, errors });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error in batch analyze:", error);
    return NextResponse.json(
      { error: message, analyzed, skipped, errors },
      { status: 500 }
    );
  }
}
