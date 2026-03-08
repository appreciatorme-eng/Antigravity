import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/config/env";

type PlacesRequestBody = {
  googlePlaceId?: string;
};

async function getOrganizationId(userId: string) {
  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  return profile?.organization_id ?? null;
}

async function getGooglePlaceConnection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation connection tables are not fully represented in generated types yet.
  supabaseAdmin: any,
  organizationId: string,
) {
  const { data: connection } = await supabaseAdmin
    .from("reputation_platform_connections")
    .select("id, platform_account_id, platform_account_name, platform_location_id")
    .eq("organization_id", organizationId)
    .eq("platform", "google_business")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return connection ?? null;
}

async function ensureGooglePlaceConfigured(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- organization settings and reputation tables are not fully typed yet.
  supabaseAdmin: any,
  organizationId: string,
  googlePlaceId: string,
) {
  const trimmedPlaceId = googlePlaceId.trim();
  const existingConnection = await getGooglePlaceConnection(supabaseAdmin, organizationId);

  if (existingConnection?.id) {
    await supabaseAdmin
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
  } else {
    await supabaseAdmin.from("reputation_platform_connections").insert({
      organization_id: organizationId,
      platform: "google_business",
      platform_account_id: trimmedPlaceId,
      platform_account_name: "Google Business",
      platform_location_id: trimmedPlaceId,
      sync_enabled: true,
    });
  }

  await supabaseAdmin.from("organization_settings").upsert(
    {
      organization_id: organizationId,
      google_places_enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );
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

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json({ enabled: false, googlePlaceId: "" });
    }

    const supabaseAdmin = createAdminClient();
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
    console.error("Google Places status check error:", error);
    return NextResponse.json({ enabled: false, googlePlaceId: "" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as PlacesRequestBody;
    const googlePlaceId = body.googlePlaceId?.trim();

    await validatePlacesApiKey(googlePlaceId);

    const supabaseAdmin = createAdminClient();
    if (googlePlaceId) {
      await ensureGooglePlaceConfigured(supabaseAdmin, organizationId, googlePlaceId);
      return NextResponse.json({
        success: true,
        enabled: true,
        googlePlaceId,
      });
    }

    await supabaseAdmin.from("organization_settings").upsert(
      {
        organization_id: organizationId,
        google_places_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" },
    );

    return NextResponse.json({ success: true, enabled: true });
  } catch (error: unknown) {
    console.error("Google Places activation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to activate Google Places" },
      { status: 500 },
    );
  }
}
