import Link from 'next/link';
import {
  AlertTriangle,
  BellRing,
  CheckCircle,
  ChevronRight,
  FileText,
  MapPin,
  Receipt,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { cn } from '@/lib/utils';
import type { AttentionItem } from './types';

interface NeedsAttentionSectionProps {
  loading: boolean;
  items: AttentionItem[];
  totalCount: number;
}

const TYPE_ICONS = {
  departure: MapPin,
  payment: Receipt,
  quote: FileText,
  followup: BellRing,
} as const;

const TYPE_COLORS = {
  departure: 'text-blue-600',
  payment: 'text-rose-600',
  quote: 'text-amber-600',
  followup: 'text-violet-600',
} as const;

export function NeedsAttentionSection({ loading, items, totalCount }: NeedsAttentionSectionProps) {
  if (loading) {
    return (
      <GlassCard padding="xl">
        <div className="mb-6 flex items-center gap-3">
          <GlassSkeleton className="h-5 w-5 rounded" />
          <GlassSkeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (items.length === 0) {
    return (
      <GlassCard padding="xl">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/50">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
            You&rsquo;re all caught up
          </h2>
          <p className="max-w-md text-sm font-medium text-text-muted">
            No urgent items right now. Great job staying on top of things.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="xl">
      <div className="mb-6 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
          Needs Your Attention
        </h2>
        <GlassBadge variant="warning" size="sm">
          {totalCount}
        </GlassBadge>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = TYPE_ICONS[item.type];
          const iconColor = TYPE_COLORS[item.type];

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex items-center gap-4 rounded-xl border border-gray-100 bg-white/50 px-5 py-4 transition-all',
                'hover:bg-white hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]',
                item.urgency === 'critical'
                  ? 'border-l-[3px] border-l-rose-400'
                  : 'border-l-[3px] border-l-amber-400'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  item.urgency === 'critical' ? 'bg-rose-50' : 'bg-amber-50'
                )}
              >
                <Icon className={cn('h-5 w-5', iconColor)} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-secondary dark:text-white">
                  {item.title}
                </h4>
                <p className="truncate text-xs font-medium text-text-muted">
                  {item.subtitle}
                </p>
              </div>

              <span
                className={cn(
                  'shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-tight',
                  item.urgency === 'critical'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-600'
                )}
              >
                {item.meta}
              </span>

              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>

      {totalCount > 5 && (
        <div className="mt-4 text-center">
          <Link
            href="/admin/operations"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            View all {totalCount} items
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
