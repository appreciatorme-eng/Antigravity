// GET /api/whatsapp/status
// Returns the current Evolution API instance status mapped to a frontend shape.
// Only reports "connected" when DB already says "connected" (set by webhook).
// During "connecting" phase (QR flow), Evolution's CONNECTED status is ignored
// because it may be stale cached auth from a previous session.
// Requires admin role -- response includes phone number and display name.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getEvolutionStatus } from "@/lib/whatsapp-evolution.server";
import { ensureAssistantGroup } from "@/lib/whatsapp/ensure-assistant-group";
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
            // Only trust Evolution's CONNECTED when DB already says "connected".
            // During "connecting" (QR flow), Evolution may report CONNECTED from
            // stale cached Baileys auth — the webhook is the only reliable source
            // for the connecting → connected transition.
            if (dbStatus === "connected") {
                let phoneNumber = connection?.phone_number ?? null;
                let displayName = connection?.display_name ?? null;

                // Backfill phone/name from Evolution if webhook didn't provide them
                if (!phoneNumber) {
                    const me = evoSession.me;
                    if (me?.id) {
                        phoneNumber = "+" + me.id.replace(/@s\.whatsapp\.net$/, "");
                        displayName = me.pushName ?? displayName;
                    }
                    await adminClient
                        .from("whatsapp_connections")
                        .update({
                            phone_number: phoneNumber,
                            display_name: displayName,
                        })
                        .eq("session_name", sessionName);

                    // Now that phone_number is set, create the assistant group
                    // (the webhook tried but bailed because phone was null)
                    void ensureAssistantGroup(sessionName).catch((err) =>
                        logError("[whatsapp/status] assistant group creation failed", err),
                    );
                }

                return NextResponse.json({
                    status: "connected",
                    number: phoneNumber,
                    name: displayName,
                });
            }

            // DB says "connecting" but Evolution says CONNECTED — stale cache.
            // Return "pending" so the frontend keeps showing the QR code.
            return NextResponse.json({ status: "pending" });
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
