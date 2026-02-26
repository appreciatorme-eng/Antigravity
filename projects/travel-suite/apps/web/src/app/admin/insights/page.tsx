"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
  Target,
  AlertTriangle,
  Clock3,
  Gauge,
  ArrowUpRight,
  Cpu,
  Database,
  Layers,
} from "lucide-react";

type ActionQueueData = {
  summary?: {
    expiring_proposals: number;
    unpaid_invoices: number;
    stalled_trips: number;
  };
  queue?: Array<{
    id: string;
    type: string;
    priority: number;
    title: string;
    description: string;
    due_at: string | null;
    href: string;
    reason: string;
  }>;
};

type MarginLeakData = {
  leaks?: Array<{
    proposal_id: string;
    title: string;
    leak_score: number;
    discount_pct: number;
    recommendation: string;
  }>;
};

type SmartUpsellData = {
  recommendations?: Array<{
    trip_id: string;
    trip_title: string;
    stage: string;
    recommendations: Array<{ add_on_id: string; name: string; score: number; price_usd: number }>;
  }>;
};

type AutoRequoteData = {
  candidates?: Array<{
    proposal_id: string;
    title: string;
    requote_score: number;
    suggested_delta_pct: number;
  }>;
};

type DailyBriefData = {
  top_actions?: Array<{
    id: string;
    title: string;
    priority: number;
    href: string;
  }>;
  metrics_snapshot?: {
    proposal_count_30d: number;
    conversion_rate_30d: number;
    paid_revenue_30d_usd: number;
  };
};

type WinLossData = {
  totals?: {
    proposals: number;
    wins: number;
    losses: number;
    win_rate: number;
  };
  patterns?: Array<{
    key: string;
    label: string;
    count: number;
    share_pct: number;
    insight: string;
    action: string;
  }>;
};

type AiUsageData = {
  tier?: string;
  utilization?: { requests_pct: number; spend_pct: number };
  usage?: { ai_requests: number; estimated_cost_usd: number; rag_hits: number; cache_hits: number; fallback_count: number };
  caps?: { monthly_request_cap: number; monthly_spend_cap_usd: number };
  degraded_mode_recommended?: boolean;
};

