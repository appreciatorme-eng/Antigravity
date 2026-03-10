// POST /api/whatsapp/disconnect
// Closes the WPPConnect session for the caller's org and marks the DB row disconnected.
// Fetches session_token from DB for WPPConnect Bearer auth before closing.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
    disconnectWahaSession,
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

        const sessionName = sessionNameFromOrgId(profile.organization_id);
        const admin = createAdminClient();

        // Fetch token before updating the row
        const { data: connection } = await admin
            .from("whatsapp_connections")
            .select("session_token")
            .eq("organization_id", profile.organization_id)
            .single();

        await disconnectWahaSession(sessionName, connection?.session_token ?? undefined);

        await admin
            .from("whatsapp_connections")
            .update({
                status: "disconnected",
                phone_number: null,
                display_name: null,
                connected_at: null,
                session_token: null,
            })
            .eq("organization_id", profile.organization_id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[whatsapp/disconnect] error:", error);
        const message = safeErrorMessage(error, "Request failed");
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
