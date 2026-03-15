// GET /api/whatsapp/qr
// Returns { qrBase64: string } — call every 15 s while QR is visible (expires ~60 s).
// Session name is derived server-side from organizationId (never trusted from query param).
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { getWahaQR, sessionNameFromOrgId } from "@/lib/whatsapp-waha.server";

export async function GET(request: NextRequest) {
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

        if (!connection?.session_token) {
            return NextResponse.json(
                { error: "Session not found — call /api/whatsapp/connect first" },
                { status: 404 },
            );
        }

        const qrBase64 = await getWahaQR(sessionName, connection.session_token);
        return NextResponse.json({ qrBase64 });
    } catch (error) {
        console.error("[whatsapp/qr] error:", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
