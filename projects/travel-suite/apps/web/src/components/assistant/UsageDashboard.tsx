"use client";

import { useState, useEffect } from "react";
import { BarChart3, Zap, Database, DollarSign, TrendingUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageData {
  readonly month: string;
  readonly messageCount: number;
  readonly limit: number;
  readonly remaining: number;
  readonly cacheHits: number;
  readonly directExecutions: number;
  readonly estimatedCostUsd: number;
  readonly tier: string;
}

const TIER_LABELS: Record<string, string> = {
  free: "Starter",
  pro_monthly: "Growth",
  pro_annual: "Growth (Annual)",
  business: "Professional",
  enterprise: "Enterprise",
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pro_monthly: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  pro_annual: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  business: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

export default function UsageDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/assistant/usage");
        const data = await res.json() as { success: boolean; usage?: UsageData; error?: string };
        if (data.success && data.usage) {
          setUsage(data.usage);
        } else {
          setError(data.error ?? "Failed to load usage data");
        }
      } catch {
        setError("Failed to connect");
      } finally {
        setLoading(false);
      }
    }
    void fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "No data available"}</p>
      </div>
    );
  }

  const usagePercent = usage.limit > 0 ? Math.min(100, Math.round((usage.messageCount / usage.limit) * 100)) : 0;
  const savingsCount = usage.cacheHits + usage.directExecutions;
  const savingsPercent = usage.messageCount > 0 ? Math.round((savingsCount / usage.messageCount) * 100) : 0;
  const isNearLimit = usagePercent >= 80;
  const tierLabel = TIER_LABELS[usage.tier] ?? usage.tier;
  const tierColor = TIER_COLORS[usage.tier] ?? TIER_COLORS.free;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            TripBuilt Assistant Usage
          </h3>
        </div>
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", tierColor)}>
          {tierLabel}
        </span>
      </div>

      {/* Usage Bar */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {usage.messageCount.toLocaleString()} / {usage.limit.toLocaleString()} messages
          </span>
          <span className={cn(
            "text-xs font-medium",
            isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
          )}>
            {usage.remaining.toLocaleString()} remaining
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isNearLimit ? "bg-amber-500" : "bg-indigo-500"
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          {usage.month} billing period
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
        {/* Cache Savings */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Database className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Cache Hits</span>
          </div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {usage.cacheHits}
          </p>
        </div>

        {/* Direct Executions */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Zero-Cost Queries</span>
          </div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {usage.directExecutions}
          </p>
        </div>

        {/* Cost Estimate */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-blue-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Est. Cost</span>
          </div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            ${usage.estimatedCostUsd.toFixed(2)}
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Savings Rate</span>
          </div>
          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {savingsPercent}%
          </p>
        </div>
      </div>

      {/* Upgrade CTA (only for non-enterprise) */}
      {usage.tier !== "enterprise" && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <a
            href="/settings/billing"
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            Upgrade for more messages
          </a>
        </div>
      )}
    </div>
  );
}
