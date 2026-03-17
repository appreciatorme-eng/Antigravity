import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";
import {
  getMetaConnectionWithToken,
  callMetaGraphApi,
  MetaApiError,
  isTokenExpiredError,
  isRateLimitError,
  isPermissionError,
} from "./meta-graph-api.server";

export type InstagramPublishResult = {
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  error?: string;
  errorType?: "token_expired" | "rate_limit" | "permission" | "validation" | "unknown";
};

type InstagramMediaResponse = {
  id: string;
};

type InstagramPublishResponse = {
  id: string;
};

function validateImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeCaption(caption: string | null | undefined): string {
  if (!caption) return "";

  // Instagram caption max length is 2200 characters
  const sanitized = caption.trim().slice(0, 2200);

  // Remove any null bytes or control characters that might cause API issues
  return sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
}

async function createCarouselItemContainer(
  igUserId: string,
  imageUrl: string,
  accessToken: string
): Promise<string> {
  const response = await callMetaGraphApi<InstagramMediaResponse>(
    `${igUserId}/media`,
    {
      method: "POST",
      accessToken,
      body: {
        image_url: imageUrl,
        is_carousel_item: true,
      },
    }
  );

  return response.id;
}

async function publishSingleImage(
  igUserId: string,
  imageUrl: string,
  caption: string,
  accessToken: string
): Promise<InstagramPublishResult> {
  try {
    // Step 1: Create media container
    const mediaResponse = await callMetaGraphApi<InstagramMediaResponse>(
      `${igUserId}/media`,
      {
        method: "POST",
        accessToken,
        body: {
          image_url: imageUrl,
          caption,
        },
      }
    );

    // Step 2: Publish the container
    const publishResponse = await callMetaGraphApi<InstagramPublishResponse>(
      `${igUserId}/media_publish`,
      {
        method: "POST",
        accessToken,
        body: {
          creation_id: mediaResponse.id,
        },
      }
    );

    const platformPostUrl = `https://www.instagram.com/p/${publishResponse.id}`;

    return {
      success: true,
      platformPostId: publishResponse.id,
      platformPostUrl,
    };
  } catch (err) {
    return handleInstagramError(err);
  }
}

async function publishCarousel(
  igUserId: string,
  imageUrls: string[],
  caption: string,
  accessToken: string
): Promise<InstagramPublishResult> {
  try {
    // Instagram carousel requires 2-10 items
    if (imageUrls.length < 2) {
      return {
        success: false,
        error: "Carousel requires at least 2 images",
        errorType: "validation",
      };
    }

    if (imageUrls.length > 10) {
      return {
        success: false,
        error: "Carousel supports maximum 10 images",
        errorType: "validation",
      };
    }

    // Step 1: Create container for each image
    const containerIds: string[] = [];
    for (const imageUrl of imageUrls) {
      const containerId = await createCarouselItemContainer(
        igUserId,
        imageUrl,
        accessToken
      );
      containerIds.push(containerId);
    }

    // Step 2: Create carousel container
    const carouselResponse = await callMetaGraphApi<InstagramMediaResponse>(
      `${igUserId}/media`,
      {
        method: "POST",
        accessToken,
        body: {
          media_type: "CAROUSEL",
          caption,
          children: containerIds,
        },
      }
    );

    // Step 3: Publish the carousel
    const publishResponse = await callMetaGraphApi<InstagramPublishResponse>(
      `${igUserId}/media_publish`,
      {
        method: "POST",
        accessToken,
        body: {
          creation_id: carouselResponse.id,
        },
      }
    );

    const platformPostUrl = `https://www.instagram.com/p/${publishResponse.id}`;

    return {
      success: true,
      platformPostId: publishResponse.id,
      platformPostUrl,
    };
  } catch (err) {
    return handleInstagramError(err);
  }
}

