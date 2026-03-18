import { useEffect, useMemo, useState } from 'react';
import type { RevenueChartPoint } from '@/components/analytics/RevenueChart';
import {
  createPresetRange,
  type AdminDateRangeSelection,
} from '@/lib/admin/date-range';
import { useDemoFetch } from '@/lib/demo/use-demo-fetch';
import { createClient } from '@/lib/supabase/client';
import type {
  ActivityItem,
  AttentionItem,
  CommandCenterPayload,
  DashboardStats,
  HealthResponse,
  RecentNotification,
  RecentTrip,
  RevenueSnapshot,
} from './types';

const EMPTY_STATS: DashboardStats = {
  recoveredRevenue: 0,
  paidLinks: 0,
  pendingProposals: 0,
  pendingNotifications: 0,
  activeTrips: 0,
  overduePayments: 0,
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

function formatCompactCurrency(value: number): string {
  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(1)}L`;
  }
  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(0)}K`;
  }
  return `₹${value.toLocaleString('en-IN')}`;
}

function deriveAttentionItems(payload: CommandCenterPayload): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const inv of payload.pending_payments) {
    if (inv.is_overdue) {
      items.push({
        id: `pay-${inv.invoice_id}`,
        type: 'payment',
        title: `Invoice ${inv.invoice_number} overdue`,
        subtitle: inv.client_name,
        urgency: 'critical',
        href: `/admin/invoices`,
        actionLabel: 'View Invoice',
        meta: `${formatCompactCurrency(inv.balance_amount)} overdue`,
      });
    }
  }

  for (const q of payload.expiring_quotes) {
    if (typeof q.hours_to_expiry === 'number' && q.hours_to_expiry <= 24) {
      items.push({
        id: `quote-${q.proposal_id}`,
        type: 'quote',
        title: q.title,
        subtitle: q.client_name,
        urgency: 'critical',
        href: `/proposals`,
        actionLabel: 'Follow Up',
        meta: `${q.hours_to_expiry}h left`,
      });
    }
  }

  for (const dep of payload.departures) {
    const status = dep.status.toLowerCase();
    const unconfirmed = status !== 'confirmed' && status !== 'active' && status !== 'in_progress';
    if (unconfirmed && typeof dep.days_until_departure === 'number' && dep.days_until_departure <= 2) {
      items.push({
        id: `dep-${dep.trip_id}`,
        type: 'departure',
        title: `${dep.title} — ${dep.destination}`,
        subtitle: dep.client_name,
        urgency: 'critical',
        href: `/admin/trips/${dep.trip_id}`,
        actionLabel: 'View Trip',
        meta: dep.days_until_departure <= 0 ? 'Today' : `D-${dep.days_until_departure}`,
      });
    }
  }

  for (const fu of payload.follow_ups) {
    if (fu.overdue) {
      items.push({
        id: `fu-${fu.queue_id}`,
        type: 'followup',
        title: `Overdue: ${fu.notification_type.replace(/_/g, ' ')}`,
        subtitle: fu.recipient || 'Unknown recipient',
        urgency: 'warning',
        href: '/admin/notifications',
        actionLabel: 'Review',
        meta: 'Overdue',
      });
    }
  }

  for (const q of payload.expiring_quotes) {
    if (typeof q.hours_to_expiry === 'number' && q.hours_to_expiry > 24) {
      items.push({
        id: `quote-${q.proposal_id}`,
        type: 'quote',
        title: q.title,
        subtitle: q.client_name,
        urgency: 'warning',
        href: `/proposals`,
        actionLabel: 'Follow Up',
        meta: `${Math.round(q.hours_to_expiry / 24)}d left`,
      });
    }
  }

  items.sort((a, b) => {
    if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
    if (a.urgency !== 'critical' && b.urgency === 'critical') return 1;
    return 0;
  });

  return items;
}

export function useAdminDashboardData() {
  const supabase = useMemo(() => createClient(), []);
  const demoFetch = useDemoFetch();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<RevenueChartPoint[]>([]);
  const [dateRange, setDateRange] = useState<AdminDateRangeSelection>(() => createPresetRange('30d'));
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [attentionTotalCount, setAttentionTotalCount] = useState(0);
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

        const [statsRes, revenueRes, commandRes] = await Promise.allSettled([
          demoFetch('/api/admin/dashboard/stats', { headers: authHeaders }),
          demoFetch(`/api/admin/revenue?${rangeQuery}`, { headers: authHeaders }),
          demoFetch('/api/admin/operations/command-center', { headers: authHeaders }),
        ]);

        let dashStats = { pendingNotifications: 0 };
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

        let commandData: CommandCenterPayload | null = null;
        if (commandRes.status === 'fulfilled' && commandRes.value.ok) {
          commandData = await commandRes.value.json();
        }

        setRevenueSeries(revenueSnapshot.series || []);

        if (commandData) {
          const derived = deriveAttentionItems(commandData);
          setAttentionTotalCount(derived.length);
          setAttentionItems(derived.slice(0, 5));
        } else {
          setAttentionItems([]);
          setAttentionTotalCount(0);
        }

        setStats({
          recoveredRevenue: revenueSnapshot.totals.recoveredRevenue || 0,
          paidLinks: revenueSnapshot.totals.paidLinks || 0,
          pendingProposals: revenueSnapshot.totals.pendingProposals || 0,
          pendingNotifications: dashStats.pendingNotifications || 0,
          activeTrips: commandData?.summary.departures_window || 0,
          overduePayments: commandData?.summary.overdue_invoices || 0,
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
        ]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);

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
    attentionItems,
    attentionTotalCount,
    loading,
    health,
  };
}
