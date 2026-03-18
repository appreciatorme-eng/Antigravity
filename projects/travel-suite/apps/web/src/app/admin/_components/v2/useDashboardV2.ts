import { useEffect, useMemo, useState } from 'react';
import {
  createPresetRange,
  type AdminDateRangeSelection,
} from '@/lib/admin/date-range';
import { useDemoFetch } from '@/lib/demo/use-demo-fetch';
import { createClient } from '@/lib/supabase/client';
import type {
  CriticalData,
  DailyBriefResponse,
  DashboardPhase,
  DashboardV2State,
  InsightsData,
  MarginLeakResponse,
  ProposalRiskResponse,
  RevenueSnapshot,
  UpsellResponse,
  WinLossResponse,
} from './types';
import type { CommandCenterPayload } from '../types';

// ---------------------------------------------------------------------------
// Attention item derivation (carried forward from v1)
// ---------------------------------------------------------------------------

function formatCompactCurrency(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function deriveAttentionItems(payload: CommandCenterPayload) {
  const items: CriticalData['attentionItems'] = [];

  for (const inv of payload.pending_payments) {
    if (inv.is_overdue) {
      items.push({
        id: `pay-${inv.invoice_id}`,
        type: 'payment',
        title: `Invoice ${inv.invoice_number} overdue`,
        subtitle: inv.client_name,
        urgency: 'critical',
        href: '/admin/invoices',
        actionLabel: 'Send Reminder',
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
        href: '/proposals',
        actionLabel: 'Follow Up',
        meta: `${q.hours_to_expiry}h left`,
      });
    }
  }

  for (const dep of payload.departures) {
    const status = dep.status.toLowerCase();
    const unconfirmed =
      status !== 'confirmed' && status !== 'active' && status !== 'in_progress';
    if (
      unconfirmed &&
      typeof dep.days_until_departure === 'number' &&
      dep.days_until_departure <= 2
    ) {
      items.push({
        id: `dep-${dep.trip_id}`,
        type: 'departure',
        title: `${dep.title} — ${dep.destination}`,
        subtitle: dep.client_name,
        urgency: 'critical',
        href: `/admin/trips/${dep.trip_id}`,
        actionLabel: 'View Trip',
        meta:
          dep.days_until_departure <= 0
            ? 'Today'
            : `D-${dep.days_until_departure}`,
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
        href: '/proposals',
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

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const EMPTY_REVENUE: RevenueSnapshot = {
  series: [],
  totals: {
    recoveredRevenue: 0,
    paidLinks: 0,
    activeOperators: 0,
    totalBookings: 0,
    pendingProposals: 0,
  },
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboardV2(): DashboardV2State {
  const supabase = useMemo(() => createClient(), []);
  const demoFetch = useDemoFetch();

  const [phase, setPhase] = useState<DashboardPhase>('loading');
  const [critical, setCritical] = useState<CriticalData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<AdminDateRangeSelection>(() =>
    createPresetRange('30d'),
  );

  const rangeQuery = useMemo(() => {
    const params = new URLSearchParams({
      preset: dateRange.preset,
      from: dateRange.from,
      to: dateRange.to,
    });
    return params.toString();
  }, [dateRange]);

  // ---- Batch 1: Critical (above-the-fold) ----
  useEffect(() => {
    let cancelled = false;

    const fetchCritical = async () => {
      setPhase('loading');
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const authHeaders: Record<string, string> = {};
        if (session?.access_token) {
          authHeaders.Authorization = `Bearer ${session.access_token}`;
        }

        const [statsRes, commandRes, revenueRes] = await Promise.allSettled([
          demoFetch('/api/admin/dashboard/stats', { headers: authHeaders }),
          demoFetch('/api/admin/operations/command-center', {
            headers: authHeaders,
          }),
          demoFetch(`/api/admin/revenue?${rangeQuery}`, {
            headers: authHeaders,
          }),
        ]);

        if (cancelled) return;

        let dashStats = { pendingNotifications: 0 };
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          dashStats = await statsRes.value.json();
        }

        let commandData: CommandCenterPayload | null = null;
        if (commandRes.status === 'fulfilled' && commandRes.value.ok) {
          commandData = await commandRes.value.json();
        }

        let revenueSnapshot = EMPTY_REVENUE;
        if (revenueRes.status === 'fulfilled' && revenueRes.value.ok) {
          const payload = await revenueRes.value.json();
          revenueSnapshot = payload?.data ?? payload;
        }

        const attentionItems = commandData
          ? deriveAttentionItems(commandData)
          : [];

        const criticalData: CriticalData = {
          stats: {
            recoveredRevenue: revenueSnapshot.totals.recoveredRevenue || 0,
            paidLinks: revenueSnapshot.totals.paidLinks || 0,
            pendingProposals: revenueSnapshot.totals.pendingProposals || 0,
            pendingNotifications: dashStats.pendingNotifications || 0,
            activeTrips: commandData?.summary.departures_window || 0,
            overduePayments: commandData?.summary.overdue_invoices || 0,
          },
          commandCenter: commandData,
          revenueSnapshot,
          revenueSeries: revenueSnapshot.series || [],
          attentionItems,
          attentionTotalCount: attentionItems.length,
        };

        setCritical(criticalData);
        setPhase('critical-ready');

        // ---- Batch 2: Deferred insights ----
        fetchInsights(authHeaders, cancelled);
      } catch (err) {
        if (!cancelled) {
          console.error('Dashboard critical fetch failed:', err);
          setError('Failed to load dashboard data');
          setPhase('error');
        }
      }
    };

    const fetchInsights = async (
      authHeaders: Record<string, string>,
      wasCancelled: boolean,
    ) => {
      try {
        const [briefRes, riskRes, winLossRes, leakRes, upsellRes] =
          await Promise.allSettled([
            demoFetch('/api/admin/insights/daily-brief?limit=5', {
              headers: authHeaders,
            }),
            demoFetch('/api/admin/insights/proposal-risk?limit=50', {
              headers: authHeaders,
            }),
            demoFetch('/api/admin/insights/win-loss', {
              headers: authHeaders,
            }),
            demoFetch('/api/admin/insights/margin-leak?limit=5', {
              headers: authHeaders,
            }),
            demoFetch('/api/admin/insights/upsell-recommendations?limit=5', {
              headers: authHeaders,
            }),
          ]);

        if (wasCancelled || cancelled) return;

        const parseJson = async <T,>(
          result: PromiseSettledResult<Response>,
        ): Promise<T | null> => {
          if (result.status === 'fulfilled' && result.value.ok) {
            return (await result.value.json()) as T;
          }
          return null;
        };

        const insightsData: InsightsData = {
          dailyBrief: await parseJson<DailyBriefResponse>(briefRes),
          proposalRisk: await parseJson<ProposalRiskResponse>(riskRes),
          winLoss: await parseJson<WinLossResponse>(winLossRes),
          marginLeak: await parseJson<MarginLeakResponse>(leakRes),
          upsell: await parseJson<UpsellResponse>(upsellRes),
        };

        setInsights(insightsData);
        setPhase('full-ready');
      } catch (err) {
        console.error('Dashboard insights fetch failed:', err);
        // Don't block dashboard — critical data is already showing
      }
    };

    void fetchCritical();

    return () => {
      cancelled = true;
    };
  }, [demoFetch, rangeQuery, supabase]);

  return { phase, critical, insights, error, dateRange, setDateRange };
}
