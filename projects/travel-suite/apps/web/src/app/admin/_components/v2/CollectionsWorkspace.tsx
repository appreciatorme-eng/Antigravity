'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  Receipt,
  Wallet,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { AdminCollectionsWorkspaceBone } from '@/components/ui/skeletons/AdminDashboardBones';
import { formatCompactINR, formatDateLabel } from '@/lib/admin/operator-state';
import { cn } from '@/lib/utils';
import type {
  DashboardCollectionsBucketKey,
  DashboardCollectionsPriorityRow,
} from '@/lib/admin/dashboard-overview-types';
import type { DashboardV2State } from './types';

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return formatCompactINR(value);
}

function formatCount(value: number | null | undefined, singular: string, plural = `${singular}s`) {
  if (value === null || value === undefined) return 'Unavailable';
  if (value === 0) return `0 ${plural}`;
  return `${value} ${value === 1 ? singular : plural}`;
}

type CollectionsToneKey = 'overdue' | 'due_soon' | 'partially_paid' | 'approved_unpaid' | 'collected';

const collectionsToneMap: Record<
  CollectionsToneKey,
  {
    surface: string;
    subtleSurface: string;
    iconWrap: string;
    icon: string;
    chip: string;
    rail: string;
    text: string;
    focusRing: string;
  }
> = {
  overdue: {
    surface:
      'border-rose-200/90 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/10',
    subtleSurface:
      'border-rose-100 bg-rose-50/40 dark:border-rose-500/20 dark:bg-rose-500/5',
    iconWrap: 'bg-rose-100 dark:bg-rose-500/20',
    icon: 'text-rose-600 dark:text-rose-300',
    chip: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    rail: 'bg-rose-500',
    text: 'text-rose-800 dark:text-rose-100',
    focusRing: 'focus-visible:ring-rose-300 dark:focus-visible:ring-rose-500/50',
  },
  due_soon: {
    surface:
      'border-amber-200/90 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10',
    subtleSurface:
      'border-amber-100 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/5',
    iconWrap: 'bg-amber-100 dark:bg-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-300',
    chip: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    rail: 'bg-amber-500',
    text: 'text-amber-800 dark:text-amber-100',
    focusRing: 'focus-visible:ring-amber-300 dark:focus-visible:ring-amber-500/50',
  },
  partially_paid: {
    surface:
      'border-orange-200/90 bg-orange-50/80 dark:border-orange-500/30 dark:bg-orange-500/10',
    subtleSurface:
      'border-orange-100 bg-orange-50/40 dark:border-orange-500/20 dark:bg-orange-500/5',
    iconWrap: 'bg-orange-100 dark:bg-orange-500/20',
    icon: 'text-orange-600 dark:text-orange-300',
    chip: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200',
    rail: 'bg-orange-500',
    text: 'text-orange-800 dark:text-orange-100',
    focusRing: 'focus-visible:ring-orange-300 dark:focus-visible:ring-orange-500/50',
  },
  approved_unpaid: {
    surface:
      'border-sky-200/90 bg-sky-50/80 dark:border-sky-500/30 dark:bg-sky-500/10',
    subtleSurface:
      'border-sky-100 bg-sky-50/40 dark:border-sky-500/20 dark:bg-sky-500/5',
    iconWrap: 'bg-sky-100 dark:bg-sky-500/20',
    icon: 'text-sky-600 dark:text-sky-300',
    chip: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
    rail: 'bg-sky-500',
    text: 'text-sky-800 dark:text-sky-100',
    focusRing: 'focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500/50',
  },
  collected: {
    surface:
      'border-emerald-200/90 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/10',
    subtleSurface:
      'border-emerald-100 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-500/5',
    iconWrap: 'bg-emerald-100 dark:bg-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-300',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    rail: 'bg-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-100',
    focusRing: 'focus-visible:ring-emerald-300 dark:focus-visible:ring-emerald-500/50',
  },
};

function getBucketTone(bucketKey: DashboardCollectionsBucketKey): CollectionsToneKey {
  if (bucketKey === 'overdue_invoices') return 'overdue';
  if (bucketKey === 'due_this_week') return 'due_soon';
  if (bucketKey === 'partially_paid_trips') return 'partially_paid';
  return 'approved_unpaid';
}

