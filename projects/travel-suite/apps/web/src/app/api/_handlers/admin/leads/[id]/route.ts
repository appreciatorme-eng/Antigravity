// Admin leads PATCH — update lead fields and/or advance pipeline stage.
// Stage changes emit lead_events audit entries and conversion_events funnel events.

import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { CRM_CONTACT_SELECT } from "@/lib/business/selects";
import {
  LEAD_STAGES,
  BUDGET_TIERS,
  TERMINAL_STAGES,
  STAGE_TO_FUNNEL_EVENT,
  type LeadStage,
  type BudgetTier,
} from "@/lib/leads/types";
import type { Database } from "@/lib/database.types";

type LeadRow = Database["public"]["Tables"]["crm_contacts"]["Row"];

const UpdateLeadSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(200).nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  stage: z.enum(LEAD_STAGES as [LeadStage, ...LeadStage[]]).optional(),
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
  lost_reason: z.string().max(1000).nullable().optional(),
  note: z.string().max(5000).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req, { requireOrganization: true });
  if (!admin.ok) return admin.response;

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return apiError("Lead ID required", 400);
  }

  const { data: lead, error } = await admin.adminClient
    .from("crm_contacts")
    .select("id, full_name, email, phone, stage, source, notes, assigned_to, expected_value, destination, budget_tier, travelers, duration_days, departure_month, lost_reason, organization_id, created_at, updated_at, last_activity_at, closed_at")
    .eq("id", id)
    .eq("organization_id", admin.organizationId!)
    .single();

  if (error || !lead) {
    return apiError("Lead not found", 404);
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req, { requireOrganization: true });
  if (!admin.ok) return admin.response;

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return apiError("Lead ID required", 400);
  }

  const { data: existing, error: fetchError } = await admin.adminClient
    .from("crm_contacts")
    .select("id, stage, organization_id")
    .eq("id", id)
    .eq("organization_id", admin.organizationId!)
    .single();

  if (fetchError || !existing) {
    return apiError("Lead not found", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = UpdateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { note, ...updateFields } = parsed.data;

  const prevStage = existing.stage as LeadStage;
  const nextStage = updateFields.stage;
  const stageChanged = nextStage !== undefined && nextStage !== prevStage;

  const updateData: Record<string, unknown> = {
    ...updateFields,
    updated_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
  };

  if (stageChanged && TERMINAL_STAGES.includes(nextStage!)) {
    updateData.closed_at = new Date().toISOString();
  }

  const { data: leadData, error: updateError } = await admin.adminClient
    .from("crm_contacts")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", admin.organizationId!)
    .select(CRM_CONTACT_SELECT)
    .single();
  const lead = leadData as unknown as LeadRow | null;

  if (updateError) {
    console.error("[admin/leads/:id] PATCH error:", updateError);
    return apiError("Failed to update lead", 500);
  }

  const leadEventType = stageChanged ? "stage_change" : note ? "note_added" : "stage_change";

  await admin.adminClient.from("lead_events").insert({
    lead_id: id,
    organization_id: admin.organizationId!,
    event_type: leadEventType,
    from_stage: stageChanged ? prevStage : null,
    to_stage: stageChanged ? nextStage : null,
    note: note ?? null,
    created_by: admin.userId,
  });

  if (stageChanged) {
    const funnelEvent = STAGE_TO_FUNNEL_EVENT[nextStage!];
    if (funnelEvent) {
      await admin.adminClient.from("conversion_events").insert({
        organization_id: admin.organizationId!,
        lead_id: id,
        event_type: funnelEvent,
        event_metadata: { from_stage: prevStage, to_stage: nextStage },
      });
    }
  }

  return NextResponse.json({ lead });
}
