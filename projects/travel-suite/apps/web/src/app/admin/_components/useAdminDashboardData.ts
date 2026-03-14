import { useEffect, useMemo, useState } from 'react';
import type { RevenueChartPoint } from '@/components/analytics/RevenueChart';
import type {
  AdminDestinationMetric,
  AdminFunnelStage,
  AdminLtvCustomer,
} from '@/features/admin/dashboard/types';
import {
  createPresetRange,
  type AdminDateRangeSelection,
} from '@/lib/admin/date-range';
import { useDemoFetch } from '@/lib/demo/use-demo-fetch';
import { createClient } from '@/lib/supabase/client';
import type {
  ActivityItem,
  DashboardStats,
  HealthResponse,
  RecentNotification,
  RecentTrip,
  RevenueSnapshot,
} from './types';

interface MarketplaceStats {
  views?: number;
  inquiries?: number;
  conversion_rate?: string;
  recent_inquiries?: Array<{
    id?: string;
    created_at?: string;
    organizations?: { name?: string };
  }>;
}

const EMPTY_STATS: DashboardStats = {
  activeOperators: 0,
  totalClients: 0,
  totalBookings: 0,
  pendingProposals: 0,
  recoveredRevenue: 0,
  paidLinks: 0,
  pendingNotifications: 0,
  marketplaceViews: 0,
  marketplaceInquiries: 0,
  conversionRate: '0.0',
};

const EMPTY_HEALTH: HealthResponse = {
  status: 'down',
  checked_at: new Date().toISOString(),
  duration_ms: 0,
  checks: {
    database: { status: 'down' },
    supabase_edge_functions: { status: 'down' },
    firebase_fcm: { status: 'down' },
    whatsapp_api: { status: 'down' },
    external_apis: { status: 'down' },
    notification_pipeline: { status: 'down' },
  },
};

