"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Plus,
  RefreshCw,
  Settings,
  Star,
} from "lucide-react";
import type {
  CreateCampaignInput,
  ReputationBrandVoice,
  ReputationDashboardData,
  ReputationReview,
  ReputationReviewCampaign,
  ReputationWidget,
  SentimentLabel,
  WidgetConfig,
} from "@/lib/reputation/types";
import { PLATFORM_LABELS } from "@/lib/reputation/constants";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { ReputationHealthScore } from "./ReputationHealthScore";
import { ReputationKPIRow } from "./ReputationKPIRow";
import { ReviewInbox } from "./ReviewInbox";
import CampaignList from "./CampaignList";
import CampaignBuilder from "./CampaignBuilder";
import { SentimentChart } from "./SentimentChart";
import { TopicCloud } from "./TopicCloud";
import { BrandVoiceSettings } from "./BrandVoiceSettings";
import PlatformConnectionCards from "./PlatformConnectionCards";
import WidgetConfigurator from "./WidgetConfigurator";
import NPSSurveyPreview from "./NPSSurveyPreview";
import { useReputationDashboardData } from "./useReputationDashboardData";
import { GuidedTour } from '@/components/tour/GuidedTour';

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

function HonestEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <GlassCard padding="xl" rounded="2xl" className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </GlassCard>
  );
}

