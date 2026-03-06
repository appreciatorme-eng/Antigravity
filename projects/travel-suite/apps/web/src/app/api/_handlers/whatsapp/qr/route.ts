// GET /api/whatsapp/qr?sessionName=org_xxx
// Returns { qrBase64: string } — call every 15 s while QR is visible (expires ~60 s).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWahaQR } from "@/lib/whatsapp-waha.server";

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

        const qrBase64 = await getWahaQR(sessionName);
        return NextResponse.json({ qrBase64 });
    } catch (error) {
        console.error("[whatsapp/qr] error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