function handleInstagramError(err: unknown): InstagramPublishResult {
  if (err instanceof MetaApiError) {
    logError("Instagram API error", err);

    if (isTokenExpiredError(err)) {
      return {
        success: false,
        error: "Instagram access token has expired. Please reconnect your account.",
        errorType: "token_expired",
      };
    }

    if (isRateLimitError(err)) {
      return {
        success: false,
        error: "Instagram rate limit reached. Please try again later.",
        errorType: "rate_limit",
      };
    }

    if (isPermissionError(err)) {
      return {
        success: false,
        error: "Missing Instagram permissions. Please reconnect your account with required permissions.",
        errorType: "permission",
      };
    }

    // Platform-specific error codes
    if (err.code === 9007) {
      return {
        success: false,
        error: "Media upload failed. Please check image format and size.",
        errorType: "validation",
      };
    }

    if (err.code === 100 && err.subcode === 2207051) {
      return {
        success: false,
        error: "Image download failed. Please ensure the image URL is publicly accessible.",
        errorType: "validation",
      };
    }

    return {
      success: false,
      error: `Instagram API error: ${err.message}`,
      errorType: "unknown",
    };
  }

  logError("Unknown Instagram publishing error", err);
  return {
    success: false,
    error: "Failed to publish to Instagram",
    errorType: "unknown",
  };
}

export async function publishToInstagram(
  queueItemId: string
): Promise<InstagramPublishResult> {
  try {
    const supabaseAdmin = createAdminClient();

    // Fetch queue item with post data and connection
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("social_post_queue")
      .select(
        `
        id,
        post_id,
        connection_id,
        social_posts!inner(
          id,
          organization_id,
          caption_instagram,
          rendered_image_url,
          rendered_image_urls
        ),
        social_connections!inner(
          id,
          platform,
          platform_page_id,
          organization_id
        )
      `
      )
      .eq("id", queueItemId)
      .eq("platform", "instagram")
      .single();

    if (queueError || !queueItem) {
      return {
        success: false,
        error: "Queue item not found",
        errorType: "validation",
      };
    }

    const post = Array.isArray(queueItem.social_posts)
      ? queueItem.social_posts[0]
      : queueItem.social_posts;

    const connection = Array.isArray(queueItem.social_connections)
      ? queueItem.social_connections[0]
      : queueItem.social_connections;

    if (!post || !connection) {
      return {
        success: false,
        error: "Post or connection data missing",
        errorType: "validation",
      };
    }

    // Get connection with decrypted token
    const metaConnection = await getMetaConnectionWithToken(
      connection.organization_id,
      "instagram",
      connection.platform_page_id
    );

    // Determine if single image or carousel
    const isCarousel = Array.isArray(post.rendered_image_urls) && post.rendered_image_urls.length > 1;
    const imageUrl = post.rendered_image_url;
    const imageUrls = post.rendered_image_urls;

    // Validate image URLs
    if (isCarousel) {
      if (!imageUrls || imageUrls.length === 0) {
        return {
          success: false,
          error: "No images provided for carousel",
          errorType: "validation",
        };
      }

      for (const url of imageUrls) {
        if (!validateImageUrl(url)) {
          return {
            success: false,
            error: `Invalid image URL: ${url}`,
            errorType: "validation",
          };
        }
      }
    } else {
      if (!imageUrl) {
        return {
          success: false,
          error: "No image URL provided",
          errorType: "validation",
        };
      }

      if (!validateImageUrl(imageUrl)) {
        return {
          success: false,
          error: `Invalid image URL: ${imageUrl}`,
          errorType: "validation",
        };
      }
    }

    const caption = sanitizeCaption(post.caption_instagram);

    // Instagram Business Account ID is stored in platform_page_id
    const igUserId = metaConnection.platform_page_id;

    // Publish based on type
    if (isCarousel) {
      return await publishCarousel(
        igUserId,
        imageUrls,
        caption,
        metaConnection.access_token
      );
    } else {
      return await publishSingleImage(
        igUserId,
        imageUrl,
        caption,
        metaConnection.access_token
      );
    }
  } catch (err) {
    logError("Failed to publish to Instagram", err);

    if (err instanceof Error && err.message.includes("token has expired")) {
      return {
        success: false,
        error: "Instagram access token has expired. Please reconnect your account.",
        errorType: "token_expired",
      };
    }

    if (err instanceof Error && err.message.includes("No instagram connection found")) {
      return {
        success: false,
        error: "Instagram account not connected. Please connect your Instagram Business account.",
        errorType: "validation",
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to publish to Instagram",
      errorType: "unknown",
    };
  }
}
