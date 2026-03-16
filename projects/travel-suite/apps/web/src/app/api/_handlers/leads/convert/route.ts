// Internal leads convert endpoint — creates or refreshes a crm_contacts lead record.
// Called internally from WhatsApp webhook and other inbound channels (no user session).
// Protected by INTERNAL_API_SECRET shared-secret header + IP rate limiting.

import { safeEqual } from "@/lib/security/safe-equal";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";
import { parseLeadMessage } from "@/lib/leads/intent-parser";
import { BUDGET_TIERS, type BudgetTier } from "@/lib/leads/types";

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? "";
const CONVERTED_LEAD_SELECT = "budget_tier, converted_profile_id, destination, id";

function verifyInternalToken(request: NextRequest): boolean {
  if (!INTERNAL_API_SECRET) {
    return false;
  }
  const provided = request.headers.get("x-internal-token") ?? "";
  return safeEqual(provided, INTERNAL_API_SECRET);
}

const ConvertLeadSchema = z.object({
  organization_id: z.string().uuid(),
  phone: z.string().min(5).max(20),
  name: z.string().min(1).max(200).optional(),
  destination: z.string().max(200).optional(),
  travelers: z.number().int().min(1).optional(),
  duration_days: z.number().int().min(1).optional(),
  budget_tier: z
    .enum(BUDGET_TIERS as [BudgetTier, ...BudgetTier[]])
    .optional(),
  expected_value: z.number().min(0).optional(),
  message: z.string().max(10000).optional(),
  source: z.string().max(100).optional().default("whatsapp"),
});

export async function POST(request: NextRequest): Promise<Response> {
  if (!INTERNAL_API_SECRET) {
    console.error("[leads/convert] INTERNAL_API_SECRET is not configured; endpoint is disabled");
    return apiError("Service not configured", 503);
  }
  if (!verifyInternalToken(request)) {
    return apiError("Unauthorized", 401);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rl = await enforceRateLimit({
    identifier: ip,
    limit: 30,
    windowMs: 60_000,
    prefix: "int:leads:convert",
  });
  if (!rl.success) {
    return apiError("Too many requests", 429);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = ConvertLeadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;
  const supabase = createAdminClient();

  let intentDestination: string | null = null;
  let intentBudgetTier: BudgetTier | null = null;
  let intentTravelers: number | null = null;
  let intentDurationDays: number | null = null;
  let intentDepartureMonth: string | null = null;

  if (input.message) {
    const intent = parseLeadMessage(input.message);
    intentDestination = intent.destination;
    intentBudgetTier = intent.budgetTier;
    intentTravelers = intent.travelers;
    intentDurationDays = intent.durationDays;
    intentDepartureMonth = intent.departureMonth;
  }

  const phoneNormalized = input.phone.replace(/\D/g, "").replace(/^0+/, "");

  const { data: existing } = await supabase
    .from("crm_contacts")
    .select("id, converted_profile_id, stage")
    .eq("organization_id", input.organization_id)
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();

  const destination = input.destination ?? intentDestination ?? null;
  const budgetTier = input.budget_tier ?? intentBudgetTier ?? null;
  const travelers = input.travelers ?? intentTravelers ?? null;
  const durationDays = input.duration_days ?? intentDurationDays ?? null;

  if (existing) {
    const { data: updated } = await supabase
      .from("crm_contacts")
      .update({
        ...(input.name ? { full_name: input.name } : {}),
        ...(destination ? { destination } : {}),
        ...(budgetTier ? { budget_tier: budgetTier } : {}),
        ...(travelers ? { travelers } : {}),
        ...(durationDays ? { duration_days: durationDays } : {}),
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, converted_profile_id")
      .single();

    return NextResponse.json({
      leadId: updated?.id ?? existing.id,
      clientId: updated?.converted_profile_id ?? existing.converted_profile_id,
      created: false,
    });
  }

  const initialNote = input.message
    ? `Initial message: ${input.message.slice(0, 1000)}`
    : null;

  const { data: lead, error } = await supabase
    .from("crm_contacts")
    .insert({
      organization_id: input.organization_id,
      full_name: input.name ?? "Unknown",
      phone: input.phone,
      phone_normalized: phoneNormalized,
      source: input.source,
      notes: initialNote,
      stage: "new",
      destination,
      budget_tier: budgetTier,
      travelers,
      duration_days: durationDays,
      departure_month: intentDepartureMonth,
      last_activity_at: new Date().toISOString(),
    })
    .select(CONVERTED_LEAD_SELECT)
    .single();

  if (error) {
    logError("[leads/convert] insert error", error);
    return apiError("Failed to create lead", 500);
  }

  await supabase.from("conversion_events").insert({
    organization_id: input.organization_id,
    lead_id: lead.id,
    event_type: "lead_created",
    event_metadata: {
      source: input.source,
      destination: lead.destination,
      budget_tier: lead.budget_tier,
    },
  });

  return NextResponse.json(
    {
      leadId: lead.id,
      clientId: lead.converted_profile_id,
      created: true,
    },
    { status: 201 }
  );
}
