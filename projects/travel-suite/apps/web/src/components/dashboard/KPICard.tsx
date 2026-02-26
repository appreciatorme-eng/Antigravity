"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

/**
 * Format a number in Indian numbering system (lakhs/crores).
 * e.g. 120000 → "1,20,000"  |  1500000 → "15,00,000"
 */
function formatIndianNumber(n: number): string {
  const str = Math.abs(Math.round(n)).toString();
  if (str.length <= 3) return str;

  // Last 3 digits, then groups of 2
  const last3 = str.slice(-3);
  const rest = str.slice(0, str.length - 3);
  const groups: string[] = [];
  let remaining = rest;
  while (remaining.length > 2) {
    groups.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, remaining.length - 2);
  }
  if (remaining) groups.unshift(remaining);

  return [...groups, last3].join(",");
}

/**
 * Compact Indian short format: 1,20,000 → ₹1.2L  |  1,20,00,000 → ₹1.2Cr
 */
function formatIndianShort(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return formatIndianNumber(n);
}

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  bg?: string;
  loading?: boolean;
  /** If true, prefix the value with ₹ and apply Indian number formatting */
  isCurrency?: boolean;
  /** If true, show the full Indian number (1,20,000) instead of short form (1.2L) */
  fullCurrencyFormat?: boolean;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp = true,
  color = "text-primary",
  bg = "bg-primary/10",
  loading = false,
  isCurrency = false,
  fullCurrencyFormat = false,
}: KPICardProps) {
  // Format the displayed value
  const displayValue = (() => {
    if (loading) return "—";
    if (isCurrency && typeof value === "number") {
      const formatted = fullCurrencyFormat
        ? formatIndianNumber(value)
        : formatIndianShort(value);
      return `₹${formatted}`;
    }
    if (isCurrency && typeof value === "string") {
      const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
      if (!isNaN(numeric)) {
        const formatted = fullCurrencyFormat
          ? formatIndianNumber(numeric)
          : formatIndianShort(numeric);
        return `₹${formatted}`;
      }
    }
    return value;
  })();

  return (
    <GlassCard
      padding="lg"
      className="group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500",
              bg
            )}
          >
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                trendUp
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {trendUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="truncate max-w-[120px]">{trend}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter"
          >
            {loading ? (
              <span className="inline-block w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            ) : (
              displayValue
            )}
          </motion.h3>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
        </div>
      </div>

      {/* Decorative background glow */}
      <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20", bg)} />
    </GlassCard>
  );
}
