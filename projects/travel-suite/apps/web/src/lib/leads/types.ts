// Lead pipeline domain types — CRM stage model for tour operator leads.
// Extends crm_contacts with pipeline fields added in migration 20260309000000.

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiating"
  | "won"
  | "lost";

export type BudgetTier = "budget" | "standard" | "premium" | "luxury";

export type LeadEventType =
  | "stage_change"
  | "note_added"
  | "contacted"
  | "proposal_sent"
  | "follow_up_scheduled"
  | "won"
  | "lost";

export type ConversionEventType =
  | "lead_created"
  | "lead_contacted"
  | "lead_qualified"
  | "proposal_sent"
  | "proposal_viewed"
  | "payment_initiated"
  | "payment_completed"
  | "trip_completed";

export const LEAD_STAGES: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "won",
  "lost",
];

export const BUDGET_TIERS: BudgetTier[] = [
  "budget",
  "standard",
  "premium",
  "luxury",
];

export const TERMINAL_STAGES: LeadStage[] = ["won", "lost"];

export const STAGE_TO_FUNNEL_EVENT: Partial<Record<LeadStage, ConversionEventType>> = {
  contacted: "lead_contacted",
  qualified: "lead_qualified",
  proposal_sent: "proposal_sent",
};

export interface Lead {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string | null;
  phone_normalized: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;

  stage: LeadStage;
  assigned_to: string | null;
  expected_value: number | null;
  destination: string | null;
  budget_tier: BudgetTier | null;
  travelers: number | null;
  duration_days: number | null;
  departure_month: string | null;
  last_activity_at: string | null;
  closed_at: string | null;
  lost_reason: string | null;

  converted_at: string | null;
  converted_profile_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LeadEvent {
  id: string;
  lead_id: string;
  organization_id: string;
  event_type: LeadEventType;
  from_stage: LeadStage | null;
  to_stage: LeadStage | null;
  note: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface ConversionEvent {
  id: string;
  organization_id: string;
  lead_id: string | null;
  profile_id: string | null;
  trip_id: string | null;
  event_type: ConversionEventType;
  event_metadata: Record<string, unknown>;
  created_at: string;
}
