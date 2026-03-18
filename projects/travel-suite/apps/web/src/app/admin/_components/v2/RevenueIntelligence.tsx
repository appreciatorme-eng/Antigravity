'use client';

import { Lightbulb, TrendingUp } from 'lucide-react';
import RevenueChart from '@/components/analytics/RevenueChart';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { DateRangePicker } from '@/features/admin/dashboard/DateRangePicker';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { cn } from '@/lib/utils';
import type { DashboardV2State } from './types';

interface RevenueIntelligenceProps {
  data: DashboardV2State;
}

export function RevenueIntelligence({ data }: RevenueIntelligenceProps) {
  const isLoading = data.phase === 'loading';
  const series = data.critical?.revenueSeries ?? [];
  const narrative = data.insights?.dailyBrief?.narrative ?? [];

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-secondary dark:text-white">
                Revenue
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-secondary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-secondary dark:text-white">
                Trips
              </span>
            </div>
          </div>
        </div>

        <DateRangePicker value={data.dateRange} onChange={data.setDateRange} />

        <div className="aspect-[21/9] w-full">
          <RevenueChart data={series} metric="revenue" loading={isLoading} />
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
