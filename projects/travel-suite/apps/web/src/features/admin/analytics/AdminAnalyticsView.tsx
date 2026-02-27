"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  IndianRupee,
  RefreshCw,
  FileCheck2,
  ChevronRight,
  Sun,
  Cloud,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import RevenueChart, { type RevenueMetricMode } from "@/components/analytics/RevenueChart";
import { cn } from "@/lib/utils";
import { formatINR, formatINRShort } from "@/lib/india/formats";
import { useAdminAnalytics } from "./useAdminAnalytics";
import { RANGE_TO_MONTHS, type DashboardRange } from "@/lib/analytics/adapters";

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "1y", label: "1Y" },
  { value: "6m", label: "6M" },
  { value: "3m", label: "3M" },
  { value: "1m", label: "1M" },
];

const METRIC_OPTIONS: Array<{ value: RevenueMetricMode; label: string }> = [
  { value: "revenue", label: "Revenue" },
  { value: "bookings", label: "Bookings" },
];

// Revenue by top-5 destination (static seed data; real app pulls from analytics engine)
const DESTINATION_REVENUE: Array<{ name: string; revenue: number; color: string; flag: string }> = [
  { name: "Rajasthan", revenue: 840000, color: "bg-amber-500", flag: "🏰" },
  { name: "Kerala", revenue: 620000, color: "bg-emerald-500", flag: "🌴" },
  { name: "Goa", revenue: 410000, color: "bg-blue-500", flag: "🏖️" },
  { name: "Himachal", revenue: 380000, color: "bg-violet-500", flag: "⛰️" },
  { name: "Delhi NCR", revenue: 290000, color: "bg-orange-500", flag: "🏛️" },
];

const MAX_DEST_REVENUE = Math.max(...DESTINATION_REVENUE.map((d) => d.revenue));

// Peak vs off-season comparison data
const SEASON_DATA = {
  peak: {
    label: "Peak Season",
    months: "Oct — Feb",
    revenue: 3840000,
    bookings: 214,
    avgTrip: 17944,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    textColor: "text-amber-400",
  },
  offSeason: {
    label: "Off Season",
    months: "Mar — Sep",
    revenue: 1960000,
    bookings: 128,
    avgTrip: 15312,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    textColor: "text-blue-400",
  },
};

const PEAK_UPLIFT_PCT = Math.round(
  ((SEASON_DATA.peak.revenue - SEASON_DATA.offSeason.revenue) / SEASON_DATA.offSeason.revenue) * 100
);

