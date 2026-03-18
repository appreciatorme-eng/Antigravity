import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import {
  Car,
  ChevronRight,
  Plus,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import RevenueChart, { type RevenueChartPoint } from '@/components/analytics/RevenueChart';
import { GlassCard } from '@/components/glass/GlassCard';
import { DateRangePicker } from '@/features/admin/dashboard/DateRangePicker';
import type { AdminDateRangeSelection } from '@/lib/admin/date-range';
import { ErrorSection } from '@/components/ui/ErrorSection';

interface AdminAnalyticsSectionProps {
  loading: boolean;
  dateRange: AdminDateRangeSelection;
  setDateRange: Dispatch<SetStateAction<AdminDateRangeSelection>>;
  revenueSeries: RevenueChartPoint[];
}

const QUICK_ACTIONS = [
  {
    href: '/admin/planner',
    label: 'Create New Trip',
    description: 'Plan a new trip itinerary.',
    icon: Plus,
    iconWrap: 'bg-primary/10',
    iconColor: 'text-primary',
    cardClass: 'hover:bg-primary/[0.03] group-hover:border-primary/30',
  },
  {
    href: '/drivers',
    label: 'Add Driver',
    description: 'Add a new driver to your team.',
    icon: Car,
    iconWrap: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    cardClass: 'hover:bg-indigo-50/50 group-hover:border-indigo-200',
  },
  {
    href: '/clients',
    label: 'Manage Clients',
    description: 'Manage existing client relationships.',
    icon: Users,
    iconWrap: 'bg-violet-50',
    iconColor: 'text-violet-600',
    cardClass: 'hover:bg-violet-50/50 group-hover:border-violet-200',
  },
  {
    href: '/admin/settings/marketplace',
    label: 'Marketplace',
    description: 'Optimize your partner profile.',
    icon: Store,
    iconWrap: 'bg-blue-50',
    iconColor: 'text-blue-500',
    cardClass: 'hover:bg-blue-50/50 group-hover:border-blue-200',
  },
  {
    href: '/admin/insights',
    label: 'Insights Copilot',
    description: 'ROI, risk, and upsell recommendations.',
    icon: Sparkles,
    iconWrap: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    cardClass: 'hover:bg-emerald-50/50 group-hover:border-emerald-200',
  },
] as const;

export function AdminAnalyticsSection({
  loading,
  dateRange,
  setDateRange,
  revenueSeries,
}: AdminAnalyticsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <ErrorSection label="Admin revenue chart">
        <GlassCard className="lg:col-span-2" padding="xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-2xl font-serif tracking-tight text-secondary dark:text-white">
                  Financial Trajectory
                </h2>
              </div>
              <p className="text-sm font-medium text-text-muted">
                Revenue, approvals, and booking movement across the selected date range.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary dark:text-white">
                  Revenue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-secondary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary dark:text-white">
                  Trips
                </span>
              </div>
            </div>
          </div>

          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <div className="aspect-[21/9] w-full">
            <RevenueChart data={revenueSeries} metric="revenue" loading={loading} />
          </div>
        </GlassCard>
      </ErrorSection>

      <div className="space-y-6">
        <div className="mb-4 flex items-center gap-2 px-2">
          <Zap className="h-5 w-5 fill-amber-500 text-amber-500" />
          <h2 className="text-xl font-serif tracking-tight text-secondary dark:text-white">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.label} href={action.href} className="group">
              <GlassCard padding="md" className={`border-gray-100 transition-all ${action.cardClass}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${action.iconWrap}`}>
                    <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-secondary dark:text-white">
                      {action.label}
                    </h4>
                    <p className="mt-0.5 text-[10px] font-medium text-text-muted">{action.description}</p>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-text-muted transition-transform group-hover:translate-x-1" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
