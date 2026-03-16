import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { REPUTATION_WIDGET_SELECT } from "@/lib/reputation/selects";
import type { Database } from "@/lib/database.types";
import type { WidgetType, WidgetTheme } from "@/lib/reputation/types";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

type WidgetRow = Database["public"]["Tables"]["reputation_widgets"]["Row"];

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
      return apiError("Unauthorized", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return apiError("No organization found", 400);
    }

    const { data: widgetsData, error } = await supabase
      .from("reputation_widgets")
      .select(REPUTATION_WIDGET_SELECT)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });
    const widgets = widgetsData as unknown as WidgetRow[] | null;

    if (error) {
      throw error;
    }

    return NextResponse.json({ widgets: widgets ?? [] });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Internal server error");
    logError("Error fetching widgets", error);
    return apiError(message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }

    const organizationId = auth.organizationId!;
    const adminClient = auth.adminClient;
    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return apiError("name is required", 400);
    }

    if (!body.widget_type || !VALID_WIDGET_TYPES.includes(body.widget_type)) {
      return apiError(`widget_type must be one of: ${VALID_WIDGET_TYPES.join(", ")}`, 400);
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
      organization_id: organizationId,
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

    const { data: widgetData, error } = await adminClient
      .from("reputation_widgets")
      .insert(insertData)
      .select(REPUTATION_WIDGET_SELECT)
      .single();
    const widget = widgetData as unknown as WidgetRow | null;

    if (error) {
      throw error;
    }

    return NextResponse.json({ widget });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Internal server error");
    logError("Error creating widget", error);
    return apiError(message, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(req, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }

    const organizationId = auth.organizationId!;
    const adminClient = auth.adminClient;
    const body = await req.json();
    const widgetId =
      typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    const theme: WidgetTheme | undefined =
      body.theme === undefined
        ? undefined
        : VALID_THEMES.includes(body.theme)
          ? body.theme
          : null;

    if (body.widget_type !== undefined && !VALID_WIDGET_TYPES.includes(body.widget_type)) {
      return apiError(`widget_type must be one of: ${VALID_WIDGET_TYPES.join(", ")}`, 400);
    }

    if (theme === null) {
      return apiError(`theme must be one of: ${VALID_THEMES.join(", ")}`, 400);
    }

    const updateData = {
      ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
      ...(body.widget_type ? { widget_type: body.widget_type } : {}),
      ...(theme ? { theme } : {}),
      ...(typeof body.accent_color === "string"
        ? { accent_color: body.accent_color || "#00d084" }
        : {}),
      ...(typeof body.background_color === "string"
        ? { background_color: body.background_color || null }
        : {}),
      ...(typeof body.text_color === "string"
        ? { text_color: body.text_color || null }
        : {}),
      ...(body.border_radius !== undefined
        ? {
            border_radius: Math.max(0, Math.min(32, Number(body.border_radius) || 12)),
          }
        : {}),
      ...(body.min_rating_to_show !== undefined
        ? {
            min_rating_to_show: Math.max(
              1,
              Math.min(5, Number(body.min_rating_to_show) || 4)
            ),
          }
        : {}),
      ...(body.max_reviews !== undefined
        ? {
            max_reviews: Math.max(1, Math.min(50, Number(body.max_reviews) || 10)),
          }
        : {}),
      ...(Array.isArray(body.platforms_filter)
        ? { platforms_filter: body.platforms_filter }
        : {}),
      ...(Array.isArray(body.destinations_filter)
        ? { destinations_filter: body.destinations_filter }
        : {}),
      ...(body.show_branding !== undefined
        ? { show_branding: body.show_branding !== false }
        : {}),
      ...(typeof body.custom_header === "string"
        ? { custom_header: body.custom_header || null }
        : {}),
      ...(typeof body.custom_footer === "string"
        ? { custom_footer: body.custom_footer || null }
        : {}),
      updated_at: new Date().toISOString(),
    };

    if (Object.keys(updateData).length === 1) {
      return apiError("No valid fields to update", 400);
    }

    let query = adminClient
      .from("reputation_widgets")
      .update(updateData as Database['public']['Tables']['reputation_widgets']['Update'])
      .eq("organization_id", organizationId);

    query = widgetId ? query.eq("id", widgetId) : query.eq("is_active", true);

    const { data: widgetData, error } = await query
      .select(REPUTATION_WIDGET_SELECT)
      .maybeSingle();
    const widget = widgetData as unknown as WidgetRow | null;

    if (error) {
      throw error;
    }

    if (!widget) {
      return apiError("Widget not found", 404);
    }

    return NextResponse.json({ widget });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Internal server error");
    logError("Error updating widget", error);
    return apiError(message, 500);
  }
}
