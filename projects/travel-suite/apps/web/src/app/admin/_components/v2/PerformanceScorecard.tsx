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
import { AdminPerformanceScorecardBone } from '@/components/ui/skeletons/AdminDashboardBones';
import type { DashboardHealthSourceKey } from '@/lib/admin/dashboard-overview-types';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

interface ScorecardMetric {
  label: string;
  current: string;
  delta: number | null;
  unit: string;
}

function buildMetrics(data: DashboardV2State): ScorecardMetric[] {
  return (data.overview?.scorecard ?? []).map((metric) => ({
    label: metric.label,
    current: metric.current,
    delta: metric.delta,
    unit: '',
  }));
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
  const [expanded, setExpanded] = useState(true);
  const isLoading = data.phase === 'loading';

  if (isLoading) {
    return <AdminPerformanceScorecardBone />;
  }

  const metrics = buildMetrics(data);
  const scorecardSources: DashboardHealthSourceKey[] = ['proposals', 'trips', 'invoices', 'followUps'];
  const scorecardUnavailable = scorecardSources.some(
    (source) => data.overview?.health.sources[source] === 'failed',
  );
  const hasValues = metrics.some((metric) => metric.current !== '—');

  return (
    <GlassCard padding="lg">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3"
      >
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">
          Performance Scorecard
        </h2>
        <div className="flex-1" />
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" />
        )}
      </button>

      {expanded && (
        scorecardUnavailable && !hasValues ? (
          <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-5 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            Scorecard metrics are temporarily unavailable because core dashboard sources did not load.
          </div>
        ) : (
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
        )
      )}
    </GlassCard>
  );
}
