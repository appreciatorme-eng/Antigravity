import type { RevenueChartPoint } from '@/components/analytics/RevenueChart';
import type {
  AttentionItem,
  CommandCenterPayload,
  DashboardStats,
  RevenueSnapshot,
} from '../types';

// ---------------------------------------------------------------------------
// API Response Types (matching actual handler responses)
// ---------------------------------------------------------------------------

export interface DailyBriefResponse {
  generated_at: string;
  top_actions: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    priority: string;
    entity_id?: string;
  }>;
  metrics_snapshot: {
    proposal_count_30d: number;
    conversion_rate_30d: number;
    paid_revenue_30d_usd: number;
  };
  narrative: string[];
}

export interface ProposalRiskRow {
  proposal_id: string;
  title: string;
  status: string;
  expires_at: string | null;
  viewed_at: string | null;
  value: number;
  risk_score: number;
  risk_level: 'high' | 'medium' | 'low';
  reasons: string[];
  next_action: string;
  client: {
    id: string | null;
    full_name: string | null;
    email: string | null;
  };
}

export interface ProposalRiskResponse {
  summary: {
    analyzed: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    org_median_proposal_value: number;
    stage_counts?: {
      draft: { count: number; value: number };
      sent: { count: number; value: number };
      viewed: { count: number; value: number };
      paid: { count: number; value: number };
      lost: { count: number; value: number };
    };
  };
  proposals: ProposalRiskRow[];
}

export interface WinLossPattern {
  key: string;
  label: string;
  count: number;
  share_pct: number;
  insight: string;
  action: string;
}

export interface WinLossResponse {
  window_days: number;
  totals: {
    proposals: number;
    wins: number;
    losses: number;
    win_rate: number;
    loss_rate: number;
  };
  patterns: WinLossPattern[];
}

export interface MarginLeakRow {
  proposal_id: string;
  title: string;
  listed_price_usd: number;
  selected_price_usd: number;
  discount_pct: number;
  leak_score: number;
  reasons: string[];
  recommendation: string;
}

export interface MarginLeakResponse {
  window_days: number;
  paid_revenue_usd: number;
  median_proposal_price_usd: number;
  flagged_count: number;
  leaks: MarginLeakRow[];
}

export interface UpsellRecommendation {
  add_on_id: string;
  name: string;
  category: string;
  price_usd: number;
  proposal_shown: number;
  selected_count: number;
  purchased_count: number;
  attach_rate: number;
  conversion_rate: number;
  untapped_revenue_usd: number;
  score: number;
  recommendation: string;
}

export interface UpsellResponse {
  window_days: number;
  analyzed: {
    active_add_ons: number;
    proposals: number;
    trips: number;
  };
  recommendations: UpsellRecommendation[];
  quick_wins: string[];
}

// ---------------------------------------------------------------------------
// Dashboard Data State (two-phase loading)
// ---------------------------------------------------------------------------

export interface CriticalData {
  stats: DashboardStats;
  commandCenter: CommandCenterPayload | null;
  revenueSnapshot: RevenueSnapshot;
  revenueSeries: RevenueChartPoint[];
  attentionItems: AttentionItem[];
  attentionTotalCount: number;
}

export interface InsightsData {
  dailyBrief: DailyBriefResponse | null;
  proposalRisk: ProposalRiskResponse | null;
  winLoss: WinLossResponse | null;
  marginLeak: MarginLeakResponse | null;
  upsell: UpsellResponse | null;
}

export type DashboardPhase = 'loading' | 'critical-ready' | 'full-ready' | 'error';

export interface DashboardV2State {
  phase: DashboardPhase;
  critical: CriticalData | null;
  insights: InsightsData | null;
  error: string | null;
  /** Date range for revenue chart */
  dateRange: import('@/lib/admin/date-range').AdminDateRangeSelection;
  setDateRange: (range: import('@/lib/admin/date-range').AdminDateRangeSelection) => void;
}

// Re-export types used by components
export type { AttentionItem, CommandCenterPayload, DashboardStats, RevenueSnapshot };
export type { RevenueChartPoint };
