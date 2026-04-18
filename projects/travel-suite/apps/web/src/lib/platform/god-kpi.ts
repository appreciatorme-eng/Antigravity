export type GodKpiScope = "snapshot" | "range_window" | "global_backlog";

export type GodKpiContract = {
  id: string;
  label: string;
  scope: GodKpiScope;
  formula: string;
  source: string[];
  drillthrough: string;
};

export type GodDataQualityMeta = {
  as_of: string;
  completeness: "complete" | "partial";
  sampled: boolean;
  estimated: boolean;
  mode: "exact_live";
  source: string[];
  notes: string[];
};

export type GodIntegrityWarning = {
  code: "DRILLTHROUGH_EMPTY_WITH_POSITIVE_KPI";
  kpi_id: string;
  message: string;
  observed_total: number;
  observed_rows: number;
};

const KPI_CONTRACTS: Record<string, GodKpiContract> = {
  total_users: {
    id: "total_users",
    label: "Total Users",
    scope: "snapshot",
    formula: "count(profiles.id)",
    source: ["profiles"],
    drillthrough: "/god/signups",
  },
  signups_in_range: {
    id: "signups_in_range",
    label: "New Users (Range)",
    scope: "range_window",
    formula: "count(profiles.id where created_at within selected range)",
    source: ["profiles"],
    drillthrough: "/god/signups",
  },
  support_owned: {
    id: "support_owned",
    label: "Owned Support Items",
    scope: "global_backlog",
    formula: "count(support_tickets in open/in_progress with work-item owner_id != null)",
    source: ["support_tickets", "platform_settings"],
    drillthrough: "/god/support?status=open",
  },
  support_sla_breached: {
    id: "support_sla_breached",
    label: "Support SLA Breached",
    scope: "global_backlog",
    formula: "count(support_tickets in open/in_progress with sla_due_at < now)",
    source: ["support_tickets", "platform_settings"],
    drillthrough: "/god/support?status=open",
  },
  errors_owned: {
    id: "errors_owned",
    label: "Owned Incidents",
    scope: "global_backlog",
    formula: "count(error_events in open/investigating with work-item owner_id != null)",
    source: ["error_events", "platform_settings"],
    drillthrough: "/god/errors?status=open",
  },
  errors_sla_breached: {
    id: "errors_sla_breached",
    label: "Incident SLA Breached",
    scope: "global_backlog",
    formula: "count(error_events in open/investigating with sla_due_at < now)",
    source: ["error_events", "platform_settings"],
    drillthrough: "/god/errors?status=open",
  },
  notification_pending: {
    id: "notification_pending",
    label: "Notifications Pending",
    scope: "snapshot",
    formula: "count(notification_queue.id where status='pending')",
    source: ["notification_queue"],
    drillthrough: "/god/monitoring?focus=queues",
  },
};

export function pickGodKpiContracts(ids: string[]): GodKpiContract[] {
  return ids
    .map((id) => KPI_CONTRACTS[id])
    .filter((contract): contract is GodKpiContract => Boolean(contract));
}

export function buildGodDataQuality(
  source: string[],
  options?: {
    completeness?: "complete" | "partial";
    sampled?: boolean;
    estimated?: boolean;
    notes?: string[];
  },
): GodDataQualityMeta {
  return {
    as_of: new Date().toISOString(),
    completeness: options?.completeness ?? "complete",
    sampled: options?.sampled ?? false,
    estimated: options?.estimated ?? false,
    mode: "exact_live",
    source,
    notes: options?.notes ?? [],
  };
}

export function detectEmptyDrillthrough(params: {
  kpiId: string;
  total: number;
  rows: number;
  page: number;
  filtersApplied: boolean;
  label: string;
}): GodIntegrityWarning | null {
  const { kpiId, total, rows, page, filtersApplied, label } = params;
  if (filtersApplied) return null;
  if (page > 0) return null;
  if (total <= 0) return null;
  if (rows > 0) return null;

  return {
    code: "DRILLTHROUGH_EMPTY_WITH_POSITIVE_KPI",
    kpi_id: kpiId,
    message: `${label} shows ${total} but first-page drill-through returned no rows.`,
    observed_total: total,
    observed_rows: rows,
  };
}
