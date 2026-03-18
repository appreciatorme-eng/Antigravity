'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  DollarSign,
  ShoppingBag,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

// ---------------------------------------------------------------------------
// Card types
// ---------------------------------------------------------------------------

interface InsightCard {
  id: string;
  category: 'margin-leak' | 'upsell' | 'win-loss';
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  description: string;
  href: string;
}

function formatCompactINR(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function buildCards(data: DashboardV2State): InsightCard[] {
  const cards: InsightCard[] = [];
  const leak = data.insights?.marginLeak;
  const upsell = data.insights?.upsell;
  const winLoss = data.insights?.winLoss;

  // Margin leak cards
  if (leak?.leaks) {
    for (const item of leak.leaks.slice(0, 2)) {
      cards.push({
        id: `leak-${item.proposal_id}`,
        category: 'margin-leak',
        icon: TrendingDown,
        iconColor: 'text-rose-500',
        iconBg: 'bg-rose-100/50 dark:bg-rose-500/10',
        title: item.title,
        value: `${item.discount_pct.toFixed(0)}% discount`,
        description: item.recommendation,
        href: '/admin/insights',
      });
    }
  }

  // Upsell cards
  if (upsell?.recommendations) {
    for (const item of upsell.recommendations.slice(0, 2)) {
      cards.push({
        id: `upsell-${item.add_on_id}`,
        category: 'upsell',
        icon: ShoppingBag,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-100/50 dark:bg-emerald-500/10',
        title: item.name,
        value: item.untapped_revenue_usd > 0 ? formatCompactINR(item.untapped_revenue_usd) + ' untapped' : `${item.conversion_rate}% conv.`,
        description: item.recommendation,
        href: '/add-ons',
      });
    }
  }

  // Win-loss pattern cards
  if (winLoss?.patterns) {
    for (const pattern of winLoss.patterns.filter((p) => p.count > 0).slice(0, 2)) {
      cards.push({
        id: `wl-${pattern.key}`,
        category: 'win-loss',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-100/50 dark:bg-amber-500/10',
        title: pattern.label,
        value: `${pattern.share_pct}% of proposals`,
        description: pattern.action,
        href: '/admin/insights',
      });
    }
  }

  return cards;
}

// ---------------------------------------------------------------------------
// Category badges
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<InsightCard['category'], string> = {
  'margin-leak': 'Margin Leak',
  'upsell': 'Upsell',
  'win-loss': 'Win/Loss',
};

const CATEGORY_COLORS: Record<InsightCard['category'], string> = {
  'margin-leak': 'bg-rose-50 text-rose-600 dark:bg-rose-500/10',
  'upsell': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10',
  'win-loss': 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface AIInsightsCarouselProps {
  data: DashboardV2State;
}

export function AIInsightsCarousel({ data }: AIInsightsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const insightsLoading = !data.insights;

  if (data.phase === 'loading') {
    return (
      <GlassCard padding="xl">
        <GlassSkeleton className="mb-4 h-5 w-40" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-40 w-56 shrink-0 rounded-xl" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const cards = buildCards(data);

  return (
    <GlassCard padding="xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">
            AI Insights
          </h3>
        </div>
        <Link
          href="/admin/insights"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          All Insights <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {insightsLoading ? (
        <div className="flex gap-3 overflow-x-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-40 w-56 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <DollarSign className="h-8 w-8 text-text-muted/30" />
          <p className="text-sm font-medium text-text-muted">
            Not enough data yet for AI insights
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
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', card.iconBg)}>
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

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Take action <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
          <div className="shrink-0 w-2" />
        </div>
      )}
    </GlassCard>
  );
}
