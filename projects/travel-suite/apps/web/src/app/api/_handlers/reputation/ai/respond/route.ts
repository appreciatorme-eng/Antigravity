import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
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
import { repFrom } from "@/lib/reputation/db";
import {
  REPUTATION_BRAND_VOICE_SELECT,
  REPUTATION_REVIEW_SELECT,
} from "@/lib/reputation/selects";
import type {
  AIResponseResult,
  BrandVoiceTone,
  ReputationBrandVoice,
  ReputationReview,
} from "@/lib/reputation/types";

export const maxDuration = 30;

const GEMINI_MODEL = "gemini-2.0-flash";

const TONE_DESCRIPTIONS: Record<BrandVoiceTone, string> = {
  professional_warm:
    "Professional yet warm and approachable. Use a friendly but business-appropriate tone.",
  casual_friendly:
    "Casual and conversational. Like talking to a friend, but still respectful.",
  formal:
    "Formal and polished. Use proper language, no slang, courteous and dignified.",
  luxury:
    "Luxurious and elegant. Sophisticated vocabulary, convey exclusivity and premium experience.",
};

function buildResponsePrompt(
  reviewText: string,
  reviewRating: number,
  brandVoice: ReputationBrandVoice
): string {
  const toneDescription = TONE_DESCRIPTIONS[brandVoice.tone] ?? TONE_DESCRIPTIONS.professional_warm;

  const ownerLine = brandVoice.owner_name
    ? `The response should be written as if from ${brandVoice.owner_name}.`
    : "";

  const signOffLine = brandVoice.sign_off
    ? `End the response with this sign-off: "${brandVoice.sign_off}"`
    : "";

  const keyPhrasesLine =
    brandVoice.key_phrases.length > 0
      ? `Try to naturally incorporate these key phrases where appropriate: ${brandVoice.key_phrases.join(", ")}`
      : "";

  const avoidPhrasesLine =
    brandVoice.avoid_phrases.length > 0
      ? `NEVER use these phrases: ${brandVoice.avoid_phrases.join(", ")}`
      : "";

  const sampleResponsesSection =
    brandVoice.sample_responses.length > 0
      ? `Here are example responses in our brand voice for reference:\n${brandVoice.sample_responses.map((s, i) => `${i + 1}. "${s}"`).join("\n")}`
      : "";

  return `You are a travel company reputation manager. Write a response to the following customer review.

TONE: ${toneDescription}
${ownerLine}
${signOffLine}
${keyPhrasesLine}
${avoidPhrasesLine}

${sampleResponsesSection}

IMPORTANT INSTRUCTIONS:
- Auto-detect the language of the review and respond in the SAME language
- Be empathetic and acknowledge specific points mentioned in the review
- Be professional but warm
- If the review is negative (rating <= 2), acknowledge the issue, apologize sincerely, and offer to make it right
- If the review is positive (rating >= 4), express genuine gratitude and mention you look forward to serving them again
- For neutral reviews (rating 3), thank them and address any concerns mentioned
- Keep the response between 50-150 words
- Do NOT use generic template language

Review Rating: ${reviewRating}/5
Review Text:
"""
${reviewText}
"""

Return ONLY a JSON object with these fields:
- suggested_response: the full response text
- tone_used: the tone style used (one of: professional_warm, casual_friendly, formal, luxury)
- language: the ISO language code of the response (e.g., "en", "hi", "fr")

Respond ONLY with valid JSON. No markdown, no code fences, no explanation.`;
}

function parseResponseResult(rawText: string, tone: BrandVoiceTone): AIResponseResult {
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  return {
    suggested_response:
      typeof parsed.suggested_response === "string" ? parsed.suggested_response : "",
    tone_used: parsed.tone_used ?? tone,
    language: typeof parsed.language === "string" ? parsed.language : "en",
  };
}

