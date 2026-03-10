import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { ConnectionPlatform } from "@/lib/reputation/types";

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
    const { data: connections, error } = await (supabase as any)
      .from("reputation_platform_connections")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ connections: connections ?? [] });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error fetching platform connections:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const VALID_PLATFORMS: ConnectionPlatform[] = [
  "google_business",
  "tripadvisor",
  "facebook",
  "makemytrip",
];

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

    const platform = body.platform as ConnectionPlatform | undefined;
    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `platform must be one of: ${VALID_PLATFORMS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!body.platform_account_id || typeof body.platform_account_id !== "string") {
      return NextResponse.json(
        { error: "platform_account_id is required" },
        { status: 400 }
      );
    }

    if (!body.platform_account_name || typeof body.platform_account_name !== "string") {
      return NextResponse.json(
        { error: "platform_account_name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("reputation_platform_connections")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("platform", platform)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "A connection for this platform already exists" },
        { status: 409 }
      );
    }

    const insertData = {
      organization_id: profile.organization_id,
      platform,
      platform_account_id: body.platform_account_id,
      platform_account_name: body.platform_account_name,
      platform_location_id: body.platform_location_id || null,
      sync_enabled: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error } = await (supabase as any)
      .from("reputation_platform_connections")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ connection });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error creating platform connection:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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
    const connectionId = url.searchParams.get("id");

    if (!connectionId) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("reputation_platform_connections")
      .delete()
      .eq("id", connectionId)
      .eq("organization_id", profile.organization_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    console.error("Error deleting platform connection:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
