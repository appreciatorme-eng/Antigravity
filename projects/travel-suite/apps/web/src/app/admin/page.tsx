/**
 * Admin Dashboard - Operator Morning Briefing
 *
 * Action-first dashboard: stats strip, urgent attention items,
 * revenue trajectory, quick actions, and recent activity.
 */

'use client';

import { Calendar, Command } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { AdminActivitySection } from './_components/AdminActivitySection';
import { AdminAnalyticsSection } from './_components/AdminAnalyticsSection';
import { AdminStatsGrid } from './_components/AdminStatsGrid';
import { NeedsAttentionSection } from './_components/NeedsAttentionSection';
import { useAdminDashboardData } from './_components/useAdminDashboardData';

export default function AdminDashboard() {
  const {
    stats,
    activities,
    revenueSeries,
    dateRange,
    setDateRange,
    attentionItems,
    attentionTotalCount,
    loading,
  } = useAdminDashboardData();

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <h1 className="text-5xl font-serif leading-none tracking-tight text-secondary dark:text-white">
            Dashboard
          </h1>
          <p className="max-w-2xl text-lg font-medium text-text-muted">
            Your travel business at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton variant="ghost" className="gap-2 rounded-2xl border-gray-100">
            <Command className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Search</span>
          </GlassButton>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-black uppercase tracking-tighter text-secondary dark:text-white">
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <AdminStatsGrid loading={loading} stats={stats} />

      <NeedsAttentionSection
        loading={loading}
        items={attentionItems}
        totalCount={attentionTotalCount}
      />

      <AdminAnalyticsSection
        loading={loading}
        dateRange={dateRange}
        setDateRange={setDateRange}
        revenueSeries={revenueSeries}
      />

      <AdminActivitySection loading={loading} activities={activities} />
    </div>
  );
}