async function getOrCreateBrandVoice(
  supabase: Parameters<typeof repFrom>[0],
  organizationId: string
): Promise<ReputationBrandVoice> {
  const { data: existingData } = await repFrom(supabase, "reputation_brand_voice")
    .select(REPUTATION_BRAND_VOICE_SELECT)
    .eq("organization_id", organizationId)
    .maybeSingle();
  const existing = existingData as unknown as ReputationBrandVoice | null;

  if (existing) {
    return existing as ReputationBrandVoice;
  }

  // Create a default brand voice config
  const defaultVoice = {
    organization_id: organizationId,
    tone: "professional_warm" as const,
    language_preference: "en" as const,
    owner_name: null,
    sign_off: null,
    key_phrases: [] as string[],
    avoid_phrases: [] as string[],
    sample_responses: [] as string[],
    auto_respond_positive: false,
    auto_respond_min_rating: 4,
    escalation_threshold: 2,
  };

  const { data: createdData, error } = await repFrom(supabase, "reputation_brand_voice")
    .insert(defaultVoice)
    .select(REPUTATION_BRAND_VOICE_SELECT)
    .single();
  const created = createdData as unknown as ReputationBrandVoice | null;

  if (error) {
    // Return a fallback object if insert fails (e.g. race condition)
    return {
      id: "",
      ...defaultVoice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return created as ReputationBrandVoice;
}

export async function POST(req: Request) {
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

    const organizationId = profile.organization_id;

    // Resolve tier and check AI response limits
    const { tier } = await resolveOrganizationPlan(supabase, organizationId);
    const tierLimits = REPUTATION_TIER_LIMITS[tier] ?? REPUTATION_TIER_LIMITS.free;

    // Count monthly AI response usage
    if (tierLimits.maxAIResponsesPerMonth !== null) {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);

      const { count } = await repFrom(supabase, "reputation_reviews")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .not("ai_suggested_response", "is", null)
        .gte("updated_at", monthStart.toISOString());

      const usedCount = count ?? 0;

      if (usedCount >= tierLimits.maxAIResponsesPerMonth) {
        return NextResponse.json(
          {
            error: `Monthly AI response limit reached (${tierLimits.maxAIResponsesPerMonth}). Upgrade your plan for more.`,
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const { reviewId, regenerate } = body as {
      reviewId: string;
      regenerate?: boolean;
    };

    if (!reviewId || typeof reviewId !== "string") {
      return apiError("reviewId is required", 400);
    }

    // Fetch the review
    const { data: reviewData, error: reviewError } = await repFrom(supabase, "reputation_reviews")
      .select(REPUTATION_REVIEW_SELECT)
      .eq("id", reviewId)
      .eq("organization_id", organizationId)
      .single();
    const review = reviewData as unknown as ReputationReview | null;

    if (reviewError || !review) {
      return apiError("Review not found", 404);
    }

    const typedReview = review as ReputationReview;

    // If already has a response and not regenerating, return existing
    if (typedReview.ai_suggested_response && !regenerate) {
      return NextResponse.json({
        response: {
          suggested_response: typedReview.ai_suggested_response,
          tone_used: "professional_warm",
          language: typedReview.language ?? "en",
        } satisfies AIResponseResult,
      });
    }

    const reviewText = typedReview.comment ?? typedReview.title ?? "";
    if (!reviewText.trim()) {
      return apiError("Review has no text content to generate a response for", 400);
    }

    // Cost guard
    const costPerRequest = getEstimatedRequestCostUsd("ai_text");
    const planCap = getPlanDailySpendCapUsd("ai_text", tier);
    const emergencyCap = await getEmergencyDailySpendCapUsd("ai_text");

    const reservation = await reserveDailySpendUsd(organizationId, "ai_text", costPerRequest, {
      planCapUsd: planCap,
      emergencyCapUsd: emergencyCap,
    });

    if (!reservation.allowed) {
      return apiError("Daily AI spend limit reached. Please try again tomorrow.", 429);
    }

    // Fetch brand voice config
    const brandVoice = await getOrCreateBrandVoice(supabase, organizationId);

    // Call Gemini
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return apiError("AI service is not configured", 503);
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = buildResponsePrompt(reviewText, typedReview.rating, brandVoice);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const aiResponse = parseResponseResult(responseText, brandVoice.tone);

    // Save AI suggested response to the review
    await repFrom(supabase, "reputation_reviews")
      .update({
        ai_suggested_response: aiResponse.suggested_response,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .eq("organization_id", organizationId);

    return NextResponse.json({ response: aiResponse });
  } catch (error: unknown) {
    console.error("Error generating AI response:", error);
    return apiError("Internal server error", 500);
  }
}
