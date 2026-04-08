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
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
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

function formatCompactINR(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function buildCards(data: DashboardV2State): KPICard[] {
  const stats = data.critical?.stats;
  const cc = data.critical?.commandCenter;
  const winLoss = data.insights?.winLoss;
  const brief = data.insights?.dailyBrief;
  const risk = data.insights?.proposalRisk;

  const revenue = stats?.recoveredRevenue ?? 0;
  const pipelineValue =
    risk?.proposals
      .filter((p) =>
        ['draft', 'sent', 'viewed'].includes(p.status.toLowerCase()),
      )
      .reduce((sum, p) => sum + p.value, 0) ?? 0;

  const overdueTotal =
    cc?.pending_payments
      .filter((p) => p.is_overdue)
      .reduce((s, p) => s + p.balance_amount, 0) ?? 0;

  const departureCount = cc?.departures.length ?? stats?.activeTrips ?? 0;
  const winRate = winLoss?.totals.win_rate;
  const conversionRate = brief?.metrics_snapshot.conversion_rate_30d;
  const pipelineHref = '/analytics/drill-through?type=pipeline&status_group=open&range=1m';

  return [
    {
      label: 'Monthly Revenue',
      value: formatCompactINR(revenue),
      delta: stats?.paidLinks ? `${stats.paidLinks} paid` : undefined,
      deltaUp: true,
      icon: TrendingUp,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-100/50',
      href: '/admin/revenue',
    },
    {
      label: 'Pipeline Value',
      value: pipelineValue > 0 ? formatCompactINR(pipelineValue) : '---',
      delta:
        risk?.summary.high_risk
          ? `${risk.summary.high_risk} at risk`
          : undefined,
      deltaUp: false,
      icon: Briefcase,
      color: 'text-blue-600',
      iconBg: 'bg-blue-100/50',
      href: pipelineHref,
    },
    {
      label: 'Overdue',
      value: overdueTotal > 0 ? formatCompactINR(overdueTotal) : '₹0',
      delta:
        stats?.overduePayments
          ? `${stats.overduePayments} invoice${stats.overduePayments > 1 ? 's' : ''}`
          : undefined,
      deltaUp: false,
      icon: AlertCircle,
      color: 'text-rose-600',
      iconBg: 'bg-rose-100/50',
      href: '/admin/invoices',
    },
    {
      label: 'Departures',
      value: String(departureCount),
      icon: MapPin,
      color: 'text-violet-600',
      iconBg: 'bg-violet-100/50',
      href: '/admin/operations',
    },
    {
      label: 'Win Rate',
      value:
        winRate !== undefined && winRate !== null
          ? `${winRate.toFixed(0)}%`
          : '---',
      delta:
        winLoss?.totals.proposals
          ? `${winLoss.totals.proposals} proposals`
          : undefined,
      deltaUp: winRate !== undefined ? winRate >= 40 : undefined,
      icon: Target,
      color: 'text-amber-600',
      iconBg: 'bg-amber-100/50',
      href: '/admin/insights',
    },
    {
      label: 'Conversion',
      value:
        conversionRate !== undefined && conversionRate !== null
          ? `${conversionRate.toFixed(0)}%`
          : '---',
      delta: brief?.metrics_snapshot.proposal_count_30d
        ? `${brief.metrics_snapshot.proposal_count_30d} sent`
        : undefined,
      deltaUp:
        conversionRate !== undefined ? conversionRate >= 30 : undefined,
      icon: TrendingUp,
      color: 'text-primary',
      iconBg: 'bg-primary/10',
      href: '/admin/insights',
    },
  ];
}

interface KPITickerStripProps {
  data: DashboardV2State;
}

export function KPITickerStrip({ data }: KPITickerStripProps) {
  const isLoading = data.phase === 'loading';

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassSkeleton
            key={i}
            className="h-32 w-48 shrink-0 rounded-2xl"
          />
        ))}
      </div>
    );
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
