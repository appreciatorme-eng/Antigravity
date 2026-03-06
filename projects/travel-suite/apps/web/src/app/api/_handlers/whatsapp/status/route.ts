// GET /api/whatsapp/status?sessionName=org_xxx
// Returns the current WPPConnect session status mapped to a frontend shape.
// Fetches session_token from DB — WPPConnect requires Bearer auth for all calls.
import { NextRequest, NextResponse } from "next/server";
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessionName = req.nextUrl.searchParams.get("sessionName");
        if (!sessionName) {
            return NextResponse.json(
                { error: "Missing sessionName" },
                { status: 400 },
            );
        }

        // Fetch token + DB status together — needed for WPPConnect Bearer auth
        const admin = createAdminClient();
        const { data: connection } = await admin
            .from("whatsapp_connections")
            .select("session_token, status, phone_number, display_name")
            .eq("session_name", sessionName)
            .single();

        const sessionToken = connection?.session_token ?? "";
        const dbStatus = connection?.status ?? "disconnected";

        if (!sessionToken) {
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
