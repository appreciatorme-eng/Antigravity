"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Inbox,
  Megaphone,
  BarChart3,
  Settings,
  AlertTriangle,
  Star,
  RefreshCw,
  Plus,
} from "lucide-react";
import type { ReputationReview } from "@/lib/reputation/types";
import { PLATFORM_LABELS } from "@/lib/reputation/constants";
import { ReputationHealthScore } from "./ReputationHealthScore";
import { ReputationKPIRow } from "./ReputationKPIRow";
import { ReviewInbox } from "./ReviewInbox";
import CampaignList from "./CampaignList";
import CampaignBuilder from "./CampaignBuilder";
import { SentimentChart } from "./SentimentChart";
import { TopicCloud } from "./TopicCloud";
import ReviewToRevenueChart from "./ReviewToRevenueChart";
import CompetitorBenchmark from "./CompetitorBenchmark";
import RatingDistribution from "./RatingDistribution";
import { BrandVoiceSettings } from "./BrandVoiceSettings";
import PlatformConnectionCards from "./PlatformConnectionCards";
import WidgetConfigurator from "./WidgetConfigurator";
import NPSSurveyPreview from "./NPSSurveyPreview";
import {
  MOCK_DASHBOARD_DATA,
  MOCK_REVIEWS,
  MOCK_CAMPAIGNS,
  MOCK_SENTIMENT_DATA,
  MOCK_TOPICS,
  MOCK_REVENUE_DATA,
  MOCK_COMPETITORS,
  MOCK_CONNECTIONS,
  MOCK_BRAND_VOICE,
  MOCK_WIDGET,
} from "./mock-data";

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

// ─── Rating Distribution Bar (inline for Overview) ──────────────
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
            <span className="text-sm text-gray-400 w-4 text-right">{star}</span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-gray-400 w-10 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────
function OverviewTab() {
  const data = { ...MOCK_DASHBOARD_DATA, recentReviews: MOCK_REVIEWS.slice(0, 5) };

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
          className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{data.attentionCount}</span>{" "}
            {data.attentionCount === 1 ? "review requires" : "reviews require"} your
            attention.
          </p>
        </motion.div>
      )}

      {/* Platform Breakdown + Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Platform Breakdown</h3>
          {data.platformBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No platform data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.platformBreakdown.map((p) => (
                <div
                  key={p.platform}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-sm text-gray-900 font-medium">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm text-gray-900 font-semibold">
                        {p.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {p.count} {p.count === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <RatingDistributionBar
            distribution={data.ratingDistribution}
            total={data.totalReviews}
          />
        </div>
      </div>

      {/* Sentiment + Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment</h3>
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
                    <span className="text-sm text-gray-600">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Reviews</h3>
          {data.recentReviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentReviews.map((review: ReputationReview) => (
                <div
                  key={review.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {review.reviewer_name}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {PLATFORM_LABELS[review.platform] ?? review.platform}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-gray-500 line-clamp-2">
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

// ─── Campaigns Tab ──────────────────────────────────────────────
function CampaignsTab() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Review Campaigns</h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CampaignBuilder
            onSave={(data) => {
              console.log("Campaign saved:", data);
              setIsCreating(false);
            }}
            onCancel={() => setIsCreating(false)}
          />
          <NPSSurveyPreview />
        </div>
      ) : (
        <CampaignList campaigns={MOCK_CAMPAIGNS} />
      )}
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────────
function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Sentiment Chart - full width */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Over Time</h3>
        <SentimentChart data={MOCK_SENTIMENT_DATA} />
      </div>

      {/* Topic Cloud + Review-to-Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Topic Analysis</h3>
          <TopicCloud topics={MOCK_TOPICS} />
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Review-to-Revenue Correlation</h3>
          <ReviewToRevenueChart data={MOCK_REVENUE_DATA} />
        </div>
      </div>

      {/* Competitor Benchmark + Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Competitor Benchmark</h3>
          <CompetitorBenchmark
            orgRating={MOCK_DASHBOARD_DATA.overallRating}
            orgReviewCount={MOCK_DASHBOARD_DATA.totalReviews}
            competitors={MOCK_COMPETITORS}
          />
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <RatingDistribution distribution={MOCK_DASHBOARD_DATA.ratingDistribution} />
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ───────────────────────────────────────────────
function SettingsTab() {
  return (
    <div className="space-y-8">
      {/* Platform Connections */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Connections</h2>
        <PlatformConnectionCards connections={MOCK_CONNECTIONS} />
      </section>

      {/* Brand Voice */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Voice</h2>
        <BrandVoiceSettings
          brandVoice={MOCK_BRAND_VOICE}
          onSave={(data) => console.log("Brand voice saved:", data)}
        />
      </section>

      {/* Review Widget */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Widget</h2>
        <WidgetConfigurator
          widget={MOCK_WIDGET}
          onSave={(config) => console.log("Widget config saved:", config)}
        />
      </section>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────
export function ReputationDashboard({ organizationName }: ReputationDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Reputation Manager</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {MOCK_DASHBOARD_DATA.totalReviews} reviews
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage reviews for {organizationName}
          </p>
        </div>
        <button
          onClick={() => {
            /* no-op with mock data */
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="reputation-tab-bg"
                  className="absolute inset-0 bg-white border border-gray-200 rounded-lg shadow-sm"
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
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "reviews" && <ReviewInbox organizationName={organizationName} />}
          {activeTab === "campaigns" && <CampaignsTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
