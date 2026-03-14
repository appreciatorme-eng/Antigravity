"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Sun, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { ActionQueuePanel } from "./_components/ActionQueuePanel";
import { InsightsHero } from "./_components/InsightsHero";
import { RevenueInsightsPanels } from "./_components/RevenueInsightsPanels";
import { UpsellAndRequotePanels } from "./_components/UpsellAndRequotePanels";
import { WinLossPanel } from "./_components/WinLossPanel";
import {
  type ActionQueueData,
  type AiUsageData,
  type AutoRequoteData,
  type BatchJobsData,
  type DailyBriefData,
  getGreeting,
  type MarginLeakData,
  type SmartUpsellData,
  type WinLossData,
} from "./shared";

export default function AdminInsightsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actionQueue, setActionQueue] = useState<ActionQueueData>({});
  const [marginLeak, setMarginLeak] = useState<MarginLeakData>({});
  const [smartUpsell, setSmartUpsell] = useState<SmartUpsellData>({});
  const [autoRequote, setAutoRequote] = useState<AutoRequoteData>({});
  const [dailyBrief, setDailyBrief] = useState<DailyBriefData>({});
  const [winLoss, setWinLoss] = useState<WinLossData>({});
  const [, setAiUsage] = useState<AiUsageData>({});
  const [, setBatchJobs] = useState<BatchJobsData>({});

  const loadAll = useCallback(
    async (showToast = false) => {
      setError(null);
      if (showToast) setRefreshing(true);
      else setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) throw new Error("Unauthorized");

        const headers = {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        };

        const streamLoaders = [
          { key: "actionQueue" as const, label: "action-queue", run: () => fetch("/api/admin/insights/action-queue?limit=8", { headers }) },
          { key: "marginLeak" as const, label: "margin-leak", run: () => fetch("/api/admin/insights/margin-leak?daysBack=90&limit=6", { headers }) },
          { key: "smartUpsell" as const, label: "smart-upsell", run: () => fetch("/api/admin/insights/smart-upsell-timing?daysForward=30&limit=6", { headers }) },
          { key: "autoRequote" as const, label: "auto-requote", run: () => fetch("/api/admin/insights/auto-requote?daysBack=120&limit=6", { headers }) },
          { key: "dailyBrief" as const, label: "daily-brief", run: () => fetch("/api/admin/insights/daily-brief?limit=5", { headers }) },
          { key: "winLoss" as const, label: "win-loss", run: () => fetch("/api/admin/insights/win-loss?daysBack=120", { headers }) },
          { key: "aiUsage" as const, label: "ai-usage", run: () => fetch("/api/admin/insights/ai-usage", { headers }) },
          { key: "batchJobs" as const, label: "batch-jobs", run: () => fetch("/api/admin/insights/batch-jobs", { headers }) },
        ];

        const settled = await Promise.allSettled(
          streamLoaders.map(async (loader) => {
            const response = await loader.run();
            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              throw new Error(`${loader.label}: ${payload?.error || response.statusText || response.status}`);
            }
            const json = await response.json();
            return { key: loader.key, payload: json };
          })
        );

        const failed: string[] = [];
        for (const item of settled) {
          if (item.status === "rejected") {
            failed.push(item.reason instanceof Error ? item.reason.message : "unknown stream error");
            continue;
          }

          const { key, payload } = item.value;
          if (key === "actionQueue") setActionQueue(payload as ActionQueueData);
          if (key === "marginLeak") setMarginLeak(payload as MarginLeakData);
          if (key === "smartUpsell") setSmartUpsell(payload as SmartUpsellData);
          if (key === "autoRequote") setAutoRequote(payload as AutoRequoteData);
          if (key === "dailyBrief") setDailyBrief(payload as DailyBriefData);
          if (key === "winLoss") setWinLoss(payload as WinLossData);
          if (key === "aiUsage") setAiUsage(payload as AiUsageData);
          if (key === "batchJobs") setBatchJobs(payload as BatchJobsData);
        }

        if (failed.length === streamLoaders.length) {
          const message = "All insight streams failed to load";
          setError(message);
          toast({ title: "Insights unavailable", description: message, variant: "error" });
          return;
        }

        setError(null);
        if (showToast) {
          toast({
            title: "Insights refreshed ✨",
            description: failed.length > 0
              ? `Loaded with ${failed.length} stream issue${failed.length > 1 ? "s" : ""}.`
              : "Your business pulse is up to date.",
            variant: failed.length > 0 ? "warning" : "success",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load insights";
        setError(message);
        toast({ title: "Insights unavailable", description: message, variant: "error" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, toast]
  );

  useEffect(() => {
    void loadAll(false);
  }, [loadAll]);

  const winRate = winLoss.totals?.win_rate ?? 0;
  const urgentCount = actionQueue.queue?.filter((action) => action.priority >= 90).length ?? 0;
  const totalActions = actionQueue.queue?.length ?? 0;
  const health =
    winRate > 40 && totalActions <= 2
      ? {
          Icon: Sun,
          label: `${getGreeting()} — business is looking strong!`,
          sub: "Keep up the momentum — a few clicks and you're set for the day.",
          color: "text-amber-500",
          bg: "from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20",
          border: "border-amber-100 dark:border-amber-800/30",
        }
      : winRate < 20 || urgentCount >= 3
        ? {
            Icon: AlertTriangle,
            label: `${getGreeting()} — a few things need your attention today.`,
            sub: "Don't worry — just take it one step at a time. You've got this!",
            color: "text-rose-500",
            bg: "from-rose-50 via-red-50 to-orange-50 dark:from-rose-900/20 dark:via-red-900/20 dark:to-orange-900/20",
            border: "border-rose-100 dark:border-rose-800/30",
          }
        : {
            Icon: Zap,
            label: `${getGreeting()} — things are moving, stay on top of it.`,
            sub: "A bit of follow-up today can make a big difference.",
            color: "text-blue-500",
            bg: "from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20",
            border: "border-blue-100 dark:border-blue-800/30",
          };

  const revenue30d = dailyBrief.metrics_snapshot?.paid_revenue_30d_usd ?? 0;
  const conversionRate = dailyBrief.metrics_snapshot?.conversion_rate_30d ?? 0;
  const proposalCount = dailyBrief.metrics_snapshot?.proposal_count_30d ?? 0;
  const conversionPer10 = Math.round((conversionRate / 100) * 10);
  const totalDiscountGiven = (marginLeak.leaks ?? []).reduce((sum, leak) => {
    const price = leak.listed_price_usd ?? 0;
    const pct = leak.discount_pct ?? 0;
    return sum + price * (pct / 100);
  }, 0);
  const winPct = Math.min(Math.round(winRate), 100);

  return (
    <div className="space-y-6 pb-16">
      <InsightsHero
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void loadAll(true)}
        health={health}
        revenue30d={revenue30d}
        totalActions={totalActions}
        conversionRate={conversionRate}
      />
      <ActionQueuePanel loading={loading} actionQueue={actionQueue} totalActions={totalActions} />
      <RevenueInsightsPanels
        loading={loading}
        revenue30d={revenue30d}
        conversionRate={conversionRate}
        proposalCount={proposalCount}
        conversionPer10={conversionPer10}
        marginLeak={marginLeak}
        totalDiscountGiven={totalDiscountGiven}
      />
      <WinLossPanel loading={loading} winPct={winPct} winLoss={winLoss} />
      <UpsellAndRequotePanels loading={loading} smartUpsell={smartUpsell} autoRequote={autoRequote} />
    </div>
  );
}
