// POST /api/whatsapp/connect
// WhatsApp integration: Meta Cloud API only. WPPConnect path removed (see CLAUDE.md).
// Creates (or resumes) a WAHA session for the caller's org, returns the QR code.
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
import { logError } from "@/lib/observability/logger";

const WHATSAPP_CONNECT_RATE_LIMIT_MAX = 5;
const WHATSAPP_CONNECT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
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

        // QR may not be ready yet (Chrome takes 15-60s to boot on Fly.io).
        // Return success with null QR — the frontend polls /api/whatsapp/qr every 5s.
        let qrBase64: string | null = null;
        try {
            qrBase64 = await getWahaQR(sessionName, token);
        } catch {
            // QR not ready yet — expected during cold start, frontend will poll
        }

        return NextResponse.json({ success: true, sessionName, qrBase64 });
    } catch (error) {
        logError("[whatsapp/connect] error", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 },
        );
    }
}