export function useAdminDashboardData() {
  const supabase = useMemo(() => createClient(), []);
  const demoFetch = useDemoFetch();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<RevenueChartPoint[]>([]);
  const [dateRange, setDateRange] = useState<AdminDateRangeSelection>(() => createPresetRange('30d'));
  const [funnelStages, setFunnelStages] = useState<AdminFunnelStage[]>([]);
  const [topCustomers, setTopCustomers] = useState<AdminLtvCustomer[]>([]);
  const [topDestinations, setTopDestinations] = useState<AdminDestinationMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const rangeQuery = useMemo(() => {
    const searchParams = new URLSearchParams({
      preset: dateRange.preset,
      from: dateRange.from,
      to: dateRange.to,
    });
    return searchParams.toString();
  }, [dateRange]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const authHeaders: Record<string, string> = {};
        if (session?.access_token) {
          authHeaders.Authorization = `Bearer ${session.access_token}`;
        }

        const [statsRes, revenueRes, marketRes, funnelRes, ltvRes, destinationsRes] = await Promise.allSettled([
          demoFetch('/api/admin/dashboard/stats', { headers: authHeaders }),
          demoFetch(`/api/admin/revenue?${rangeQuery}`, { headers: authHeaders }),
          session?.access_token
            ? fetch('/api/marketplace/stats', {
                headers: { Authorization: `Bearer ${session.access_token}` },
              })
            : Promise.resolve(null),
          demoFetch(`/api/admin/funnel?${rangeQuery}`, { headers: authHeaders }),
          demoFetch(`/api/admin/ltv?${rangeQuery}`, { headers: authHeaders }),
          demoFetch(`/api/admin/destinations?${rangeQuery}`, { headers: authHeaders }),
        ]);

        let dashStats = { totalClients: 0, pendingNotifications: 0 };
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          dashStats = await statsRes.value.json();
        }

        let revenueSnapshot: RevenueSnapshot = {
          series: [],
          totals: {
            recoveredRevenue: 0,
            paidLinks: 0,
            activeOperators: 0,
            totalBookings: 0,
            pendingProposals: 0,
          },
        };
        if (revenueRes.status === 'fulfilled' && revenueRes.value.ok) {
          const payload = await revenueRes.value.json();
          revenueSnapshot = payload?.data ?? payload;
        }

        let marketStats: MarketplaceStats | null = null;
        if (marketRes.status === 'fulfilled' && marketRes.value?.ok) {
          marketStats = await marketRes.value.json();
        } else if (marketRes.status === 'rejected') {
          console.error('Marketplace stats fetch failed', marketRes.reason);
        }

        setRevenueSeries(revenueSnapshot.series || []);

        if (funnelRes.status === 'fulfilled' && funnelRes.value.ok) {
          const payload = await funnelRes.value.json();
          const funnelPayload = payload?.data ?? payload;
          setFunnelStages(funnelPayload?.stages || []);
        } else {
          setFunnelStages([]);
        }

        if (ltvRes.status === 'fulfilled' && ltvRes.value.ok) {
          const payload = await ltvRes.value.json();
          const ltvPayload = payload?.data ?? payload;
          setTopCustomers(ltvPayload?.customers || []);
        } else {
          setTopCustomers([]);
        }

        if (destinationsRes.status === 'fulfilled' && destinationsRes.value.ok) {
          const payload = await destinationsRes.value.json();
          const destinationsPayload = payload?.data ?? payload;
          setTopDestinations(destinationsPayload?.destinations || []);
        } else {
          setTopDestinations([]);
        }

        setStats({
          activeOperators: revenueSnapshot.totals.activeOperators || 0,
          totalClients: dashStats.totalClients || 0,
          totalBookings: revenueSnapshot.totals.totalBookings || 0,
          pendingProposals: revenueSnapshot.totals.pendingProposals || 0,
          recoveredRevenue: revenueSnapshot.totals.recoveredRevenue || 0,
          paidLinks: revenueSnapshot.totals.paidLinks || 0,
          pendingNotifications: dashStats.pendingNotifications || 0,
          marketplaceViews: marketStats?.views || 0,
          marketplaceInquiries: marketStats?.inquiries || 0,
          conversionRate: marketStats?.conversion_rate || '0.0',
        });

        const [tripsRes, notifsRes] = await Promise.allSettled([
          demoFetch('/api/admin/trips?status=all&limit=5', { headers: authHeaders }),
          demoFetch('/api/admin/notifications/delivery?limit=5', { headers: authHeaders }),
        ]);

        const recentTrips: RecentTrip[] = [];
        if (tripsRes.status === 'fulfilled' && tripsRes.value.ok) {
          const payload = await tripsRes.value.json();
          recentTrips.push(...(payload.trips || []).slice(0, 5));
        }

        const recentNotifications: RecentNotification[] = [];
        if (notifsRes.status === 'fulfilled' && notifsRes.value.ok) {
          const payload = await notifsRes.value.json();
          recentNotifications.push(...(payload.notifications || payload.logs || []).slice(0, 5));
        }

        const formattedActivities: ActivityItem[] = [
          ...recentTrips.map((trip) => ({
            id: trip.id,
            type: 'trip' as const,
            title: 'Trip Created',
            description: `${trip.itineraries?.trip_title || 'Untitled Trip'} to ${trip.itineraries?.destination || 'Unknown Destination'}`,
            timestamp: trip.created_at,
            status: trip.status || 'pending',
          })),
          ...recentNotifications.map((notif) => ({
            id: notif.id,
            type: 'notification' as const,
            title: notif.title || 'Notification',
            description: notif.body || '',
            timestamp: notif.sent_at || new Date().toISOString(),
            status: notif.status || 'sent',
          })),
          ...(marketStats?.recent_inquiries || []).map((inq, index) => ({
            id: inq.id || `inq-${inq.created_at || 'unknown'}-${inq.organizations?.name || 'partner'}-${index}`,
            type: 'inquiry' as const,
            title: 'Partner Inquiry',
            description: `From ${inq.organizations?.name || 'Unknown Partner'}`,
            timestamp: inq.created_at || new Date().toISOString(),
            status: 'new',
          })),
        ]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 8);

        setActivities(formattedActivities);
      } catch (error) {
        console.error('Critical Dashboard Failure:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [demoFetch, rangeQuery, supabase]);

  useEffect(() => {
    let mounted = true;

    const fetchHealth = async () => {
      try {
        if (!mounted) return;
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data = (await res.json()) as HealthResponse;
        if (mounted) {
          setHealth(data);
        }
      } catch {
        if (mounted) {
          setHealth({
            ...EMPTY_HEALTH,
            checked_at: new Date().toISOString(),
          });
        }
      }
    };

    void fetchHealth();
    const intervalId = setInterval(() => {
      void fetchHealth();
    }, 60_000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return {
    stats,
    activities,
    revenueSeries,
    dateRange,
    setDateRange,
    funnelStages,
    topCustomers,
    topDestinations,
    loading,
    health,
  };
}
