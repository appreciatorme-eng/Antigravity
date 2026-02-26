/**
 * Dashboard - Enterprise Overview
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Bell,
  Plus,
  Zap,
  ArrowUpRight,
  Activity,
  Eye,
  EyeOff,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDashboardStats } from "@/lib/queries/dashboard";
import RevenueChart, { type RevenueMetricMode, type RevenueChartPoint } from "@/components/analytics/RevenueChart";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { cn } from "@/lib/utils";
import {
  buildMoMDriverCallouts,
  RANGE_TO_MONTHS,
  type DashboardRange,
} from "@/lib/analytics/adapters";

type TimeRange = DashboardRange;

const RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "1y", label: "1Y" },
  { value: "6m", label: "6M" },
  { value: "3m", label: "3M" },
  { value: "1m", label: "1M" },
];

const METRIC_OPTIONS: Array<{ value: RevenueMetricMode; label: string }> = [
  { value: "revenue", label: "Revenue" },
  { value: "bookings", label: "Bookings" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading: loading } = useDashboardStats();

  const stats =
    data?.stats ||
    ({
      totalDrivers: 0,
      totalClients: 0,
      activeTrips: 0,
      pendingNotifications: 0,
      marketplaceViews: 0,
      marketplaceInquiries: 0,
      conversionRate: "0.0",
    } as const);

  const activities = data?.activities || [];


  const [range, setRange] = useState<TimeRange>("6m");
  const [metric, setMetric] = useState<RevenueMetricMode>("revenue");
  const [privacyBlur, setPrivacyBlur] = useState(false);

  const filteredSeries = useMemo<RevenueChartPoint[]>(() => {
    const take = RANGE_TO_MONTHS[range];
    const series = data?.series || [];
    return series.slice(-take);
  }, [data?.series, range]);

  const metricDrivers = useMemo(
    () =>
      buildMoMDriverCallouts(
        filteredSeries.map((point) => ({
          revenue: point.revenue,
          bookings: point.bookings,
          conversionRate: point.conversionRate,
        }))
      ),
    [filteredSeries]
  );

  const kpiItems = [
    {
      label: "Active Trips",
      value: stats.activeTrips,
      icon: Zap,
      trend: "+12%",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/analytics/drill-through?type=bookings&range=6m",
    },
    {
      label: "Strategic Partners",
      value: stats.totalClients,
      icon: Users,
      trend: "+3",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/analytics/drill-through?type=clients&range=6m",
    },
    {
      label: "Marketplace",
      value: `${stats.marketplaceViews || 0} / ${stats.marketplaceInquiries || 0}`,
      icon: Plus,
      trend: `${stats.conversionRate || "0.0"}% CR`,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/analytics/drill-through?type=conversion&range=6m",
    },
    {
      label: "Signal Queue",
      value: stats.pendingNotifications,
      icon: Bell,
      trend: "-5%",
      trendUp: false,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      href: "/admin/insights",
    },
  ];

  const handlePointSelect = (point: RevenueChartPoint) => {
    const params = new URLSearchParams({
      type: metric,
      month: point.monthKey,
      range,
    });
    router.push(`/analytics/drill-through?${params.toString()}`);
  };

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Strategic <span className="text-primary">Overview</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Your travel business at a glance.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/inbox">
            <GlassButton variant="outline" className="h-12 px-6 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 transition-colors shadow-sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">WhatsApp Inbox</span>
            </GlassButton>
          </Link>
          <Link href="/trips">
            <GlassButton variant="primary" className="h-12 px-6 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-shadow">
              <Plus className="w-4 h-4 mr-2" />
              Create Trip
            </GlassButton>
          </Link>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
      >
        {kpiItems.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="group"
          >
            <Link href={item.href} className="block">
              <KPICard {...item} loading={loading} />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      >
        <GlassCard className="lg:col-span-2" padding="xl">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Financial Trajectory</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Revenue, bookings, and conversion trend over the selected period.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPrivacyBlur(!privacyBlur)}
                  className={cn(
                    "p-1.5 transition-colors rounded-lg border shadow-sm",
                    privacyBlur
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  )}
                  title="Toggle Margin Privacy"
                >
                  {privacyBlur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <GlassButton
                  variant="outline"
                  className="h-9 px-3 text-xs"
                  onClick={() => {
                    const params = new URLSearchParams({ type: metric, range });
                    router.push(`/analytics/drill-through?${params.toString()}`);
                  }}
                >
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  Drill Through
                </GlassButton>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {METRIC_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                      metric === option.value
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                    onClick={() => setMetric(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white dark:bg-slate-900 px-1 py-1">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-black rounded-lg tracking-wide transition-all",
                      range === option.value
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                    onClick={() => setRange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={cn(
            "w-full aspect-[21/9] transition-all duration-500 ease-in-out",
            privacyBlur ? "blur-[6px] opacity-60 grayscale-[50%] select-none pointer-events-none" : "blur-none opacity-100"
          )}>
            <RevenueChart data={filteredSeries} metric={metric} loading={loading} onPointSelect={handlePointSelect} />
          </div>

          <div className="mt-4 text-[11px] text-text-muted font-semibold uppercase tracking-wider">
            Tip: click a chart point to view drill-through records for that month.
          </div>

          {metricDrivers.length > 0 ? (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {metricDrivers.map((driver) => (
                <div
                  key={driver.title}
                  className={cn(
                    "rounded-xl border px-3 py-2",
                    driver.direction === "up"
                      ? "border-emerald-100 bg-emerald-50/60"
                      : driver.direction === "down"
                        ? "border-rose-100 bg-rose-50/60"
                        : "border-gray-200 bg-gray-50/70"
                  )}
                >
                  <p className="text-[11px] font-black uppercase tracking-wider text-secondary">{driver.title}</p>
                  <p className="mt-1 text-[11px] text-text-secondary">{driver.detail}</p>
                </div>
              ))}
            </div>
          ) : null}
        </GlassCard>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <QuickActions />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} loading={loading} />
        </div>

        <div className="space-y-6">


          <GlassCard padding="none" className="overflow-hidden group">
            <div className="p-6 bg-gradient-to-br from-primary to-emerald-600">
              <h4 className="text-white font-black text-lg mb-2">Upgrade Plan</h4>
              <p className="text-white/80 text-xs font-medium leading-relaxed">
                Unlock advanced analytics, team collaboration, and automated reporting by upgrading your tier.
              </p>
            </div>
            <Link
              href="/admin/billing"
              className="flex items-center justify-center gap-2 w-full text-center py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Initialize Upgrade
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </GlassCard>
        </div>
      </motion.div>

    </div>
  );
}
