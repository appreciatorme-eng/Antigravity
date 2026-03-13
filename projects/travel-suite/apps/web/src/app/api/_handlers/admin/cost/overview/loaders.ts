import { daysAgoISO, monthStartISO } from "./shared";
import type {
  AdminContext,
  AuthFailureLog,
  NotificationLog,
  RecentCostLog,
  WeeklyRevenueRow,
} from "./types";

/**
 * Load cost-metering notification logs within the given time range.
 */
export async function loadCostLogs(
  ctx: AdminContext,
  sinceIso: string,
): Promise<NotificationLog[]> {
  if (ctx.scopedRecipientIds && ctx.scopedRecipientIds.length === 0) {
    return [];
  }

  let query = ctx.adminClient
    .from("notification_logs")
    .select("id,recipient_id,status,body,created_at")
    .eq("notification_type", "cost_metering")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (ctx.scopedRecipientIds) {
    query = query.in("recipient_id", ctx.scopedRecipientIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Load recent 7-day cost logs for window-stats computation.
 */
export async function loadRecentCostLogs(
  ctx: AdminContext,
): Promise<RecentCostLog[]> {
  if (ctx.scopedRecipientIds && ctx.scopedRecipientIds.length === 0) {
    return [];
  }

  const since7dIso = daysAgoISO(7);

  let query = ctx.adminClient
    .from("notification_logs")
    .select("recipient_id,status,body,created_at")
    .eq("notification_type", "cost_metering")
    .gte("created_at", since7dIso)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (ctx.scopedRecipientIds) {
    query = query.in("recipient_id", ctx.scopedRecipientIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Load auth-failure notification logs from the last 24h.
 */
export async function loadAuthFailureLogs(
  ctx: AdminContext,
): Promise<AuthFailureLog[]> {
  if (ctx.scopedRecipientIds && ctx.scopedRecipientIds.length === 0) {
    return [];
  }

  const since24hIso = daysAgoISO(1);

  let query = ctx.adminClient
    .from("notification_logs")
    .select("recipient_id,body,created_at")
    .eq("notification_type", "admin_auth_failure")
    .gte("created_at", since24hIso)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (ctx.scopedRecipientIds) {
    query = query.in("recipient_id", ctx.scopedRecipientIds);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Load scoped recipient IDs from profiles within an organization.
 */
export async function loadScopedRecipientIds(
  adminClient: AdminContext["adminClient"],
  organizationId: string,
): Promise<string[]> {
  const { data, error } = await adminClient
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(5000);

  if (error) throw new Error(error.message);
  return (data || []).map((p) => p.id).filter(Boolean);
}

/**
 * Build a map of recipient ID -> organization ID from profiles.
 */
export async function loadProfileOrgMap(
  ctx: AdminContext,
  recipientIds: string[],
): Promise<Map<string, string>> {
  if (recipientIds.length === 0) return new Map();

  let query = ctx.adminClient
    .from("profiles")
    .select("id,organization_id")
    .in("id", recipientIds);

  if (ctx.scopedOrganizationId) {
    query = query.eq("organization_id", ctx.scopedOrganizationId);
  }

  const { data } = await query;

  return new Map(
    (data || [])
      .filter((p) => p.organization_id)
      .map((p) => [p.id, p.organization_id as string]),
  );
}

/**
 * Load organization metadata and AI usage for the given organization IDs.
 */
export async function loadOrganizationMetadata(
  adminClient: AdminContext["adminClient"],
  organizationIds: string[],
): Promise<{
  orgRows: Array<{
    id: string;
    name: string | null;
    subscription_tier: string | null;
  }>;
  aiUsageRows: Array<{
    organization_id: string;
    ai_requests: number | string | null;
    estimated_cost_usd: number | string | null;
  }>;
}> {
  if (organizationIds.length === 0) {
    return { orgRows: [], aiUsageRows: [] };
  }

  const [{ data: orgRows }, { data: aiUsageRows }] = await Promise.all([
    adminClient
      .from("organizations")
      .select("id,name,subscription_tier")
      .in("id", organizationIds),
    adminClient
      .from("organization_ai_usage")
      .select("organization_id,ai_requests,estimated_cost_usd")
      .eq("month_start", monthStartISO())
      .in("organization_id", organizationIds),
  ]);

  return {
    orgRows: orgRows || [],
    aiUsageRows: aiUsageRows || [],
  };
}

/**
 * Load weekly paid invoices, optionally scoped to an organization.
 */
export async function loadWeeklyRevenue(
  ctx: AdminContext,
): Promise<WeeklyRevenueRow[]> {
  const since7dIso = daysAgoISO(7);

  let query = ctx.adminClient
    .from("invoices")
    .select("organization_id,total_amount")
    .eq("status", "paid")
    .gte("created_at", since7dIso)
    .limit(10000);

  if (ctx.scopedOrganizationId) {
    query = query.eq("organization_id", ctx.scopedOrganizationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
