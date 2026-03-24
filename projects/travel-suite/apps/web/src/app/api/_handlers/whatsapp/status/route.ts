// GET /api/whatsapp/status
// Returns the current Evolution API instance status mapped to a frontend shape.
// Also syncs the DB when Evolution reports CONNECTED (webhook-independent).
// Requires admin role -- response includes phone number and display name.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getEvolutionStatus } from "@/lib/whatsapp-evolution.server";
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

        const dbStatus = connection?.status ?? "disconnected";

        if (!sessionName) {
            return NextResponse.json({ status: "disconnected" });
        }

        const evoSession = await getEvolutionStatus(sessionName);

        if (evoSession.status === "CONNECTED") {
            let phoneNumber = connection?.phone_number ?? null;
            let displayName = connection?.display_name ?? null;

            if (dbStatus !== "connected" || !phoneNumber) {
                const me = evoSession.me;
                if (me?.id) {
                    phoneNumber = "+" + me.id.replace(/@s\.whatsapp\.net$/, "");
                    displayName = me.pushName ?? displayName;
                }

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

        // Evolution reports "DISCONNECTED" during both QR phase and truly disconnected.
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
