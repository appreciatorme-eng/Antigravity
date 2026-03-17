// POST /api/whatsapp/test-message
// Sends a test message from the connected session to the operator's own number.
// Requires admin role — any member could otherwise trigger real outbound messages.
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { sendWahaText } from "@/lib/whatsapp-waha.server";
import { logError } from "@/lib/observability/logger";

export async function POST(request: Request) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, userId, adminClient } = auth;

        const { data: connection } = await adminClient
            .from("whatsapp_connections")
            .select("session_name, session_token, phone_number, status")
            .eq("organization_id", organizationId!)
            .single();

        if (
            !connection ||
            connection.status !== "connected" ||
            !connection.phone_number ||
            !connection.session_token
        ) {
            return NextResponse.json(
                { error: "WhatsApp not connected" },
                { status: 400 },
            );
        }

        const phoneDigits = connection.phone_number.replace(/\D/g, "");
        await sendWahaText(
            connection.session_name,
            connection.session_token,
            phoneDigits,
            "✅ TripBuilt test — your WhatsApp inbox is live! Reply to verify two-way messaging.",
        );

        console.info("[whatsapp/test-message] sent by admin", { userId, organizationId });

        return NextResponse.json({
            success: true,
            messageId: "wpp_" + Date.now(),
        });
    } catch (error) {
        logError("[whatsapp/test-message] error", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