function getPaymentStageTone(paymentStage: DashboardCollectionsPriorityRow['paymentStage']): CollectionsToneKey {
  if (paymentStage === 'overdue') return 'overdue';
  if (paymentStage === 'due_soon') return 'due_soon';
  if (paymentStage === 'partially_paid') return 'partially_paid';
  if (paymentStage === 'approved' || paymentStage === 'unpaid') return 'approved_unpaid';
  return 'approved_unpaid';
}

function getSnapshotTone(metricKey: 'collected' | 'outstanding' | 'overdue' | 'expected'): CollectionsToneKey {
  if (metricKey === 'collected') return 'collected';
  if (metricKey === 'overdue') return 'overdue';
  if (metricKey === 'expected') return 'due_soon';
  return 'approved_unpaid';
}

function getNextActionTone(title: string): CollectionsToneKey {
  const normalized = title.toLowerCase();
  if (normalized.includes('overdue')) return 'overdue';
  if (normalized.includes('partially paid')) return 'partially_paid';
  if (normalized.includes('due')) return 'due_soon';
  return 'approved_unpaid';
}

function paymentStageLabel(stage: string) {
  switch (stage) {
    case 'overdue':
      return 'Overdue';
    case 'due_soon':
      return 'Due Soon';
    case 'partially_paid':
      return 'Partially Paid';
    case 'approved':
      return 'Approved';
    case 'unpaid':
      return 'Unpaid';
    default:
      return stage.replace(/_/g, ' ');
  }
}

function snapshotMeta(label: string, count: number | null | undefined) {
  switch (label) {
    case 'Collected This Window':
      return count ? `${count} contributor${count === 1 ? '' : 's'}` : 'Realized cash only';
    case 'Outstanding':
      return count ? `${count} collectible record${count === 1 ? '' : 's'}` : 'Nothing pending';
    case 'Overdue':
      return formatCount(count, 'invoice');
    case 'Expected in 7 Days':
      return count ? `${count} planned collection${count === 1 ? '' : 's'}` : 'No near-term collections';
    default:
      return '';
  }
}

interface CollectionsWorkspaceProps {
  data: DashboardV2State;
}

