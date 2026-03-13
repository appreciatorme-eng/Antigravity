"use client";

import {
  Package,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import type { Stats } from "./types";

interface StatsHeaderProps {
  readonly stats: Stats;
}

export function StatsHeader({ stats }: StatsHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-primary">
            Total Add-ons
          </div>
          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {stats.totalAddOns}
        </div>
        <div className="text-xs text-text-secondary mt-2">
          {stats.activeAddOns} active
        </div>
      </GlassCard>

      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-primary">
            Revenue (Month)
          </div>
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          ${stats.totalRevenue.toFixed(2)}
        </div>
        <div className="text-xs text-text-secondary mt-2">
          From {stats.totalSales} sales
        </div>
      </GlassCard>

      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-primary">
            Most Popular
          </div>
          <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="text-xl font-bold text-purple-600 dark:text-purple-400 truncate">
          {stats.topAddOn}
        </div>
        <div className="text-xs text-text-secondary mt-2">Top seller</div>
      </GlassCard>

      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-primary">
            Active Sales
          </div>
          <Activity className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
          {stats.totalSales}
        </div>
        <div className="text-xs text-text-secondary mt-2">This month</div>
      </GlassCard>
    </div>
  );
}
