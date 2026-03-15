// POST /api/whatsapp/connect
// Creates (or resumes) a WPPConnect session for the caller's org, returns the QR code.
// Idempotent: safe to call multiple times — existing sessions are reused.
// createWahaSession now returns a Bearer token stored in whatsapp_connections.
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import {
    createWahaSession,
    getWahaQR,
    sessionNameFromOrgId,
} from "@/lib/whatsapp-waha.server";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const WHATSAPP_CONNECT_RATE_LIMIT_MAX = 5;
const WHATSAPP_CONNECT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
    try {
        const webhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET?.trim();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
        if (!webhookSecret) {
            return apiError("Webhook secret is not configured", 503);
        }
        if (!appUrl) {
            return apiError("App URL is not configured", 503);
        }

        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { userId, organizationId, adminClient } = auth;

        const rateLimit = await enforceRateLimit({
            identifier: userId,
            limit: WHATSAPP_CONNECT_RATE_LIMIT_MAX,
            windowMs: WHATSAPP_CONNECT_RATE_LIMIT_WINDOW_MS,
            prefix: "api:whatsapp:connect",
        });
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: "Too many WhatsApp connect requests. Please retry later." },
                { status: 429 },
            );
        }

        const orgId = organizationId!;
        const sessionName = sessionNameFromOrgId(orgId);
        const webhookUrl = `${appUrl}/api/webhooks/waha`;

        const token = await createWahaSession(orgId, webhookUrl);

        const admin = adminClient;
        await admin.from("whatsapp_connections").upsert(
            {
                organization_id: orgId,
                session_name: sessionName,
                status: "connecting",
                session_token: token,
            },
            { onConflict: "organization_id" },
        );

        const qrBase64 = await getWahaQR(sessionName, token);

        return NextResponse.json({ success: true, sessionName, qrBase64 });
    } catch (error) {
        console.error("[whatsapp/connect] error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 },
        );
    }
}
