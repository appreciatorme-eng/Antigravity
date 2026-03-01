import { NextRequest, NextResponse } from "next/server";
import { ensureMockEndpointAllowed } from "@/lib/security/mock-endpoint-guard";

export async function GET(req: NextRequest) {
    const guard = ensureMockEndpointAllowed("/api/whatsapp/status:GET");
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");

    if (!instanceId) {
        return NextResponse.json({ error: "No instance ID" }, { status: 400 });
    }

    try {
        const parts = instanceId.split("_");
        const createdAt = parseInt(parts[1], 10);

        const now = Date.now();
        const elapsed = now - createdAt;

        if (elapsed > 6000) {
            return NextResponse.json({
                status: "connected",
                number: "+91 98765 43210",
                name: "GoBuddy Travel Co.",
            });
        }

        return NextResponse.json({ status: "pending" });
    } catch {
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
