"use client";

import { motion } from "framer-motion";
import { Wallet, IndianRupee, TrendingUp, Trophy, Handshake, Receipt, Banknote } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { formatINR, formatINRShort } from "@/lib/india/formats";
import type { PricingDashboardKpis } from "../types";

interface PricingKpiCardsProps {
  kpis: PricingDashboardKpis;
}

const MAIN_KPI_CONFIG = [
  {
    key: "totalInvestment" as const,
    label: "Total Investment",
    icon: Wallet,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    description: "What you paid vendors",
  },
  {
    key: "totalRevenue" as const,
    label: "Total Revenue",
    icon: IndianRupee,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    description: "What clients paid you",
  },
  {
    key: "grossProfit" as const,
    label: "Gross Profit",
    icon: TrendingUp,
    color: "text-sky-600",
    bg: "bg-sky-500/10",
    description: "Revenue minus costs",
  },
  {
    key: "netProfit" as const,
    label: "Net Profit",
    icon: Trophy,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    description: "After overhead expenses",
  },
] as const;

const TAX_KPI_CONFIG = [
  {
    key: "totalCommission" as const,
    label: "Commission Earned",
    icon: Handshake,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    description: "From vendors on bookings",
    badge: null as string | null,
  },
  {
    key: "totalGst" as const,
    label: "GST Collected",
    icon: Receipt,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    description: "5% on tour package price",
    badge: "5%",
  },
  {
    key: "totalTcs" as const,
    label: "TCS Collected",
    icon: Banknote,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    description: "2% tax collected at source",
    badge: "2%",
  },
] as const;

export function PricingKpiCards({ kpis }: PricingKpiCardsProps) {
  return (
    <div className="space-y-3">
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
      >
        {MAIN_KPI_CONFIG.map((item, idx) => {
          const value = kpis[item.key];
          const Icon = item.icon;
          return (
            <GlassCard
              key={item.key}
              padding="lg"
              className="group border border-slate-200/50 overflow-hidden"
            >
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-2xl ${item.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  {(item.key === "grossProfit" || item.key === "netProfit") && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      value >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      {kpis.marginPct.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-secondary tabular-nums">
                  {formatINRShort(value)}
                </div>
                <div className="text-xs text-text-muted mt-0.5">{formatINR(value)}</div>
                <p className="mt-1.5 text-sm font-medium text-text-secondary">{item.label}</p>
                <p className="text-[11px] text-text-muted">{item.description}</p>
              </motion.div>
            </GlassCard>
          );
        })}
      </motion.div>

      {/* Commission + Tax secondary row */}
      <motion.div
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.2 }}
      >
        {TAX_KPI_CONFIG.map((item, idx) => {
          const value = (kpis[item.key] as number | undefined) ?? 0;
          const Icon = item.icon;
          return (
            <GlassCard
              key={item.key}
              padding="md"
              className="border border-slate-200/40"
            >
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + idx * 0.04 }}
              >
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-secondary tabular-nums">
                      {formatINRShort(value)}
                    </span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.bg} ${item.color}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-text-secondary leading-tight">{item.label}</p>
                  <p className="text-[10px] text-text-muted leading-tight">{item.description}</p>
                </div>
              </motion.div>
            </GlassCard>
          );
        })}
      </motion.div>
    </div>
  );
}
