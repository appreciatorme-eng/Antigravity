"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  Calendar,
  Package,
  RefreshCw,
  ArrowUpRight,
  AlertTriangle,
  ArrowUp,
  Trophy,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassSkeleton } from "@/components/glass/GlassSkeleton";
import { GlassButton } from "@/components/glass/GlassButton";
import RevenueChart, { type RevenueMetricMode } from "@/components/analytics/RevenueChart";
import { cn } from "@/lib/utils";
import { type DashboardRange } from "@/lib/analytics/adapters";
import { formatINR, formatINRShort } from "@/lib/india/formats";
import { useAdminRevenue } from "./useAdminRevenue";

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "1y", label: "1Y" },
  { value: "6m", label: "6M" },
  { value: "3m", label: "3M" },
  { value: "1m", label: "1M" },
];

const METRIC_OPTIONS: Array<{ value: RevenueMetricMode; label: string }> = [
  { value: "revenue", label: "Revenue" },
  { value: "bookings", label: "Invoices" },
];

// Peak season months for North India: Oct, Nov, Dec, Jan, Feb (0-indexed: 9,10,11,0,1)
const PEAK_SEASON_MONTHS = new Set([0, 1, 9, 10, 11]);

function isPeakSeason(): boolean {
  return PEAK_SEASON_MONTHS.has(new Date().getMonth());
}

// Mock top-5 clients by revenue this month (in a real app, comes from useAdminRevenue)
const TOP_CLIENTS = [
  { name: "Sharma Family", revenue: 149100, trips: 3, location: "Delhi" },
  { name: "Kapoor Enterprises", revenue: 225750, trips: 1, location: "Mumbai" },
  { name: "Iyer Wedding Group", revenue: 405300, trips: 1, location: "Chennai" },
  { name: "Mehta & Associates", revenue: 94080, trips: 2, location: "Ahmedabad" },
  { name: "Priya Nair", revenue: 71925, trips: 2, location: "Kochi" },
].sort((a, b) => b.revenue - a.revenue);

