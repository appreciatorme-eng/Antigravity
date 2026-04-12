'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  DollarSign,
  HeartHandshake,
  Receipt,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { AdminAiInsightsBone } from '@/components/ui/skeletons/AdminDashboardBones';
import type { DashboardAiInsightCard } from '@/lib/admin/dashboard-overview-types';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

interface InsightCard extends DashboardAiInsightCard {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const CATEGORY_LABELS: Record<InsightCard['category'], string> = {
  cash: 'Cash',
  pipeline: 'Pipeline',
  operations: 'Ops',
  growth: 'Growth',
};

const CATEGORY_COLORS: Record<InsightCard['category'], string> = {
  cash: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
  pipeline: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
  operations: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10',
  growth: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10',
};

function buildCards(data: DashboardV2State): InsightCard[] {
  return (data.overview?.aiInsights ?? []).map((card) => ({
    ...card,
    icon:
      card.category === 'cash'
        ? Receipt
        : card.category === 'pipeline'
          ? TrendingDown
          : card.category === 'operations'
            ? HeartHandshake
            : TrendingUp,
    iconColor:
      card.category === 'cash'
        ? 'text-emerald-500'
        : card.category === 'pipeline'
          ? 'text-amber-500'
          : card.category === 'operations'
            ? 'text-blue-500'
            : 'text-violet-500',
    iconBg:
      card.category === 'cash'
        ? 'bg-emerald-100/50 dark:bg-emerald-500/10'
        : card.category === 'pipeline'
          ? 'bg-amber-100/50 dark:bg-amber-500/10'
          : card.category === 'operations'
            ? 'bg-blue-100/50 dark:bg-blue-500/10'
            : 'bg-violet-100/50 dark:bg-violet-500/10',
  }));
}

interface AIInsightsCarouselProps {
  data: DashboardV2State;
}

export function AIInsightsCarousel({ data }: AIInsightsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const insightsLoading = data.phase === 'loading';

  if (insightsLoading) {
    return <AdminAiInsightsBone />;
  }

  const cards = buildCards(data);

  return (
    <GlassCard padding="xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">
            AI Insights
          </h2>
        </div>
        <Link
          href="/admin/insights"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          All Insights <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <DollarSign className="h-8 w-8 text-text-muted/30" />
          <p className="text-sm font-medium text-text-muted">
            Not enough connected data yet for AI insights
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group block shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div
                  className={cn(
                    'w-56 rounded-xl border border-gray-100 bg-white/50 p-4 transition-all',
                    'hover:border-primary/30 hover:shadow-md',
                    'dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]',
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        card.iconBg,
                      )}
                    >
                      <Icon className={cn('h-4 w-4', card.iconColor)} />
                    </div>
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight',
                        CATEGORY_COLORS[card.category],
                      )}
                    >
                      {CATEGORY_LABELS[card.category]}
                    </span>
                  </div>

                  <h4 className="mb-1 truncate text-sm font-bold text-secondary dark:text-white">
                    {card.title}
                  </h4>
                  <p className="mb-2 text-xs font-black text-primary">
                    {card.value}
                  </p>
                  <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-text-muted">
                    {card.description}
                  </p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                    Source: {card.source}
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Take action <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
          <div className="w-2 shrink-0" />
        </div>
      )}
    </GlassCard>
  );
}
