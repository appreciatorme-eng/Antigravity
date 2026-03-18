import type { RevenueChartPoint } from '@/components/analytics/RevenueChart';

export interface DashboardStats {
  recoveredRevenue: number;
  paidLinks: number;
  pendingProposals: number;
  pendingNotifications: number;
  activeTrips: number;
  overduePayments: number;
}

export interface ActivityItem {
  id: string;
  type: 'trip' | 'notification' | 'inquiry';
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface RecentTrip {
  id: string;
  status: string | null;
  created_at: string;
  itineraries: {
    trip_title: string | null;
    destination: string | null;
  } | null;
}

export interface RecentNotification {
  id: string;
  title: string | null;
  body: string | null;
  sent_at: string | null;
  status: string | null;
}

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unconfigured';

export interface HealthResponse {
  status: HealthStatus;
  checked_at: string;
  duration_ms: number;
  checks: {
    database: { status: HealthStatus };
    supabase_edge_functions: { status: HealthStatus };
    firebase_fcm: { status: HealthStatus };
    whatsapp_api: { status: HealthStatus };
    external_apis: { status: HealthStatus };
    notification_pipeline: { status: HealthStatus };
  };
}

export interface RevenueSnapshot {
  series: RevenueChartPoint[];
  totals: {
    recoveredRevenue: number;
    paidLinks: number;
    activeOperators: number;
    totalBookings: number;
    pendingProposals: number;
  };
}

export type AttentionItem = {
  id: string;
  type: 'departure' | 'payment' | 'quote' | 'followup';
  title: string;
  subtitle: string;
  urgency: 'critical' | 'warning';
  href: string;
  actionLabel: string;
  meta: string;
};

export type DepartureItem = {
  trip_id: string;
  title: string;
  destination: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  client_name: string;
  days_until_departure: number | null;
};

export type PendingPaymentItem = {
  invoice_id: string;
  invoice_number: string;
  status: string;
  due_date: string | null;
  balance_amount: number;
  total_amount: number;
  client_name: string;
  is_overdue: boolean;
};

export type ExpiringQuoteItem = {
  proposal_id: string;
  title: string;
  status: string;
  expires_at: string | null;
  total_price: number;
  client_name: string;
  hours_to_expiry: number | null;
};

export type FollowUpItem = {
  queue_id: string;
  notification_type: string;
  status: string;
  scheduled_for: string;
  trip_id: string | null;
  recipient: string | null;
  overdue: boolean;
};

export type CommandCenterPayload = {
  generated_at: string;
  summary: {
    departures_window: number;
    pending_payments: number;
    expiring_quotes: number;
    follow_ups_due: number;
    overdue_invoices: number;
    urgent_quotes: number;
    overdue_follow_ups: number;
  };
  daily_ops_board: {
    at_risk_departures: number;
    pending_payments: number;
    expiring_quotes_24h: number;
    overdue_follow_ups: number;
  };
  outcome_events: Array<{
    key: 'time_saved_hours' | 'recovered_revenue_inr' | 'response_sla_pct';
    label: string;
    value: number;
    unit: 'hours' | 'inr' | 'percent';
    window: string;
  }>;
  departures: DepartureItem[];
  pending_payments: PendingPaymentItem[];
  expiring_quotes: ExpiringQuoteItem[];
  follow_ups: FollowUpItem[];
};

export interface DashboardDataState {
  stats: DashboardStats;
  activities: ActivityItem[];
  revenueSeries: RevenueChartPoint[];
  attentionItems: AttentionItem[];
  attentionTotalCount: number;
  loading: boolean;
  health: HealthResponse | null;
}
