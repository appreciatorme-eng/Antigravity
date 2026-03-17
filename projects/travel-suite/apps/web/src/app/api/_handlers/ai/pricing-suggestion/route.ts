import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getGeminiModel, parseGeminiJson } from "@/lib/ai/gemini.server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";
import {
  findComparableTrips,
  getComparableTripStats,
  type ComparableTrip,
} from "@/lib/pricing/comparable-trips";

const QuerySchema = z.object({
  destination: z.string().trim().min(1).max(120),
  durationDays: z.coerce.number().int().min(1).max(30),
  pax: z.coerce.number().int().min(1).max(20).default(2),
  packageTier: z.string().trim().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

type ConfidenceLevel = "high" | "medium" | "low" | "ai_estimate";

/**
 * Determine confidence level based on comparable trips quality and quantity
 */
function determineConfidence(comparableTrips: ComparableTrip[]): ConfidenceLevel {
  if (comparableTrips.length === 0) {
    return "ai_estimate";
  }

  const avgMatchScore =
    comparableTrips.reduce((sum, trip) => sum + trip.matchScore, 0) / comparableTrips.length;

  if (comparableTrips.length >= 5 && avgMatchScore >= 70) {
    return "high";
  }
  if (comparableTrips.length >= 3 && avgMatchScore >= 50) {
    return "medium";
  }
  if (comparableTrips.length >= 1) {
    return "low";
  }

  return "ai_estimate";
}

function buildPricingPrompt(input: z.infer<typeof QuerySchema>) {
  const tierInfo = input.packageTier ? `, Package tier: ${input.packageTier}` : "";
  const seasonInfo = input.month
    ? `, Travel month: ${new Date(2024, input.month - 1).toLocaleString("en-US", { month: "long" })}`
    : "";

  return `You are a travel pricing expert for India. Estimate a fair per-person price range in INR for:
Destination: ${input.destination}, Duration: ${input.durationDays} days, Group size: ${input.pax} people${tierInfo}${seasonInfo}.
Include accommodation, transport, activities. Return JSON: { "min": number, "max": number }.`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      destination: url.searchParams.get("destination"),
      durationDays: url.searchParams.get("durationDays"),
      pax: url.searchParams.get("pax") || 2,
      packageTier: url.searchParams.get("packageTier"),
      month: url.searchParams.get("month"),
    });

    if (!parsed.success) {
      return apiError("Invalid pricing suggestion query", 400, {
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
      prefix: "api:ai:pricing-suggestion",
    });
    if (!rl.success) {
      return apiError("Too many requests", 429);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("Organization not found", 404);
    }

    const comparableTrips = await findComparableTrips(
      {
        destination: parsed.data.destination,
        durationDays: parsed.data.durationDays,
        groupSize: parsed.data.pax,
        packageTier: parsed.data.packageTier,
        month: parsed.data.month,
      },
      {
        maxResults: 3,
        minMatchScore: 40,
        excludeOrgId: profile.organization_id,
        supabaseClient: supabase,
      }
    );

    const confidence = determineConfidence(comparableTrips);
    const stats = getComparableTripStats(comparableTrips);

    if (stats && confidence !== "ai_estimate") {
      return apiSuccess({
        min: stats.min,
        median: stats.median,
        max: stats.max,
        confidence,
        sampleSize: stats.sampleSize,
        comparableTrips: comparableTrips.map((trip) => ({
          destination: trip.destination,
          durationDays: trip.durationDays,
          pricePerPerson: trip.pricePerPerson,
          packageTier: trip.packageTier,
          matchScore: trip.matchScore,
          organizationHash: trip.organizationHash,
        })),
      });
    }

    const model = getGeminiModel();
    const result = await model.generateContent(buildPricingPrompt(parsed.data));
    const estimate = parseGeminiJson<{ min: number; max: number }>(result.response.text());

    const min = Math.max(0, Math.round(Number(estimate.min || 0)));
    const max = Math.max(min, Math.round(Number(estimate.max || min)));

    return apiSuccess({
      min,
      median: Math.round((min + max) / 2),
      max,
      confidence: "ai_estimate",
      sampleSize: 0,
      comparableTrips: [],
    });
  } catch (error) {
    logError("[ai/pricing-suggestion] unexpected error", error);
    return apiError("Failed to generate pricing suggestion", 500);
  }
}
