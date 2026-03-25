/* ------------------------------------------------------------------
 * POST /api/admin/whatsapp/relink
 * Re-links WhatsApp by deleting + recreating the Evolution instance.
 * Uses a unique instance name so Evolution cannot reuse cached auth.
 * This forces a fresh QR scan which triggers MESSAGES_SET with full
 * conversation history. Existing messages in TripBuilt are preserved.
 * ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import {
    logoutAndDeleteInstance,
    sessionNameFromOrgId,
    uniqueSessionName,
    createEvolutionInstance,
    getEvolutionQR,
} from "@/lib/whatsapp-evolution.server";
import { logError, logEvent } from "@/lib/observability/logger";

export async function POST(request: Request): Promise<Response> {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId, adminClient } = auth;
    const orgId = organizationId!;

    // Read actual session_name from DB (may include a unique suffix)
    const { data: conn } = await adminClient
        .from("whatsapp_connections")
        .select("session_name")
        .eq("organization_id", orgId)
        .maybeSingle();

    const oldSessionName = conn?.session_name ?? sessionNameFromOrgId(orgId);

    try {
        logEvent("info", `[whatsapp/relink] Starting re-link for ${oldSessionName}`);

        // 1. Logout + delete the existing instance
        await logoutAndDeleteInstance(oldSessionName);

        // 2. Generate a unique name so Evolution can't reuse cached auth
        const newSessionName = uniqueSessionName(orgId);

        // 3. Update connection status with new session name
        if (conn) {
            await adminClient
                .from("whatsapp_connections")
                .update({
                    session_name: newSessionName,
                    status: "disconnected",
                    history_imported: false,
                })
                .eq("organization_id", orgId);
        }

        // 4. Recreate the instance with updated webhook events
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
        await createEvolutionInstance(newSessionName, webhookUrl);

        // 5. Get the QR code for scanning
        let qrCode: string | null = null;
        try {
            qrCode = await getEvolutionQR(newSessionName);
        } catch {
            // QR may not be ready immediately — frontend will poll
        }

        logEvent("info", `[whatsapp/relink] Instance recreated as ${newSessionName}, awaiting QR scan`);

        return NextResponse.json({
            success: true,
            sessionName: newSessionName,
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
