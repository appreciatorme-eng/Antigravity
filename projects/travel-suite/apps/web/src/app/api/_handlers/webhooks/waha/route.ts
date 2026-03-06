/* ------------------------------------------------------------------
 * WAHA inbound webhook — handles session.status and message events.
 *
 * POST: Process WAHA events (session lifecycle + incoming messages).
 *
 * Security: HMAC-SHA256 via X-Webhook-Hmac header (no "sha256=" prefix).
 * In dev without WAHA_WEBHOOK_SECRET the check is skipped (logged warning).
 * ------------------------------------------------------------------ */

import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { handleWhatsAppMessage } from "@/lib/assistant/channel-adapters/whatsapp";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WahaStatusPayload {
    readonly status: string;
    readonly me?: {
        readonly id: string;
        readonly pushName: string;
    };
}

interface WahaMessagePayload {
    readonly id: string;
    readonly from: string;
    readonly body?: string;
    readonly type?: string;
}

interface WahaEvent {
    readonly event: string;
    readonly session: string;
    readonly payload: WahaStatusPayload | WahaMessagePayload;
}

// ---------------------------------------------------------------------------
// HMAC verification (WAHA sends X-Webhook-Hmac, no "sha256=" prefix)
// ---------------------------------------------------------------------------

function verifyWahaHmac(
    rawBody: string,
    hmacHeader: string,
    secret: string,
): boolean {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const providedBuffer = Buffer.from(hmacHeader, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(providedBuffer, expectedBuffer);
}

// ---------------------------------------------------------------------------
// POST — main handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
    let rawBody: string;
    try {
        rawBody = await request.text();
    } catch {
        return NextResponse.json({ ok: true });
    }

    const secret = process.env.WAHA_WEBHOOK_SECRET;
    const hmacHeader = request.headers.get("X-Webhook-Hmac");

    if (secret) {
        if (!hmacHeader) {
            console.warn("[webhooks/waha] Missing X-Webhook-Hmac header");
            return new Response("Unauthorized", { status: 401 });
        }
        if (!verifyWahaHmac(rawBody, hmacHeader, secret)) {
            console.warn("[webhooks/waha] HMAC mismatch — rejecting event");
            return new Response("Unauthorized", { status: 401 });
        }
    } else {
        console.warn(
            "[webhooks/waha] WAHA_WEBHOOK_SECRET not set — skipping HMAC verification",
        );
    }

    let event: WahaEvent;
    try {
        event = JSON.parse(rawBody) as WahaEvent;
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const admin = createAdminClient();

    if (event.event === "session.status") {
        const payload = event.payload as WahaStatusPayload;

        if (payload.status === "WORKING" && payload.me) {
            await admin
                .from("whatsapp_connections")
                .update({
                    status: "connected",
                    phone_number: "+" + payload.me.id,
                    display_name: payload.me.pushName,
                    connected_at: new Date().toISOString(),
                })
                .eq("session_name", event.session);
        } else if (
            payload.status === "STOPPED" ||
            payload.status === "FAILED"
        ) {
            await admin
                .from("whatsapp_connections")
                .update({ status: "disconnected" })
                .eq("session_name", event.session);
        }
    } else if (event.event === "message") {
        const payload = event.payload as WahaMessagePayload;

        if (payload.type !== "chat" || !payload.body) {
            return NextResponse.json({ ok: true });
        }

        const waId = payload.from.replace(/@c\.us$/, "");
        const senderPhone = "+" + waId;
        const providerId = "waha_" + payload.id;

        const { count } = await admin
            .from("whatsapp_webhook_events")
            .select("id", { count: "exact", head: true })
            .eq("provider_message_id", providerId);

        if ((count ?? 0) > 0) {
            return NextResponse.json({ ok: true });
        }

        const payloadHash = createHmac("sha256", providerId)
            .update(rawBody)
            .digest("hex");

        await admin.from("whatsapp_webhook_events").insert({
            provider_message_id: providerId,
            wa_id: waId,
            event_type: "text",
            payload_hash: payloadHash,
            metadata: { session: event.session },
        });

        await handleWhatsAppMessage(waId, payload.body, senderPhone).catch(
            (err) => {
                console.error("[webhooks/waha] message processing error:", err);
            },
        );
    }

    return NextResponse.json({ ok: true });
}
