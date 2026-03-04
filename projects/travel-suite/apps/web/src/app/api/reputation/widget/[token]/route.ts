import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const supabase = await createClient();

    // Look up widget by embed_token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: widget, error: widgetError } = await (supabase as any)
      .from("reputation_widgets")
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("reputation_reviews")
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
    const publicReviews = (reviews ?? []).map((r: ReputationReview) => ({
      id: r.id,
      platform: r.platform,
      reviewer_name: r.reviewer_name,
      reviewer_avatar_url: r.reviewer_avatar_url,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      review_date: r.review_date,
      destination: r.destination,
      is_verified_client: r.is_verified_client,
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
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching widget data:", error);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
