export type ActionItem = {
  id: string;
  type: string;
  priority: number;
  title: string;
  description: string;
  due_at: string | null;
  href: string;
  reason: string;
};

export type ActionQueueData = {
  summary?: {
    expiring_proposals: number;
    unpaid_invoices: number;
    stalled_trips: number;
  };
  queue?: ActionItem[];
};

export type LeakItem = {
  proposal_id: string;
  title: string;
  leak_score: number;
  discount_pct: number;
  listed_price_usd: number;
  selected_price_usd: number;
  recommendation: string;
};

export type MarginLeakData = {
  leaks?: LeakItem[];
};

export type UpsellRec = {
  add_on_id: string;
  name: string;
  score: number;
  price_usd: number;
  category?: string;
};

export type SmartUpsellData = {
  recommendations?: Array<{
    trip_id: string;
    trip_title: string;
    destination?: string;
    stage: string;
    days_to_departure?: number | null;
    start_date?: string;
    recommendations: UpsellRec[];
  }>;
};

export type AutoRequoteData = {
  candidates?: Array<{
    proposal_id: string;
    title: string;
    requote_score: number;
    suggested_delta_pct: number;
  }>;
};

export type DailyBriefData = {
  top_actions?: Array<{
    id: string;
    title: string;
    priority: number;
    href: string;
  }>;
  metrics_snapshot?: {
    proposal_count_30d: number;
    conversion_rate_30d: number;
    paid_revenue_30d_usd: number;
  };
};

export type WinLossData = {
  totals?: {
    proposals: number;
    wins: number;
    losses: number;
    win_rate: number;
  };
  patterns?: Array<{
    key: string;
    label: string;
    count: number;
    share_pct: number;
    insight: string;
    action: string;
  }>;
};

export type AiUsageData = {
  tier?: string;
  utilization?: { requests_pct: number; spend_pct: number };
  usage?: {
    ai_requests: number;
    estimated_cost_usd: number;
    rag_hits: number;
    cache_hits: number;
    fallback_count: number;
  };
  caps?: { monthly_request_cap: number; monthly_spend_cap_usd: number };
  degraded_mode_recommended?: boolean;
};

export type BatchJobsData = {
  jobs?: Array<{ id: string; status: string | null; created_at: string | null; payload?: { job_type?: string } }>;
};

export const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function humanSentence(action: ActionItem): string {
  if (action.type === 'invoice') {
    return `Payment for "${action.title}" is overdue — collect it now.`;
  }
  if (action.priority >= 90) {
    return `"${action.title}" expires very soon — reach out immediately!`;
  }
  if (action.type === 'trip') {
    return `"${action.title}" hasn't been updated in a while — check in with the client.`;
  }
  return `"${action.title}" — they may be waiting to hear from you. Time to follow up!`;
}

export function actionEmoji(action: ActionItem): string {
  if (action.type === 'invoice') return '💸';
  if (action.type === 'trip') return '✈️';
  if (action.priority >= 90) return '⚠️';
  return '💬';
}

export function stageLabel(stage: string): string {
  switch (stage) {
    case 'early':
      return '✅ Perfect time to offer extras';
    case 'mid':
      return '🕐 Good time to upsell';
    case 'last_minute':
      return '🚀 Final chance — they depart soon!';
    case 'active':
      return '🌍 Currently travelling';
    default:
      return '💡 Upsell opportunity';
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
