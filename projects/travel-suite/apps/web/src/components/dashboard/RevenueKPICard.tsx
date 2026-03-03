"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { formatINRShort } from "@/lib/india/formats";
import type { DashboardSeriesPoint } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";

type RevenueRange = "1y" | "6m" | "3m" | "1m";

const RANGE_MONTHS: Record<RevenueRange, number> = {
  "1y": 12,
  "6m": 6,
  "3m": 3,
  "1m": 1,
};

const RANGE_LABELS: Array<{ value: RevenueRange; label: string }> = [
  { value: "1y", label: "1Y" },
  { value: "6m", label: "6M" },
  { value: "3m", label: "3M" },
  { value: "1m", label: "1M" },
];

function sumRevenue(points: DashboardSeriesPoint[]): number {
  return points.reduce((acc, p) => acc + p.revenue, 0);
}

interface RevenueKPICardProps {
  series: DashboardSeriesPoint[];
  loading?: boolean;
}

export function RevenueKPICard({ series, loading = false }: RevenueKPICardProps) {
  const [range, setRange] = useState<RevenueRange>("6m");
  const [expanded, setExpanded] = useState(false);

  const { currentRevenue, percentChange, trendUp, currentSlice } = useMemo(() => {
    const months = RANGE_MONTHS[range];
    const current = series.slice(-months);
    const previous = series.slice(-(months * 2), -months);

    const currentTotal = sumRevenue(current);
    const previousTotal = sumRevenue(previous);

    const change =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : currentTotal > 0
          ? 100
          : 0;

    return {
      currentRevenue: currentTotal,
      percentChange: change,
      trendUp: change >= 0,
      currentSlice: current,
    };
  }, [series, range]);

  const maxMonthRevenue = useMemo(
    () => Math.max(...currentSlice.map((p) => p.revenue), 1),
    [currentSlice],
  );

  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setExpanded(false);
  }, []);

  const trendText = `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}% vs prev`;

  return (
    <GlassCard
      padding="lg"
      className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer"
      onClick={handleToggleExpand}
    >
      <div className="relative z-10">
        {/* Icon row + range tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 transition-transform group-hover:scale-110 duration-500">
            <IndianRupee className="w-6 h-6 text-emerald-500" />
          </div>

          {/* Period toggle pills */}
          <div
            className="flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {RANGE_LABELS.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-black rounded-md tracking-wide transition-all",
                  range === opt.value
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                )}
                onClick={() => setRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Value + trend */}
        <div className="space-y-1">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter"
          >
            {loading ? (
              <span className="inline-block w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            ) : (
              formatINRShort(currentRevenue)
            )}
          </motion.h3>

          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Revenue
            </p>
            <div className="flex items-center gap-1.5">
              {!loading && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                    trendUp
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  )}
                >
                  {trendUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{trendText}</span>
                </div>
              )}
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 transition-transform duration-300",
                  expanded && "rotate-180",
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drill-through panel */}
      <AnimatePresence>
        {expanded && !loading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Monthly Breakdown
                </p>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2">
                {currentSlice.map((point) => {
                  const barWidth = (point.revenue / maxMonthRevenue) * 100;
                  return (
                    <div key={point.monthKey} className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-slate-500 w-10 shrink-0">
                        {point.label}
                      </span>
                      <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-14 text-right shrink-0">
                        {formatINRShort(point.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/40 dark:border-slate-700/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {formatINRShort(currentRevenue)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative background glow */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20 bg-emerald-500/10" />
    </GlassCard>
  );
}
