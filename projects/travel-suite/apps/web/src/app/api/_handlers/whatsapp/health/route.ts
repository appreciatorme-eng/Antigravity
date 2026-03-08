import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkWPPConnectHealth } from "@/lib/whatsapp/session-health";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ connected: false, sessionName: null, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json({
        connected: false,
        sessionName: null,
        error: "Organization not configured",
      });
    }

    const admin = createAdminClient();
    const { data: connection, error } = await admin
      .from("whatsapp_connections")
      .select("session_name, session_token")
      .eq("organization_id", profile.organization_id)
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

    return NextResponse.json(health);
  } catch (error) {
    console.error("[whatsapp/health] unexpected error:", error);
    return NextResponse.json(
      { connected: false, sessionName: null, error: "Failed to check WhatsApp health" },
      { status: 500 },
    );
  }
}
