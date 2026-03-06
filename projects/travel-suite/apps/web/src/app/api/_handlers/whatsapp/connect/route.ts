// POST /api/whatsapp/connect
// Creates (or resumes) a WPPConnect session for the caller's org, returns the QR code.
// Idempotent: safe to call multiple times — existing sessions are reused.
// createWahaSession now returns a Bearer token stored in whatsapp_connections.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    createWahaSession,
    getWahaQR,
    sessionNameFromOrgId,
} from "@/lib/whatsapp-waha.server";

export async function POST() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/waha`;

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
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