export function AdminRevenueView() {
  const { loading, refreshing, error, metrics, addonData, filteredSeries, drivers, range, setRange, reload } = useAdminRevenue();
  const [chartMetric, setChartMetric] = useState<RevenueMetricMode>("revenue");

  const avgInvoiceValue = metrics.paidInvoices > 0 ? metrics.invoiceRevenue / metrics.paidInvoices : 0;
  const peakSeason = isPeakSeason();

  // Month-over-month comparison values (mock delta — in real app, comes from analytics)
  const momDelta = {
    amount: 120000, // ₹1.2L
    percent: 14,
    positive: true,
  };

  const kpiCards = useMemo(
    () => [
      {
        label: "MRR",
        value: formatINR(metrics.mrr),
        short: formatINRShort(metrics.mrr),
        detail: `${metrics.activeSubscriptions} active subscriptions`,
        icon: TrendingUp,
        tone: "text-emerald-600",
        type: "revenue",
      },
      {
        label: "Total Revenue",
        value: formatINR(metrics.totalRevenue),
        short: formatINRShort(metrics.totalRevenue),
        detail: "All revenue streams",
        icon: IndianRupee,
        tone: "text-blue-600",
        type: "revenue",
      },
      {
        label: "Invoice Revenue",
        value: formatINR(metrics.invoiceRevenue),
        short: formatINRShort(metrics.invoiceRevenue),
        detail: `${metrics.paidInvoices} paid invoices`,
        icon: CreditCard,
        tone: "text-purple-600",
        type: "revenue",
      },
      {
        label: "Add-on Revenue",
        value: formatINR(metrics.addonRevenue),
        short: formatINRShort(metrics.addonRevenue),
        detail: "Upsell & extras",
        icon: ShoppingCart,
        tone: "text-orange-600",
        type: "revenue",
      },
    ],
    [metrics]
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <GlassSkeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
          <GlassSkeleton className="h-32" />
        </div>
        <GlassSkeleton className="h-96" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Peak Season Alert */}
      {peakSeason && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 backdrop-blur-xl"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-bold text-amber-400">Peak Season — North India</p>
            <p className="mt-0.5 text-sm text-amber-300/70">
              Oct–Feb is peak season for North India (Rajasthan, Himachal, Delhi). Demand is high — ensure capacity, driver allocations, and hotel blocks are confirmed. Now is the best time to upsell premium add-ons.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        className="flex flex-wrap items-start justify-between gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Revenue</span>
            <h1 className="text-3xl font-serif text-secondary dark:text-white">Revenue Dashboard</h1>
            <p className="mt-1 text-text-secondary">
              Per-widget drill-through with range-aware trends.{" "}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUp className="h-3 w-3" />
                {formatINRShort(momDelta.amount)} vs last month (+{momDelta.percent}%)
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/analytics/drill-through?type=${chartMetric}&range=${range}`}>
            <GlassButton variant="outline" size="sm" className="h-10 rounded-xl gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Drill Through
            </GlassButton>
          </Link>
          <GlassButton variant="outline" size="sm" loading={refreshing} onClick={() => void reload()} className="h-10 rounded-xl">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </GlassButton>
        </div>
      </motion.div>

      {error ? (
        <GlassCard padding="lg" rounded="2xl" className="border border-rose-200/70 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-900/20">
          <p className="text-sm text-rose-700 dark:text-rose-300">Unable to load revenue data: {error}</p>
        </GlassCard>
      ) : null}

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
      >
        {kpiCards.map((item) => (
          <Link key={item.label} href={`/analytics/drill-through?type=${item.type}&range=${range}`}>
            <GlassCard padding="lg" rounded="2xl" className="hover:-translate-y-0.5 transition-transform">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-primary">{item.label}</div>
                <item.icon className={cn("h-4 w-4", item.tone)} />
              </div>
              <div className={cn("text-2xl font-bold", item.tone)}>{item.short}</div>
              <div className="mt-0.5 text-xs text-text-muted">{item.value}</div>
              <div className="mt-2 text-xs text-text-secondary">{item.detail}</div>
            </GlassCard>
          </Link>
        ))}
      </motion.div>

      <GlassCard padding="lg" rounded="2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif text-secondary dark:text-white">Revenue Trend</h2>
            <p className="text-xs text-text-muted mt-1">Select a window and drill monthly points.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {METRIC_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    chartMetric === option.value ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  )}
                  onClick={() => setChartMetric(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1 py-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-black rounded-lg tracking-wide transition-all",
                    range === option.value ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <RevenueChart
          data={filteredSeries}
          metric={chartMetric}
          onPointSelect={(point) => {
            const params = new URLSearchParams({
              type: chartMetric,
              range,
              month: point.monthKey,
            });
            window.location.href = `/analytics/drill-through?${params.toString()}`;
          }}
        />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {drivers.map((driver) => (
            <div key={driver.title} className="p-3 rounded-xl border border-gray-100 bg-white/70">
              <p className="text-xs font-black text-secondary uppercase tracking-[0.12em]">{driver.title}</p>
              <p className="mt-1 text-xs text-text-muted">{driver.detail}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
      >
        <Link href={`/analytics/drill-through?type=clients&range=${range}`}>
          <GlassCard padding="lg" rounded="2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Total Clients</div>
                <div className="text-2xl font-bold text-secondary dark:text-white">{metrics.totalClients}</div>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </GlassCard>
        </Link>

        <Link href={`/analytics/drill-through?type=revenue&range=${range}`}>
          <GlassCard padding="lg" rounded="2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Avg Invoice Value</div>
                <div className="text-2xl font-bold text-secondary dark:text-white">
                  {formatINRShort(avgInvoiceValue)}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">{formatINR(avgInvoiceValue)}</div>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-50" />
            </div>
          </GlassCard>
        </Link>

        <Link href={`/analytics/drill-through?type=bookings&range=${range}`}>
          <GlassCard padding="lg" rounded="2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Pending Invoices</div>
                <div className="text-2xl font-bold text-secondary dark:text-white">{metrics.pendingInvoices}</div>
              </div>
              <Package className="h-8 w-8 text-primary opacity-50" />
            </div>
          </GlassCard>
        </Link>
      </motion.div>

      {/* Top 5 Clients by Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.14 }}
      >
        <GlassCard padding="none" rounded="2xl">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="text-lg font-serif text-secondary dark:text-white">Top Clients This Month</h2>
                <p className="mt-0.5 text-sm text-text-secondary">By total revenue (incl. GST)</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Trips</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {TOP_CLIENTS.map((client, idx) => (
                  <tr key={client.name} className="transition-colors hover:bg-white/10 dark:hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                          idx === 0 ? "bg-amber-400/20 text-amber-400" :
                          idx === 1 ? "bg-slate-400/20 text-slate-400" :
                          idx === 2 ? "bg-orange-700/20 text-orange-700" :
                          "bg-white/10 text-white/40"
                        )}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-semibold text-secondary dark:text-white">{client.name}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <GlassBadge variant="info" size="sm">{client.location}</GlassBadge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-secondary dark:text-white">
                      {client.trips}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINRShort(client.revenue)}
                      <span className="ml-1 text-xs font-normal text-text-muted">
                        {formatINR(client.revenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      {addonData.length > 0 ? (
        <GlassCard padding="none" rounded="2xl">
          <div className="border-b border-white/10 p-6">
            <h2 className="text-lg font-serif text-secondary dark:text-white">Top Performing Add-ons</h2>
            <p className="mt-1 text-sm text-text-secondary">By total revenue</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/40 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Add-on</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Total Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Sales</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Avg. Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {addonData.slice(0, 10).map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-white/10 dark:hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-secondary dark:text-white">{item.name}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <GlassBadge variant="info" size="sm">
                        {item.category}
                      </GlassBadge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINRShort(item.total_revenue)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-secondary dark:text-white">{item.total_sales}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-text-secondary">
                      {formatINR(item.avg_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : null}

      {metrics.totalRevenue === 0 ? (
        <GlassCard padding="lg" rounded="2xl" className="py-12 text-center">
          <IndianRupee className="mx-auto h-12 w-12 text-text-secondary opacity-50" />
          <h3 className="mt-4 text-sm font-semibold text-secondary dark:text-white">No revenue data yet</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Revenue appears once subscriptions, invoices, or add-on purchases are recorded.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/billing"
              className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/20 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/30"
            >
              View Billing
            </a>
            <a
              href="/add-ons"
              className="inline-flex items-center rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-white/30 dark:text-white"
            >
              Manage Add-ons
            </a>
          </div>
        </GlassCard>
      ) : null}
    </motion.div>
  );
}
