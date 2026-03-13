import type { CostCategory } from "@/lib/cost/spend-guardrails";

/**
 * Shared internal types used across the cost overview handler modules.
 */

export type NotificationLog = {
  id: string;
  recipient_id: string | null;
  status: string | null;
  body: string | null;
  created_at: string | null;
};

export type RecentCostLog = {
  recipient_id: string | null;
  status: string | null;
  body: string | null;
  created_at: string | null;
};

export type AuthFailureLog = {
  recipient_id: string | null;
  body: string | null;
  created_at: string | null;
};

export type CategoryWindowStats = {
  organizationId: string;
  category: CostCategory;
  last24hSpendUsd: number;
  previous24hSpendUsd: number;
  total24hRequests: number;
  denied24hRequests: number;
  weeklyAllowedRequests: number;
  weeklyDeniedRequests: number;
  weeklySpendUsd: number;
};

export type WeeklyRevenueRow = {
  organization_id: string;
  total_amount: number | string | null;
};

export type AdminContext = {
  adminClient: ReturnType<
    typeof import("@/lib/supabase/admin").createAdminClient
  >;
  scopedOrganizationId: string | null;
  scopedRecipientIds: string[] | null;
};
