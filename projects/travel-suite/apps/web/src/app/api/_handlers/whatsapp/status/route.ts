// GET /api/whatsapp/status?sessionName=org_xxx
// Returns the current WPPConnect session status mapped to a frontend shape.
// Fetches session_token from DB — WPPConnect requires Bearer auth for all calls.
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWahaStatus } from "@/lib/whatsapp-waha.server";

export async function GET(req: NextRequest) {
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
            return NextResponse.json({ status: "disconnected" });
        }

        const requestedSessionName = req.nextUrl.searchParams.get("sessionName");
        const admin = createAdminClient();
        let connectionQuery = admin
            .from("whatsapp_connections")
            .select("session_name, session_token, status, phone_number, display_name")
            .eq("organization_id", profile.organization_id);

        if (requestedSessionName) {
            connectionQuery = connectionQuery.eq("session_name", requestedSessionName);
        }

        const { data: connection } = await connectionQuery
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const sessionName = requestedSessionName || connection?.session_name;

        const sessionToken = connection?.session_token ?? "";
        const dbStatus = connection?.status ?? "disconnected";

        if (!sessionToken || !sessionName) {
            return NextResponse.json({ status: "disconnected" });
        }

        const wppSession = await getWahaStatus(sessionName, sessionToken);

        if (wppSession.status === "CONNECTED") {
            return NextResponse.json({
                status: "connected",
                number: connection?.phone_number ?? null,
                name: connection?.display_name ?? null,
            });
        }

        // WPPConnect reports "DISCONNECTED" during both QR phase and truly disconnected.
        // Use the DB status to distinguish: "connecting" = QR is showing.
        if (dbStatus === "connecting") {
            return NextResponse.json({ status: "pending" });
        }

        return NextResponse.json({ status: "disconnected" });
    } catch (error) {
        console.error("[whatsapp/status] error:", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
