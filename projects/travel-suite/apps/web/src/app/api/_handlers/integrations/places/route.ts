import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { env } from "@/lib/config/env";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

type PlacesRequestBody = {
  googlePlaceId?: string;
};

type AdminClient = Extract<
  Awaited<ReturnType<typeof requireAdmin>>,
  { ok: true }
>["adminClient"];

async function getGooglePlaceConnection(
  supabaseAdmin: AdminClient,
  organizationId: string,
) {
  const { data: connection, error } = await supabaseAdmin
    .from("reputation_platform_connections")
    .select("id, platform_account_id, platform_account_name, platform_location_id")
    .eq("organization_id", organizationId)
    .eq("platform", "google_business")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw error;
  }

  return connection ?? null;
}

async function ensureGooglePlaceConfigured(
  supabaseAdmin: AdminClient,
  organizationId: string,
  googlePlaceId: string,
) {
  const trimmedPlaceId = googlePlaceId.trim();
  const existingConnection = await getGooglePlaceConnection(supabaseAdmin, organizationId);

  if (existingConnection?.id) {
    const { error: updateConnectionError } = await supabaseAdmin
      .from("reputation_platform_connections")
      .update({
        platform_account_id: trimmedPlaceId,
        platform_account_name: existingConnection.platform_account_name || "Google Business",
        platform_location_id: trimmedPlaceId,
        sync_enabled: true,
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingConnection.id);
    if (updateConnectionError) {
      throw updateConnectionError;
    }
  } else {
    const { error: insertConnectionError } = await supabaseAdmin.from("reputation_platform_connections").insert({
      organization_id: organizationId,
      platform: "google_business",
      platform_account_id: trimmedPlaceId,
      platform_account_name: "Google Business",
      platform_location_id: trimmedPlaceId,
      sync_enabled: true,
    });
    if (insertConnectionError) {
      throw insertConnectionError;
    }
  }

  const { error: settingsUpsertError } = await supabaseAdmin.from("organization_settings").upsert(
    {
      organization_id: organizationId,
      google_places_enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );
  if (settingsUpsertError) {
    throw settingsUpsertError;
  }
}

async function validatePlacesApiKey(placeId?: string) {
  const apiKey = env.google.placesApiKey;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId || "ChIJN1t_tDeuEmsRUsoyG83frY4");
  url.searchParams.set("fields", "name");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });
  const payload = (await response.json().catch(() => null)) as {
    status?: string;
    error_message?: string;
  } | null;

  if (!response.ok || !payload) {
    throw new Error("Google Places validation failed");
  }

  if (payload.status === "REQUEST_DENIED") {
    throw new Error(payload.error_message || "Google Places API key rejected");
  }

  if (placeId && payload.status !== "OK") {
    throw new Error(payload.error_message || "Google Place ID could not be verified");
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { requireOrganization: true });
    if (!admin.ok) {
      return admin.response;
    }

    const organizationId = admin.organizationId;
    if (!organizationId) {
      return apiError("No organization found", 403);
    }

    const supabaseAdmin = admin.adminClient;

    const [{ data: settings }, connection] = await Promise.all([
      supabaseAdmin
        .from("organization_settings")
        .select("google_places_enabled")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      getGooglePlaceConnection(supabaseAdmin, organizationId),
    ]);

    return NextResponse.json({
      enabled: settings?.google_places_enabled ?? false,
      googlePlaceId:
        connection?.platform_location_id || connection?.platform_account_id || "",
    });
  } catch (error: unknown) {
    logError("Google Places status check error", error);
    return NextResponse.json({ enabled: false, googlePlaceId: "" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { requireOrganization: true });
    if (!admin.ok) {
      return admin.response;
    }

    const organizationId = admin.organizationId;
    if (!organizationId) {
      return apiError("No organization found", 403);
    }

    const body = (await request.json().catch(() => ({}))) as PlacesRequestBody;
    const googlePlaceId = body.googlePlaceId?.trim();

    const supabaseAdmin = admin.adminClient;

    if (googlePlaceId) {
      // Only validate the API key when a Place ID is being saved
      await validatePlacesApiKey(googlePlaceId);
      await ensureGooglePlaceConfigured(supabaseAdmin, organizationId, googlePlaceId);
      return NextResponse.json({
        success: true,
        enabled: true,
        googlePlaceId,
      });
    }

    // Plain activation (no Place ID) — just enable the feature flag
    const { error: settingsUpsertError } = await supabaseAdmin.from("organization_settings").upsert(
      {
        organization_id: organizationId,
        google_places_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" },
    );
    if (settingsUpsertError) {
      throw settingsUpsertError;
    }

    return NextResponse.json({ success: true, enabled: true });
  } catch (error: unknown) {
    logError("Google Places activation error", error);
    return NextResponse.json(
      { error: safeErrorMessage(error, "Request failed") },
      { status: 500 },
    );
  }
}
