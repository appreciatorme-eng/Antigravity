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

function bucketTone(urgency: 'critical' | 'warning' | 'attention') {
  if (urgency === 'critical') {
    return 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200';
  }
  if (urgency === 'warning') {
    return 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200';
  }
  return 'border-sky-200 bg-sky-50/70 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200';
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
  ];

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
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-xs font-bold text-secondary transition-colors hover:bg-white dark:border-white/10 dark:text-white"
          >
            <Receipt className="h-4 w-4" />
            Open Collections
          </Link>
          <Link
            href="/admin/notifications"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <BellRing className="h-4 w-4" />
            Send Reminders
          </Link>
        </div>
      </div>

      {workspace.nextBestAction ? (
        <Link
          href={workspace.nextBestAction.href}
          className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 transition-colors hover:bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
              Next Best Action
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-900 dark:text-amber-50">
              {workspace.nextBestAction.title}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-200">
            {workspace.nextBestAction.actionLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshotCards.map(({ key, icon: Icon, item }) => (
          <Link
            key={key}
            href={item.href}
            className="rounded-2xl border border-gray-100 bg-white/50 px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/5 dark:bg-white/[0.02]"
          >
            <div className="mb-3 flex items-center justify-between">
              <Icon className="h-4 w-4 text-primary" />
              <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
              {item.label}
            </p>
            <div className="mt-2 text-2xl font-black tabular-nums text-secondary dark:text-white">
              {formatMoney(item.amount)}
            </div>
            <p className="mt-1 text-[11px] font-medium text-text-muted">
              {snapshotMeta(item.label, item.count)}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspace.buckets.map((bucket) => (
          <Link
            key={bucket.key}
            href={bucket.href}
            className="rounded-2xl border border-gray-100 bg-white/50 px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/5 dark:bg-white/[0.02]"
          >
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
        ))}
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
              className="rounded-2xl border border-gray-100 bg-white/50 px-4 py-4 dark:border-white/5 dark:bg-white/[0.02]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-secondary dark:text-white">
                      {row.title}
                    </p>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                        bucketTone(row.urgency),
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
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-gray-200 px-3 text-xs font-bold text-secondary transition-colors hover:bg-white dark:border-white/10 dark:text-white"
                    >
                      {row.primaryLabel}
                    </Link>
                    {row.secondaryHref && row.secondaryLabel ? (
                      <Link
                        href={row.secondaryHref}
                        className="inline-flex h-9 items-center gap-1 rounded-xl border border-primary/20 bg-primary/5 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
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
