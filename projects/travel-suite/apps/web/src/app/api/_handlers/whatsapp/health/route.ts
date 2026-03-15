import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { checkWPPConnectHealth } from "@/lib/whatsapp/session-health";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId, adminClient } = auth;

    const { data: connection, error } = await adminClient
      .from("whatsapp_connections")
      .select("session_name, session_token")
      .eq("organization_id", organizationId!)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[whatsapp/health] failed to load connection:", error);
      return NextResponse.json(
        { connected: false, sessionName: null, error: "Failed to load WhatsApp connection" },
        { status: 500 },
      );
    }

    const health = await checkWPPConnectHealth({
      sessionName: connection?.session_name ?? null,
      token: connection?.session_token ?? null,
    });

    return apiSuccess(health);
  } catch (error) {
    console.error("[whatsapp/health] unexpected error:", error);
    return NextResponse.json(
      { connected: false, sessionName: null, error: "Failed to check WhatsApp health" },
      { status: 500 },
    );
  }
}
