'use client';

import Link from 'next/link';
import { ChevronRight, Filter } from 'lucide-react';
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

interface FunnelStage {
  key: string;
  label: string;
  count: number;
  value: number;
  color: string;
  barColor: string;
}

function buildStages(data: DashboardV2State): FunnelStage[] {
  const proposals = data.insights?.proposalRisk?.proposals ?? [];

  const stages: Record<string, { count: number; value: number }> = {
    draft: { count: 0, value: 0 },
    sent: { count: 0, value: 0 },
    viewed: { count: 0, value: 0 },
    approved: { count: 0, value: 0 },
    rejected: { count: 0, value: 0 },
  };

  for (const p of proposals) {
    const status = p.status.toLowerCase();
    const key =
      status === 'accepted' || status === 'confirmed' || status === 'converted'
        ? 'approved'
        : status === 'expired' || status === 'cancelled'
          ? 'rejected'
          : status in stages
            ? status
            : 'draft';
    stages[key].count += 1;
    stages[key].value += p.value;
  }

  return [
    {
      key: 'draft',
      label: 'Draft',
      ...stages.draft,
      color: 'text-slate-500',
      barColor: 'bg-slate-400',
    },
    {
      key: 'sent',
      label: 'Sent',
      ...stages.sent,
      color: 'text-blue-500',
      barColor: 'bg-blue-500',
    },
    {
      key: 'viewed',
      label: 'Viewed',
      ...stages.viewed,
      color: 'text-amber-500',
      barColor: 'bg-amber-500',
    },
    {
      key: 'approved',
      label: 'Won',
      ...stages.approved,
      color: 'text-emerald-500',
      barColor: 'bg-emerald-500',
    },
    {
      key: 'rejected',
      label: 'Lost',
      ...stages.rejected,
      color: 'text-rose-500',
      barColor: 'bg-rose-500',
    },
  ];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface PipelineFunnelProps {
  data: DashboardV2State;
}

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const insightsLoading = !data.insights;

  if (data.phase === 'loading') {
    return (
      <GlassCard padding="xl">
        <GlassSkeleton className="mb-4 h-5 w-44" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const stages = buildStages(data);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const summary = data.insights?.proposalRisk?.summary;

  return (
    <GlassCard padding="xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">
            Pipeline Funnel
          </h2>
        </div>
        <Link
          href="/analytics/drill-through?type=pipeline&status_group=open&limit=50"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Details <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Risk summary */}
      {summary && (
        <div className="mb-4 flex gap-3">
          {[
            { label: 'High Risk', count: summary.high_risk, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' },
            { label: 'Medium', count: summary.medium_risk, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Low', count: summary.low_risk, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
          ].map((r) => (
            <span
              key={r.label}
              className={cn(
                'rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tight',
                r.color,
              )}
            >
              {r.count} {r.label}
            </span>
          ))}
        </div>
      )}

      {/* Funnel bars */}
      {insightsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage) => {
            const widthPct = Math.max((stage.count / maxCount) * 100, 4);
            return (
              <div key={stage.key} className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-16 shrink-0 text-right text-[10px] font-black uppercase tracking-widest',
                    stage.color,
                  )}
                >
                  {stage.label}
                </span>
                <div className="flex-1">
                  <div className="h-8 w-full overflow-hidden rounded-lg bg-gray-100/50 dark:bg-white/5">
                    <div
                      className={cn(
                        'flex h-full items-center rounded-lg px-2 transition-all duration-500',
                        stage.barColor,
                        'bg-opacity-20',
                      )}
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-[11px] font-black text-secondary dark:text-white">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="w-16 shrink-0 text-right text-[11px] font-bold tabular-nums text-text-muted">
                  {stage.value > 0 ? formatCompactINR(stage.value) : '---'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
