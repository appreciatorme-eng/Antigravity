import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getGeminiModel, parseGeminiJson } from "@/lib/ai/gemini.server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";

const QuerySchema = z.object({
  destination: z.string().trim().min(1).max(120),
  durationDays: z.coerce.number().int().min(1).max(30),
  pax: z.coerce.number().int().min(1).max(20).default(2),
});

type HistoricalSample = {
  amountInr: number;
  destination: string | null;
  durationDays: number | null;
};

function normalizeDestination(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function computeMedian(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1]! + sorted[middle]!) / 2);
  }
  return sorted[middle]!;
}

function buildPricingPrompt(input: z.infer<typeof QuerySchema>) {
  return `You are a travel pricing expert for India. Estimate a fair price range in INR for:
Destination: ${input.destination}, Duration: ${input.durationDays} days, Group size: ${input.pax} people.
Include accommodation, transport, activities. Return JSON: { "min": number, "max": number }.`;
}

async function loadHistoricalSamples(organizationId: string): Promise<HistoricalSample[]> {
  const supabase = await createClient();
  const { data: paymentLinks, error: paymentError } = await supabase
    .from("payment_links")
    .select("amount_paise, proposal_id")
    .eq("organization_id", organizationId)
    .eq("status", "paid")
    .not("proposal_id", "is", null);

  if (paymentError) {
    throw paymentError;
  }

  const proposalIds: string[] = [
    ...new Set(
      (paymentLinks || [])
        .map((row) => row.proposal_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];
  if (proposalIds.length === 0) {
    return [];
  }

  const { data: proposals, error: proposalError } = await supabase
    .from("proposals")
    .select("id, template_id")
    .in("id", proposalIds);

  if (proposalError) {
    throw proposalError;
  }

  const templateIds: string[] = [
    ...new Set(
      (proposals || [])
        .map((row) => row.template_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];
  const { data: templates, error: templateError } =
    templateIds.length > 0
      ? await supabase
          .from("tour_templates")
          .select("id, destination, duration_days")
          .in("id", templateIds)
      : { data: [], error: null };

  if (templateError) {
    throw templateError;
  }

  const proposalMap = new Map((proposals || []).map((proposal) => [proposal.id, proposal]));
  const templateMap = new Map((templates || []).map((template) => [template.id, template]));

  return (paymentLinks || []).flatMap((link) => {
    if (!link.proposal_id) return [];
    const proposal = proposalMap.get(link.proposal_id);
    const template = proposal?.template_id ? templateMap.get(proposal.template_id) : null;
    if (!template) return [];

    return [
      {
        amountInr: Math.round(Number(link.amount_paise || 0) / 100),
        destination: template.destination,
        durationDays: template.duration_days,
      },
    ];
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      destination: url.searchParams.get("destination"),
      durationDays: url.searchParams.get("durationDays"),
      pax: url.searchParams.get("pax") || 2,
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
      windowMs: 60_000, // 30 requests per minute per user
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

    const samples = await loadHistoricalSamples(profile.organization_id);
    const destinationQuery = normalizeDestination(parsed.data.destination);
    const matchingAmounts = samples
      .filter((sample) => {
        const sampleDestination = normalizeDestination(sample.destination);
        const durationDelta = Math.abs((sample.durationDays || 0) - parsed.data.durationDays);
        return (
          sampleDestination &&
          (sampleDestination.includes(destinationQuery) ||
            destinationQuery.includes(sampleDestination)) &&
          durationDelta <= 1
        );
      })
      .map((sample) => sample.amountInr)
      .filter((value) => Number.isFinite(value) && value > 0);

    if (matchingAmounts.length >= 3) {
      const min = Math.min(...matchingAmounts);
      const max = Math.max(...matchingAmounts);
      const median = computeMedian(matchingAmounts);
      return apiSuccess({
        min,
        median,
        max,
        confidence: "data" as const,
        sampleSize: matchingAmounts.length,
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
      confidence: "ai_estimate" as const,
      sampleSize: 0,
    });
  } catch (error) {
    logError("[ai/pricing-suggestion] unexpected error", error);
    return apiError("Failed to generate pricing suggestion", 500);
  }
}
