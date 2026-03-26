// GET /api/whatsapp/qr
// Returns { qrBase64: string } -- call every 15 s while QR is visible (expires ~60 s).
// Session name is read from whatsapp_connections (never trusted from query param).
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { getEvolutionQR } from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;

        const { data: conn } = await adminClient
            .from("whatsapp_connections")
            .select("session_name")
            .eq("organization_id", organizationId!)
            .maybeSingle();
        const sessionName = (conn as { session_name?: string } | null)?.session_name;
        if (!sessionName) return apiError("No active WhatsApp session", 404);

        // QR may not be ready yet (Baileys needs ~5-10s to boot).
        // Return null instead of 500 so the frontend keeps polling.
        let qrBase64: string | null = null;
        try {
            qrBase64 = await getEvolutionQR(sessionName);
        } catch (qrError) {
            logError("[whatsapp/qr] QR not ready yet", qrError);
        }
        return NextResponse.json({ qrBase64 });
    } catch (error) {
        logError("[whatsapp/qr] error", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
