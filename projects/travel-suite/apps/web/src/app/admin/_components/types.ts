import type { RevenueChartPoint } from '@/components/analytics/RevenueChart';
import type {
  AdminDestinationMetric,
  AdminFunnelStage,
  AdminLtvCustomer,
} from '@/features/admin/dashboard/types';

export interface DashboardStats {
  activeOperators: number;
  totalClients: number;
  totalBookings: number;
  pendingProposals: number;
  recoveredRevenue: number;
  paidLinks: number;
  pendingNotifications: number;
  marketplaceViews?: number;
  marketplaceInquiries?: number;
  conversionRate?: string;
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

export interface DashboardDataState {
  stats: DashboardStats;
  activities: ActivityItem[];
  revenueSeries: RevenueChartPoint[];
  funnelStages: AdminFunnelStage[];
  topCustomers: AdminLtvCustomer[];
  topDestinations: AdminDestinationMetric[];
  loading: boolean;
  health: HealthResponse | null;
}
