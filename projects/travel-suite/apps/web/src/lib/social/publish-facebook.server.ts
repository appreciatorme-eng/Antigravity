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

export type FacebookPublishResult = {
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  error?: string;
  errorType?: "token_expired" | "rate_limit" | "permission" | "validation" | "unknown";
};

type FacebookPhotoResponse = {
  id: string;
  post_id: string;
};

type FacebookFeedResponse = {
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

function validateLinkUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeMessage(message: string | null | undefined): string {
  if (!message) return "";

  // Facebook message max length is 63,206 characters, but keep it reasonable
  const sanitized = message.trim().slice(0, 5000);

  // Remove any null bytes or control characters that might cause API issues
  return sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
}

async function publishTextPost(
  pageId: string,
  message: string,
  accessToken: string
): Promise<FacebookPublishResult> {
  try {
    if (!message.trim()) {
      return {
        success: false,
        error: "Message cannot be empty for text posts",
        errorType: "validation",
      };
    }

    const response = await callMetaGraphApi<FacebookFeedResponse>(
      `${pageId}/feed`,
      {
        method: "POST",
        accessToken,
        body: {
          message,
        },
      }
    );

    const platformPostUrl = `https://www.facebook.com/${response.id}`;

    return {
      success: true,
      platformPostId: response.id,
      platformPostUrl,
    };
  } catch (err) {
    return handleFacebookError(err);
  }
}

async function publishSingleImage(
  pageId: string,
  imageUrl: string,
  message: string,
  accessToken: string
): Promise<FacebookPublishResult> {
  try {
    if (!validateImageUrl(imageUrl)) {
      return {
        success: false,
        error: "Invalid image URL",
        errorType: "validation",
      };
    }

    const response = await callMetaGraphApi<FacebookPhotoResponse>(
      `${pageId}/photos`,
      {
        method: "POST",
        accessToken,
        body: {
          url: imageUrl,
          caption: message,
        },
      }
    );

    // Facebook returns both id (photo ID) and post_id (post ID)
    // We want the post_id for the actual post URL
    const postId = response.post_id || response.id;
    const platformPostUrl = `https://www.facebook.com/${postId}`;

    return {
      success: true,
      platformPostId: postId,
      platformPostUrl,
    };
  } catch (err) {
    return handleFacebookError(err);
  }
}

async function publishMultipleImages(
  pageId: string,
  imageUrls: string[],
  message: string,
  accessToken: string
): Promise<FacebookPublishResult> {
  try {
    if (imageUrls.length < 2) {
      return {
        success: false,
        error: "Multiple image post requires at least 2 images",
        errorType: "validation",
      };
    }

    // Facebook supports up to 10 photos in a single post
    if (imageUrls.length > 10) {
      return {
        success: false,
        error: "Facebook supports maximum 10 images per post",
        errorType: "validation",
      };
    }

    // Validate all image URLs
    for (const imageUrl of imageUrls) {
      if (!validateImageUrl(imageUrl)) {
        return {
          success: false,
          error: `Invalid image URL: ${imageUrl}`,
          errorType: "validation",
        };
      }
    }

    // Step 1: Upload each photo and get their IDs (unpublished)
    const photoIds: string[] = [];
    for (const imageUrl of imageUrls) {
      const photoResponse = await callMetaGraphApi<FacebookPhotoResponse>(
        `${pageId}/photos`,
        {
          method: "POST",
          accessToken,
          body: {
            url: imageUrl,
            published: false,
          },
        }
      );
      photoIds.push(photoResponse.id);
    }

    // Step 2: Create a feed post with the attached photos
    const attachedMedia = photoIds.map((photoId) => ({
      media_fbid: photoId,
    }));

    const response = await callMetaGraphApi<FacebookFeedResponse>(
      `${pageId}/feed`,
      {
        method: "POST",
        accessToken,
        body: {
          message,
          attached_media: attachedMedia,
        },
      }
    );

    const platformPostUrl = `https://www.facebook.com/${response.id}`;

    return {
      success: true,
      platformPostId: response.id,
      platformPostUrl,
    };
  } catch (err) {
    return handleFacebookError(err);
  }
}

async function publishLinkPost(
  pageId: string,
  linkUrl: string,
  message: string,
  accessToken: string
): Promise<FacebookPublishResult> {
  try {
    if (!validateLinkUrl(linkUrl)) {
      return {
        success: false,
        error: "Invalid link URL",
        errorType: "validation",
      };
    }

    const response = await callMetaGraphApi<FacebookFeedResponse>(
      `${pageId}/feed`,
      {
        method: "POST",
        accessToken,
        body: {
          message,
          link: linkUrl,
        },
      }
    );

    const platformPostUrl = `https://www.facebook.com/${response.id}`;

    return {
      success: true,
      platformPostId: response.id,
      platformPostUrl,
    };
  } catch (err) {
    return handleFacebookError(err);
  }
}

function handleFacebookError(err: unknown): FacebookPublishResult {
  if (err instanceof MetaApiError) {
    logError("Facebook API error", err);

    if (isTokenExpiredError(err)) {
      return {
        success: false,
        error: "Facebook access token has expired. Please reconnect your account.",
        errorType: "token_expired",
      };
    }

    if (isRateLimitError(err)) {
      return {
        success: false,
        error: "Facebook rate limit reached. Please try again later.",
        errorType: "rate_limit",
      };
    }

    if (isPermissionError(err)) {
      return {
        success: false,
        error: "Insufficient permissions to publish to Facebook. Please reconnect your account.",
        errorType: "permission",
      };
    }

    return {
      success: false,
      error: err.message || "Failed to publish to Facebook",
      errorType: "unknown",
    };
  }

  logError("Unexpected error during Facebook publish", err);
  return {
    success: false,
    error: "An unexpected error occurred while publishing to Facebook",
    errorType: "unknown",
  };
}

export async function publishToFacebook(
  organizationId: string,
  content: {
    message?: string;
    imageUrls?: string[];
    linkUrl?: string;
  },
  platformPageId?: string
): Promise<FacebookPublishResult> {
  try {
    const connection = await getMetaConnectionWithToken(
      organizationId,
      "facebook",
      platformPageId
    );

    const message = sanitizeMessage(content.message);
    const imageUrls = content.imageUrls || [];
    const linkUrl = content.linkUrl;

    // Determine post type and publish accordingly
    if (imageUrls.length > 1) {
      // Multiple images
      return await publishMultipleImages(
        connection.platform_page_id,
        imageUrls,
        message,
        connection.access_token
      );
    } else if (imageUrls.length === 1) {
      // Single image
      return await publishSingleImage(
        connection.platform_page_id,
        imageUrls[0],
        message,
        connection.access_token
      );
    } else if (linkUrl) {
      // Link post
      return await publishLinkPost(
        connection.platform_page_id,
        linkUrl,
        message,
        connection.access_token
      );
    } else if (message) {
      // Text-only post
      return await publishTextPost(
        connection.platform_page_id,
        message,
        connection.access_token
      );
    } else {
      return {
        success: false,
        error: "Post must contain at least a message, image, or link",
        errorType: "validation",
      };
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("access token has expired")) {
      return {
        success: false,
        error: err.message,
        errorType: "token_expired",
      };
    }

    logError("Failed to publish to Facebook", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to publish to Facebook",
      errorType: "unknown",
    };
  }
}