function RatingDistributionBar({
  distribution,
  total,
}: {
  distribution: Record<number, number>;
  total: number;
}) {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((starCount) => {
        const count = distribution[starCount] ?? 0;
        const width = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={starCount} className="flex items-center gap-3">
            <span className="w-4 text-right text-sm text-gray-400">{starCount}</span>
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </div>
            <span className="w-10 text-right text-xs text-gray-400">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function OverviewTab({ dashboard }: { dashboard: ReputationDashboardData | null }) {
  if (!dashboard || dashboard.totalReviews === 0) {
    return (
      <HonestEmptyState
        title="No reviews yet"
        description="Connect a review platform or add a manual review to unlock your rating, response-rate, and sentiment trends."
      />
    );
  }

  const recentReviews = dashboard.recentReviews.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="flex items-center justify-center lg:col-span-1">
          <ReputationHealthScore score={dashboard.healthScore} />
        </div>
        <div className="lg:col-span-3">
          <ReputationKPIRow
            overallRating={dashboard.overallRating}
            totalReviews={dashboard.totalReviews}
            responseRate={dashboard.responseRate}
            npsScore={dashboard.npsScore}
          />
        </div>
      </div>

      {dashboard.attentionCount > 0 && (
        <GlassCard
          padding="md"
          rounded="xl"
          className="flex items-center gap-3 border-red-200/70 bg-red-50/80"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{dashboard.attentionCount}</span>{" "}
            {dashboard.attentionCount === 1 ? "review requires" : "reviews require"} your
            attention.
          </p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Platform Breakdown</h3>
          <div className="space-y-3">
            {dashboard.platformBreakdown.map((platform) => (
              <div
                key={platform.platform}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{platform.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      {platform.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {platform.count} {platform.count === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Rating Distribution</h3>
          <RatingDistributionBar
            distribution={dashboard.ratingDistribution}
            total={dashboard.totalReviews}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Sentiment</h3>
          <div className="space-y-3">
            {[
              { key: "positive", label: "Positive", color: "#22c55e" },
              { key: "neutral", label: "Neutral", color: "#eab308" },
              { key: "negative", label: "Negative", color: "#ef4444" },
            ].map((entry) => (
              <div key={entry.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {
                    dashboard.sentimentBreakdown[
                      entry.key as keyof typeof dashboard.sentimentBreakdown
                    ]
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Recent Reviews</h3>
          <div className="space-y-3">
            {recentReviews.map((review: ReputationReview) => (
              <div
                key={review.id}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={`${review.id}-${index}`}
                      className={`h-3 w-3 ${
                        index < review.rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {review.reviewer_name}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {PLATFORM_LABELS[review.platform] ?? review.platform}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="line-clamp-2 text-xs text-gray-500">{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignsTab({
  campaigns,
  onCreate,
  onChanged,
}: {
  campaigns: ReputationReviewCampaign[];
  onCreate: (input: CreateCampaignInput) => Promise<void>;
  onChanged: () => Promise<void>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Review Campaigns</h2>
        {!isCreating && (
          <GlassButton
            size="md"
            onClick={() => {
              setError(null);
              setIsCreating(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </GlassButton>
        )}
      </div>

      {error && (
        <GlassCard padding="md" rounded="xl" className="border-red-200/70 bg-red-50/80">
          <p className="text-sm text-red-700">{error}</p>
        </GlassCard>
      )}

      {isCreating ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CampaignBuilder
            onSave={async (input) => {
              try {
                await onCreate(input);
                setIsCreating(false);
              } catch (saveError) {
                setError(
                  saveError instanceof Error
                    ? saveError.message
                    : "Failed to create campaign"
                );
              }
            }}
            onCancel={() => setIsCreating(false)}
          />
          <NPSSurveyPreview />
        </div>
      ) : (
        <CampaignList campaigns={campaigns} onChanged={onChanged} />
      )}
    </div>
  );
}

function AnalyticsTab({
  dashboard,
  trends,
  topics,
}: {
  dashboard: ReputationDashboardData | null;
  trends: ReturnType<typeof useReputationDashboardData>["trends"];
  topics: ReturnType<typeof useReputationDashboardData>["topics"];
}) {
  const sentimentSeries = useMemo(
    () =>
      trends.map((trend) => ({
        date: trend.date,
        positive: trend.positive ?? 0,
        neutral: trend.neutral ?? 0,
        negative: trend.negative ?? 0,
      })),
    [trends]
  );

  const topicEntries = useMemo(
    () =>
      topics.map((topic) => ({
        topic: topic.topic,
        count: topic.count,
        sentiment:
          topic.avgSentiment > 0.2
            ? "positive"
            : topic.avgSentiment < -0.2
              ? "negative"
              : "neutral",
      })),
    [topics]
  ) as Array<{ topic: string; count: number; sentiment: SentimentLabel }>;

  if (!dashboard || dashboard.totalReviews === 0) {
    return (
      <HonestEmptyState
        title="Analytics unlock after your first reviews arrive"
        description="Once review data starts flowing in, this tab will show live sentiment, topic concentration, and response trends instead of placeholder charts."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Sentiment Over Time</h3>
        <SentimentChart data={sentimentSeries} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Topic Analysis</h3>
          <TopicCloud topics={topicEntries} />
        </div>
        <GlassCard padding="xl" rounded="xl" className="border-gray-200/80">
          <h3 className="text-sm font-semibold text-gray-900">
            Review-to-Revenue Correlation
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Revenue attribution is not wired into the reputation module yet, so this card
            stays honest until booking and review timelines are joined in the backend.
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard padding="xl" rounded="xl" className="border-gray-200/80">
          <h3 className="text-sm font-semibold text-gray-900">Competitor Benchmark</h3>
          <p className="mt-2 text-sm text-gray-500">
            Benchmarking activates after you connect Google Business or Tripadvisor in
            Settings. We avoid placeholder competitor data here because it undermines the
            scorecard.
          </p>
        </GlassCard>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Rating Distribution</h3>
          <RatingDistributionBar
            distribution={dashboard.ratingDistribution}
            total={dashboard.totalReviews}
          />
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  connections,
  brandVoice,
  widget,
  onSaveBrandVoice,
  onSaveWidget,
  onConnectionsChanged,
}: {
  connections: ReturnType<typeof useReputationDashboardData>["connections"];
  brandVoice: ReputationBrandVoice | null;
  widget: ReputationWidget | null;
  onSaveBrandVoice: (input: Partial<ReputationBrandVoice>) => Promise<void>;
  onSaveWidget: (input: WidgetConfig) => Promise<void>;
  onConnectionsChanged: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const connectionsKey = connections.map((connection) => connection.id).join(":") || "empty";
  const brandVoiceKey = brandVoice?.updated_at ?? "brand-voice-new";
  const widgetKey = widget?.updated_at ?? "widget-new";

  return (
    <div className="space-y-8">
      {error && (
        <GlassCard padding="md" rounded="xl" className="border-red-200/70 bg-red-50/80">
          <p className="text-sm text-red-700">{error}</p>
        </GlassCard>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Platform Connections</h2>
        <PlatformConnectionCards
          key={connectionsKey}
          connections={connections}
          onConnectionsChanged={onConnectionsChanged}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Brand Voice</h2>
        <BrandVoiceSettings
          key={brandVoiceKey}
          brandVoice={brandVoice ?? undefined}
          onSave={async (input) => {
            try {
              setError(null);
              await onSaveBrandVoice(input);
            } catch (saveError) {
              setError(
                saveError instanceof Error ? saveError.message : "Failed to save brand voice"
              );
            }
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Review Widget</h2>
        <WidgetConfigurator
          key={widgetKey}
          widget={widget ?? undefined}
          onSave={async (config) => {
            try {
              setError(null);
              await onSaveWidget(config);
            } catch (saveError) {
              setError(
                saveError instanceof Error ? saveError.message : "Failed to save widget"
              );
            }
          }}
        />
      </section>
    </div>
  );
}

export function ReputationDashboard({ organizationName }: ReputationDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const {
    dashboard,
    campaigns,
    trends,
    topics,
    connections,
    brandVoice,
    currentWidget,
    loading,
    refreshing,
    error,
    refresh,
    refreshCampaigns,
    createCampaign,
    saveBrandVoice,
    saveWidget,
  } = useReputationDashboardData();

  if (loading && !dashboard) {
    return (
      <GlassCard padding="xl" rounded="2xl" className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-gray-200/70" />
        <div className="h-4 w-72 animate-pulse rounded-full bg-gray-100/80" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-gray-100/80" />
          ))}
        </div>
      </GlassCard>
    );
  }

  if (error && !dashboard) {
    return (
      <GlassCard padding="xl" rounded="2xl" className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Reputation data is unavailable</h2>
        <p className="text-sm text-gray-500">{error}</p>
        <GlassButton onClick={() => refresh()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </GlassButton>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GuidedTour />
      <div data-tour="reputation-score" className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Reputation Manager</h1>
            <GlassBadge variant="info">
              {dashboard?.totalReviews ?? 0} reviews
            </GlassBadge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage reviews for {organizationName}
          </p>
        </div>
        <GlassButton
          variant="ghost"
          loading={refreshing}
          onClick={() => refresh()}
          aria-label="Refresh reputation data"
          data-tour="reputation-actions"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </GlassButton>
      </div>

      {error && (
        <GlassCard padding="md" rounded="xl" className="border-amber-200/70 bg-amber-50/80">
          <p className="text-sm text-amber-700">{error}</p>
        </GlassCard>
      )}

      <div data-tour="reputation-reviews" className="flex items-center gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="reputation-tab"
                  className="absolute inset-0 rounded-lg border border-gray-200 bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && <OverviewTab dashboard={dashboard} />}
          {activeTab === "reviews" && <ReviewInbox organizationName={organizationName} />}
          {activeTab === "campaigns" && (
            <CampaignsTab
              campaigns={campaigns}
              onChanged={refreshCampaigns}
              onCreate={async (input) => {
                await createCampaign(input);
              }}
            />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab dashboard={dashboard} trends={trends} topics={topics} />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              connections={connections}
              brandVoice={brandVoice}
              widget={currentWidget}
              onConnectionsChanged={refresh}
              onSaveBrandVoice={async (input) => {
                await saveBrandVoice(input);
              }}
              onSaveWidget={async (config) => {
                await saveWidget(config);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
