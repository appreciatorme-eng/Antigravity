// Admin leads API — list pipeline leads (GET) and create a new lead (POST).
// Requires admin auth. All writes also emit conversion_events for funnel tracking.

import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { parseLeadMessage } from "@/lib/leads/intent-parser";
import {
  LEAD_STAGES,
  BUDGET_TIERS,
  type LeadStage,
  type BudgetTier,
} from "@/lib/leads/types";

const CreateLeadSchema = z.object({
  full_name: z.string().min(1).max(200),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  stage: z
    .enum(LEAD_STAGES as [LeadStage, ...LeadStage[]])
    .optional()
    .default("new"),
  assigned_to: z.string().uuid().nullable().optional(),
  expected_value: z.number().min(0).nullable().optional(),
  destination: z.string().max(200).nullable().optional(),
  budget_tier: z
    .enum(BUDGET_TIERS as [BudgetTier, ...BudgetTier[]])
    .nullable()
    .optional(),
  travelers: z.number().int().min(1).nullable().optional(),
  duration_days: z.number().int().min(1).nullable().optional(),
  departure_month: z.string().max(50).nullable().optional(),
  raw_message: z.string().max(10000).optional(),
});

export async function GET(req: Request) {
  const admin = await requireAdmin(req, { requireOrganization: true });
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const assigned_to = searchParams.get("assigned_to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
  const offset = (page - 1) * limit;

  let query = admin.adminClient
    .from("crm_contacts")
    .select("*", { count: "exact" })
    .eq("organization_id", admin.organizationId!)
    .order("last_activity_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (stage) {
    query = query.eq("stage", stage);
  }
  if (assigned_to) {
    query = query.eq("assigned_to", assigned_to);
  }

  const { data: leads, error, count } = await query;

  if (error) {
    console.error("[admin/leads] GET error:", error);
    return apiError("Failed to fetch leads", 500);
  }

  return NextResponse.json({ leads: leads ?? [], total: count ?? 0, page, limit });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req, { requireOrganization: true });
  if (!admin.ok) return admin.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const input = parsed.data;

  let intentDestination: string | null = null;
  let intentBudgetTier: BudgetTier | null = null;
  let intentTravelers: number | null = null;
  let intentDurationDays: number | null = null;
  let intentDepartureMonth: string | null = null;

  if (input.raw_message) {
    const intent = parseLeadMessage(input.raw_message);
    intentDestination = intent.destination;
    intentBudgetTier = intent.budgetTier;
    intentTravelers = intent.travelers;
    intentDurationDays = intent.durationDays;
    intentDepartureMonth = intent.departureMonth;
  }

  const phone = input.phone ?? null;
  const phoneNormalized = phone
    ? phone.replace(/\D/g, "").replace(/^0+/, "")
    : null;

  const insertData = {
    organization_id: admin.organizationId!,
    full_name: input.full_name,
    phone,
    phone_normalized: phoneNormalized,
    email: input.email ?? null,
    source: input.source ?? null,
    notes: input.notes ?? null,
    stage: input.stage ?? "new",
    assigned_to: input.assigned_to ?? null,
    expected_value: input.expected_value ?? null,
    destination: input.destination ?? intentDestination ?? null,
    budget_tier: input.budget_tier ?? intentBudgetTier ?? null,
    travelers: input.travelers ?? intentTravelers ?? null,
    duration_days: input.duration_days ?? intentDurationDays ?? null,
    departure_month: input.departure_month ?? intentDepartureMonth ?? null,
    last_activity_at: new Date().toISOString(),
    created_by: admin.userId,
  };

  const { data: lead, error } = await admin.adminClient
    .from("crm_contacts")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[admin/leads] POST error:", error);
    return apiError("Failed to create lead", 500);
  }

  const initialNote = input.raw_message
    ? `Lead created from message: "${input.raw_message.slice(0, 200)}"`
    : "Lead created";

  await Promise.all([
    admin.adminClient.from("conversion_events").insert({
      organization_id: admin.organizationId!,
      lead_id: lead.id,
      event_type: "lead_created",
      event_metadata: {
        source: input.source ?? null,
        destination: lead.destination,
        budget_tier: lead.budget_tier,
      },
    }),
    admin.adminClient.from("lead_events").insert({
      lead_id: lead.id,
      organization_id: admin.organizationId!,
      event_type: "stage_change",
      from_stage: null,
      to_stage: "new",
      note: initialNote,
      created_by: admin.userId,
    }),
  ]);

  return NextResponse.json({ lead }, { status: 201 });
}
