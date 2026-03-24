// POST /api/whatsapp/disconnect
// Closes the Evolution API instance for the caller's org and marks the DB row disconnected.
// Requires admin role -- any member could otherwise reset the shared org session.
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
    disconnectEvolution,
    sessionNameFromOrgId,
} from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

export async function POST(request: Request) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;

        const sessionName = sessionNameFromOrgId(organizationId!);

        await disconnectEvolution(sessionName);

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