type BatchJobsData = {
  jobs?: Array<{ id: string; status: string | null; created_at: string | null; payload?: { job_type?: string } }>;
};

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
  const [aiUsage, setAiUsage] = useState<AiUsageData>({});
  const [batchJobs, setBatchJobs] = useState<BatchJobsData>({});

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

        const [
          actionQueueRes,
          marginRes,
          upsellRes,
          requoteRes,
          briefRes,
          winLossRes,
          usageRes,
          jobsRes,
        ] = await Promise.all([
          fetch("/api/admin/insights/action-queue?limit=8", { headers }),
          fetch("/api/admin/insights/margin-leak?daysBack=90&limit=6", { headers }),
          fetch("/api/admin/insights/smart-upsell-timing?daysForward=30&limit=6", { headers }),
          fetch("/api/admin/insights/auto-requote?daysBack=120&limit=6", { headers }),
          fetch("/api/admin/insights/daily-brief?limit=5", { headers }),
          fetch("/api/admin/insights/win-loss?daysBack=120", { headers }),
          fetch("/api/admin/insights/ai-usage", { headers }),
          fetch("/api/admin/insights/batch-jobs", { headers }),
        ]);

        if (
          !actionQueueRes.ok ||
          !marginRes.ok ||
          !upsellRes.ok ||
          !requoteRes.ok ||
          !briefRes.ok ||
          !winLossRes.ok ||
          !usageRes.ok ||
          !jobsRes.ok
        ) {
          throw new Error("One or more insight streams failed to load");
        }

        const [actionQueueJson, marginJson, upsellJson, requoteJson, briefJson, winLossJson, usageJson, jobsJson] =
          await Promise.all([
            actionQueueRes.json(),
            marginRes.json(),
            upsellRes.json(),
            requoteRes.json(),
            briefRes.json(),
            winLossRes.json(),
            usageRes.json(),
            jobsRes.json(),
          ]);

        setActionQueue(actionQueueJson as ActionQueueData);
        setMarginLeak(marginJson as MarginLeakData);
        setSmartUpsell(upsellJson as SmartUpsellData);
        setAutoRequote(requoteJson as AutoRequoteData);
        setDailyBrief(briefJson as DailyBriefData);
        setWinLoss(winLossJson as WinLossData);
        setAiUsage(usageJson as AiUsageData);
        setBatchJobs(jobsJson as BatchJobsData);

        if (showToast) {
          toast({
            title: "Insights refreshed",
            description: "Growth intelligence feeds are updated.",
            variant: "success",
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

  const enqueueBatch = useCallback(
    async (jobType: "recompute_analytics" | "recompute_upsell" | "refresh_copilot") => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Unauthorized");

        const response = await fetch("/api/admin/insights/batch-jobs", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ job_type: jobType, priority: "normal" }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to queue batch job");
        }

        toast({
          title: "Batch job queued",
          description: "Heavy insight recomputation is now queued asynchronously.",
          variant: "success",
        });

        await loadAll(false);
      } catch (err) {
        toast({
          title: "Queue failed",
          description: err instanceof Error ? err.message : "Failed to queue job",
          variant: "error",
        });
      }
    },
    [loadAll, supabase, toast]
  );

  useEffect(() => {
    void loadAll(false);
  }, [loadAll]);

  return (
    <div className="space-y-8 pb-16">
      <motion.div
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Growth Intelligence</span>
          </div>
          <h1 className="text-4xl font-serif text-secondary dark:text-white tracking-tight">Insights Copilot</h1>
          <p className="text-sm text-text-muted mt-2">
            Action queue, margin defense, upsell timing, requote suggestions, and win/loss learning.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <GlassButton onClick={() => void enqueueBatch("recompute_analytics")} className="h-10 rounded-xl gap-2" variant="outline">
            <Database className="w-4 h-4" />
            Queue Analytics Recompute
          </GlassButton>
          <GlassButton onClick={() => void loadAll(true)} disabled={refreshing} className="h-10 rounded-xl gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </GlassButton>
        </div>
      </motion.div>

      {error ? (
        <GlassCard padding="lg" className="border-rose-200 bg-rose-50/30">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-secondary">Action Queue</h2>
          </div>
          <p className="text-4xl font-black text-secondary dark:text-white">
            {loading ? "--" : actionQueue.queue?.length || 0}
          </p>
          <p className="text-xs text-text-muted mt-2">Revenue-risk actions prioritized today</p>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-secondary">Margin Leak</h2>
          </div>
          <p className="text-4xl font-black text-secondary dark:text-white">{loading ? "--" : marginLeak.leaks?.length || 0}</p>
          <p className="text-xs text-text-muted mt-2">Deals flagged for potential margin erosion</p>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-secondary">Win Rate</h2>
          </div>
          <p className="text-4xl font-black text-secondary dark:text-white">
            {loading ? "--" : `${(winLoss.totals?.win_rate || 0).toFixed(1)}%`}
          </p>
          <p className="text-xs text-text-muted mt-2">Proposals converted in analysis window</p>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-secondary">AI Utilization</h2>
          </div>
          <p className="text-4xl font-black text-secondary dark:text-white">
            {loading ? "--" : `${Math.max(aiUsage.utilization?.requests_pct || 0, aiUsage.utilization?.spend_pct || 0).toFixed(1)}%`}
          </p>
          <p className="text-xs text-text-muted mt-2">Capacity used across request/spend caps</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">Operator Copilot Daily Brief</h3>
          <div className="space-y-3">
            {(dailyBrief.top_actions || []).slice(0, 5).map((action) => (
              <Link key={action.id} href={action.href} className="block p-3 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-secondary dark:text-white">{action.title}</p>
                  <span className="text-[10px] font-black uppercase text-primary">P{action.priority}</span>
                </div>
              </Link>
            ))}
            {(!dailyBrief.top_actions || dailyBrief.top_actions.length === 0) && !loading ? (
              <p className="text-xs text-text-muted">No actions currently in the queue.</p>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">Auto Requote Engine</h3>
          <div className="space-y-3">
            {(autoRequote.candidates || []).slice(0, 5).map((item) => (
              <Link key={item.proposal_id} href={`/proposals/${item.proposal_id}`} className="block p-3 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-secondary dark:text-white">{item.title}</p>
                    <p className="text-xs text-text-muted mt-1">Suggested requote delta: {item.suggested_delta_pct}%</p>
                  </div>
                  <GlassBadge variant={item.requote_score >= 70 ? "danger" : item.requote_score >= 45 ? "warning" : "info"}>
                    {item.requote_score}
                  </GlassBadge>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">Smart Upsell Timing</h3>
          <div className="space-y-3">
            {(smartUpsell.recommendations || []).slice(0, 5).map((item) => (
              <Link key={item.trip_id} href={`/trips/${item.trip_id}`} className="block p-3 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-secondary dark:text-white">{item.trip_title}</p>
                    <p className="text-xs text-text-muted mt-1">Stage: {item.stage}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {item.recommendations[0]?.name || "No suggestion"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">Win-Loss Intelligence</h3>
          <div className="space-y-3">
            {(winLoss.patterns || []).map((pattern) => (
              <div key={pattern.key} className="p-3 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-secondary dark:text-white">{pattern.label}</p>
                  <span className="text-xs font-black text-primary">{pattern.share_pct}%</span>
                </div>
                <p className="text-xs text-text-muted mt-1">{pattern.insight}</p>
                <p className="text-xs text-secondary mt-1">Action: {pattern.action}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">Margin Leak Detector</h3>
          <div className="space-y-3">
            {(marginLeak.leaks || []).slice(0, 5).map((leak) => (
              <Link key={leak.proposal_id} href={`/proposals/${leak.proposal_id}`} className="block p-3 rounded-xl border border-gray-100 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-secondary dark:text-white">{leak.title}</p>
                    <p className="text-xs text-text-muted mt-1">Discount pressure: {leak.discount_pct.toFixed(1)}%</p>
                  </div>
                  <GlassBadge variant={leak.leak_score >= 70 ? "danger" : leak.leak_score >= 45 ? "warning" : "info"}>
                    {leak.leak_score}
                  </GlassBadge>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">Cost Efficiency Controls</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-secondary dark:text-white">Progressive compute path</p>
              </div>
              <p className="text-xs text-text-muted mt-1">Cache → RAG → model fallback path is active for itinerary generation.</p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-bold text-secondary dark:text-white">Async heavy jobs</p>
              </div>
              <p className="text-xs text-text-muted mt-1">Batch jobs are queued in background to keep request handlers lightweight.</p>
              <p className="text-xs text-text-muted mt-1">
                Queued: {(batchJobs.jobs || []).filter((job) => (job.status || "") === "pending").length} pending
              </p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-secondary dark:text-white">AI spend/request cap status</p>
                {aiUsage.degraded_mode_recommended ? (
                  <GlassBadge variant="warning">Degraded mode suggested</GlassBadge>
                ) : (
                  <GlassBadge variant="success">Within cap</GlassBadge>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Requests: {(aiUsage.utilization?.requests_pct || 0).toFixed(1)}% • Spend: {(aiUsage.utilization?.spend_pct || 0).toFixed(1)}%
              </p>
            </div>

            <Link href="/admin/billing" className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-primary">
              Open billing conversion dashboard
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
