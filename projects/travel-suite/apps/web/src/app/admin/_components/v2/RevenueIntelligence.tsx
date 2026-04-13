'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  IndianRupee,
  Lightbulb,
  Plane,
} from 'lucide-react';
import RevenueChart, {
  type RevenueChartItemPoint,
  type RevenueChartPoint,
  type RevenueMetricMode,
} from '@/components/analytics/RevenueChart';
import { GlassCard } from '@/components/glass/GlassCard';
import { AdminRevenueIntelligenceBone } from '@/components/ui/skeletons/AdminDashboardBones';
import { DateRangePicker } from '@/features/admin/dashboard/DateRangePicker';
import { ErrorSection } from '@/components/ui/ErrorSection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCompactINR } from '@/lib/admin/operator-state';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

interface RevenueIntelligenceProps {
  data: DashboardV2State;
}

function getMetricItems(
  point: RevenueChartPoint | null,
  metric: RevenueMetricMode,
): RevenueChartItemPoint[] {
  if (!point) return [];
  if (metric === 'booked') return point.bookedItems ?? [];
  if (metric === 'cash' || metric === 'revenue') return point.cashItems ?? [];
  return point.tripItems ?? [];
}

function metricTitle(metric: RevenueMetricMode) {
  if (metric === 'booked') return 'Won value';
  if (metric === 'cash' || metric === 'revenue') return 'Collected cash';
  return 'Trips';
}

export function RevenueIntelligence({ data }: RevenueIntelligenceProps) {
  const [userMetric, setUserMetric] = useState<RevenueMetricMode | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<RevenueChartPoint | null>(null);
  const isLoading = data.phase === 'loading';
  const revenue = data.overview?.revenue;
  const series = useMemo(() => revenue?.series ?? [], [revenue?.series]);
  const metric = userMetric ?? revenue?.defaultMetric ?? 'booked';
  const wonDrillParams = new URLSearchParams({
    type: 'won',
    preset: data.dateRange.preset,
    from: data.dateRange.from,
    to: data.dateRange.to,
  });
  const selectedItems = useMemo(
    () => getMetricItems(selectedPoint, metric),
    [metric, selectedPoint],
  );

  if (isLoading) {
    return <AdminRevenueIntelligenceBone />;
  }

  const totals = revenue?.totals;

  return (
    <ErrorSection label="Revenue intelligence">
      <GlassCard padding="xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
                Revenue Intelligence
              </h2>
            </div>
            <p className="text-xs font-medium text-text-muted">
              Booked, collected, and trip activity from one connected business snapshot
            </p>
          </div>

          <div className="flex items-center rounded-full border border-gray-200 bg-gray-50/80 p-0.5 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setUserMetric('booked')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                metric === 'booked'
                  ? 'bg-white text-emerald-600 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-text-muted hover:text-secondary dark:hover:text-white/70',
              )}
            >
              <Briefcase className="h-3 w-3" />
              Won
            </button>
            <button
              type="button"
              onClick={() => setUserMetric('cash')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                metric === 'cash'
                  ? 'bg-white text-primary shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-text-muted hover:text-secondary dark:hover:text-white/70',
              )}
            >
              <IndianRupee className="h-3 w-3" />
              Cash
            </button>
            <button
              type="button"
              onClick={() => setUserMetric('trips')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                metric === 'trips'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-text-muted hover:text-secondary dark:hover:text-white/70',
              )}
            >
              <Plane className="h-3 w-3" />
              Trips
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {[
            {
              key: 'booked',
              label: 'Won Value',
              value:
                totals?.bookedValue !== null && totals?.bookedValue !== undefined
                  ? formatCompactINR(totals.bookedValue)
                  : '—',
              active: metric === 'booked',
              color: 'border-emerald-500/20 bg-emerald-500/5',
              href: `/analytics/drill-through?${wonDrillParams.toString()}`,
            },
            {
              key: 'cash',
              label: 'Collected Cash',
              value:
                totals?.cashCollected !== null && totals?.cashCollected !== undefined
                  ? formatCompactINR(totals.cashCollected)
                  : '—',
              active: metric === 'cash',
              color: 'border-primary/20 bg-primary/5',
              href: null,
            },
            {
              key: 'trips',
              label: 'Trip Activity',
              value:
                totals?.tripCount !== null && totals?.tripCount !== undefined
                  ? String(totals.tripCount)
                  : '—',
              active: metric === 'trips',
              color: 'border-blue-500/20 bg-blue-500/5',
              href: null,
            },
          ].map((item) => (
            item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:border-primary/30 hover:bg-primary/5',
                  item.active
                    ? item.color
                    : 'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]',
                )}
              >
                <span className="text-xs font-medium text-text-muted">{item.label}</span>
                <span className="text-sm font-bold text-secondary dark:text-white">
                  {item.value}
                </span>
                <ArrowUpRight className="ml-1 h-3.5 w-3.5 text-text-muted" />
              </Link>
            ) : (
              <div
                key={item.key}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
                  item.active
                    ? item.color
                    : 'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]',
                )}
              >
                <span className="text-xs font-medium text-text-muted">{item.label}</span>
                <span className="text-sm font-bold text-secondary dark:text-white">
                  {item.value}
                </span>
              </div>
            )
          ))}
        </div>

        <DateRangePicker value={data.dateRange} onChange={data.setDateRange} />

        <div className="aspect-[21/9] w-full">
          <RevenueChart
            data={series}
            metric={metric}
            loading={isLoading}
            onPointSelect={setSelectedPoint}
          />
        </div>

        {(revenue?.narrative?.length ?? 0) > 0 && (
          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Connected Readout
              </span>
            </div>
            {revenue?.narrative.slice(0, 3).map((line) => (
              <p
                key={line}
                className={cn(
                  'rounded-lg border border-gray-100 bg-white/50 px-3 py-2 text-xs font-medium text-secondary',
                  'dark:border-white/5 dark:bg-white/[0.02] dark:text-white/80',
                )}
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </GlassCard>

      <Dialog
        open={Boolean(selectedPoint)}
        onOpenChange={(open) => !open && setSelectedPoint(null)}
      >
        <DialogContent className="max-w-3xl p-0">
          <div className="border-b border-border px-6 py-5">
            <DialogHeader className="gap-1 text-left">
              <DialogTitle className="text-base font-semibold text-secondary dark:text-white">
                {metricTitle(metric)} for {selectedPoint?.label}
              </DialogTitle>
              <DialogDescription className="text-sm text-text-muted">
                {selectedItems.length > 0
                  ? `${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} in this bucket`
                  : 'No items matched this bucket'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
            {selectedItems.length > 0 ? (
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <Link
                    key={`${item.kind}:${item.id}`}
                    href={item.href}
                    className="block rounded-lg border border-border bg-background px-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-secondary dark:text-white">
                            {item.title}
                          </p>
                          <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium capitalize text-text-muted">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">{item.subtitle}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <IndianRupee className="h-3.5 w-3.5" />
                            {item.amountLabel}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {item.dateLabel}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-sm text-text-muted">
                No linked items were found for this point.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ErrorSection>
  );
}
