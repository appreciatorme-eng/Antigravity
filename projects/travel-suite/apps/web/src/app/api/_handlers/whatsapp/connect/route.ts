// POST /api/whatsapp/connect
// Creates (or resumes) an Evolution API instance for the caller's org, returns the QR code.
// Idempotent: safe to call multiple times -- existing instances are reused.
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import {
    createEvolutionInstance,
    deleteEvolutionInstance,
    getEvolutionQR,
    getEvolutionStatus,
    sessionNameFromOrgId,
} from "@/lib/whatsapp-evolution.server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";

const WHATSAPP_CONNECT_RATE_LIMIT_MAX = 5;
const WHATSAPP_CONNECT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
    try {
        let appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
        if (!appUrl) {
            return apiError("App URL is not configured", 503);
        }
        // Ensure www prefix to avoid 307 redirect that breaks webhook POST callbacks
        if (appUrl.includes("tripbuilt.com") && !appUrl.includes("www.")) {
            appUrl = appUrl.replace("://tripbuilt.com", "://www.tripbuilt.com");
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

        // Purge any lingering Evolution instance if DB shows disconnected
        // This prevents reconnecting from picking up cached/stale session state
        const { data: existingConn } = await adminClient
            .from("whatsapp_connections")
            .select("status")
            .eq("organization_id", orgId)
            .maybeSingle();

        if (!existingConn || existingConn.status === "disconnected") {
            await deleteEvolutionInstance(sessionName);
        }

        const webhookSecret =
            process.env.EVOLUTION_WEBHOOK_SECRET?.trim() ??
            process.env.WPPCONNECT_WEBHOOK_SECRET?.trim() ?? "";
        const webhookUrl = webhookSecret
            ? `${appUrl}/api/webhooks/evolution?secret=${encodeURIComponent(webhookSecret)}`
            : `${appUrl}/api/webhooks/evolution`;

        const instanceName = await createEvolutionInstance(orgId, webhookUrl);

        const admin = adminClient;
        await admin.from("whatsapp_connections").upsert(
            {
                organization_id: orgId,
                session_name: sessionName,
                status: "connecting",
                session_token: instanceName,
            },
            { onConflict: "session_name" },
        );

        // Check if session already connected (auto-reconnect from previous QR scan)
        try {
            const currentStatus = await getEvolutionStatus(instanceName);
            if (currentStatus.status === "CONNECTED") {
                await admin.from("whatsapp_connections").update({ status: "connected" })
                    .eq("session_name", sessionName);
                return NextResponse.json({
                    success: true,
                    sessionName,
                    status: "connected",
                    number: currentStatus.me?.id?.replace(/@.*/, "") ?? null,
                    name: currentStatus.me?.pushName ?? null,
                });
            }
        } catch {
            // Status check failed — instance still initializing, proceed to QR flow
        }

        // QR may not be ready immediately — Baileys needs a few seconds to boot.
        // Retry up to 3 times with 2s delays to catch the first QR in this request.
        let qrBase64: string | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                qrBase64 = await getEvolutionQR(instanceName);
                if (qrBase64) break;
            } catch {
                // QR not ready yet — wait and retry
            }
            if (attempt < 2) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
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
