import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getGeminiModel } from "@/lib/ai/gemini.server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 30;

const DraftReviewResponseSchema = z.object({
  reviewContent: z.string().trim().min(1).max(4000),
  reviewerName: z.string().trim().min(1).max(120),
  rating: z.number().min(1).max(5),
  platform: z.string().trim().min(1).max(60),
});

function buildDraftPrompt(input: z.infer<typeof DraftReviewResponseSchema>) {
  return `You are a professional travel operator. Write a warm, personal response to this
${input.rating}-star ${input.platform} review from ${input.reviewerName}.
Rules: 3 sentences max. Be genuine, address their specific points,
invite them back. No generic phrases like "Thank you for your feedback."
Review: ${input.reviewContent}
Return only the response text, no explanation.`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const rl = await enforceRateLimit({
      identifier: user.id,
      limit: 20,
      windowMs: 60_000, // 20 requests per minute per user
      prefix: "api:ai:draft-review-response",
    });
    if (!rl.success) {
      return apiError("Too many requests", 429);
    }

    const body = await request.json();
    const parsed = DraftReviewResponseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid review draft payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    const model = getGeminiModel();
    const result = await model.generateContent(buildDraftPrompt(parsed.data));
    const draft = result.response.text().trim();

    if (!draft) {
      return apiError("AI did not return a review response draft", 502);
    }

    return apiSuccess({ draft });
  } catch (error) {
    logError("[ai/draft-review-response] unexpected error", error);
    return apiError("Failed to draft review response", 500);
  }
}

