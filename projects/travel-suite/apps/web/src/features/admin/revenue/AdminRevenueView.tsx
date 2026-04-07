"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  IndianRupee,
  RefreshCw,
  FileCheck2,
  ChevronRight,
  Sun,
  Cloud,
  Trophy,
  ShoppingCart,
  Percent,
  UserCheck,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassSkeleton } from "@/components/glass/GlassSkeleton";
import RevenueChart, { type RevenueMetricMode } from "@/components/analytics/RevenueChart";
import { cn } from "@/lib/utils";
import { formatINR, formatINRShort } from "@/lib/india/formats";
import { useAdminAnalytics } from "../analytics/useAdminAnalytics";
import { RANGE_TO_MONTHS, type DashboardRange } from "@/lib/analytics/adapters";
import { useAdminRevenue } from "./useAdminRevenue";
import { GuidedTour } from '@/components/tour/GuidedTour';

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

const DESTINATION_COLORS = [
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-emerald-500 to-teal-400",
  "bg-gradient-to-r from-sky-500 to-blue-400",
  "bg-gradient-to-r from-violet-500 to-purple-400",
  "bg-gradient-to-r from-orange-500 to-amber-400",
  "bg-gradient-to-r from-fuchsia-500 to-pink-400",
] as const;

const PIPELINE_COLORS: Record<string, string> = {
  approved: "bg-emerald-500",
  accepted: "bg-emerald-500",
  confirmed: "bg-emerald-500",
  converted: "bg-emerald-500",
  sent: "bg-sky-500",
  viewed: "bg-violet-500",
  draft: "bg-slate-400",
  expired: "bg-rose-400",
  rejected: "bg-rose-500",
};

