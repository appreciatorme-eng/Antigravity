'use client';

import { useMemo, useState } from 'react';
import { IndianRupee, Lightbulb, Plane, TrendingUp } from 'lucide-react';
import RevenueChart, { type RevenueMetricMode } from '@/components/analytics/RevenueChart';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { DateRangePicker } from '@/features/admin/dashboard/DateRangePicker';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

interface RevenueIntelligenceProps {
  data: DashboardV2State;
}

function formatCompactINR(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function RevenueIntelligence({ data }: RevenueIntelligenceProps) {
  const [metric, setMetric] = useState<RevenueMetricMode>('revenue');
  const isLoading = data.phase === 'loading';
  const series = useMemo(
    () => data.critical?.revenueSeries ?? [],
    [data.critical?.revenueSeries],
  );
  const narrative = data.insights?.dailyBrief?.narrative ?? [];

  const totals = useMemo(() => {
    const totalRevenue = series.reduce((sum, p) => sum + p.revenue, 0);
    const totalBookings = series.reduce((sum, p) => sum + p.bookings, 0);
    return { totalRevenue, totalBookings };
  }, [series]);

  if (isLoading) {
    return (
      <GlassCard padding="xl">
        <GlassSkeleton className="mb-4 h-6 w-48" />
        <GlassSkeleton className="h-64 w-full rounded-xl" />
      </GlassCard>
    );
  }

  return (
    <ErrorSection label="Revenue intelligence">
      <GlassCard padding="xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">
                Revenue Intelligence
              </h2>
            </div>
            <p className="text-xs font-medium text-text-muted">
              Revenue trajectory with AI-powered insights
            </p>
          </div>

          {/* Interactive metric toggle */}
          <div className="flex items-center rounded-full border border-gray-200 bg-gray-50/80 p-0.5 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setMetric('revenue')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                metric === 'revenue'
                  ? 'bg-white text-primary shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-text-muted hover:text-secondary dark:hover:text-white/70',
              )}
            >
              <IndianRupee className="h-3 w-3" />
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setMetric('bookings')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                metric === 'bookings'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-white/10 dark:text-white'
                  : 'text-text-muted hover:text-secondary dark:hover:text-white/70',
              )}
            >
              <Plane className="h-3 w-3" />
              Trips
            </button>
          </div>
        </div>

        {/* Summary totals strip */}
        <div className="mb-4 flex items-center gap-6">
          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
            metric === 'revenue'
              ? 'border-primary/20 bg-primary/5'
              : 'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]',
          )}>
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-medium text-text-muted">Total Revenue</span>
            <span className="text-sm font-bold text-secondary dark:text-white">
              {formatCompactINR(totals.totalRevenue)}
            </span>
          </div>
          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
            metric === 'bookings'
              ? 'border-blue-500/20 bg-blue-500/5'
              : 'border-gray-100 bg-gray-50/50 dark:border-white/5 dark:bg-white/[0.02]',
          )}>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-text-muted">Total Trips</span>
            <span className="text-sm font-bold text-secondary dark:text-white">
              {totals.totalBookings}
            </span>
          </div>
        </div>

        <DateRangePicker value={data.dateRange} onChange={data.setDateRange} />

        <div className="aspect-[21/9] w-full">
          <RevenueChart data={series} metric={metric} loading={isLoading} />
        </div>

        {/* AI Insights below chart */}
        {narrative.length > 0 && (
          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                AI Insights
              </span>
            </div>
            {narrative.slice(0, 3).map((line) => (
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
    </ErrorSection>
  );
}
