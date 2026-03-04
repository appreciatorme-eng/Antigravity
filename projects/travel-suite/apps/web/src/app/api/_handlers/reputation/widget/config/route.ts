import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { WidgetType, WidgetTheme } from "@/lib/reputation/types";

const VALID_WIDGET_TYPES: WidgetType[] = [
  "carousel",
  "grid",
  "badge",
  "floating",
  "wall",
];

const VALID_THEMES: WidgetTheme[] = ["light", "dark", "auto"];

export async function GET() {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: widgets, error } = await (supabase as any)
      .from("reputation_widgets")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ widgets: widgets ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching widgets:", error);
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

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (!body.widget_type || !VALID_WIDGET_TYPES.includes(body.widget_type)) {
      return NextResponse.json(
        { error: `widget_type must be one of: ${VALID_WIDGET_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const theme: WidgetTheme = VALID_THEMES.includes(body.theme)
      ? body.theme
      : "dark";

    // Validate numeric fields
    const minRating = Math.max(1, Math.min(5, Number(body.min_rating_to_show) || 4));
    const maxReviews = Math.max(1, Math.min(50, Number(body.max_reviews) || 10));
    const borderRadius = Math.max(0, Math.min(32, Number(body.border_radius) || 12));

    // Generate embed token
    const embedToken = crypto.randomUUID().replace(/-/g, "");

    const insertData = {
      organization_id: profile.organization_id,
      name: body.name,
      widget_type: body.widget_type,
      theme,
      accent_color: body.accent_color || "#00d084",
      background_color: body.background_color || null,
      text_color: body.text_color || null,
      border_radius: borderRadius,
      min_rating_to_show: minRating,
      max_reviews: maxReviews,
      platforms_filter: Array.isArray(body.platforms_filter)
        ? body.platforms_filter
        : [],
      destinations_filter: Array.isArray(body.destinations_filter)
        ? body.destinations_filter
        : [],
      embed_token: embedToken,
      is_active: true,
      show_branding: body.show_branding !== false,
      custom_header: body.custom_header || null,
      custom_footer: body.custom_footer || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: widget, error } = await (supabase as any)
      .from("reputation_widgets")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ widget });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error creating widget:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
