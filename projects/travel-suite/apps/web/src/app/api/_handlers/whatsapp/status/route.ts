// GET /api/whatsapp/status
// Returns the current WAHA session status mapped to a frontend shape.
// Also syncs the DB when WPPConnect reports CONNECTED (webhook-independent).
// Requires admin role — response includes phone number and display name.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getWahaStatus } from "@/lib/whatsapp-waha.server";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;

        const requestedSessionName = request.nextUrl.searchParams.get("sessionName");
        let connectionQuery = adminClient
            .from("whatsapp_connections")
            .select("session_name, session_token, status, phone_number, display_name")
            .eq("organization_id", organizationId!);

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
            // Sync DB when WPPConnect reports connected — don't rely solely on webhooks
            let phoneNumber = connection?.phone_number ?? null;
            let displayName = connection?.display_name ?? null;

            if (dbStatus !== "connected" || !phoneNumber) {
                // Fetch phone number from WPPConnect session info
                const me = wppSession.me;
                if (me?.id) {
                    phoneNumber = "+" + me.id.replace(/@c\.us$/, "");
                    displayName = me.pushName ?? displayName;
                }

                // Update DB — mark connected + store phone number
                await adminClient
                    .from("whatsapp_connections")
                    .update({
                        status: "connected",
                        phone_number: phoneNumber,
                        display_name: displayName,
                        connected_at: new Date().toISOString(),
                    })
                    .eq("session_name", sessionName);
            }

            return NextResponse.json({
                status: "connected",
                number: phoneNumber,
                name: displayName,
            });
        }

        // WAHA reports "DISCONNECTED" during both QR phase and truly disconnected.
        // Use the DB status to distinguish: "connecting" = QR is showing.
        if (dbStatus === "connecting") {
            return NextResponse.json({ status: "pending" });
        }

        return NextResponse.json({ status: "disconnected" });
    } catch (error) {
        logError("[whatsapp/status] error", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
