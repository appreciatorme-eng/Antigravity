// Auto-review processor — automatically generates marketing assets for eligible 5-star reviews.
// Called by database trigger (via Edge Function) or manual API endpoint to process reviews.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { ensureReviewMarketingAsset } from "@/lib/reputation/review-marketing.server";

type AppSupabaseClient = SupabaseClient<Database>;

const MIN_ELIGIBLE_RATING = 5;

export interface AutoReviewProcessorResult {
  processed: number;
  assets_generated: number;
  errors: string[];
}

interface ReviewRow {
  id: string;
  organization_id: string;
  rating: number;
  comment: string | null;
}

interface ExistingAssetRow {
  id: string;
  review_id: string;
}

type QueryErrorLike = { message: string } | null;

type UntypedBuilder = {
  select: (columns: string) => UntypedBuilder;
  eq: (column: string, value: unknown) => UntypedBuilder;
  in: (column: string, values: readonly string[]) => UntypedBuilder;
  gte: (column: string, value: unknown) => UntypedBuilder;
  is: (column: string, value: unknown) => UntypedBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: QueryErrorLike }>;
  single: () => Promise<{ data: unknown; error: QueryErrorLike }>;
};

type UntypedSupabase = {
  from: (relation: string) => UntypedBuilder;
};

/**
 * Process a single review for marketing asset generation.
 * Checks eligibility (5-star, has comment, no existing asset) and generates if eligible.
 */
export async function processEligibleReviewForMarketing(options: {
  supabase: SupabaseClient;
  reviewId: string;
  organizationId: string;
  userId: string;
}): Promise<AutoReviewProcessorResult> {
  const { supabase, reviewId, organizationId, userId } = options;
  const errors: string[] = [];
  const rawSupabase = supabase as unknown as UntypedSupabase;

  // Step 1: Fetch the review to check eligibility
  const { data: review, error: reviewError } = await ((rawSupabase
    .from("reputation_reviews")
    .select("id, organization_id, rating, comment")
    .eq("id", reviewId)
    .eq("organization_id", organizationId)
    .maybeSingle()) as unknown as Promise<{
    data: ReviewRow | null;
    error: QueryErrorLike;
  }>);

  if (reviewError) {
    errors.push(`Failed to fetch review ${reviewId}: ${reviewError.message}`);
    return { processed: 0, assets_generated: 0, errors };
  }

  if (!review) {
    errors.push(`Review ${reviewId} not found for organization ${organizationId}`);
    return { processed: 0, assets_generated: 0, errors };
  }

  // Step 2: Check if review is eligible (5-star with comment)
  if (review.rating < MIN_ELIGIBLE_RATING) {
    // Not an error - just not eligible
    return { processed: 1, assets_generated: 0, errors };
  }

  if (!review.comment || review.comment.trim().length === 0) {
    // Not an error - just not eligible
    return { processed: 1, assets_generated: 0, errors };
  }

  // Step 3: Check if asset already exists
  const { data: existingAsset, error: assetError } = await ((rawSupabase
    .from("review_marketing_assets")
    .select("id, review_id")
    .eq("review_id", reviewId)
    .eq("organization_id", organizationId)
    .maybeSingle()) as unknown as Promise<{
    data: ExistingAssetRow | null;
    error: QueryErrorLike;
  }>);

  if (assetError) {
    errors.push(
      `Failed to check existing asset for review ${reviewId}: ${assetError.message}`,
    );
    return { processed: 1, assets_generated: 0, errors };
  }

  if (existingAsset) {
    // Asset already exists - not an error, just skip
    return { processed: 1, assets_generated: 0, errors };
  }

  // Step 4: Generate marketing asset
  try {
    await ensureReviewMarketingAsset({ supabase, reviewId, userId });
    return { processed: 1, assets_generated: 1, errors };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error generating asset";
    errors.push(`Failed to generate asset for review ${reviewId}: ${errorMessage}`);
    return { processed: 1, assets_generated: 0, errors };
  }
}

/**
 * Process all eligible reviews for an organization.
 * Fetches recent 5-star reviews and generates marketing assets for those without existing assets.
 */
export async function processEligibleReviewsForOrganization(options: {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  lookbackDays?: number;
}): Promise<AutoReviewProcessorResult> {
  const { supabase, organizationId, userId, lookbackDays = 7 } = options;
  const errors: string[] = [];
  let totalProcessed = 0;
  let totalAssetsGenerated = 0;
  const rawSupabase = supabase as unknown as UntypedSupabase;

  const cutoffDate = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Fetch recent 5-star reviews with comments
  const { data: reviews, error: reviewsError } = await ((rawSupabase
    .from("reputation_reviews")
    .select("id, organization_id, rating, comment")
    .eq("organization_id", organizationId)
    .gte("rating", MIN_ELIGIBLE_RATING)
    .gte("created_at", cutoffDate)) as unknown as Promise<{
    data: ReviewRow[] | null;
    error: QueryErrorLike;
  }>);

  if (reviewsError) {
    errors.push(
      `Failed to fetch reviews for organization ${organizationId}: ${reviewsError.message}`,
    );
    return { processed: 0, assets_generated: 0, errors };
  }

  const eligibleReviews =
    reviews?.filter(
      (review) =>
        review.rating >= MIN_ELIGIBLE_RATING &&
        review.comment &&
        review.comment.trim().length > 0,
    ) ?? [];

  if (eligibleReviews.length === 0) {
    return { processed: 0, assets_generated: 0, errors };
  }

  const reviewIds = eligibleReviews.map((r) => r.id);

  // Fetch existing assets to skip duplicates
  const { data: existingAssets, error: existingAssetsError } = await ((rawSupabase
    .from("review_marketing_assets")
    .select("id, review_id")
    .eq("organization_id", organizationId)
    .in("review_id", reviewIds)) as unknown as Promise<{
    data: ExistingAssetRow[] | null;
    error: QueryErrorLike;
  }>);

  if (existingAssetsError) {
    errors.push(
      `Failed to fetch existing assets for organization ${organizationId}: ${existingAssetsError.message}`,
    );
    return { processed: 0, assets_generated: 0, errors };
  }

  const existingAssetReviewIds = new Set(
    (existingAssets ?? []).map((asset) => asset.review_id),
  );

  const reviewsToProcess = eligibleReviews.filter(
    (review) => !existingAssetReviewIds.has(review.id),
  );

  // Process each review sequentially to avoid race conditions
  for (const review of reviewsToProcess) {
    totalProcessed++;

    try {
      await ensureReviewMarketingAsset({ supabase, reviewId: review.id, userId });
      totalAssetsGenerated++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error generating asset";
      errors.push(`Failed to generate asset for review ${review.id}: ${errorMessage}`);
    }
  }

  return {
    processed: totalProcessed,
    assets_generated: totalAssetsGenerated,
    errors,
  };
}
