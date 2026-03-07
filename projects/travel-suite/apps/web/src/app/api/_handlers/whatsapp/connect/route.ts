// POST /api/whatsapp/connect
// Creates (or resumes) a WPPConnect session for the caller's org, returns the QR code.
// Idempotent: safe to call multiple times — existing sessions are reused.
// createWahaSession now returns a Bearer token stored in whatsapp_connections.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    createWahaSession,
    getWahaQR,
    sessionNameFromOrgId,
} from "@/lib/whatsapp-waha.server";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const WHATSAPP_CONNECT_RATE_LIMIT_MAX = 5;
const WHATSAPP_CONNECT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(_request: NextRequest) {
    try {
        const webhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET?.trim();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
        if (!webhookSecret) {
            return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 503 });
        }
        if (!appUrl) {
            return NextResponse.json({ error: "App URL is not configured" }, { status: 503 });
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rateLimit = await enforceRateLimit({
            identifier: user.id,
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

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json(
                { error: "No organization found" },
                { status: 400 },
            );
        }

        const { organization_id: orgId } = profile;
        const sessionName = sessionNameFromOrgId(orgId);
        const webhookUrl = `${appUrl}/api/webhooks/waha`;

        // Returns WPPConnect Bearer token — must be stored for subsequent calls
        const token = await createWahaSession(orgId, webhookUrl);

        const admin = createAdminClient();
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
