import { NextResponse } from "next/server";
import { ensureMockEndpointAllowed } from "@/lib/security/mock-endpoint-guard";

export async function POST() {
    const guard = ensureMockEndpointAllowed("/api/whatsapp/connect:POST");
    if (guard) return guard;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockInstanceId = "instance_" + Date.now();
    const mockQrData = "1@E3o6H9QjKz...fake...QR...DATA";

    return NextResponse.json({
        success: true,
        instanceId: mockInstanceId,
        qrCode: mockQrData,
    });
}
