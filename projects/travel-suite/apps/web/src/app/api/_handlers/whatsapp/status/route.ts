// GET /api/whatsapp/status?sessionName=org_xxx
// Returns the current WAHA session status mapped to a simple frontend shape.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWahaStatus } from "@/lib/whatsapp-waha.server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sessionName = req.nextUrl.searchParams.get("sessionName");
        if (!sessionName) {
            return NextResponse.json(
                { error: "Missing sessionName" },
                { status: 400 },
            );
        }

        const wahaSession = await getWahaStatus(sessionName);

        if (wahaSession.status === "WORKING" && wahaSession.me) {
            return NextResponse.json({
                status: "connected",
                number: "+" + wahaSession.me.id,
                name: wahaSession.me.pushName,
            });
        }

        if (
            wahaSession.status === "SCAN_QR_CODE" ||
            wahaSession.status === "STARTING"
        ) {
            return NextResponse.json({ status: "pending" });
        }

        return NextResponse.json({ status: "disconnected" });
    } catch (error) {
        console.error("[whatsapp/status] error:", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
