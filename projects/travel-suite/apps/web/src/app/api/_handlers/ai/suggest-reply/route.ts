import { unstable_cache } from "next/cache";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getGeminiModel, parseGeminiJson } from "@/lib/ai/gemini.server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 30;

const SuggestReplySchema = z.object({
  lastMessages: z
    .array(
      z.object({
        role: z.enum(["traveler", "agent", "system"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(8),
  threadContext: z.string().trim().max(500).optional(),
});

function buildSuggestReplyPrompt(input: z.infer<typeof SuggestReplySchema>) {
  const transcript = input.lastMessages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  return `You are an assistant for a professional travel operator.
Given the last few WhatsApp messages from a traveler, suggest exactly 3 short reply options.
Each reply must be under 15 words, professional, and contextually relevant.
Avoid placeholders, signatures, bullet points, and emojis.
Return only a JSON array of 3 strings. No explanation.

${input.threadContext ? `Thread context: ${input.threadContext}\n` : ""}Conversation:
${transcript}`;
}

const getCachedSuggestions = unstable_cache(
  async (serializedInput: string) => {
    const parsed = SuggestReplySchema.parse(
      JSON.parse(serializedInput) as z.infer<typeof SuggestReplySchema>,
    );
    const model = getGeminiModel();
    const result = await model.generateContent(buildSuggestReplyPrompt(parsed));
    const suggestions = parseGeminiJson<string[]>(result.response.text())
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (suggestions.length !== 3) {
      throw new Error("Gemini did not return exactly three reply suggestions");
    }

    return suggestions;
  },
  ["ai-suggest-reply"],
  { revalidate: 300 },
);

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
      limit: 30,
      windowMs: 60_000, // 30 requests per minute per user
      prefix: "api:ai:suggest-reply",
    });
    if (!rl.success) {
      return apiError("Too many requests", 429);
    }

    const body = await request.json();
    const parsed = SuggestReplySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid smart reply payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    const suggestions = await getCachedSuggestions(JSON.stringify(parsed.data));
    return apiSuccess({ suggestions });
  } catch (error) {
    logError("[ai/suggest-reply] unexpected error", error);
    return apiError("Failed to generate smart replies", 500);
  }
}