export function AdminAnalyticsView() {
  const { loading, refreshing, error, filters, filterOptions, snapshot, setFilter, reload } = useAdminAnalytics();
  const [chartMetric, setChartMetric] = useState<RevenueMetricMode>("revenue");

  const drillBaseParams = useMemo(() => {
    const params = new URLSearchParams({
      range: filters.range,
    });
    return params;
  }, [filters.range]);

  const kpis = [
    {
      label: "Total Revenue",
      value: formatINRShort(snapshot.monthlyRevenueTotal),
      fullValue: formatINR(snapshot.monthlyRevenueTotal),
      sub: `Last ${RANGE_TO_MONTHS[filters.range]} months`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      type: "revenue",
    },
    {
      label: "Proposals",
      value: `${snapshot.proposalsTotal}`,
      fullValue: null,
      sub: "Scoped by cohorts",
      icon: FileCheck2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      type: "bookings",
    },
    {
      label: "Conversion",
      value: `${snapshot.proposalConversionRate.toFixed(1)}%`,
      fullValue: null,
      sub: "Proposal to closed",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
      type: "conversion",
    },
    {
      label: "Engagement",
      value: `${snapshot.viewedProposalRate.toFixed(1)}%`,
      fullValue: null,
      sub: "Viewed proposals",
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
      type: "clients",
    },
  ] as const;

  return (
    <motion.div
      className="space-y-8 pb-12"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="flex flex-wrap items-end justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-premium drop-shadow-sm tracking-tight mb-1">Business Insights</h1>
          <p className="mt-2 text-lg text-slate-500 font-medium">Cohort-aware analytics with per-widget drill-through.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/analytics/drill-through?${drillBaseParams.toString()}&type=${chartMetric}`}>
            <GlassButton variant="outline" className="rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95">
              <BarChart3 className="h-4 w-4 mr-2" />
              Drill Through
            </GlassButton>
          </Link>
          <GlassButton
            variant="outline"
            className="rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
            loading={refreshing}
            onClick={() => void reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </GlassButton>
        </div>
      </motion.div>

      <GlassCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Cohort Filters</p>
            <p className="text-xs text-text-muted mt-1">Destination, sales owner, and source channel update all KPI widgets.</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1 py-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-black rounded-lg tracking-wide transition-all",
                  filters.range === option.value ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"
                )}
                onClick={() => setFilter("range", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">Destination</span>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
              value={filters.destination}
              onChange={(event) => setFilter("destination", event.target.value)}
            >
              <option value="all">All destinations</option>
              {filterOptions.destinations.map((destination) => (
                <option key={destination} value={destination}>
                  {destination}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">Sales owner</span>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
              value={filters.salesOwner}
              onChange={(event) => setFilter("salesOwner", event.target.value)}
            >
              <option value="all">All owners</option>
              {filterOptions.salesOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">Source channel</span>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
              value={filters.sourceChannel}
              onChange={(event) => setFilter("sourceChannel", event.target.value)}
            >
              <option value="all">All channels</option>
              {filterOptions.sourceChannels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </label>
        </div>
      </GlassCard>

      {error ? (
        <GlassCard padding="lg" className="border-rose-100 bg-rose-50/50">
          <p className="text-sm text-rose-600 font-medium">Analytics Engine Error: {error}</p>
        </GlassCard>
      ) : null}

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
      >
        {kpis.map((item) => (
          <Link
            key={item.label}
            href={`/analytics/drill-through?${drillBaseParams.toString()}&type=${item.type}`}
            className="block"
          >
            <GlassCard padding="lg" className="group hover:-translate-y-1 hover:shadow-card transition-all duration-300 animate-spring-up overflow-hidden relative border border-slate-200/50">
              <div className="absolute inset-0 bg-gradient-premium opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary">
                    Drill
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-secondary tabular-nums">{loading ? "..." : item.value}</div>
                {item.fullValue && (
                  <div className="text-xs text-text-muted mt-0.5">{item.fullValue}</div>
                )}
                <p className="mt-1 text-sm font-medium text-text-secondary">{item.label}</p>
                <p className="text-[11px] text-text-muted mt-1">{item.sub}</p>
              </div>
            </GlassCard>
          </Link>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 xl:grid-cols-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
      >
        <GlassCard padding="lg" className="xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-serif text-secondary">Revenue and Bookings Trajectory</h2>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-tighter">Click points for monthly drill-through records</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {METRIC_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                    chartMetric === option.value ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  )}
                  onClick={() => setChartMetric(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <RevenueChart
            data={snapshot.series}
            metric={chartMetric}
            loading={loading}
            onPointSelect={(point) => {
              const params = new URLSearchParams({
                type: chartMetric,
                month: point.monthKey,
                range: filters.range,
              });
              window.location.href = `/analytics/drill-through?${params.toString()}`;
            }}
          />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {snapshot.drivers.map((driver) => (
              <div key={driver.title} className="p-3 rounded-xl border border-gray-100 bg-white/70">
                <p className="text-xs font-black text-secondary uppercase tracking-[0.12em]">{driver.title}</p>
                <p className="mt-1 text-xs text-text-muted">{driver.detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="mb-6">
            <h2 className="text-xl font-serif text-secondary">Top Destinations</h2>
            <p className="text-xs text-text-muted mt-1">Demand concentration by selected cohorts</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : snapshot.destinationRank.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-text-muted">No destination data yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {snapshot.destinationRank.map((dest, idx) => (
                <div key={dest.name} className="flex items-center justify-between p-3 bg-white/60 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-text-muted w-4">{idx + 1}</span>
                    <span className="text-sm font-bold text-secondary">{dest.name}</span>
                  </div>
                  <span className="text-xs font-black text-primary">{dest.trips}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Revenue by Destination Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.16 }}
      >
        <GlassCard padding="lg">
          <div className="mb-6">
            <h2 className="text-xl font-serif text-secondary">Revenue by Destination</h2>
            <p className="text-xs text-text-muted mt-1">Top 5 destinations by total revenue (₹ lakh)</p>
          </div>
          <div className="space-y-4">
            {DESTINATION_REVENUE.map((dest) => {
              const widthPct = Math.round((dest.revenue / MAX_DEST_REVENUE) * 100);
              return (
                <div key={dest.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-secondary">
                      <span>{dest.flag}</span>
                      {dest.name}
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      {formatINRShort(dest.revenue)}
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className={cn("h-full rounded-full", dest.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">{formatINR(dest.revenue)}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Peak vs Off-Season Comparison */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.2 }}
      >
        {/* Peak Season Card */}
        <div className={cn("rounded-2xl border p-5", SEASON_DATA.peak.bgColor)}>
          <div className="mb-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", SEASON_DATA.peak.color)}>
              <Sun className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/50">
                {SEASON_DATA.peak.label}
              </p>
              <p className={cn("text-sm font-bold", SEASON_DATA.peak.textColor)}>
                {SEASON_DATA.peak.months}
              </p>
            </div>
            <span className={cn("ml-auto rounded-full px-2.5 py-1 text-xs font-bold bg-gradient-to-r text-white", SEASON_DATA.peak.color)}>
              +{PEAK_UPLIFT_PCT}% uplift
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Revenue</p>
              <p className={cn("mt-1 text-lg font-extrabold", SEASON_DATA.peak.textColor)}>
                {formatINRShort(SEASON_DATA.peak.revenue)}
              </p>
              <p className="text-xs text-white/30">{formatINR(SEASON_DATA.peak.revenue)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Bookings</p>
              <p className={cn("mt-1 text-lg font-extrabold", SEASON_DATA.peak.textColor)}>
                {SEASON_DATA.peak.bookings}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Avg Trip</p>
              <p className={cn("mt-1 text-lg font-extrabold", SEASON_DATA.peak.textColor)}>
                {formatINRShort(SEASON_DATA.peak.avgTrip)}
              </p>
            </div>
          </div>
        </div>

        {/* Off Season Card */}
        <div className={cn("rounded-2xl border p-5", SEASON_DATA.offSeason.bgColor)}>
          <div className="mb-4 flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", SEASON_DATA.offSeason.color)}>
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/50">
                {SEASON_DATA.offSeason.label}
              </p>
              <p className={cn("text-sm font-bold", SEASON_DATA.offSeason.textColor)}>
                {SEASON_DATA.offSeason.months}
              </p>
            </div>
            <span className={cn("ml-auto rounded-full px-2.5 py-1 text-xs font-bold bg-gradient-to-r text-white", SEASON_DATA.offSeason.color)}>
              Shoulder period
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Revenue</p>
              <p className={cn("mt-1 text-lg font-extrabold", SEASON_DATA.offSeason.textColor)}>
                {formatINRShort(SEASON_DATA.offSeason.revenue)}
              </p>
              <p className="text-xs text-white/30">{formatINR(SEASON_DATA.offSeason.revenue)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Bookings</p>
              <p className={cn("mt-1 text-lg font-extrabold", SEASON_DATA.offSeason.textColor)}>
                {SEASON_DATA.offSeason.bookings}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Avg Trip</p>
              <p className={cn("mt-1 text-lg font-extrabold", SEASON_DATA.offSeason.textColor)}>
                {formatINRShort(SEASON_DATA.offSeason.avgTrip)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 xl:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.24 }}
      >
        <GlassCard padding="lg">
          <h2 className="text-xl font-serif text-secondary mb-5">Proposal Pipeline</h2>
          <div className="space-y-3">
            {snapshot.proposalStatusBreakdown.length === 0 ? (
              <p className="text-sm text-text-muted">No proposal status history yet.</p>
            ) : (
              snapshot.proposalStatusBreakdown.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                    <span className="capitalize">{item.status.replaceAll("_", " ")}</span>
                    <span className="text-secondary">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (item.count / Math.max(snapshot.proposalsTotal, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="text-xl font-serif text-secondary mb-5">Operations Status</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-gray-100 bg-white/60">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">Active clients</p>
              <p className="text-2xl font-bold text-secondary mt-1">{snapshot.activeClients}</p>
            </div>
            <div className="p-4 rounded-2xl border border-gray-100 bg-white/60">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">Ongoing trips</p>
              <p className="text-2xl font-bold text-secondary mt-1">{snapshot.activeTrips}</p>
            </div>
            <Link
              href={`/analytics/drill-through?${drillBaseParams.toString()}&type=conversion`}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-primary"
            >
              Explore conversion drill-through
              <TrendingUp className="h-3.5 w-3.5" />
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
