'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Filter } from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import type { DashboardPipelineSummary } from '@/lib/admin/dashboard-overview-types';
import { formatCompactINR } from '@/lib/admin/operator-state';
import { useDemoFetch } from '@/lib/demo/use-demo-fetch';
import { filterCanonicalPipelineProposals } from '@/lib/proposals/pipeline-integrity';
import { createClient } from '@/lib/supabase/client';
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

type ProposalListRow = {
  id: string;
  status: string | null;
  title: string | null;
  client_id?: string | null;
  total_price: number | null;
  client_selected_price: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  trip_id?: string | null;
  trips:
    | {
        id?: string | null;
        status: string | null;
      }
    | null;
};

type FunnelDataState = {
  stages: FunnelStage[];
  risk: DashboardPipelineSummary['risk'] | null;
  proposalUnavailable: boolean;
};

function normalizeStatus(input: string | null | undefined): string {
  return (input || '').trim().toLowerCase();
}

function getProposalValue(proposal: ProposalListRow): number {
  return Number(proposal.client_selected_price ?? proposal.total_price ?? 0);
}

function getStageKey(proposal: ProposalListRow): FunnelStage['key'] {
  const proposalStatus = normalizeStatus(proposal.status);
  const tripStatus = normalizeStatus(proposal.trips?.status);

  if (['accepted', 'approved', 'confirmed', 'converted'].includes(proposalStatus)) {
    return 'paid';
  }
  if (['expired', 'cancelled', 'rejected'].includes(proposalStatus)) {
    return 'lost';
  }
  if (['confirmed', 'paid', 'completed', 'active', 'in_progress'].includes(tripStatus)) {
    return 'paid';
  }
  if (proposalStatus === 'sent' || proposalStatus === 'viewed' || proposalStatus === 'draft') {
    return proposalStatus as FunnelStage['key'];
  }
  return 'draft';
}

function buildStagesFromOverview(data: DashboardV2State): FunnelDataState {
  const stages = (data.overview?.pipeline.stages ?? []).map((stage) => ({
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

  return {
    stages,
    risk: data.overview?.pipeline.risk ?? null,
    proposalUnavailable: data.overview?.health.sources.proposals === 'failed',
  };
}

function buildStagesFromProposals(proposals: ProposalListRow[]): FunnelDataState {
  const canonicalProposals = filterCanonicalPipelineProposals(proposals);
  const stageMap: Record<FunnelStage['key'], { count: number; value: number }> = {
    draft: { count: 0, value: 0 },
    sent: { count: 0, value: 0 },
    viewed: { count: 0, value: 0 },
    paid: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
  };

  for (const proposal of canonicalProposals) {
    const key = getStageKey(proposal);
    stageMap[key].count += 1;
    stageMap[key].value += getProposalValue(proposal);
  }

  const stages = [
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'viewed', label: 'Viewed' },
    { key: 'paid', label: 'Paid' },
    { key: 'lost', label: 'Lost' },
  ].map((stage) => ({
    ...stage,
    count: stageMap[stage.key].count,
    value: stageMap[stage.key].value,
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

  return {
    stages,
    risk: null,
    proposalUnavailable: false,
  };
}

function buildStages(data: DashboardV2State, localFunnel: FunnelDataState | null): FunnelDataState {
  if (localFunnel && !localFunnel.proposalUnavailable) {
    return localFunnel;
  }

  return buildStagesFromOverview(data);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface PipelineFunnelProps {
  data: DashboardV2State;
}

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const supabase = useMemo(() => createClient(), []);
  const demoFetch = useDemoFetch();
  const [localFunnel, setLocalFunnel] = useState<FunnelDataState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFunnel() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const response = await demoFetch('/api/admin/proposals', {
          headers,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Proposal list failed: ${response.status}`);
        }

        const payload = (await response.json()) as { proposals?: ProposalListRow[] };
        if (cancelled) return;
        setLocalFunnel(buildStagesFromProposals(payload.proposals ?? []));
      } catch {
        if (cancelled) return;
        setLocalFunnel({
          stages: [],
          risk: null,
          proposalUnavailable: true,
        });
      }
    }

    void fetchFunnel();

    return () => {
      cancelled = true;
    };
  }, [demoFetch, supabase]);

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

  const funnel = data.overview?.pipeline;
  const resolvedFunnel = buildStages(data, localFunnel);
  const stages = resolvedFunnel.stages;
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const summary = resolvedFunnel.risk ?? funnel?.risk;
  const hasValues = stages.some((stage) => stage.count > 0 || stage.value > 0);
  const proposalUnavailable = resolvedFunnel.proposalUnavailable;

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

      {proposalUnavailable && !hasValues ? (
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-5 text-sm font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
          Proposal pipeline data is temporarily unavailable, so the funnel cannot be computed right now.
        </div>
      ) : (
        <>
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
        </>
      )}
    </GlassCard>
  );
}
