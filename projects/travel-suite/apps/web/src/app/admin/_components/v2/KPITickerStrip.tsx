'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  MapPin,
  Target,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { AdminKpiStripBone } from '@/components/ui/skeletons/AdminDashboardBones';
import { formatCompactINR } from '@/lib/admin/operator-state';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

interface KPICard {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  icon: LucideIcon;
  color: string;
  iconBg: string;
  href: string;
}

function buildCards(data: DashboardV2State): KPICard[] {
  const kpis = data.overview?.kpis;
  const pipelineHref =
    '/analytics/drill-through?type=pipeline&status_group=open&limit=50';
  const bookedParams = new URLSearchParams({
    type: 'booked',
    preset: data.dateRange.preset,
    from: data.dateRange.from,
    to: data.dateRange.to,
  });

  const displayCurrency = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : formatCompactINR(value);
  const displayCount = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : String(value);
  const displayRate = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : `${value.toFixed(1)}%`;

  return [
    {
      label: 'Revenue',
      value: displayCurrency(kpis?.cashCollected),
      delta: data.overview?.revenue.totals.tripCount
        ? `${data.overview.revenue.totals.tripCount} trips`
        : undefined,
      deltaUp: (kpis?.cashCollected ?? 0) > 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-100/50',
      href: `/analytics/drill-through?${bookedParams.toString()}`,
    },
    {
      label: 'Outstanding Balance',
      value: displayCurrency(kpis?.outstandingBalance),
      delta: (kpis?.outstandingBalance ?? 0) > 0 ? 'Needs collection' : undefined,
      deltaUp: false,
      icon: Briefcase,
      color: 'text-blue-600',
      iconBg: 'bg-blue-100/50',
      href: '/admin/revenue',
    },
    {
      label: 'Open Pipeline',
      value: displayCurrency(kpis?.openPipelineValue),
      delta: kpis?.openProposalCount
        ? `${kpis.openProposalCount} open`
        : undefined,
      icon: Briefcase,
      color: 'text-sky-600',
      iconBg: 'bg-sky-100/50',
      href: pipelineHref,
    },
    {
      label: 'Overdue',
      value:
        kpis?.overdueAmount === null || kpis?.overdueAmount === undefined
          ? '—'
          : formatCompactINR(kpis.overdueAmount),
      delta:
        kpis?.overdueInvoices
          ? `${kpis.overdueInvoices} invoice${kpis.overdueInvoices > 1 ? 's' : ''}`
          : undefined,
      deltaUp: false,
      icon: AlertCircle,
      color: 'text-rose-600',
      iconBg: 'bg-rose-100/50',
      href: '/admin/invoices',
    },
    {
      label: 'Departures',
      value: displayCount(kpis?.departureCount),
      icon: MapPin,
      color: 'text-violet-600',
      iconBg: 'bg-violet-100/50',
      href: '/admin/operations',
    },
    {
      label: 'Win Rate',
      value: displayRate(kpis?.winRate),
      delta: data.overview?.customerPulse.proposalCount
        ? `${data.overview.customerPulse.proposalCount} proposals`
        : undefined,
      deltaUp:
        kpis?.winRate !== undefined && kpis?.winRate !== null
          ? kpis.winRate >= 40
          : undefined,
      icon: Target,
      color: 'text-amber-600',
      iconBg: 'bg-amber-100/50',
      href: '/admin/insights',
    },
    {
      label: 'Follow-ups',
      value: displayCount(kpis?.followUpsDue),
      delta: kpis?.followUpsDue
        ? 'Needs review'
        : undefined,
      icon: Target,
      color: 'text-primary',
      iconBg: 'bg-primary/10',
      href: '/admin/notifications',
    },
  ];
}

interface KPITickerStripProps {
  data: DashboardV2State;
}

export function KPITickerStrip({ data }: KPITickerStripProps) {
  const isLoading = data.phase === 'loading';

  if (isLoading) {
    return <AdminKpiStripBone />;
  }

  const cards = buildCards(data);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="group block shrink-0"
        >
          <GlassCard
            padding="lg"
            className={cn(
              'relative w-48 overflow-hidden border-gray-100/20 transition-all duration-300 dark:border-white/5',
              'hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
            )}
          >
            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                    card.iconBg,
                  )}
                >
                  <card.icon className={cn('h-4.5 w-4.5', card.color)} />
                </div>
                {card.delta && card.deltaUp !== undefined && (
                  <div className="flex items-center gap-0.5">
                    {card.deltaUp ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-rose-500" />
                    )}
                  </div>
                )}
              </div>

              <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
                {card.label}
              </h2>
              <span className="mt-1 block text-2xl font-black tabular-nums text-secondary dark:text-white">
                {card.value}
              </span>

              {card.delta && (
                <p className="mt-2 text-[10px] font-semibold text-text-muted">
                  {card.delta}
                </p>
              )}
            </div>
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}
