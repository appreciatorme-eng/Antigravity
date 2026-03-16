import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { REPUTATION_PLATFORM_CONNECTION_SELECT } from "@/lib/reputation/selects";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { ConnectionPlatform } from "@/lib/reputation/types";
import type { Database } from "@/lib/database.types";
import { logError } from "@/lib/observability/logger";

type ConnectionRow = Database["public"]["Tables"]["reputation_platform_connections"]["Row"];

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

    const { data: connectionsData, error } = await supabase
      .from("reputation_platform_connections")
      .select(REPUTATION_PLATFORM_CONNECTION_SELECT)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });
    const connections = connectionsData as unknown as ConnectionRow[] | null;

    if (error) {
      throw error;
    }

    return NextResponse.json({ connections: connections ?? [] });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    logError("Error fetching platform connections", error);
    return apiError(message, 500);
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
    const auth = await requireAdmin(req, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }

    const organizationId = auth.organizationId!;
    const adminClient = auth.adminClient;
    const body = await req.json();

    const platform = body.platform as ConnectionPlatform | undefined;
    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return apiError(`platform must be one of: ${VALID_PLATFORMS.join(", ")}`, 400);
    }

    if (!body.platform_account_id || typeof body.platform_account_id !== "string") {
      return apiError("platform_account_id is required", 400);
    }

    if (!body.platform_account_name || typeof body.platform_account_name !== "string") {
      return apiError("platform_account_name is required", 400);
    }

    // Check for duplicate connection
    const { data: existing } = await adminClient
      .from("reputation_platform_connections")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("platform", platform)
      .maybeSingle();

    if (existing) {
      return apiError("A connection for this platform already exists", 409);
    }

    const insertData = {
      organization_id: organizationId,
      platform,
      platform_account_id: body.platform_account_id,
      platform_account_name: body.platform_account_name,
      platform_location_id: body.platform_location_id || null,
      sync_enabled: true,
    };

    const { data: connectionData, error } = await adminClient
      .from("reputation_platform_connections")
      .insert(insertData)
      .select(REPUTATION_PLATFORM_CONNECTION_SELECT)
      .single();
    const connection = connectionData as unknown as ConnectionRow | null;

    if (error) {
      throw error;
    }

    return NextResponse.json({ connection });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    logError("Error creating platform connection", error);
    return apiError(message, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin(req, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }

    const organizationId = auth.organizationId!;
    const adminClient = auth.adminClient;
    const url = new URL(req.url);
    const connectionId = url.searchParams.get("id");

    if (!connectionId) {
      return apiError("id query parameter is required", 400);
    }

    const { error } = await adminClient
      .from("reputation_platform_connections")
      .delete()
      .eq("id", connectionId)
      .eq("organization_id", organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    logError("Error deleting platform connection", error);
    return apiError(message, 500);
  }
}
