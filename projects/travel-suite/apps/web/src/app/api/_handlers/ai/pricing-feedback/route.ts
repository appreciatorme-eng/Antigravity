import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";
import { recordPricingFeedback } from "@/lib/pricing/feedback-loop";

const FeedbackSchema = z.object({
  suggestionId: z.string().trim().min(1).max(255),
  action: z.enum(["accepted", "adjusted", "dismissed"]),
  suggestedPrice: z.number().int().min(0),
  finalPrice: z.number().int().min(0).nullable(),
  confidenceLevel: z.enum(["high", "medium", "low", "ai_estimate"]),
  comparableTripsCount: z.number().int().min(0).default(0),
  destination: z.string().trim().min(1).max(120),
  durationDays: z.number().int().min(1).max(30),
  pax: z.number().int().min(1).max(20),
  packageTier: z.enum(["budget", "standard", "premium", "luxury"]).optional(),
  seasonMonth: z.number().int().min(1).max(12).optional(),
  proposalId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = FeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid pricing feedback data", 400, {
        details: parsed.error.flatten(),
      });
    }

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
      windowMs: 60_000,
      prefix: "api:ai:pricing-feedback",
    });
    if (!rl.success) {
      return apiError("Too many requests", 429);
    }

    // Record feedback using the utility function
    const result = await recordPricingFeedback(
      {
        suggestionId: parsed.data.suggestionId,
        action: parsed.data.action,
        suggestedPricePaise: parsed.data.suggestedPrice,
        finalPricePaise: parsed.data.finalPrice,
        confidenceLevel: parsed.data.confidenceLevel,
        comparableTripsCount: parsed.data.comparableTripsCount,
        destination: parsed.data.destination,
        durationDays: parsed.data.durationDays,
        pax: parsed.data.pax,
        packageTier: parsed.data.packageTier,
        seasonMonth: parsed.data.seasonMonth,
        proposalId: parsed.data.proposalId,
      },
      {
        supabaseClient: supabase,
      }
    );

    if (!result.success) {
      return apiError(result.error || "Failed to record pricing feedback", 500);
    }

    return apiSuccess({
      feedbackId: result.feedbackId,
      message: "Pricing feedback recorded successfully",
    });
  } catch (error) {
    logError("[ai/pricing-feedback] unexpected error", error);
    return apiError("Failed to record pricing feedback", 500);
  }
}
