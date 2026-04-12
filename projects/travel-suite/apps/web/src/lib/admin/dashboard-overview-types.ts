import type { RevenueChartPoint } from "@/components/analytics/RevenueChart";

export type DashboardSourceHealth = "ok" | "partial" | "failed";

export type DashboardHealthSourceKey =
  | "proposals"
  | "trips"
  | "invoices"
  | "payments"
  | "followUps"
  | "profiles"
  | "itineraries";

export interface DashboardHealthIssue {
  source: DashboardHealthSourceKey;
  message: string;
}

export type DashboardQueueItemType = "departure" | "payment" | "quote" | "followup";

export interface DashboardHealth {
  overall: DashboardSourceHealth;
  sources: Record<DashboardHealthSourceKey, DashboardSourceHealth>;
  issues: DashboardHealthIssue[];
  messages: string[];
}

export interface DashboardQueueItem {
  id: string;
  type: DashboardQueueItemType;
  title: string;
  subtitle: string;
  urgency: "critical" | "warning";
  href: string;
  actionLabel: string;
  meta: string;
}

export interface DashboardQueueSummary {
  overdueInvoices: number | null;
  dueSoonInvoices: number | null;
  expiringQuotes: number | null;
  atRiskDepartures: number | null;
  followUpsDue: number | null;
}

export interface DashboardRevenueSnapshot {
  defaultMetric: "booked" | "cash" | "trips";
  totals: {
    bookedValue: number | null;
    cashCollected: number | null;
    tripCount: number | null;
    openPipelineValue: number | null;
  };
  series: RevenueChartPoint[];
  narrative: string[];
}

export interface DashboardCustomerPulse {
  proposalCount: number | null;
  winRate: number | null;
  wins: number | null;
  followUpsDue: number | null;
}

export interface DashboardPipelineStage {
  key: "draft" | "sent" | "viewed" | "paid" | "lost";
  label: string;
  count: number | null;
  value: number | null;
}

export interface DashboardPipelineSummary {
  stages: DashboardPipelineStage[];
  risk: {
    high: number | null;
    medium: number | null;
    low: number | null;
  };
}

export interface DashboardScorecardMetric {
  key: string;
  label: string;
  current: string;
  delta: number | null;
}

export interface DashboardAiInsightCard {
  id: string;
  category: "cash" | "pipeline" | "operations" | "growth";
  source: string;
  title: string;
  value: string;
  description: string;
  href: string;
}

export interface DashboardCalendarPreviewDay {
  date: string;
  label: string;
  dayLabel: string;
  isToday: boolean;
  departures: number;
  payments: number;
  followUps: number;
  quotes: number;
}

export interface DashboardCalendarPreview {
  days: DashboardCalendarPreviewDay[];
  hasAnyEvents: boolean;
  sourceErrors: Array<{ source: string }>;
}

export interface DashboardKpis {
  bookedValue: number | null;
  cashCollected: number | null;
  openPipelineValue: number | null;
  overdueAmount: number | null;
  overdueInvoices: number | null;
  departureCount: number | null;
  winRate: number | null;
  openProposalCount: number | null;
  wins: number | null;
  followUpsDue: number | null;
}

export interface DashboardOverview {
  generatedAt: string;
  health: DashboardHealth;
  briefing: {
    sentence: string;
  };
  kpis: DashboardKpis;
  actionQueue: {
    total: number;
    summary: DashboardQueueSummary;
    items: DashboardQueueItem[];
  };
  revenue: DashboardRevenueSnapshot;
  customerPulse: DashboardCustomerPulse;
  pipeline: DashboardPipelineSummary;
  scorecard: DashboardScorecardMetric[];
  aiInsights: DashboardAiInsightCard[];
  calendarPreview: DashboardCalendarPreview;
  lastComputedAt: string;
}