const SEASON_THEME = {
  peak: {
    label: "Peak Season",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60",
    textColor: "text-amber-700",
    labelColor: "text-amber-500",
    statBg: "bg-amber-100/60",
    statLabel: "text-amber-600/70",
    badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
  offSeason: {
    label: "Off Season",
    color: "from-sky-500 to-indigo-500",
    bgColor: "bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-200/60",
    textColor: "text-sky-700",
    labelColor: "text-sky-500",
    statBg: "bg-sky-100/60",
    statLabel: "text-sky-600/70",
    badgeColor: "bg-gradient-to-r from-sky-500 to-indigo-500",
  },
} as const;

const RANGE_LABEL_MAP: Record<DashboardRange, string> = {
  "1y": "Last 12 Months",
  "6m": "Last 6 Months",
  "3m": "Last 3 Months",
  "1m": "This Month",
};

export function AdminRevenueView() {
  const { loading, refreshing, error, filters, filterOptions, snapshot, setFilter, reload } = useAdminAnalytics();
  const { addonData } = useAdminRevenue();
  const [chartMetric, setChartMetric] = useState<RevenueMetricMode>("revenue");

  const destinationMetricMax = useMemo(() => {
    return Math.max(
      1,
      ...snapshot.destinationRank.map((item) => (item.revenue > 0 ? item.revenue : item.trips))
    );
  }, [snapshot.destinationRank]);

  const peakUpliftPct = useMemo(() => {
    const offRevenue = snapshot.seasonalBreakdown.offSeason.revenue;
    if (offRevenue <= 0) return 0;
    return Math.round(((snapshot.seasonalBreakdown.peak.revenue - offRevenue) / offRevenue) * 100);
  }, [snapshot.seasonalBreakdown]);

  const drillBaseParams = useMemo(() => {
    return new URLSearchParams({ range: filters.range });
  }, [filters.range]);

  const kpis = [
    {
      label: "Total Revenue",
      value: formatINRShort(snapshot.monthlyRevenueTotal),
      fullValue: formatINR(snapshot.monthlyRevenueTotal),
      sub: `Last ${RANGE_TO_MONTHS[filters.range]} months`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      type: "revenue",
    },
    {
      label: "Proposals",
      value: `${snapshot.proposalsTotal}`,
      fullValue: null,
      sub: "Within selected filters",
      icon: FileCheck2,
      color: "text-sky-600",
      bg: "bg-sky-500/10",
      type: "bookings",
    },
    {
      label: "Conversion",
      value: `${snapshot.proposalConversionRate.toFixed(1)}%`,
      fullValue: null,
      sub: "Proposal to closed",
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
      type: "conversion",
    },
    {
      label: "Proposal Views",
      value: `${snapshot.viewedProposalRate.toFixed(1)}%`,
      fullValue: null,
      sub: "Clients who opened proposals",
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      type: "clients",
    },
  ] as const;

  if (loading) {
    return (
      <div className="space-y-8">
        <GlassSkeleton className="h-20 w-full" />
        <GlassSkeleton className="h-28 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <GlassSkeleton className="h-36" />
          <GlassSkeleton className="h-36" />
          <GlassSkeleton className="h-36" />
          <GlassSkeleton className="h-36" />
        </div>
        <GlassSkeleton className="h-96" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8 pb-12"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <GuidedTour />
      {/* Header */}
      <motion.div
        className="flex flex-wrap items-end justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-secondary tracking-tight">
              Revenue
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Filter by destination, owner, or channel — click any metric to drill through.
          </p>
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
            Sync
          </GlassButton>
        </div>
      </motion.div>

      {/* Filters */}
      <GlassCard padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Filters</p>
            <p className="text-xs text-text-muted mt-1">Destination, sales owner, and source channel update all widgets below.</p>
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
                <option key={destination} value={destination}>{destination}</option>
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
                <option key={owner.id} value={owner.id}>{owner.label}</option>
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
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </label>
        </div>
      </GlassCard>

      {error ? (
        <GlassCard padding="lg" className="border-rose-100 bg-rose-50/50">
          <p className="text-sm text-rose-600 font-medium">Revenue Engine Error: {error}</p>
        </GlassCard>
      ) : null}

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
        data-tour="revenue-stats"
      >
        {kpis.map((item) => (
          <Link
            key={item.label}
            href={`/analytics/drill-through?${drillBaseParams.toString()}&type=${item.type}`}
            className="block"
          >
            <GlassCard padding="lg" className="group hover:-translate-y-1 hover:shadow-card transition-all duration-300 overflow-hidden relative border border-slate-200/50">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Drill
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-secondary tabular-nums">{item.value}</div>
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

      {/* Tour Operator Metrics */}
      <motion.div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/70 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
            <Wallet className="h-5 w-5 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">Avg Booking</p>
            <p className="text-lg font-bold text-secondary tabular-nums truncate">{formatINRShort(snapshot.avgBookingValue)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/70 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <Percent className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">Collection Rate</p>
            <p className="text-lg font-bold text-secondary tabular-nums">{snapshot.collectionRate.toFixed(0)}%</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/70 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <UserCheck className="h-5 w-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">Rev / Pax</p>
            <p className="text-lg font-bold text-secondary tabular-nums truncate">{formatINRShort(snapshot.revenuePerPax)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/70 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <Users className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">Active Clients</p>
            <p className="text-lg font-bold text-secondary tabular-nums">{snapshot.activeClients}</p>
          </div>
        </div>
      </motion.div>

      {/* Revenue Chart — Full Width (no sidebar) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
        data-tour="revenue-chart"
      >
        <GlassCard padding="lg">
          <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-serif text-secondary">Revenue & Bookings Trajectory</h2>
              <p className="text-xs text-text-muted mt-1">Click points for monthly drill-through records</p>
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
      </motion.div>

      {/* Destination Performance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.16 }}
      >
        <GlassCard padding="lg">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-secondary">Destination Performance</h2>
              <p className="text-xs text-text-muted mt-1">Live paid invoice revenue by destination, with trip volume as fallback</p>
            </div>
            <Link
              href={`/analytics/drill-through?${drillBaseParams.toString()}&type=destination-revenue`}
              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary"
            >
              Drill <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {snapshot.destinationRank.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              <p className="text-sm">No destination-linked invoice or trip data yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {snapshot.destinationRank.map((dest, idx) => {
                const metricValue = dest.revenue > 0 ? dest.revenue : dest.trips;
                const widthPct = Math.round((metricValue / destinationMetricMax) * 100);
                const color = DESTINATION_COLORS[idx % DESTINATION_COLORS.length];
              return (
                <Link
                  key={dest.name}
                  href={`/analytics/drill-through?${drillBaseParams.toString()}&type=destination-revenue&destination=${encodeURIComponent(dest.name)}`}
                  className="block space-y-1.5 hover:bg-gray-50/50 rounded-xl p-2 -mx-2 transition-colors group"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-secondary">{dest.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary tabular-nums">
                        {dest.revenue > 0 ? formatINRShort(dest.revenue) : `${dest.trips} trip${dest.trips === 1 ? "" : "s"}`}
                      </span>
                      <ChevronRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className={cn("h-full rounded-full", color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    {dest.revenue > 0
                      ? `${formatINR(dest.revenue)} across ${dest.trips} trip${dest.trips === 1 ? "" : "s"}`
                      : `${dest.trips} trip${dest.trips === 1 ? "" : "s"} · no paid invoice revenue yet`}
                  </p>
                </Link>
              );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Peak vs Off-Season — Light Mode Friendly */}
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.2 }}
      >
        {/* Peak Season */}
        <Link
          href={`/analytics/drill-through?${drillBaseParams.toString()}&type=season&season=peak`}
          className="block group"
        >
          <div className={cn("rounded-2xl border p-5 transition-all group-hover:shadow-lg group-hover:-translate-y-0.5", SEASON_THEME.peak.bgColor)}>
            <div className="mb-4 flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md", SEASON_THEME.peak.color)}>
                <Sun className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase tracking-widest", SEASON_THEME.peak.labelColor)}>{SEASON_THEME.peak.label}</p>
                <p className={cn("text-sm font-bold", SEASON_THEME.peak.textColor)}>{snapshot.seasonalBreakdown.peak.months}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm", SEASON_THEME.peak.badgeColor)}>
                  {peakUpliftPct > 0 ? `+${peakUpliftPct}% uplift` : "Current range"}
                </span>
                <ChevronRight className="h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={cn("rounded-xl p-3", SEASON_THEME.peak.statBg)}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", SEASON_THEME.peak.statLabel)}>Revenue</p>
                <p className={cn("mt-1 text-lg font-extrabold", SEASON_THEME.peak.textColor)}>{formatINRShort(snapshot.seasonalBreakdown.peak.revenue)}</p>
                <p className="text-xs text-slate-400">{formatINR(snapshot.seasonalBreakdown.peak.revenue)}</p>
              </div>
              <div className={cn("rounded-xl p-3", SEASON_THEME.peak.statBg)}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", SEASON_THEME.peak.statLabel)}>Bookings</p>
                <p className={cn("mt-1 text-lg font-extrabold", SEASON_THEME.peak.textColor)}>{snapshot.seasonalBreakdown.peak.bookings}</p>
              </div>
              <div className={cn("rounded-xl p-3", SEASON_THEME.peak.statBg)}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", SEASON_THEME.peak.statLabel)}>Avg Trip</p>
                <p className={cn("mt-1 text-lg font-extrabold", SEASON_THEME.peak.textColor)}>{formatINRShort(snapshot.seasonalBreakdown.peak.avgTrip)}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Off Season */}
        <Link
          href={`/analytics/drill-through?${drillBaseParams.toString()}&type=season&season=off`}
          className="block group"
        >
          <div className={cn("rounded-2xl border p-5 transition-all group-hover:shadow-lg group-hover:-translate-y-0.5", SEASON_THEME.offSeason.bgColor)}>
            <div className="mb-4 flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md", SEASON_THEME.offSeason.color)}>
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase tracking-widest", SEASON_THEME.offSeason.labelColor)}>{SEASON_THEME.offSeason.label}</p>
                <p className={cn("text-sm font-bold", SEASON_THEME.offSeason.textColor)}>{snapshot.seasonalBreakdown.offSeason.months}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-sm", SEASON_THEME.offSeason.badgeColor)}>
                  Shoulder period
                </span>
                <ChevronRight className="h-4 w-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className={cn("rounded-xl p-3", SEASON_THEME.offSeason.statBg)}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", SEASON_THEME.offSeason.statLabel)}>Revenue</p>
                <p className={cn("mt-1 text-lg font-extrabold", SEASON_THEME.offSeason.textColor)}>{formatINRShort(snapshot.seasonalBreakdown.offSeason.revenue)}</p>
                <p className="text-xs text-slate-400">{formatINR(snapshot.seasonalBreakdown.offSeason.revenue)}</p>
              </div>
              <div className={cn("rounded-xl p-3", SEASON_THEME.offSeason.statBg)}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", SEASON_THEME.offSeason.statLabel)}>Bookings</p>
                <p className={cn("mt-1 text-lg font-extrabold", SEASON_THEME.offSeason.textColor)}>{snapshot.seasonalBreakdown.offSeason.bookings}</p>
              </div>
              <div className={cn("rounded-xl p-3", SEASON_THEME.offSeason.statBg)}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", SEASON_THEME.offSeason.statLabel)}>Avg Trip</p>
                <p className={cn("mt-1 text-lg font-extrabold", SEASON_THEME.offSeason.textColor)}>{formatINRShort(snapshot.seasonalBreakdown.offSeason.avgTrip)}</p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Proposal Pipeline + Operations Status */}
      <motion.div
        className="grid grid-cols-1 gap-6 xl:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.24 }}
      >
        <GlassCard padding="lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-serif text-secondary">Proposal Pipeline</h2>
            <Link
              href={`/analytics/drill-through?${drillBaseParams.toString()}&type=pipeline`}
              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary"
            >
              Drill <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {snapshot.proposalStatusBreakdown.length === 0 ? (
              <p className="text-sm text-text-muted">No proposal status history yet.</p>
            ) : (
              snapshot.proposalStatusBreakdown.map((item) => (
                <Link
                  key={item.status}
                  href={`/analytics/drill-through?${drillBaseParams.toString()}&type=pipeline&status=${encodeURIComponent(item.status)}`}
                  className="block space-y-1 hover:bg-gray-50/50 rounded-lg p-1.5 -mx-1.5 transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                    <span className="capitalize">{item.status.replaceAll("_", " ")}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-secondary">{item.count}</span>
                      <ChevronRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", PIPELINE_COLORS[item.status.toLowerCase()] || "bg-primary")}
                      style={{ width: `${Math.min(100, (item.count / Math.max(snapshot.proposalsTotal, 1)) * 100)}%` }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="text-xl font-serif text-secondary mb-5">Operations Status</h2>
          <div className="space-y-4">
            <Link
              href={`/analytics/drill-through?${drillBaseParams.toString()}&type=operations&subtype=clients`}
              className="block p-4 rounded-2xl border border-gray-100 bg-white/60 hover:bg-white/80 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">Active clients</p>
                  <p className="text-2xl font-bold text-secondary mt-1">{snapshot.activeClients}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
            <Link
              href={`/analytics/drill-through?${drillBaseParams.toString()}&type=operations&subtype=trips`}
              className="block p-4 rounded-2xl border border-gray-100 bg-white/60 hover:bg-white/80 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">Ongoing trips</p>
                  <p className="text-2xl font-bold text-secondary mt-1">{snapshot.activeTrips}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </div>
        </GlassCard>
      </motion.div>

      {/* Dynamic Top Clients by Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.28 }}
      >
        <GlassCard padding="none" rounded="2xl">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="text-lg font-serif text-secondary">Top Clients — {RANGE_LABEL_MAP[filters.range]}</h2>
                  <p className="mt-0.5 text-sm text-text-secondary">By paid invoice revenue (incl. GST)</p>
                </div>
              </div>
              <Link
                href="/clients"
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary"
              >
                All Clients <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          {snapshot.topClients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-text-muted">No paid invoices in this period.</p>
              <p className="text-xs text-text-muted mt-1">Revenue appears once invoices are marked paid.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Client</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Invoices</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Trips</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {snapshot.topClients.map((client, idx) => (
                    <tr key={client.clientId} className="transition-colors hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                            idx === 0 ? "bg-amber-100 text-amber-600" :
                            idx === 1 ? "bg-slate-100 text-slate-500" :
                            idx === 2 ? "bg-orange-100 text-orange-600" :
                            "bg-gray-50 text-gray-400"
                          )}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/clients/${client.clientId}`}
                          className="text-sm font-semibold text-secondary hover:text-primary transition-colors"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-text-secondary">
                        {client.invoiceCount}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-secondary">
                        {client.trips}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <span className="text-sm font-bold text-emerald-600">{formatINRShort(client.revenue)}</span>
                        <span className="ml-1 text-xs font-normal text-text-muted">{formatINR(client.revenue)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Top Performing Add-ons */}
      {addonData.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.32 }}
        >
          <GlassCard padding="none" rounded="2xl">
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-serif text-secondary">Top Performing Add-ons</h2>
                  <p className="mt-1 text-sm text-text-secondary">By total revenue</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Add-on</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Total Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Sales</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">Avg. Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {addonData.slice(0, 10).map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-secondary">{item.name}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <GlassBadge variant="info" size="sm">{item.category}</GlassBadge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-emerald-600">
                        {formatINRShort(item.total_revenue)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-secondary">{item.total_sales}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-text-secondary">
                        {formatINR(item.avg_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
