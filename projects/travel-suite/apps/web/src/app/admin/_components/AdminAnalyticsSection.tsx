import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import {
  Car,
  ChevronRight,
  Plus,
  Server,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import RevenueChart, { type RevenueChartPoint } from '@/components/analytics/RevenueChart';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { DateRangePicker } from '@/features/admin/dashboard/DateRangePicker';
import type { AdminDateRangeSelection } from '@/lib/admin/date-range';
import { ErrorSection } from '@/components/ui/ErrorSection';
import type { HealthResponse } from './types';

interface AdminAnalyticsSectionProps {
  loading: boolean;
  health: HealthResponse | null;
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
  health,
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

        <GlassCard padding="lg" className="relative overflow-hidden border-none bg-slate-900">
          <div className="absolute -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">System Health</h3>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black uppercase text-emerald-500">Live</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Main Engine
                </span>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-200">Stable</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  API Latency
                </span>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-medium text-slate-200">{health?.duration_ms || 42}ms</span>
                </div>
              </div>
            </div>

            <GlassButton variant="primary" className="h-10 w-full rounded-xl border-none bg-white text-slate-900 hover:bg-slate-100">
              <span className="text-[10px] font-black uppercase tracking-widest">Run Health Check</span>
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
