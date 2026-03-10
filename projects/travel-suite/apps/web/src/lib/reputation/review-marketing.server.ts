import { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { ReputationReview } from "@/lib/reputation/types";
import {
  getConnectionsForPlatforms,
  replaceReviewQueueItems,
} from "@/lib/social/review-queue.server";
import {
  buildQuoteExcerpt,
  buildReviewMarketingTemplateData,
  chooseReviewTemplate,
  renderAndUploadReviewMarketingAsset,
} from "@/lib/reputation/review-marketing-renderer.server";
import type { TemplateDataForRender } from "@/lib/social/types";

type AppSupabaseClient = SupabaseClient<Database>;
type SocialPostInsert = Database["public"]["Tables"]["social_posts"]["Insert"];
type SocialPostRow = Database["public"]["Tables"]["social_posts"]["Row"];

const REVIEW_TEMPLATE_IDS = new Set([
  "review_stars_minimal",
  "review_dark_quote",
  "review_elegant_1",
]);
const REVIEW_MARKETING_SOURCE = "auto_review";
const MIN_ELIGIBLE_RATING = 4;

type ReviewMarketingAssetRow = {
  id: string;
  review_id: string;
  social_post_id: string;
  organization_id: string;
  lifecycle_state: string;
  template_id: string;
  image_url: string | null;
  platform_targets: string[] | null;
  quote_excerpt: string | null;
  last_queued_at: string | null;
};

async function getReviewForOrganization(
  supabase: AppSupabaseClient,
  reviewId: string,
  organizationId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation_reviews is present in live schema but not in generated typings
  const { data: review, error } = await (supabase as any)
    .from("reputation_reviews")
    .select("id, organization_id, rating, comment, title, reviewer_name, platform, destination, trip_type")
    .eq("id", reviewId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !review) {
    throw new Error("Review not found");
  }

  return review as ReputationReview;
}

async function getOrganizationBranding(supabase: AppSupabaseClient, userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, phone, phone_whatsapp")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.organization_id) {
    throw new Error("No organization found");
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, logo_url")
    .eq("id", profile.organization_id)
    .single();

  if (organizationError || !organization) {
    throw new Error("Organization not found");
  }

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    organizationLogoUrl: organization.logo_url,
    operatorPhone: profile.phone_whatsapp || profile.phone || null,
  };
}

async function upsertSocialPost(options: {
  supabase: AppSupabaseClient;
  existingPostId?: string | null;
  organizationId: string;
  userId: string;
  templateId: string;
  templateData: TemplateDataForRender;
}) {
  const { supabase, existingPostId, organizationId, userId, templateId, templateData } = options;

  const payload: SocialPostInsert = {
    organization_id: organizationId,
    created_by: userId,
    template_id: templateId,
    template_data: templateData as SocialPostInsert["template_data"],
    source: REVIEW_MARKETING_SOURCE,
    status: "draft",
    caption_instagram: `What our traveler said about ${templateData.reviewerTrip || templateData.destination}.`,
    caption_facebook: `Traveler story: ${templateData.reviewText || ""}`,
  };

  if (existingPostId) {
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        template_id: payload.template_id,
        template_data: payload.template_data as SocialPostInsert["template_data"],
        source: payload.source,
        status: "draft",
        caption_instagram: payload.caption_instagram,
        caption_facebook: payload.caption_facebook,
      })
      .eq("id", existingPostId)
      .eq("organization_id", organizationId)
      .select("id, organization_id, created_by, template_id, template_data, source, status, caption_instagram, caption_facebook, rendered_image_url, rendered_image_urls, hashtags, created_at, updated_at")
      .single();

    if (error || !data) {
      throw new Error("Failed to update review social post");
    }

    return data as SocialPostRow;
  }

  const { data, error } = await supabase
    .from("social_posts")
      .insert({
        ...payload,
        template_data: payload.template_data as SocialPostInsert["template_data"],
      })
    .select("id, organization_id, created_by, template_id, template_data, source, status, caption_instagram, caption_facebook, rendered_image_url, rendered_image_urls, hashtags, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error("Failed to create review social post");
  }

  return data as SocialPostRow;
}

async function getExistingAsset(
  supabase: AppSupabaseClient,
  reviewId: string,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("review_marketing_assets")
    .select("id, review_id, social_post_id, organization_id, lifecycle_state, template_id, image_url, platform_targets, quote_excerpt, last_queued_at")
    .eq("review_id", reviewId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to load existing review marketing asset");
  }

  return data as ReviewMarketingAssetRow | null;
}

