'use client';

import Link from 'next/link';
import {
  ChevronRight,
  Heart,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import type { DashboardHealthSourceKey } from '@/lib/admin/dashboard-overview-types';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

// ---------------------------------------------------------------------------
// Metric row
// ---------------------------------------------------------------------------

function MetricRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/50 dark:hover:bg-white/[0.03]">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
          iconBg,
        )}
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">
          {label}
        </p>
        <p className="text-lg font-black tabular-nums text-secondary dark:text-white">
          {value}
        </p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface CustomerPulseProps {
  data: DashboardV2State;
}

export function CustomerPulse({ data }: CustomerPulseProps) {
  const isLoading = data.phase === 'loading';
  const pulse = data.overview?.customerPulse;
  const pulseSources: DashboardHealthSourceKey[] = ['proposals', 'trips', 'followUps'];
  const pulseUnavailable = pulseSources.some(
    (source) => data.overview?.health.sources[source] === 'failed',
  );

  if (isLoading) {
    return (
      <GlassCard padding="xl" className="h-full">
        <GlassSkeleton className="mb-4 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const proposalCount = pulse?.proposalCount;
  const winRate = pulse?.winRate;
  const totalWins = pulse?.wins;
  const followUpsDue = pulse?.followUpsDue;

  if (
    pulseUnavailable &&
    proposalCount === null &&
    winRate === null &&
    totalWins === null
  ) {
    return (
      <GlassCard padding="xl" className="h-full">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">
            Customer Pulse
          </h2>
        </div>
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-5 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          Proposal and win-rate data is temporarily unavailable, so customer pulse metrics are paused.
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="xl" className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-4 w-4 text-rose-500" />
        <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">
          Customer Pulse
        </h2>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/5">
        <MetricRow
          icon={Star}
          iconColor="text-amber-500"
          iconBg="bg-amber-100/50"
          label="Win Rate"
          value={
            winRate !== undefined && winRate !== null
              ? `${winRate.toFixed(1)}%`
              : '—'
          }
          href="/admin/insights"
        />
        <MetricRow
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-100/50"
          label="Proposals In Window"
          value={proposalCount !== null && proposalCount !== undefined ? String(proposalCount) : '—'}
          href="/proposals"
        />
        <MetricRow
          icon={Star}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-100/50"
          label="Wins In Window"
          value={totalWins !== null && totalWins !== undefined ? String(totalWins) : '—'}
          href="/admin/insights"
        />
        <MetricRow
          icon={MessageCircle}
          iconColor="text-violet-500"
          iconBg="bg-violet-100/50"
          label="Follow-ups Due"
          value={followUpsDue !== null && followUpsDue !== undefined ? String(followUpsDue) : '—'}
          href="/admin/notifications"
        />
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/reputation"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          View Reputation Dashboard
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </GlassCard>
  );
}
