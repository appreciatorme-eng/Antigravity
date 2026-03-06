// POST /api/whatsapp/test-message
// Sends a test message from the connected session to the operator's own number.
// Fetches session_token from DB — WPPConnect requires Bearer auth for send-message.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWahaText } from "@/lib/whatsapp-waha.server";

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

        const admin = createAdminClient();
        const { data: connection } = await admin
            .from("whatsapp_connections")
            .select("session_name, session_token, phone_number, status")
            .eq("organization_id", profile.organization_id)
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
            "✅ TravelSuite test — your WhatsApp inbox is live! Reply to verify two-way messaging.",
        );

        return NextResponse.json({
            success: true,
            messageId: "wpp_" + Date.now(),
        });
    } catch (error) {
        console.error("[whatsapp/test-message] error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