async function persistAsset(options: {
  supabase: AppSupabaseClient;
  existingAssetId?: string | null;
  organizationId: string;
  reviewId: string;
  socialPostId: string;
  userId: string;
  templateId: string;
  quoteExcerpt: string;
  imageUrl: string;
  lifecycleState: string;
  platformTargets?: string[];
  lastQueuedAt?: string | null;
}) {
  const {
    supabase,
    existingAssetId,
    organizationId,
    reviewId,
    socialPostId,
    userId,
    templateId,
    quoteExcerpt,
    imageUrl,
    lifecycleState,
    platformTargets = [],
    lastQueuedAt = null,
  } = options;

  const row = {
    organization_id: organizationId,
    review_id: reviewId,
    social_post_id: socialPostId,
    created_by: userId,
    template_id: templateId,
    quote_excerpt: quoteExcerpt,
    image_url: imageUrl,
    lifecycle_state: lifecycleState,
    platform_targets: platformTargets,
    last_queued_at: lastQueuedAt,
  };

  if (existingAssetId) {
    const { data, error } = await supabase
      .from("review_marketing_assets")
      .update(row)
      .eq("id", existingAssetId)
      .select("id, review_id, social_post_id, organization_id, lifecycle_state, template_id, image_url, platform_targets, quote_excerpt, last_queued_at")
      .single();

    if (error || !data) {
      throw new Error("Failed to update review marketing asset");
    }

    return data as ReviewMarketingAssetRow;
  }

  const { data, error } = await supabase
    .from("review_marketing_assets")
    .insert(row)
    .select("id, review_id, social_post_id, organization_id, lifecycle_state, template_id, image_url, platform_targets, quote_excerpt, last_queued_at")
    .single();

  if (error || !data) {
    throw new Error("Failed to create review marketing asset");
  }

  return data as ReviewMarketingAssetRow;
}

export function isReviewEligibleForMarketing(review: ReputationReview) {
  return review.rating >= MIN_ELIGIBLE_RATING && Boolean(review.comment?.trim());
}

export async function ensureReviewMarketingAsset(options: {
  supabase: AppSupabaseClient;
  reviewId: string;
  userId: string;
  templateId?: string;
}) {
  const { supabase, reviewId, userId } = options;
  const selectedTemplateId =
    options.templateId && REVIEW_TEMPLATE_IDS.has(options.templateId)
      ? options.templateId
      : undefined;

  const branding = await getOrganizationBranding(supabase, userId);
  const review = await getReviewForOrganization(supabase, reviewId, branding.organizationId);

  if (!isReviewEligibleForMarketing(review)) {
    throw new Error("Only strong reviews with comment text can become marketing assets");
  }

  const existingAsset = await getExistingAsset(supabase, reviewId, branding.organizationId);
  const templateId = selectedTemplateId || existingAsset?.template_id || chooseReviewTemplate(review);
  const templateData = buildReviewMarketingTemplateData({
    organizationName: branding.organizationName,
    organizationLogoUrl: branding.organizationLogoUrl,
    operatorPhone: branding.operatorPhone,
    review,
  });
  const socialPost = await upsertSocialPost({
    supabase,
    existingPostId: existingAsset?.social_post_id,
    organizationId: branding.organizationId,
    userId,
    templateId,
    templateData,
  });
  const imageUrl = await renderAndUploadReviewMarketingAsset({
    supabase,
    organizationId: branding.organizationId,
    socialPostId: socialPost.id,
    templateId,
    templateData,
  });

  await supabase
    .from("social_posts")
    .update({ rendered_image_url: imageUrl, status: "draft" })
    .eq("id", socialPost.id)
    .eq("organization_id", branding.organizationId);

  const asset = await persistAsset({
    supabase,
    existingAssetId: existingAsset?.id,
    organizationId: branding.organizationId,
    reviewId,
    socialPostId: socialPost.id,
    userId,
    templateId,
    quoteExcerpt: buildQuoteExcerpt(review.comment || review.title || review.reviewer_name),
    imageUrl,
    lifecycleState: existingAsset?.lifecycle_state === "published" ? "published" : "asset_generated",
    platformTargets: existingAsset?.platform_targets ?? [],
    lastQueuedAt: existingAsset?.last_queued_at ?? null,
  });

  return {
    asset,
    review,
    socialPost: {
      ...socialPost,
      rendered_image_url: imageUrl,
    },
    organizationId: branding.organizationId,
  };
}

export async function scheduleReviewMarketingAsset(options: {
  supabase: AppSupabaseClient;
  reviewId: string;
  userId: string;
  templateId?: string;
  platforms: Array<"instagram" | "facebook">;
  scheduledFor?: string;
}) {
  const { supabase, reviewId, userId, platforms, scheduledFor } = options;
  const generated = await ensureReviewMarketingAsset({
    supabase,
    reviewId,
    userId,
    templateId: options.templateId,
  });

  const connections = await getConnectionsForPlatforms({
    supabase,
    organizationId: generated.organizationId,
    platforms,
  });

  const queueScheduledFor = scheduledFor || new Date().toISOString();
  const queuedItems = await replaceReviewQueueItems({
    supabase,
    postId: generated.socialPost.id,
    connections,
    scheduledFor: queueScheduledFor,
  });

  await supabase
    .from("social_posts")
    .update({ status: "scheduled" })
    .eq("id", generated.socialPost.id)
    .eq("organization_id", generated.organizationId);

  const asset = await persistAsset({
    supabase,
    existingAssetId: generated.asset.id,
    organizationId: generated.organizationId,
    reviewId,
    socialPostId: generated.socialPost.id,
    userId,
    templateId: generated.asset.template_id,
    quoteExcerpt: generated.asset.quote_excerpt || buildQuoteExcerpt(generated.review.comment || ""),
    imageUrl: generated.socialPost.rendered_image_url || generated.asset.image_url || "",
    lifecycleState: "queued_for_review",
    platformTargets: connections.map((connection) => connection.platform),
    lastQueuedAt: queueScheduledFor,
  });

  return {
    asset,
    postId: generated.socialPost.id,
    queuedPlatforms: queuedItems.map((item) => item.platform),
    queueIds: queuedItems.map((item) => item.id),
    scheduledFor: queueScheduledFor,
  };
}
