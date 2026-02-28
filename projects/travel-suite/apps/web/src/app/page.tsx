/**
 * Dashboard - India Travel Operator Command Centre
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Zap,
  Activity,
  Eye,
  EyeOff,
  MessageCircle,
  IndianRupee,
} from "lucide-react";
import { useDashboardStats } from "@/lib/queries/dashboard";
import RevenueChart, {
  type RevenueMetricMode,
  type RevenueChartPoint,
} from "@/components/analytics/RevenueChart";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { TodaysTimeline } from "@/components/dashboard/TodaysTimeline";
import { WhatsAppDashboardPreview } from "@/components/dashboard/WhatsAppDashboardPreview";
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

/** Returns "Good Morning / Afternoon / Evening" based on IST hour */
function getISTGreeting(): string {
  const istHour = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(istHour, 10);
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Returns today's date formatted for IST */
function getISTDateString(): string {
  return new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const OPERATOR_NAME = "Rajiv";

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

  const greeting = getISTGreeting();
  const istDate = getISTDateString();

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

  // Today's estimated revenue from active trips (mock: ₹1,85,000)
  const todayRevenue = 185000;

  const kpiItems = [
    {
      label: "Today's Revenue",
      value: todayRevenue,
      icon: IndianRupee,
      trend: "₹45K more than yesterday",
      trendUp: true,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/admin/billing",
      isCurrency: true,
    },
    {
      label: "Active Trips",
      value: stats.activeTrips || 8,
      icon: Zap,
      trend: "2 start today",
      trendUp: true,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/trips",
    },
    {
      label: "WhatsApp Unread",
      value: stats.pendingNotifications || 3,
      icon: MessageCircle,
      trend:
        (stats.pendingNotifications || 3) > 0 ? "Action Required" : "All cleared",
      trendUp: (stats.pendingNotifications || 3) === 0,
      color: "text-[#25D366]",
      bg: "bg-[#25D366]/10",
      href: "/inbox",
    },
    {
      label: "Client Pipeline",
      value: stats.totalClients || 24,
      icon: Users,
      trend: "+3 this week",
      trendUp: true,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/clients",
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

      {/* ── TOP: Namaste Greeting ────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div>
          <p className="text-sm font-semibold text-slate-400 mb-1 tracking-wide">
            {greeting} — {istDate}
          </p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Namaste,{" "}
            <span className="text-primary">{OPERATOR_NAME}! 🙏</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Here's your travel operations command centre for today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/inbox">
            <GlassButton
              variant="outline"
              className="relative group h-12 px-6 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">WhatsApp Inbox</span>
              {(stats.pendingNotifications || 3) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-emerald-50 text-[10px] font-bold text-white shadow-xl animate-in zoom-in-50">
                  {stats.pendingNotifications || 3}
                </span>
              )}
            </GlassButton>
          </Link>
          <Link href="/trips">
            <GlassButton
              variant="primary"
              className="h-12 px-6 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </GlassButton>
          </Link>
        </div>
      </motion.div>

      {/* ── SECTION 1: Action Queue ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <ActionQueue loading={loading} />
      </motion.div>

      {/* ── SECTION 2: Today's Timeline (60%) + WhatsApp Preview (40%) ──── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <div className="lg:col-span-3 flex flex-col">
          <TodaysTimeline loading={loading} />
        </div>
        <div className="lg:col-span-2 flex flex-col">
          <WhatsAppDashboardPreview
            loading={loading}
            unreadCount={stats.pendingNotifications || 3}
          />
        </div>
      </motion.div>

      {/* ── SECTION 3: KPI Cards ─────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
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

      {/* ── SECTION 4: Financial Chart + Quick Actions ────────────────────── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        {/* Financial Chart */}
        <GlassCard className="lg:col-span-2" padding="xl">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Your Business Growth
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  Track your earnings and bookings over time
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
                  title="Toggle Revenue Privacy"
                >
                  {privacyBlur ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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

          <div
            className={cn(
              "w-full aspect-[21/9] transition-all duration-500 ease-in-out",
              privacyBlur
                ? "blur-[6px] opacity-60 grayscale-[50%] select-none pointer-events-none"
                : "blur-none opacity-100"
            )}
          >
            <RevenueChart
              data={filteredSeries}
              metric={metric}
              loading={loading}
              onPointSelect={handlePointSelect}
            />
          </div>

          {metricDrivers.length > 0 && (
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {metricDrivers.map((driver) => (
                <div
                  key={driver.title}
                  className={cn(
                    "rounded-xl border px-3 py-2",
                    driver.direction === "up"
                      ? "border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-900/10"
                      : driver.direction === "down"
                      ? "border-rose-100 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/10"
                      : "border-gray-200 bg-gray-50/70 dark:border-slate-700 dark:bg-slate-800/30"
                  )}
                >
                  <p className="text-[11px] font-black uppercase tracking-wider text-secondary">
                    {driver.title}
                  </p>
                  <p className="mt-1 text-[11px] text-text-secondary">{driver.detail}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Quick Actions sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <QuickActions />
          </motion.div>
        </div>
      </motion.div>

      {/* ── SECTION 5: Activity Feed ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28 }}
      >
        <ActivityFeed activities={activities} loading={loading} />
      </motion.div>
    </div>
  );
}
