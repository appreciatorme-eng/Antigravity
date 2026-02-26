import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const instanceId = searchParams.get("instanceId");

    if (!instanceId) {
        return NextResponse.json({ error: "No instance ID" }, { status: 400 });
    }

    try {
        // Extract the created timestamp from our mock ID: instance_17140...
        const parts = instanceId.split("_");
        const createdAt = parseInt(parts[1], 10);

        // Mock connection simulation: If 6 seconds have passed, we pretend the operator
        // scanned the QR code via their phone's WhatsApp linked devices
        const now = Date.now();
        const elapsed = now - createdAt;

        if (elapsed > 6000) {
            return NextResponse.json({
                status: "connected",
                number: "+91 98765 43210", // A mock Indian tour operator number
                name: "GoBuddy Travel Co."
            });
        }

        // Still pending user to scan QR
        return NextResponse.json({ status: "pending" });

    } catch (e) {
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
