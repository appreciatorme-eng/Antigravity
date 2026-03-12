import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { ReputationPlatform, ResponseStatus, SentimentLabel } from "@/lib/reputation/types";

type ReputationReviewRow = Database['public']['Tables']['reputation_reviews']['Row'];

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") as ReputationPlatform | null;
    const rating = url.searchParams.get("rating");
    const status = url.searchParams.get("status") as ResponseStatus | null;
    const sentiment = url.searchParams.get("sentiment") as SentimentLabel | null;
    const requiresAttention = url.searchParams.get("requiresAttention");
    const search = url.searchParams.get("search");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const sortBy = url.searchParams.get("sortBy") || "review_date";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    let query = supabase
      .from("reputation_reviews")
      .select("*", { count: "exact" })
      .eq("organization_id", profile.organization_id);

    if (platform) {
      query = query.eq("platform", platform);
    }

    if (rating) {
      query = query.eq("rating", parseInt(rating, 10));
    }

    if (status) {
      query = query.eq("response_status", status);
    }

    if (sentiment) {
      query = query.eq("sentiment_label", sentiment);
    }

    if (requiresAttention === "true") {
      query = query.eq("requires_attention", true);
    }

    if (search) {
      query = query.or(
        `reviewer_name.ilike.%${search}%,comment.ilike.%${search}%,title.ilike.%${search}%`
      );
    }

    const ascending = sortOrder === "asc";
    query = query
      .order(sortBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      throw error;
    }

    const reviewIds = (reviews ?? []).map((review: ReputationReviewRow) => review.id);
    let assetMap = new Map<
      string,
      {
        id: string;
        lifecycle_state: string;
        social_post_id: string;
        image_url: string | null;
      }
    >();

    if (reviewIds.length > 0) {
      const { data: assets, error: assetError } = await supabase
        .from("review_marketing_assets")
        .select("id, review_id, lifecycle_state, social_post_id, image_url")
        .eq("organization_id", profile.organization_id)
        .in("review_id", reviewIds);

      if (assetError) {
        throw assetError;
      }

      assetMap = new Map(
        (assets ?? []).map((asset) => [
          asset.review_id,
          {
            id: asset.id,
            lifecycle_state: asset.lifecycle_state,
            social_post_id: asset.social_post_id,
            image_url: asset.image_url,
          },
        ])
      );
    }

    const reviewsWithAssets = (reviews ?? []).map((review: ReputationReviewRow) => {
      const asset = assetMap.get(review.id);
      return {
        ...review,
        marketing_asset_id: asset?.id ?? null,
        marketing_asset_state: asset?.lifecycle_state ?? null,
        marketing_social_post_id: asset?.social_post_id ?? null,
        marketing_image_url: asset?.image_url ?? null,
      };
    });

    return NextResponse.json({
      reviews: reviewsWithAssets,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error fetching reputation reviews:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const body = await req.json();

    if (!body.reviewer_name || typeof body.reviewer_name !== "string") {
      return NextResponse.json(
        { error: "reviewer_name is required" },
        { status: 400 }
      );
    }

    const ratingValue = Number(body.rating);
    if (!body.rating || isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json(
        { error: "rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    const insertData = {
      organization_id: profile.organization_id,
      platform: body.platform || "internal",
      platform_review_id: body.platform_review_id || null,
      platform_url: body.platform_url || null,
      reviewer_name: body.reviewer_name,
      rating: ratingValue,
      title: body.title || null,
      comment: body.comment || null,
      review_date: body.review_date || new Date().toISOString(),
      destination: body.destination || null,
      trip_type: body.trip_type || null,
      trip_id: body.trip_id || null,
      client_id: body.client_id || null,
      response_status: "pending" as const,
      is_featured: false,
      is_verified_client: false,
      requires_attention: false,
    };

    const { data: review, error } = await supabase
      .from("reputation_reviews")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ review });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error creating reputation review:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
