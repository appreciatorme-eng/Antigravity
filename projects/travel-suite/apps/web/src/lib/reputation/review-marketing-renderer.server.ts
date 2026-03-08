import { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { ReputationReview } from "@/lib/reputation/types";
import { renderPoster } from "@/lib/social/poster-renderer";
import type { TemplateDataForRender } from "@/lib/social/types";

type AppSupabaseClient = SupabaseClient<Database>;

export function chooseReviewTemplate(review: ReputationReview) {
  const commentLength = review.comment?.trim().length ?? 0;
  if (review.rating >= 5 && commentLength >= 180) return "review_elegant_1";
  if (review.platform === "google" || review.platform === "tripadvisor") {
    return "review_stars_minimal";
  }
  return "review_dark_quote";
}

export function buildQuoteExcerpt(comment: string) {
  const normalized = comment.replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) return normalized;
  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function buildReviewerTrip(review: ReputationReview) {
  return [review.destination, review.trip_type].filter(Boolean).join(" • ") || "Memorable Trip";
}

export function buildReviewMarketingTemplateData(options: {
  organizationName: string;
  organizationLogoUrl: string | null;
  operatorPhone: string | null;
  review: ReputationReview;
}): TemplateDataForRender {
  const { organizationName, organizationLogoUrl, operatorPhone, review } = options;

  return {
    companyName: organizationName,
    destination: review.destination || "Traveler Story",
    price: "",
    offer: "",
    season: review.platform === "internal" ? "Verified Traveler Review" : `${review.platform} review`,
    contactNumber: operatorPhone || "",
    email: "",
    website: "",
    logoUrl: organizationLogoUrl || undefined,
    reviewText: buildQuoteExcerpt(review.comment || review.title || "Our travelers loved the experience."),
    reviewerName: review.reviewer_name || "Happy Traveler",
    reviewerTrip: buildReviewerTrip(review),
  };
}

async function uploadRenderedAsset(options: {
  supabase: AppSupabaseClient;
  organizationId: string;
  socialPostId: string;
  templateId: string;
  buffer: Buffer;
  contentType: string;
}) {
  const { supabase, organizationId, socialPostId, templateId, buffer, contentType } = options;
  const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
  const storagePath = `${organizationId}/review-assets/${socialPostId}-${templateId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("social-media")
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw new Error("Failed to upload rendered review asset");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("social-media").getPublicUrl(storagePath);

  return publicUrl;
}

export async function renderAndUploadReviewMarketingAsset(options: {
  supabase: AppSupabaseClient;
  organizationId: string;
  socialPostId: string;
  templateId: string;
  templateData: TemplateDataForRender;
}) {
  const { supabase, organizationId, socialPostId, templateId, templateData } = options;
  const rendered = await renderPoster({
    templateData,
    layoutType: "ReviewLayout",
    aspectRatio: "square",
    format: "png",
  });

  return uploadRenderedAsset({
    supabase,
    organizationId,
    socialPostId,
    templateId,
    buffer: rendered.buffer,
    contentType: rendered.contentType,
  });
}
