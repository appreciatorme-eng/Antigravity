// POST /api/whatsapp/disconnect
// Closes the WPPConnect session for the caller's org and marks the DB row disconnected.
// Requires admin role — any member could otherwise reset the shared org session.
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
    disconnectWahaSession,
    sessionNameFromOrgId,
} from "@/lib/whatsapp-waha.server";

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
            console.error("[whatsapp/disconnect] failed to update connection:", updateError);
            return apiError("Failed to update connection status", 500);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[whatsapp/disconnect] error:", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
