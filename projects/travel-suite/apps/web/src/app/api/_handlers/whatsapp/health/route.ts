import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { checkEvolutionHealth } from "@/lib/whatsapp/session-health";
import { logError } from "@/lib/observability/logger";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId, adminClient } = auth;

    const { data: connection, error } = await adminClient
      .from("whatsapp_connections")
      .select("session_name, session_token, status, phone_number")
      .eq("organization_id", organizationId!)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logError("[whatsapp/health] failed to load connection", error);
      return NextResponse.json(
        { connected: false, sessionName: null, error: "Failed to load WhatsApp connection" },
        { status: 500 },
      );
    }

    const health = await checkEvolutionHealth({
      sessionName: connection?.session_name ?? null,
      dbStatus: connection?.status ?? null,
    });

    return apiSuccess(health);
  } catch (error) {
    logError("[whatsapp/health] unexpected error", error);
    return NextResponse.json(
      { connected: false, sessionName: null, error: "Failed to check WhatsApp health" },
      { status: 500 },
    );
  }
}
