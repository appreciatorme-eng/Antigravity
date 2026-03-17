import { callMetaGraphApi, getMetaConnectionWithToken, MetaApiError } from "./meta-graph-api.server";
import { logError } from "@/lib/observability/logger";

export type InstagramInsights = {
  engagement: number;
  impressions: number;
  reach: number;
};

export type FacebookInsights = {
  likes: number;
  comments: number;
  shares: number;
};

export type InsightsFetchResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: "deleted" | "permission_denied" | "not_found" | "rate_limit" | "unknown";
  message: string;
};

export type BatchInsightsRequest = {
  postId: string;
  platform: "instagram" | "facebook";
};

export type BatchInsightsResult = {
  postId: string;
  platform: "instagram" | "facebook";
  result: InsightsFetchResult<InstagramInsights | FacebookInsights>;
};

export async function fetchInstagramInsights(
  igMediaId: string,
  organizationId: string
): Promise<InsightsFetchResult<InstagramInsights>> {
  try {
    const connection = await getMetaConnectionWithToken(organizationId, "instagram");

    const result = await callMetaGraphApi<{
      data?: Array<{
        name: string;
        values: Array<{ value: number }>;
      }>;
    }>(`${igMediaId}/insights`, {
      accessToken: connection.access_token,
      params: {
        metric: "engagement,impressions,reach",
      },
    });

    if (!result.data || !Array.isArray(result.data)) {
      return {
        success: false,
        error: "unknown",
        message: "Invalid response format from Instagram API",
      };
    }

    const insights: Partial<InstagramInsights> = {};

    for (const metric of result.data) {
      const value = metric.values?.[0]?.value ?? 0;
      if (metric.name === "engagement") {
        insights.engagement = value;
      } else if (metric.name === "impressions") {
        insights.impressions = value;
      } else if (metric.name === "reach") {
        insights.reach = value;
      }
    }

    return {
      success: true,
      data: {
        engagement: insights.engagement ?? 0,
        impressions: insights.impressions ?? 0,
        reach: insights.reach ?? 0,
      },
    };
  } catch (err) {
    return handleInsightsError(err);
  }
}

export async function fetchFacebookInsights(
  postId: string,
  organizationId: string
): Promise<InsightsFetchResult<FacebookInsights>> {
  try {
    const connection = await getMetaConnectionWithToken(organizationId, "facebook");

    const result = await callMetaGraphApi<{
      likes?: {
        summary?: {
          total_count: number;
        };
      };
      comments?: {
        summary?: {
          total_count: number;
        };
      };
      shares?: {
        count: number;
      };
    }>(`${postId}`, {
      accessToken: connection.access_token,
      params: {
        fields: "likes.summary(true),comments.summary(true),shares",
      },
    });

    return {
      success: true,
      data: {
        likes: result.likes?.summary?.total_count ?? 0,
        comments: result.comments?.summary?.total_count ?? 0,
        shares: result.shares?.count ?? 0,
      },
    };
  } catch (err) {
    return handleInsightsError(err);
  }
}

export async function fetchBatchInsights(
  requests: BatchInsightsRequest[],
  organizationId: string
): Promise<BatchInsightsResult[]> {
  const results: BatchInsightsResult[] = [];

  for (const request of requests) {
    let result: InsightsFetchResult<InstagramInsights | FacebookInsights>;

    if (request.platform === "instagram") {
      result = await fetchInstagramInsights(request.postId, organizationId);
    } else {
      result = await fetchFacebookInsights(request.postId, organizationId);
    }

    results.push({
      postId: request.postId,
      platform: request.platform,
      result,
    });
  }

  return results;
}

function handleInsightsError(err: unknown): InsightsFetchResult<never> {
  if (err instanceof MetaApiError) {
    if (err.code === 100 && err.subcode === 33) {
      return {
        success: false,
        error: "deleted",
        message: "Post has been deleted",
      };
    }

    if (err.code === 100 || err.code === 803) {
      return {
        success: false,
        error: "not_found",
        message: "Post not found",
      };
    }

    if (err.code === 200 || err.code === 10) {
      return {
        success: false,
        error: "permission_denied",
        message: "Insufficient permissions to access insights",
      };
    }

    if (err.code === 4 || err.code === 17 || err.code === 32) {
      return {
        success: false,
        error: "rate_limit",
        message: "Rate limit exceeded",
      };
    }

    logError("Meta API error while fetching insights", err);
    return {
      success: false,
      error: "unknown",
      message: err.message,
    };
  }

  logError("Unexpected error while fetching insights", err);
  return {
    success: false,
    error: "unknown",
    message: err instanceof Error ? err.message : "Unknown error occurred",
  };
}
