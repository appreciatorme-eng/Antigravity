'use client';

import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Minus,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCompactINR(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

interface ScorecardMetric {
  label: string;
  current: string;
  delta: number | null;
  unit: string;
}

function buildMetrics(data: DashboardV2State): ScorecardMetric[] {
  const stats = data.critical?.stats;
  const winLoss = data.insights?.winLoss;
  const brief = data.insights?.dailyBrief;

  return [
    {
      label: 'Revenue',
      current: formatCompactINR(stats?.recoveredRevenue ?? 0),
      delta: null, // We don't have prev month in current APIs
      unit: '',
    },
    {
      label: 'Active Proposals',
      current: String(stats?.pendingProposals ?? 0),
      delta: null,
      unit: '',
    },
    {
      label: 'Win Rate',
      current:
        winLoss?.totals.win_rate !== undefined
          ? `${winLoss.totals.win_rate.toFixed(1)}%`
          : '---',
      delta: null,
      unit: '',
    },
    {
      label: 'Conversion (30d)',
      current:
        brief?.metrics_snapshot.conversion_rate_30d !== undefined
          ? `${brief.metrics_snapshot.conversion_rate_30d.toFixed(1)}%`
          : '---',
      delta: null,
      unit: '',
    },
    {
      label: 'Paid Revenue (30d)',
      current: formatCompactINR(
        brief?.metrics_snapshot.paid_revenue_30d_usd ?? 0,
      ),
      delta: null,
      unit: '',
    },
    {
      label: 'Overdue Invoices',
      current: String(stats?.overduePayments ?? 0),
      delta: null,
      unit: '',
    },
  ];
}

// ---------------------------------------------------------------------------
// Delta indicator
// ---------------------------------------------------------------------------

function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <Minus className="h-3 w-3 text-text-muted/40" />;
  }
  if (delta > 0) {
    return (
      <div className="flex items-center gap-0.5 text-emerald-500">
        <ArrowUpRight className="h-3 w-3" />
        <span className="text-[10px] font-black">+{delta}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 text-rose-500">
      <ArrowDownRight className="h-3 w-3" />
      <span className="text-[10px] font-black">{delta}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface PerformanceScorecardProps {
  data: DashboardV2State;
}

export function PerformanceScorecard({ data }: PerformanceScorecardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = data.phase === 'loading';

  if (isLoading) {
    return (
      <GlassCard padding="lg">
        <GlassSkeleton className="h-6 w-52" />
      </GlassCard>
    );
  }

  const metrics = buildMetrics(data);

  return (
    <GlassCard padding="lg">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3"
      >
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">
          Performance Scorecard
        </h3>
        <div className="flex-1" />
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                'rounded-xl border border-gray-100 bg-white/50 px-4 py-3',
                'dark:border-white/5 dark:bg-white/[0.02]',
              )}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted">
                {metric.label}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xl font-black tabular-nums text-secondary dark:text-white">
                  {metric.current}
                </span>
                <DeltaIndicator delta={metric.delta} />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
