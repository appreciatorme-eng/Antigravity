"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Loader2, AlertCircle, Info } from "lucide-react";
import type { OperatorScorecardPayload } from "@/lib/admin/operator-scorecard";
import { ScorecardCard } from "./_components/ScorecardCard";
import { TrendChart, type TrendMetricMode } from "./_components/TrendChart";
import { UpgradeBanner } from "./_components/UpgradeBanner";

type MetricTab = {
  id: TrendMetricMode;
  label: string;
  icon: React.ElementType;
};

const METRIC_TABS: MetricTab[] = [
  { id: "revenue", label: "Revenue", icon: TrendingUp },
  { id: "approvalRate", label: "Approval Rate", icon: BarChart3 },
  { id: "paymentConversion", label: "Payment Conversion", icon: BarChart3 },
];

export default function PerformancePage() {
  const [scorecards, setScorecards] = useState<OperatorScorecardPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<TrendMetricMode>("revenue");

  const isFree = useMemo(() => {
    if (scorecards.length === 0) return false;
    const tier = scorecards[0].organization.subscriptionTier?.toLowerCase();
    return !tier || tier === "free" || tier === "trial";
  }, [scorecards]);

  useEffect(() => {
    async function fetchScorecards() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/scorecards", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch scorecards" }));
          throw new Error(errorData.message || "Failed to fetch scorecards");
        }

        const data = await response.json();
        const fetchedScorecards = data.scorecards || [];
        setScorecards(fetchedScorecards);

        if (fetchedScorecards.length > 0 && !selectedMonthKey) {
          setSelectedMonthKey(fetchedScorecards[0].monthKey);
        }
      } catch (err) {
        console.error("Error fetching scorecards:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchScorecards();
  }, [selectedMonthKey]);

  const selectedScorecard = useMemo(() => {
    return scorecards.find((sc) => sc.monthKey === selectedMonthKey) || scorecards[0] || null;
  }, [scorecards, selectedMonthKey]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#0a1628] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
              <p className="text-sm text-zinc-400">Loading performance data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#0a1628] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex max-w-md flex-col items-center gap-4 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30">
                <AlertCircle className="h-8 w-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Failed to Load Performance Data</h2>
              <p className="text-sm text-zinc-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
              >
                Retry
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (scorecards.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#0a1628] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[60vh] items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex max-w-md flex-col items-center gap-4 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 border border-blue-500/30">
                <Info className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">No Performance Data Yet</h2>
              <p className="text-sm text-zinc-400">
                Monthly scorecards will be generated automatically on the 1st of each month. Check back soon!
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#0a1628] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Performance Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Monthly business intelligence scorecard with trends and actionable insights
          </p>
        </motion.div>

        {/* Month Selector */}
        {scorecards.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              {scorecards.map((scorecard, idx) => {
                const isSelected = scorecard.monthKey === selectedMonthKey;
                return (
                  <button
                    key={scorecard.monthKey}
                    onClick={() => setSelectedMonthKey(scorecard.monthKey)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {scorecard.monthLabel}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Free Tier Upgrade Banner */}
        {isFree && (
          <div className="mb-6">
            <UpgradeBanner />
          </div>
        )}

        {/* Current Scorecard */}
        {selectedScorecard && (
          <div className="mb-8">
            <ScorecardCard scorecard={selectedScorecard} />
          </div>
        )}

        {/* 6-Month Trends Section (Pro feature) */}
        {!isFree && scorecards.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8"
          >
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-xl font-bold text-white">6-Month Performance Trends</h2>
              <p className="mb-6 text-sm text-zinc-400">
                Track your business metrics over time to identify patterns and opportunities
              </p>

              {/* Metric Tabs */}
              <div className="mb-4 flex flex-wrap gap-2">
                {METRIC_TABS.map((tab) => {
                  const isSelected = tab.id === selectedMetric;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedMetric(tab.id)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                        isSelected
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Trend Chart */}
              <TrendChart data={scorecards} metric={selectedMetric} loading={false} />
            </div>
          </motion.div>
        )}

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 rounded-lg border border-white/5 bg-white/[0.02] p-4"
        >
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-white">How are scorecards calculated?</p>
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                Your performance score is weighted across multiple factors: proposal approval rate (20%), payment
                conversion rate (20%), review response rate (15%), average rating (10%), cache efficiency (10%),
                WhatsApp response time (10%), revenue growth (10%), and proposal throughput (5%). Scorecards are
                auto-generated on the 1st of each month.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
