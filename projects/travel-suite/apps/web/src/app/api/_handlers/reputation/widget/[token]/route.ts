import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { repFrom } from "@/lib/reputation/db";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import type { ReputationWidget, ReputationReview } from "@/lib/reputation/types";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string" || !UUID_REGEX.test(token)) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await enforceRateLimit({
      identifier: ip,
      limit: 60,
      windowMs: 60_000,
      prefix: "pub:widget:get",
    });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: corsHeaders() }
      );
    }

    const supabase = await createClient();

    // Look up widget by embed_token
    const { data: widget, error: widgetError } = await repFrom(supabase, "reputation_widgets")
      .select("*")
      .eq("embed_token", token)
      .maybeSingle();

    if (widgetError) {
      throw widgetError;
    }

    if (!widget) {
      return NextResponse.json(
        { error: "Widget not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    const typedWidget = widget as ReputationWidget;

    if (!typedWidget.is_active) {
      return NextResponse.json(
        { error: "Widget is inactive" },
        { status: 403, headers: corsHeaders() }
      );
    }

    // Fetch reviews matching widget filters
    let query = repFrom(supabase, "reputation_reviews")
      .select("*")
      .eq("organization_id", typedWidget.organization_id)
      .gte("rating", typedWidget.min_rating_to_show)
      .order("review_date", { ascending: false })
      .limit(typedWidget.max_reviews);

    // Platform filter
    if (
      typedWidget.platforms_filter &&
      typedWidget.platforms_filter.length > 0
    ) {
      query = query.in("platform", typedWidget.platforms_filter);
    }

    // Destination filter
    if (
      typedWidget.destinations_filter &&
      typedWidget.destinations_filter.length > 0
    ) {
      query = query.in("destination", typedWidget.destinations_filter);
    }

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      throw reviewsError;
    }

    // Return only safe public fields from reviews
    const publicReviews = (reviews ?? []).map((review) => ({
      id: review.id,
      platform: review.platform as ReputationReview["platform"],
      reviewer_name: review.reviewer_name,
      reviewer_avatar_url: review.reviewer_avatar_url,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      review_date: review.review_date,
      destination: review.destination,
      is_verified_client: review.is_verified_client,
    }));

    const responseData = {
      widget: {
        widget_type: typedWidget.widget_type,
        theme: typedWidget.theme,
        accent_color: typedWidget.accent_color,
        background_color: typedWidget.background_color,
        text_color: typedWidget.text_color,
        border_radius: typedWidget.border_radius,
        show_branding: typedWidget.show_branding,
        custom_header: typedWidget.custom_header,
        custom_footer: typedWidget.custom_footer,
      },
      reviews: publicReviews,
    };

    return NextResponse.json(responseData, {
      headers: corsHeaders(),
    });
  } catch (error: unknown) {
    console.error("Error fetching widget data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
