import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  MapPin,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import { cn } from '@/lib/utils';
import type { DashboardStats } from './types';

interface AdminStatsGridProps {
  loading: boolean;
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: number | string;
  trend: string;
  trendUp: boolean;
  icon: LucideIcon;
  color: string;
  iconBg: string;
  description: string;
  href: string;
}

export function AdminStatsGrid({ loading, stats }: AdminStatsGridProps) {
  const compactCurrencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  const statCards: StatCard[] = [
    {
      label: "This Month's Revenue",
      value: loading ? '---' : compactCurrencyFormatter.format(stats.recoveredRevenue),
      trend: stats.paidLinks > 0 ? `${stats.paidLinks} paid links` : '',
      trendUp: true,
      icon: TrendingUp,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-100/50',
      description: 'Revenue recovered from verified payment links',
      href: '/admin/invoices',
    },
    {
      label: 'Upcoming Departures',
      value: stats.activeTrips,
      trend: '',
      trendUp: true,
      icon: MapPin,
      color: 'text-blue-600',
      iconBg: 'bg-blue-100/50',
      description: 'Trips departing in the next 48 hours',
      href: '/admin/trips',
    },
    {
      label: 'Pending Proposals',
      value: stats.pendingProposals,
      trend: stats.pendingNotifications > 0 ? `${stats.pendingNotifications} alerts pending` : '',
      trendUp: true,
      icon: MessageSquare,
      color: 'text-amber-600',
      iconBg: 'bg-amber-100/60',
      description: 'Open proposals awaiting a client decision',
      href: '/proposals',
    },
    {
      label: 'Overdue Payments',
      value: stats.overduePayments,
      trend: '',
      trendUp: false,
      icon: AlertCircle,
      color: 'text-rose-600',
      iconBg: 'bg-rose-100/50',
      description: 'Invoices past their due date',
      href: '/admin/invoices',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => (
        <Link key={stat.label} href={stat.href} className="group block">
          <GlassCard
            padding="xl"
            className={cn(
              'relative overflow-hidden border-gray-100/20 transition-all duration-500 dark:border-white/5',
              'hover:-translate-y-2 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10'
            )}
          >
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3',
                    stat.iconBg
                  )}
                >
                  <stat.icon className={cn('h-6 w-6', stat.color)} />
                </div>
                {stat.trend ? (
                  <div
                    className={cn(
                      'rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-tight',
                      stat.trendUp
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                        : 'border-rose-100 bg-rose-50 text-rose-600'
                    )}
                  >
                    {stat.trend}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                  {stat.label}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tabular-nums text-secondary dark:text-white">
                    {stat.value}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-[11px] font-medium italic text-text-muted">
                &ldquo;{stat.description}&rdquo;
              </p>
            </div>

            <div
              className={cn(
                'absolute -bottom-10 -right-10 h-32 w-32 rounded-full blur-[60px] opacity-0 transition-opacity duration-1000 group-hover:opacity-20',
                stat.iconBg
              )}
            />
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}
