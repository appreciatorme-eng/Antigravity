/* ------------------------------------------------------------------
 * POST /api/admin/whatsapp/relink
 * Re-links WhatsApp by deleting + recreating the Evolution instance.
 * This forces a fresh QR scan which triggers MESSAGES_SET with full
 * conversation history. Existing messages in TripBuilt are preserved.
 * ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
    deleteEvolutionInstance,
    disconnectEvolution,
    sessionNameFromOrgId,
    createEvolutionInstance,
    getEvolutionQR,
} from "@/lib/whatsapp-evolution.server";
import { logError, logEvent } from "@/lib/observability/logger";

export async function POST(request: Request): Promise<Response> {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId, adminClient } = auth;
    const orgId = organizationId!;
    const sessionName = sessionNameFromOrgId(orgId);

    try {
        logEvent("info", `[whatsapp/relink] Starting re-link for ${sessionName}`);

        // 1. Disconnect and delete the existing instance
        await disconnectEvolution(sessionName);
        await deleteEvolutionInstance(sessionName);

        // 2. Update connection status
        await adminClient
            .from("whatsapp_connections")
            .update({
                status: "disconnected",
                history_imported: false,
            })
            .eq("session_name", sessionName);

        // 3. Recreate the instance with updated webhook events
        let appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tripbuilt.com").trim();
        if (appUrl.includes("tripbuilt.com") && !appUrl.includes("www.")) {
            appUrl = appUrl.replace("://tripbuilt.com", "://www.tripbuilt.com");
        }
        const webhookSecret =
            process.env.EVOLUTION_WEBHOOK_SECRET?.trim() ??
            process.env.WPPCONNECT_WEBHOOK_SECRET?.trim() ?? "";
        const webhookUrl = webhookSecret
            ? `${appUrl}/api/webhooks/evolution?secret=${encodeURIComponent(webhookSecret)}`
            : `${appUrl}/api/webhooks/evolution`;
        await createEvolutionInstance(orgId, webhookUrl);

        // 4. Get the QR code for scanning
        let qrCode: string | null = null;
        try {
            qrCode = await getEvolutionQR(sessionName);
        } catch {
            // QR may not be ready immediately — frontend will poll
        }

        logEvent("info", `[whatsapp/relink] Instance recreated for ${sessionName}, awaiting QR scan`);

        return NextResponse.json({
            success: true,
            sessionName,
            qrBase64: qrCode,
            message: "WhatsApp re-linked. Scan the QR code to connect and import history.",
        });
    } catch (error) {
        logError("[whatsapp/relink] Re-link failed", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Re-link failed" },
            { status: 500 },
        );
    }
}
