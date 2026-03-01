import { NextResponse } from "next/server";
import { ensureMockEndpointAllowed } from "@/lib/security/mock-endpoint-guard";

export async function POST() {
    const guard = ensureMockEndpointAllowed("/api/whatsapp/test-message:POST");
    if (guard) return guard;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
        success: true,
        messageId: "mock-message-id-" + Date.now(),
    });
}
