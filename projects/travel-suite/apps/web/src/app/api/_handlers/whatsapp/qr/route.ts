// GET /api/whatsapp/qr?sessionName=org_xxx
// Returns { qrBase64: string } — call every 15 s while QR is visible (expires ~60 s).
// Fetches session_token from DB for WPPConnect Bearer auth.
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { getWahaQR } from "@/lib/whatsapp-waha.server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", 401);
        }

        const sessionName = req.nextUrl.searchParams.get("sessionName");
        if (!sessionName) {
            return NextResponse.json(
                { error: "Missing sessionName" },
                { status: 400 },
            );
        }

        const admin = createAdminClient();
        const { data: connection } = await admin
            .from("whatsapp_connections")
            .select("session_token")
            .eq("session_name", sessionName)
            .single();

        if (!connection?.session_token) {
            return NextResponse.json(
                { error: "Session not found — call /api/whatsapp/connect first" },
                { status: 404 },
            );
        }

        const qrBase64 = await getWahaQR(sessionName, connection.session_token);
        return NextResponse.json({ qrBase64 });
    } catch (error) {
        console.error("[whatsapp/qr] error:", error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
