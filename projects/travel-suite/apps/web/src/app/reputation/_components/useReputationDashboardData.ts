"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateCampaignInput,
  ReputationBrandVoice,
  ReputationDashboardData,
  ReputationPlatformConnection,
  ReputationReviewCampaign,
  ReputationWidget,
  TrendDataPoint,
  WidgetConfig,
} from "@/lib/reputation/types";

export interface TopicAnalyticsPoint {
  topic: string;
  count: number;
  avgSentiment: number;
}

interface TrendsResponse {
  trends?: TrendDataPoint[];
}

interface TopicsResponse {
  topics?: TopicAnalyticsPoint[];
}

interface CampaignsResponse {
  campaigns?: ReputationReviewCampaign[];
}

interface ConnectionsResponse {
  connections?: ReputationPlatformConnection[];
}

interface BrandVoiceResponse {
  brandVoice?: ReputationBrandVoice;
}

interface WidgetsResponse {
  widgets?: ReputationWidget[];
}

interface WidgetResponse {
  widget: ReputationWidget;
}

interface CampaignResponse {
  campaign: ReputationReviewCampaign;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  // Unwrap { data, error } envelope used by apiSuccess/apiError helpers
  if ("data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  return payload as T;
}

export function useReputationDashboardData() {
  const [dashboard, setDashboard] = useState<ReputationDashboardData | null>(null);
  const [campaigns, setCampaigns] = useState<ReputationReviewCampaign[]>([]);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [topics, setTopics] = useState<TopicAnalyticsPoint[]>([]);
  const [connections, setConnections] = useState<ReputationPlatformConnection[]>([]);
  const [brandVoice, setBrandVoice] = useState<ReputationBrandVoice | null>(null);
  const [widgets, setWidgets] = useState<ReputationWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const [
          dashboardData,
          trendsData,
          topicsData,
          campaignsData,
          connectionsData,
          brandVoiceData,
          widgetsData,
        ] = await Promise.all([
          fetchJson<ReputationDashboardData>("/api/reputation/dashboard"),
          fetchJson<TrendsResponse>("/api/reputation/analytics/trends?period=30d"),
          fetchJson<TopicsResponse>("/api/reputation/analytics/topics?period=30d"),
          fetchJson<CampaignsResponse>("/api/reputation/campaigns"),
          fetchJson<ConnectionsResponse>("/api/reputation/connections"),
          fetchJson<BrandVoiceResponse>("/api/reputation/brand-voice"),
          fetchJson<WidgetsResponse>("/api/reputation/widget/config"),
        ]);

        setDashboard(dashboardData);
        setTrends(trendsData.trends ?? []);
        setTopics(topicsData.topics ?? []);
        setCampaigns(campaignsData.campaigns ?? []);
        setConnections(connectionsData.connections ?? []);
        setBrandVoice(brandVoiceData.brandVoice ?? null);
        setWidgets(widgetsData.widgets ?? []);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load dashboard";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadAll(false);
  }, [loadAll]);

  const refresh = useCallback(async () => {
    await loadAll(true);
  }, [loadAll]);

  const refreshCampaigns = useCallback(async () => {
    const data = await fetchJson<CampaignsResponse>("/api/reputation/campaigns");
    setCampaigns(data.campaigns ?? []);
  }, []);

  const createCampaign = useCallback(async (input: CreateCampaignInput) => {
    const data = await fetchJson<CampaignResponse>("/api/reputation/campaigns", {
      method: "POST",
      body: JSON.stringify(input),
    });

    setCampaigns((current) => [data.campaign, ...current]);
    return data.campaign;
  }, []);

  const saveBrandVoice = useCallback(
    async (input: Partial<ReputationBrandVoice>) => {
      const data = await fetchJson<BrandVoiceResponse>("/api/reputation/brand-voice", {
        method: "PUT",
        body: JSON.stringify(input),
      });

      setBrandVoice(data.brandVoice ?? null);
      return data.brandVoice ?? null;
    },
    []
  );

  const currentWidget = useMemo(() => widgets[0] ?? null, [widgets]);

  const saveWidget = useCallback(
    async (input: WidgetConfig) => {
      const method = currentWidget ? "PUT" : "POST";
      const body = currentWidget ? { ...input, id: currentWidget.id } : input;
      const data = await fetchJson<WidgetResponse>("/api/reputation/widget/config", {
        method,
        body: JSON.stringify(body),
      });

      setWidgets((current) => {
        if (!data.widget) return current;
        const remaining = current.filter((widget) => widget.id !== data.widget.id);
        return [data.widget, ...remaining];
      });

      return data.widget;
    },
    [currentWidget]
  );

  return {
    dashboard,
    campaigns,
    trends,
    topics,
    connections,
    brandVoice,
    widgets,
    currentWidget,
    loading,
    refreshing,
    error,
    refresh,
    refreshCampaigns,
    createCampaign,
    saveBrandVoice,
    saveWidget,
  };
}
