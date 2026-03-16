// POST /api/whatsapp/disconnect
// Closes the WAHA session for the caller's org and marks the DB row disconnected.
// WhatsApp: Meta Cloud API only. WPPConnect path removed — see CLAUDE.md.
// Requires admin role — any member could otherwise reset the shared org session.
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
    disconnectWahaSession,
    sessionNameFromOrgId,
} from "@/lib/whatsapp-waha.server";
import { logError } from "@/lib/observability/logger";

export async function POST(request: Request) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;

        const sessionName = sessionNameFromOrgId(organizationId!);

        const { data: connection } = await adminClient
            .from("whatsapp_connections")
            .select("session_token")
            .eq("organization_id", organizationId!)
            .single();

        await disconnectWahaSession(sessionName, connection?.session_token ?? undefined);

        const { error: updateError } = await adminClient
            .from("whatsapp_connections")
            .update({
                status: "disconnected",
                phone_number: null,
                display_name: null,
                connected_at: null,
                session_token: null,
            })
            .eq("organization_id", organizationId!);

        if (updateError) {
            logError("[whatsapp/disconnect] failed to update connection", updateError);
            return apiError("Failed to update connection status", 500);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logError("[whatsapp/disconnect] error", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