export function CollectionsWorkspace({ data }: CollectionsWorkspaceProps) {
  if (data.phase === 'loading') {
    return <AdminCollectionsWorkspaceBone />;
  }

  const workspace = data.overview?.collectionsWorkspace;
  const health = data.overview?.health;
  const workspaceUnavailable =
    health?.sources.invoices === 'failed' &&
    health.sources.trips === 'failed' &&
    health.sources.payments === 'failed' &&
    health.sources.followUps === 'failed';

  if (!workspace) {
    return null;
  }

  if (workspaceUnavailable) {
    return (
      <GlassCard padding="xl">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/60">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
            Collections workspace temporarily unavailable
          </h2>
          <p className="max-w-xl text-sm font-medium text-text-muted">
            Invoice, trip, payment, or reminder data did not load, so collection planning is paused until the dashboard sources recover.
          </p>
        </div>
      </GlassCard>
    );
  }

  const snapshotCards = [
    { key: 'collected', icon: Wallet, item: workspace.snapshot.collectedThisWindow },
    { key: 'outstanding', icon: CircleDollarSign, item: workspace.snapshot.outstanding },
    { key: 'overdue', icon: AlertTriangle, item: workspace.snapshot.overdue },
    { key: 'expected', icon: CalendarClock, item: workspace.snapshot.expectedIn7Days },
  ] as const;

  const hasCollectionsData =
    snapshotCards.some((card) => Number(card.item.amount || 0) > 0) ||
    workspace.priorityRows.length > 0 ||
    workspace.buckets.some((bucket) => Number(bucket.amount || 0) > 0);

  if (!hasCollectionsData) {
    return (
      <GlassCard padding="xl">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/60">
            <Wallet className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
            No active collections risk right now
          </h2>
          <p className="max-w-xl text-sm font-medium text-text-muted">
            Cash is clean, no invoices are due or overdue, and there are no partially paid or approved unpaid trips needing collection work.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
              Collections Workspace
            </h2>
          </div>
          <p className="max-w-2xl text-sm font-medium text-text-muted">
            Track what is collectible now and what needs follow-up next.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/invoices"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-xs font-bold text-secondary transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:border-white/10 dark:text-white"
          >
            <Receipt className="h-4 w-4" />
            Open Collections
          </Link>
          <Link
            href="/admin/notifications"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <BellRing className="h-4 w-4" />
            Send Reminders
          </Link>
        </div>
      </div>

      {workspace.nextBestAction ? (
        (() => {
          const toneKey = getNextActionTone(workspace.nextBestAction.title);
          const tone = collectionsToneMap[toneKey];
          return (
        <Link
          href={workspace.nextBestAction.href}
          className={cn(
            'mt-6 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 transition-colors hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2',
            tone.surface,
            tone.focusRing,
          )}
        >
          <span className={cn('w-1.5 self-stretch rounded-full', tone.rail)} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className={cn('text-[10px] font-black uppercase tracking-[0.18em]', tone.text)}>
              Next Best Action
            </p>
            <p className={cn('mt-1 text-sm font-semibold', tone.text)}>
              {workspace.nextBestAction.title}
            </p>
          </div>
          <span className={cn('inline-flex shrink-0 items-center gap-1 text-xs font-bold', tone.text)}>
            {workspace.nextBestAction.actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
          );
        })()
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshotCards.map(({ key, icon: Icon, item }) => {
          const tone = collectionsToneMap[getSnapshotTone(key)];
          return (
        <Link
          key={key}
          href={item.href}
          className={cn(
            'relative overflow-hidden rounded-2xl border px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2',
            tone.subtleSurface,
            tone.focusRing,
          )}
        >
          <span className={cn('absolute inset-y-0 left-0 w-1', tone.rail)} aria-hidden />
          <div className="mb-3 flex items-center justify-between">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tone.iconWrap)}>
              <Icon className={cn('h-4 w-4', tone.icon)} />
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
            {item.label}
          </p>
          <div className="mt-2 flex items-end gap-1">
            <div className="text-2xl font-black tabular-nums leading-none text-secondary dark:text-white">
              {formatMoney(item.amount)}
            </div>
          </div>
          <p className="mt-2 text-[11px] font-medium text-text-muted">
            {snapshotMeta(item.label, item.count)}
          </p>
        </Link>
        );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspace.buckets.map((bucket) => {
          const tone = collectionsToneMap[getBucketTone(bucket.key)];
          return (
          <Link
            key={bucket.key}
            href={bucket.href}
            className={cn(
              'relative overflow-hidden rounded-2xl border px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2',
              tone.subtleSurface,
              tone.focusRing,
            )}
          >
            <span className={cn('absolute inset-x-0 top-0 h-1', tone.rail)} aria-hidden />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-secondary dark:text-white">{bucket.label}</p>
              <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
            </div>
            <div className="mt-3 text-xl font-black tabular-nums text-secondary dark:text-white">
              {formatMoney(bucket.amount)}
            </div>
            <p className="mt-1 text-[11px] font-medium text-text-muted">
              {formatCount(bucket.count, 'record')}
            </p>
          </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-text-muted">
            Priority Worklist
          </h3>
          <GlassBadge variant="secondary" size="sm">
            {workspace.priorityRows.length}
          </GlassBadge>
        </div>

        <div className="space-y-3">
          {workspace.priorityRows.map((row) => (
            <div
              key={`${row.recordType}-${row.id}`}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-white/60 px-4 py-4 dark:bg-white/[0.02]',
                collectionsToneMap[getPaymentStageTone(row.paymentStage)].subtleSurface,
              )}
            >
              <span
                className={cn(
                  'absolute inset-y-0 left-0 w-1',
                  collectionsToneMap[getPaymentStageTone(row.paymentStage)].rail,
                )}
                aria-hidden
              />
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-secondary dark:text-white">
                      {row.title}
                    </p>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                        collectionsToneMap[getPaymentStageTone(row.paymentStage)].chip,
                      )}
                    >
                      {paymentStageLabel(row.paymentStage)}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-text-muted">
                    <span>{row.clientName || 'Client pending'}</span>
                    <span>
                      {row.dueDate ? `Due ${formatDateLabel(row.dueDate)}` : 'Collection timing not set'}
                    </span>
                    {row.followUpState ? <span>{row.followUpState}</span> : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                      Outstanding
                    </p>
                    <p className="text-xl font-black tabular-nums text-secondary dark:text-white">
                      {formatMoney(row.outstandingAmount)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={row.primaryHref}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {row.primaryLabel}
                    </Link>
                    {row.secondaryHref && row.secondaryLabel ? (
                      <Link
                        href={row.secondaryHref}
                        className="inline-flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white/80 px-3 text-xs font-bold text-secondary transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                      >
                        {row.secondaryLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
