// POST /api/whatsapp/disconnect
// Stops the WAHA session for the caller's org and marks the DB row disconnected.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

        await disconnectWahaSession(sessionName);

        const admin = createAdminClient();
        await admin
            .from("whatsapp_connections")
            .update({
                status: "disconnected",
                phone_number: null,
                display_name: null,
                connected_at: null,
            })
            .eq("organization_id", profile.organization_id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[whatsapp/disconnect] error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
