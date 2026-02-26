import { NextResponse } from "next/server";

export async function POST() {
    // In a real scenario, passing the instanceId, target number, and message
    // payload to the whatsapp-web.js or Evolution API service would dispatch the message.

    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API dispatch time

    return NextResponse.json({
        success: true,
        messageId: "mock-message-id-" + Date.now(),
    });
}
