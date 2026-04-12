'use client';

import Link from 'next/link';
import { ChevronRight, Filter } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { formatCompactINR } from '@/lib/admin/operator-state';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

// ---------------------------------------------------------------------------
interface FunnelStage {
  key: string;
  label: string;
  count: number;
  value: number;
  color: string;
  barColor: string;
}

function buildStages(data: DashboardV2State): FunnelStage[] {
  const stages = data.overview?.pipeline.stages ?? [];
  return stages.map((stage) => ({
    key: stage.key,
    label: stage.label,
    count: stage.count ?? 0,
    value: stage.value ?? 0,
    color:
      stage.key === 'draft'
        ? 'text-slate-500'
        : stage.key === 'sent'
          ? 'text-blue-500'
          : stage.key === 'viewed'
            ? 'text-amber-500'
            : stage.key === 'paid'
              ? 'text-emerald-500'
              : 'text-rose-500',
    barColor:
      stage.key === 'draft'
        ? 'bg-slate-400'
        : stage.key === 'sent'
          ? 'bg-blue-500'
          : stage.key === 'viewed'
            ? 'bg-amber-500'
            : stage.key === 'paid'
              ? 'bg-emerald-500'
              : 'bg-rose-500',
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface PipelineFunnelProps {
  data: DashboardV2State;
}

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const funnel = data.overview?.pipeline;

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
  const summary = funnel?.risk;

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
            { label: 'High Risk', count: summary.high, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' },
            { label: 'Medium', count: summary.medium, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
            { label: 'Low', count: summary.low, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
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
    </GlassCard>
  );
}
