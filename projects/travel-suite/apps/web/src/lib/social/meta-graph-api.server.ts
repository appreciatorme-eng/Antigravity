import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSocialToken } from "@/lib/security/social-token-crypto";
import { logError } from "@/lib/observability/logger";

const META_GRAPH_API_VERSION = "v20.0";
const META_GRAPH_API_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export type MetaPlatform = "facebook" | "instagram";

export type MetaConnectionWithToken = {
  id: string;
  platform: string;
  platform_page_id: string;
  access_token: string;
  token_expires_at: string | null;
};

export type MetaGraphApiError = {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

export type MetaGraphApiResponse<T> = {
  data?: T;
  error?: MetaGraphApiError;
};

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly type: string,
    public readonly subcode?: number,
    public readonly traceId?: string
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

export async function getMetaConnectionWithToken(
  organizationId: string,
  platform: MetaPlatform,
  platformPageId?: string
): Promise<MetaConnectionWithToken> {
  const supabaseAdmin = createAdminClient();

  let query = supabaseAdmin
    .from("social_connections")
    .select("id, platform, platform_page_id, access_token_encrypted, token_expires_at")
    .eq("organization_id", organizationId)
    .eq("platform", platform);

  if (platformPageId) {
    query = query.eq("platform_page_id", platformPageId);
  }

  const { data: connection, error } = await query.single();

  if (error || !connection) {
    throw new Error(`No ${platform} connection found for organization`);
  }

  if (!connection.access_token_encrypted) {
    throw new Error(`No access token found for ${platform} connection`);
  }

  const accessToken = decryptSocialToken(connection.access_token_encrypted);

  if (connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at);
    if (expiresAt < new Date()) {
      throw new Error(`${platform} access token has expired`);
    }
  }

  return {
    id: connection.id,
    platform: connection.platform,
    platform_page_id: connection.platform_page_id,
    access_token: accessToken,
    token_expires_at: connection.token_expires_at,
  };
}

export async function callMetaGraphApi<T = unknown>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    accessToken: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
  }
): Promise<T> {
  const { method = "GET", accessToken, body, params } = options;

  const url = new URL(`${META_GRAPH_API_BASE_URL}/${endpoint.replace(/^\//, "")}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  };

  if (body && (method === "POST" || method === "DELETE")) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const data = (await response.json()) as MetaGraphApiResponse<T>;

    if (data.error) {
      throw new MetaApiError(
        data.error.message,
        data.error.code,
        data.error.type,
        data.error.error_subcode,
        data.error.fbtrace_id
      );
    }

    if (!response.ok) {
      throw new MetaApiError(
        `Meta Graph API request failed with status ${response.status}`,
        response.status,
        "HTTP_ERROR"
      );
    }

    return data as T;
  } catch (err) {
    if (err instanceof MetaApiError) {
      throw err;
    }

    logError("Meta Graph API request failed", err);
    throw new Error("Failed to communicate with Meta Graph API");
  }
}

export async function getInstagramBusinessAccount(
  facebookPageId: string,
  accessToken: string
): Promise<{ id: string } | null> {
  try {
    const result = await callMetaGraphApi<{
      instagram_business_account?: { id: string };
    }>(`${facebookPageId}`, {
      accessToken,
      params: {
        fields: "instagram_business_account",
      },
    });

    return result.instagram_business_account || null;
  } catch (err) {
    logError("Failed to fetch Instagram business account", err);
    return null;
  }
}

export async function getPageInfo(
  pageId: string,
  accessToken: string
): Promise<{ id: string; name?: string; category?: string } | null> {
  try {
    const result = await callMetaGraphApi<{
      id: string;
      name?: string;
      category?: string;
    }>(`${pageId}`, {
      accessToken,
      params: {
        fields: "id,name,category",
      },
    });

    return result;
  } catch (err) {
    logError("Failed to fetch page info", err);
    return null;
  }
}

export function isTokenExpiredError(error: unknown): boolean {
  if (error instanceof MetaApiError) {
    return (
      error.code === 190 ||
      error.type === "OAuthException" ||
      error.subcode === 463 ||
      error.subcode === 467
    );
  }
  return false;
}

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof MetaApiError) {
    return error.code === 4 || error.code === 17 || error.code === 32;
  }
  return false;
}

export function isPermissionError(error: unknown): boolean {
  if (error instanceof MetaApiError) {
    return (
      error.code === 200 ||
      error.code === 10 ||
      (error.type === "OAuthException" && error.code !== 190)
    );
  }
  return false;
}
