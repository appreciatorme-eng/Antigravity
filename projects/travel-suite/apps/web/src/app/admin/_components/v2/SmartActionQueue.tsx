'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BellRing,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  MapPin,
  Receipt,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { AdminSmartActionQueueBone } from '@/components/ui/skeletons/AdminDashboardBones';
import type {
  DashboardHealthSourceKey,
  DashboardQueueItem,
} from '@/lib/admin/dashboard-overview-types';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type ItemType = DashboardQueueItem['type'];

const TYPE_CONFIG: Record<
  ItemType,
  {
    icon: React.ElementType;
    iconColor: string;
    label: string;
    order: number;
  }
> = {
  departure: {
    icon: MapPin,
    iconColor: 'text-blue-600',
    label: 'Departures',
    order: 0,
  },
  payment: {
    icon: Receipt,
    iconColor: 'text-rose-600',
    label: 'Payments',
    order: 1,
  },
  quote: {
    icon: FileText,
    iconColor: 'text-amber-600',
    label: 'Quotes',
    order: 2,
  },
  followup: {
    icon: BellRing,
    iconColor: 'text-violet-600',
    label: 'Follow-ups',
    order: 3,
  },
};

// ---------------------------------------------------------------------------
// Group component
// ---------------------------------------------------------------------------

function ActionGroup({
  type,
  items,
}: {
  type: ItemType;
  items: DashboardQueueItem[];
}) {
  const [expanded, setExpanded] = useState(true);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  const criticalCount = items.filter((i) => i.urgency === 'critical').length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2.5 px-1 py-2 text-left"
      >
        <Icon className={cn('h-4 w-4', config.iconColor)} />
        <span className="text-xs font-black uppercase tracking-widest text-secondary dark:text-white">
          {config.label}
        </span>
        <GlassBadge
          variant={criticalCount > 0 ? 'danger' : 'secondary'}
          size="sm"
        >
          {items.length}
        </GlassBadge>
        <div className="flex-1" />
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 pb-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-gray-100 bg-white/50 px-4 py-3 transition-all',
                'hover:bg-white hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]',
                item.urgency === 'critical'
                  ? 'border-l-[3px] border-l-rose-400'
                  : 'border-l-[3px] border-l-amber-400',
              )}
            >
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-bold text-secondary dark:text-white">
                  {item.title}
                </h4>
                <p className="truncate text-[11px] font-medium text-text-muted">
                  {item.subtitle}
                </p>
              </div>

              <span
                className={cn(
                  'shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tight',
                  item.urgency === 'critical'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
                )}
              >
                {item.meta}
              </span>

              <span className="shrink-0 rounded-lg border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 dark:border-white/10">
                {item.actionLabel}
              </span>

              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface SmartActionQueueProps {
  data: DashboardV2State;
}

export function SmartActionQueue({ data }: SmartActionQueueProps) {
  const isLoading = data.phase === 'loading';
  const items = data.overview?.actionQueue.items ?? [];
  const queueSources: DashboardHealthSourceKey[] = ['proposals', 'trips', 'invoices', 'followUps'];
  const queueUnavailable = queueSources.some(
    (source) => data.overview?.health.sources[source] === 'failed',
  );

  if (isLoading) {
    return <AdminSmartActionQueueBone />;
  }

  if (items.length === 0 && queueUnavailable) {
    return (
      <GlassCard padding="xl">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/60">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
            Action queue temporarily unavailable
          </h2>
          <p className="max-w-md text-sm font-medium text-text-muted">
            Some proposal, trip, invoice, or follow-up data did not load, so this queue cannot be trusted yet.
          </p>
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

  // Group items by type
  const grouped = new Map<ItemType, DashboardQueueItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.type) ?? [];
    grouped.set(item.type, [...existing, item]);
  }

  const sortedGroups = Array.from(grouped.entries()).sort(
    ([a], [b]) => TYPE_CONFIG[a].order - TYPE_CONFIG[b].order,
  );

  const totalCount = data.overview?.actionQueue.total ?? items.length;

  return (
    <GlassCard padding="xl">
      <div className="mb-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
          Needs Your Attention
        </h2>
        <GlassBadge variant="warning" size="sm">
          {totalCount}
        </GlassBadge>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {sortedGroups.map(([type, groupItems]) => (
          <ActionGroup key={type} type={type} items={groupItems} />
        ))}
      </div>

      {totalCount > items.length && (
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
