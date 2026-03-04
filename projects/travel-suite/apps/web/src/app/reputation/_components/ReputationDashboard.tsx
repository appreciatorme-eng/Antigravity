"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Inbox,
  Megaphone,
  BarChart3,
  Settings,
  AlertTriangle,
  Loader2,
  Star,
} from "lucide-react";
import type { ReputationDashboardData, ReputationReview } from "@/lib/reputation/types";
import { PLATFORM_LABELS } from "@/lib/reputation/constants";
import { ReputationHealthScore } from "./ReputationHealthScore";
import { ReputationKPIRow } from "./ReputationKPIRow";
import { ReviewInbox } from "./ReviewInbox";

interface ReputationDashboardProps {
  organizationName: string;
}

type TabId = "overview" | "reviews" | "campaigns" | "analytics" | "settings";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "reviews", label: "Reviews", icon: Inbox },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function RatingDistributionBar({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  const bars = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-2">
      {bars.map((star) => {
        const count = distribution[star] ?? 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm text-slate-400 w-4 text-right">{star}</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-slate-500 w-10 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Megaphone className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mx-auto">{description}</p>
      <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-500 font-medium">
        Coming Soon
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: ReputationDashboardData }) {
  return (
    <div className="space-y-6">
      {/* Health Score + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 flex items-center justify-center">
          <ReputationHealthScore score={data.healthScore} />
        </div>
        <div className="lg:col-span-3">
          <ReputationKPIRow
            overallRating={data.overallRating}
            totalReviews={data.totalReviews}
            responseRate={data.responseRate}
            npsScore={data.npsScore}
          />
        </div>
      </div>

      {/* Attention Alerts */}
      {data.attentionCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">{data.attentionCount}</span>{" "}
            {data.attentionCount === 1 ? "review requires" : "reviews require"} your
            attention.
          </p>
        </motion.div>
      )}

      {/* Platform Breakdown + Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Platform Breakdown</h3>
          {data.platformBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No platform data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.platformBreakdown.map((p) => (
                <div
                  key={p.platform}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-sm text-white font-medium">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-white font-semibold">
                        {p.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {p.count} {p.count === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Rating Distribution</h3>
          <RatingDistributionBar
            distribution={data.ratingDistribution}
            total={data.totalReviews}
          />
        </div>
      </div>

      {/* Sentiment + Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Breakdown */}
        <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Sentiment</h3>
          <div className="space-y-3">
            {(
              [
                { key: "positive", label: "Positive", color: "#22c55e" },
                { key: "neutral", label: "Neutral", color: "#eab308" },
                { key: "negative", label: "Negative", color: "#ef4444" },
              ] as const
            ).map((s) => {
              const count =
                data.sentimentBreakdown[s.key as keyof typeof data.sentimentBreakdown];
              return (
                <div key={s.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm text-slate-300">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Reviews</h3>
          {data.recentReviews.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentReviews.map((review: ReputationReview) => (
                <div
                  key={review.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {review.reviewer_name}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {PLATFORM_LABELS[review.platform] ?? review.platform}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReputationDashboard({ organizationName }: ReputationDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [dashboardData, setDashboardData] = useState<ReputationDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/reputation/dashboard");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load dashboard");
      }
      const data: ReputationDashboardData = await res.json();
      setDashboardData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reputation Manager</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor and manage reviews for {organizationName}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="reputation-tab-bg"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {loading && activeTab === "overview" ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
          ) : error && activeTab === "overview" ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={fetchDashboard}
                className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          ) : activeTab === "overview" && dashboardData ? (
            <OverviewTab data={dashboardData} />
          ) : activeTab === "reviews" ? (
            <ReviewInbox organizationName={organizationName} />
          ) : activeTab === "campaigns" ? (
            <ComingSoonCard
              title="Review Campaigns"
              description="Automate review collection with post-trip NPS surveys and smart routing to platforms."
            />
          ) : activeTab === "analytics" ? (
            <ComingSoonCard
              title="Reputation Analytics"
              description="Track trends, compare platforms, and analyze sentiment over time."
            />
          ) : activeTab === "settings" ? (
            <ComingSoonCard
              title="Reputation Settings"
              description="Configure brand voice, platform connections, and notification preferences."
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
