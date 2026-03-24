// GET /api/whatsapp/qr
// Returns { qrBase64: string } -- call every 15 s while QR is visible (expires ~60 s).
// Session name is derived server-side from organizationId (never trusted from query param).
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { getEvolutionQR, sessionNameFromOrgId } from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId } = auth;

        const sessionName = sessionNameFromOrgId(organizationId!);

        const qrBase64 = await getEvolutionQR(sessionName);
        return NextResponse.json({ qrBase64 });
    } catch (error) {
        logError("[whatsapp/qr] error", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
