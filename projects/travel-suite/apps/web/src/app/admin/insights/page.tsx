"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { useToast } from "@/components/ui/toast";
import {
  Sun,
  Zap,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  IndianRupee,
  CalendarDays,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Clock,
  BadgeCheck,
  Gift,
  FileEdit,
  Plane,
  Target,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionItem = {
  id: string;
  type: string;
  priority: number;
  title: string;
  description: string;
  due_at: string | null;
  href: string;
  reason: string;
};

type ActionQueueData = {
  summary?: {
    expiring_proposals: number;
    unpaid_invoices: number;
    stalled_trips: number;
  };
  queue?: ActionItem[];
};

type LeakItem = {
  proposal_id: string;
  title: string;
  leak_score: number;
  discount_pct: number;
  listed_price_usd: number;
  selected_price_usd: number;
  recommendation: string;
};

type MarginLeakData = {
  leaks?: LeakItem[];
};

type UpsellRec = {
  add_on_id: string;
  name: string;
  score: number;
  price_usd: number;
  category?: string;
};

type SmartUpsellData = {
  recommendations?: Array<{
    trip_id: string;
    trip_title: string;
    destination?: string;
    stage: string;
    days_to_departure?: number | null;
    start_date?: string;
    recommendations: UpsellRec[];
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a USD/INR amount in Indian currency style */
const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** Map action type + priority → human sentence */
function humanSentence(action: ActionItem): string {
  if (action.type === "invoice") {
    return `Payment for "${action.title}" is overdue — collect it now.`;
  }
  if (action.priority >= 90) {
    return `"${action.title}" expires very soon — reach out immediately!`;
  }
  if (action.type === "trip") {
    return `"${action.title}" hasn't been updated in a while — check in with the client.`;
  }
  return `"${action.title}" — they may be waiting to hear from you. Time to follow up!`;
}

/** Map action type → emoji */
function actionEmoji(action: ActionItem): string {
  if (action.type === "invoice") return "💸";
  if (action.type === "trip") return "✈️";
  if (action.priority >= 90) return "⚠️";
  return "💬";
}

/** Map trip stage → friendly label */
function stageLabel(stage: string): string {
  switch (stage) {
    case "early": return "✅ Perfect time to offer extras";
    case "mid": return "🕐 Good time to upsell";
    case "last_minute": return "🚀 Final chance — they depart soon!";
    case "active": return "🌍 Currently travelling";
    default: return "💡 Upsell opportunity";
  }
}

/** Get greeting based on time of day */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  // kept in state for possible future use, not displayed in UI
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
          {
            key: "actionQueue" as const,
            label: "action-queue",
            run: () => fetch("/api/admin/insights/action-queue?limit=8", { headers }),
          },
          {
            key: "marginLeak" as const,
            label: "margin-leak",
            run: () => fetch("/api/admin/insights/margin-leak?daysBack=90&limit=6", { headers }),
          },
          {
            key: "smartUpsell" as const,
            label: "smart-upsell",
            run: () => fetch("/api/admin/insights/smart-upsell-timing?daysForward=30&limit=6", { headers }),
          },
          {
            key: "autoRequote" as const,
            label: "auto-requote",
            run: () => fetch("/api/admin/insights/auto-requote?daysBack=120&limit=6", { headers }),
          },
          {
            key: "dailyBrief" as const,
            label: "daily-brief",
            run: () => fetch("/api/admin/insights/daily-brief?limit=5", { headers }),
          },
          {
            key: "winLoss" as const,
            label: "win-loss",
            run: () => fetch("/api/admin/insights/win-loss?daysBack=120", { headers }),
          },
          {
            key: "aiUsage" as const,
            label: "ai-usage",
            run: () => fetch("/api/admin/insights/ai-usage", { headers }),
          },
          {
            key: "batchJobs" as const,
            label: "batch-jobs",
            run: () => fetch("/api/admin/insights/batch-jobs", { headers }),
          },
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

  // ── Derived values ───────────────────────────────────────────────────────────

  const winRate = winLoss.totals?.win_rate ?? 0;
  const urgentCount = actionQueue.queue?.filter((a) => a.priority >= 90).length ?? 0;
  const totalActions = actionQueue.queue?.length ?? 0;

  // Business health signal
  const health =
    winRate > 40 && totalActions <= 2
      ? {
          Icon: Sun,
          label: "Business is looking strong!",
          sub: "Keep up the momentum — a few clicks and you're set for the day.",
          color: "text-amber-500",
          bg: "from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20",
          border: "border-amber-100 dark:border-amber-800/30",
        }
      : winRate < 20 || urgentCount >= 3
      ? {
          Icon: AlertTriangle,
          label: "A few things need your attention today.",
          sub: "Don't worry — just take it one step at a time. You've got this!",
          color: "text-rose-500",
          bg: "from-rose-50 via-red-50 to-orange-50 dark:from-rose-900/20 dark:via-red-900/20 dark:to-orange-900/20",
          border: "border-rose-100 dark:border-rose-800/30",
        }
      : {
          Icon: Zap,
          label: "Things are moving — stay on top of it.",
          sub: "A bit of follow-up today can make a big difference.",
          color: "text-blue-500",
          bg: "from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20",
          border: "border-blue-100 dark:border-blue-800/30",
        };

  const { Icon: HealthIcon } = health;

  // Revenue this month
  const revenue30d = dailyBrief.metrics_snapshot?.paid_revenue_30d_usd ?? 0;
  const conversionRate = dailyBrief.metrics_snapshot?.conversion_rate_30d ?? 0;
  const proposalCount = dailyBrief.metrics_snapshot?.proposal_count_30d ?? 0;
  const conversionPer10 = Math.round((conversionRate / 100) * 10);

  // Total discounts given away
  const totalDiscountGiven = (marginLeak.leaks ?? []).reduce((sum, l) => {
    const price = l.listed_price_usd ?? 0;
    const pct = l.discount_pct ?? 0;
    return sum + price * (pct / 100);
  }, 0);

  // Win rate for the visual ring
  const winPct = Math.min(Math.round(winRate), 100);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Business Pulse</span>
          </div>
          <h1 className="text-3xl font-serif text-secondary dark:text-white tracking-tight">
            {getGreeting()} 👋
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Here&apos;s everything you need to know about your business today.
          </p>
        </div>
        <button
          onClick={() => void loadAll(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-text-muted hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error ? (
        <GlassCard padding="lg" className="border-rose-200 bg-rose-50/30">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        </GlassCard>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Business health + 3 quick stats
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <GlassCard padding="none" className={`bg-gradient-to-br ${health.bg} border ${health.border} overflow-hidden`}>
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              {/* Health icon */}
              <div className={`w-12 h-12 shrink-0 rounded-2xl bg-white/60 dark:bg-black/20 flex items-center justify-center shadow-sm`}>
                <HealthIcon className={`w-6 h-6 ${health.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-secondary dark:text-white leading-snug">
                  {loading ? "Loading your business data…" : health.label}
                </p>
                <p className="text-sm text-text-muted mt-0.5">{health.sub}</p>
              </div>
            </div>

            {/* 3 quick-stat pills */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Revenue pill */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/70 dark:bg-black/20 border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 leading-none">
                    {loading ? "—" : fmt(revenue30d)}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 font-medium">earned this month</p>
                </div>
              </div>

              {/* Follow-up pill */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/70 dark:bg-black/20 border border-amber-100 dark:border-amber-900/30">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-amber-700 dark:text-amber-400 leading-none">
                    {loading ? "—" : totalActions}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 font-medium">
                    {totalActions === 1 ? "quote needs follow-up" : "quotes need follow-up"}
                  </p>
                </div>
              </div>

              {/* Conversion pill */}
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/70 dark:bg-black/20 border border-blue-100 dark:border-blue-900/30">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-blue-700 dark:text-blue-400 leading-none">
                    {loading ? "—" : `${conversionRate.toFixed(0)}%`}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 font-medium">quote-to-booking rate</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — What to do today (Action Queue)
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <GlassCard padding="lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-secondary dark:text-white flex items-center gap-2">
                🎯 What to do today
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                These are the most important things for your business right now.
              </p>
            </div>
            {!loading && totalActions > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                {totalActions} item{totalActions !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {loading ? (
              // Skeleton
              [1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
              ))
            ) : (actionQueue.queue ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                  <BadgeCheck className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="font-bold text-secondary dark:text-white">You&apos;re all caught up! 🎉</p>
                <p className="text-sm text-text-muted mt-1">No urgent actions right now. Enjoy the peace!</p>
              </div>
            ) : (
              (actionQueue.queue ?? []).slice(0, 5).map((action) => {
                const isUrgent = action.priority >= 90;
                const isToday = action.priority >= 75 && action.priority < 90;
                const urgencyDot = isUrgent ? "🔴" : isToday ? "🟡" : "🟢";
                const urgencyLabel = isUrgent ? "URGENT" : isToday ? "TODAY" : "THIS WEEK";
                const urgencyBg = isUrgent
                  ? "border-rose-100 dark:border-rose-800/30 hover:border-rose-300"
                  : isToday
                  ? "border-amber-100 dark:border-amber-800/30 hover:border-amber-300"
                  : "border-gray-100 dark:border-slate-700 hover:border-primary/30";

                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    className={`flex items-center gap-4 p-4 rounded-2xl border bg-white/60 dark:bg-black/10 transition-all duration-200 hover:shadow-sm group ${urgencyBg}`}
                  >
                    {/* Emoji */}
                    <div className="text-2xl shrink-0 leading-none">{actionEmoji(action)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-secondary dark:text-white leading-snug">
                        {humanSentence(action)}
                      </p>
                      {action.due_at && (
                        <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {new Date(action.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>

                    {/* Urgency badge + arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isUrgent ? "text-rose-500" : isToday ? "text-amber-500" : "text-emerald-500"}`}>
                        {urgencyDot} {urgencyLabel}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — Your Money This Month (Revenue + Discounts)
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {/* Revenue story */}
        <GlassCard padding="lg" className="border-emerald-100/50 dark:border-emerald-900/30">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-secondary dark:text-white">💰 Your money this month</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Big revenue number */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-1">Revenue earned</p>
                <p className="text-4xl font-black text-emerald-700 dark:text-emerald-400">
                  {fmt(revenue30d)}
                </p>
                <p className="text-xs text-emerald-600/70 mt-1">in the last 30 days</p>
              </div>

              {/* Conversion story */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                  <BadgeCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary dark:text-white">
                    {conversionPer10} out of every 10 quotes you send become real bookings
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    You sent {proposalCount} quote{proposalCount !== 1 ? "s" : ""} this month
                    {conversionRate >= 30 ? " — great conversion rate! ✅" : " — try following up faster to convert more 📈"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Discounts given away */}
        <GlassCard padding="lg" className="border-amber-100/50 dark:border-amber-900/30">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-secondary dark:text-white">🎟️ Discounts you gave away</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (marginLeak.leaks ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-secondary dark:text-white">No big discounts found!</p>
              <p className="text-sm text-text-muted mt-1">Your pricing is holding strong.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Total summary */}
              {totalDiscountGiven > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 mb-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    This month you gave away{" "}
                    <span className="font-black text-sm">{fmt(totalDiscountGiven)}</span>{" "}
                    in discounts — is that intentional?
                  </p>
                </div>
              )}

              {(marginLeak.leaks ?? []).slice(0, 4).map((leak) => {
                const discountAmt = (leak.listed_price_usd ?? 0) * ((leak.discount_pct ?? 0) / 100);
                return (
                  <Link
                    key={leak.proposal_id}
                    href={`/proposals/${leak.proposal_id}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-100 dark:border-amber-800/20 hover:border-amber-300 dark:hover:border-amber-700 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary dark:text-white truncate">{leak.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {leak.discount_pct.toFixed(0)}% less than your standard rate
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-amber-600">{fmt(discountAmt)}</p>
                      <p className="text-[10px] text-text-muted">given away</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — Why do clients book or not? (Win-Loss)
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary dark:text-white">📊 Why do clients book (or not)?</h2>
              <p className="text-xs text-text-muted">Based on your last 120 days of quotes</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-48 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />)}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Win rate ring */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-40 h-40">
                  {/* Ring using conic-gradient */}
                  <div
                    className="w-40 h-40 rounded-full"
                    style={{
                      background: `conic-gradient(#10b981 0% ${winPct}%, #e5e7eb ${winPct}% 100%)`,
                    }}
                  />
                  {/* Center hole */}
                  <div className="absolute inset-4 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center shadow-inner">
                    <p className="text-3xl font-black text-secondary dark:text-white leading-none">{winPct}%</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">booked</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-secondary dark:text-white">
                    {winLoss.totals?.wins ?? 0} bookings from {winLoss.totals?.proposals ?? 0} quotes
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {winPct >= 30
                      ? "Great conversion! Industry average is ~30% ✅"
                      : "Room to improve — faster follow-ups help 📈"}
                  </p>
                </div>
              </div>

              {/* Pattern cards */}
              <div className="space-y-3">
                {(winLoss.patterns ?? []).map((pattern) => {
                  const patternConfig: Record<string, { emoji: string; plain: string }> = {
                    no_view: {
                      emoji: "🙈",
                      plain: `${pattern.count} of your quotes were never even opened — try following up within 24 hours of sending`,
                    },
                    stale_viewed: {
                      emoji: "⏳",
                      plain: `${pattern.count} clients saw your quote but went quiet — they need a gentle nudge from you`,
                    },
                    price_pressure: {
                      emoji: "💡",
                      plain: `Higher-priced quotes lose more often — consider offering payment plans for bigger bookings`,
                    },
                  };

                  const cfg = patternConfig[pattern.key] ?? {
                    emoji: "📌",
                    plain: pattern.insight,
                  };

                  return (
                    <div key={pattern.key} className="flex items-start gap-3 p-3.5 rounded-xl border border-blue-50 dark:border-blue-900/20 bg-blue-50/50 dark:bg-blue-900/10">
                      <span className="text-xl leading-none shrink-0 mt-0.5">{cfg.emoji}</span>
                      <p className="text-sm text-secondary dark:text-white leading-relaxed">{cfg.plain}</p>
                    </div>
                  );
                })}

                {(winLoss.patterns ?? []).length === 0 && (
                  <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/50 dark:bg-emerald-900/10 text-center">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Not enough data yet 📊</p>
                    <p className="text-xs text-text-muted mt-1">Send more quotes to start seeing patterns.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — Earn more from existing trips (Smart Upsell)
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Gift className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary dark:text-white">🎁 Earn more from existing trips</h2>
              <p className="text-xs text-text-muted">Without finding new clients — just offer the right thing at the right time</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (smartUpsell.recommendations ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-3xl mb-2">✈️</p>
              <p className="font-bold text-secondary dark:text-white">No upcoming trips to upsell right now</p>
              <p className="text-sm text-text-muted mt-1">Check back when you have confirmed trips in the next 30 days.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(smartUpsell.recommendations ?? []).slice(0, 5).map((item) => {
                const topAddon = item.recommendations?.[0];
                const daysLeft = item.days_to_departure;

                return (
                  <Link
                    key={item.trip_id}
                    href={`/trips/${item.trip_id}`}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-violet-100 dark:border-violet-800/20 hover:border-violet-300 dark:hover:border-violet-700 bg-white/50 dark:bg-black/10 transition-all duration-200 group"
                  >
                    {/* Trip icon */}
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <Plane className="w-5 h-5 text-violet-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-secondary dark:text-white truncate">
                        {item.trip_title}
                        {item.destination ? ` — ${item.destination}` : ""}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">{stageLabel(item.stage)}</p>
                      {topAddon && (
                        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-1">
                          💡 Offer: {topAddon.name}
                          {topAddon.price_usd > 0 ? ` — earn ${fmt(topAddon.price_usd)} more` : ""}
                        </p>
                      )}
                    </div>

                    {/* Departure countdown */}
                    <div className="text-right shrink-0">
                      {daysLeft !== null && daysLeft !== undefined ? (
                        <>
                          <p className="text-lg font-black text-violet-600 dark:text-violet-400 leading-none">{daysLeft}d</p>
                          <p className="text-[10px] text-text-muted">to depart</p>
                        </>
                      ) : (
                        <CalendarDays className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — Quotes that may need a price change (Auto Requote)
      ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <FileEdit className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary dark:text-white">📋 Quotes that may need a price change</h2>
              <p className="text-xs text-text-muted">These quotes might be priced too high — consider a small adjustment</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (autoRequote.candidates ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-3xl mb-2">👌</p>
              <p className="font-bold text-secondary dark:text-white">Your pricing looks good!</p>
              <p className="text-sm text-text-muted mt-1">No quotes flagged for a price review right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(autoRequote.candidates ?? []).slice(0, 3).map((item) => {
                const isHighRisk = item.requote_score >= 70;
                const isMedRisk = item.requote_score >= 45;
                const riskEmoji = isHighRisk ? "🔴" : isMedRisk ? "🟡" : "🟢";
                const riskLabel = isHighRisk ? "High risk" : isMedRisk ? "Medium risk" : "Low risk";
                const riskColor = isHighRisk
                  ? "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30"
                  : isMedRisk
                  ? "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30"
                  : "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30";

                return (
                  <Link
                    key={item.proposal_id}
                    href={`/proposals/${item.proposal_id}`}
                    className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors group ${riskColor}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary dark:text-white truncate">
                        {riskEmoji} {item.title}
                      </p>
                      <p className="text-xs mt-0.5 opacity-80">
                        {riskLabel} — consider lowering by ~{Math.abs(item.suggested_delta_pct)}%
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Footer note */}
      <p className="text-center text-[11px] text-text-muted pb-4">
        <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
        Insights are based on your real bookings and proposals data. Updated every time you refresh.
      </p>
    </div>
  );
}
