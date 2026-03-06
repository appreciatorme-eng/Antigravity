/* ------------------------------------------------------------------
 * WPPConnect inbound webhook — handles onStateChange and onMessage events.
 *
 * POST: Process WPPConnect events (session lifecycle + incoming messages).
 *
 * Security: shared secret in ?secret= query param (WPPConnect has no HMAC).
 * Set WPPCONNECT_WEBHOOK_SECRET on Vercel. Skip check if not set (dev only).
 *
 * WPPConnect event shape:
 *   { event: "onStateChange", session: "org_xxx", token: "...", response: "CONNECTED" }
 *   { event: "onMessage",     session: "org_xxx", token: "...", response: { id, from, body, type } }
 * ------------------------------------------------------------------ */

import { createHmac } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { handleWhatsAppMessage } from "@/lib/assistant/channel-adapters/whatsapp";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WppMessageResponse {
    readonly id: string;
    readonly from: string;
    readonly body?: string;
    readonly type?: string;
    readonly isGroupMsg?: boolean;
}

interface WppEvent {
    readonly event: string;
    readonly session: string;
    readonly token?: string;
    readonly response: string | WppMessageResponse | unknown;
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

    // Secret verification via ?secret= query param (WPPConnect has no built-in HMAC)
    const webhookSecret = process.env.WPPCONNECT_WEBHOOK_SECRET;
    if (webhookSecret) {
        const url = new URL(request.url);
        const providedSecret = url.searchParams.get("secret");
        if (providedSecret !== webhookSecret) {
            console.warn("[webhooks/waha] Invalid or missing ?secret= param");
            return new Response("Unauthorized", { status: 401 });
        }
    } else {
        console.warn(
            "[webhooks/waha] WPPCONNECT_WEBHOOK_SECRET not set — skipping verification",
        );
    }

    let event: WppEvent;
    try {
        event = JSON.parse(rawBody) as WppEvent;
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const admin = createAdminClient();

    // -----------------------------------------------------------------------
    // onStateChange — session lifecycle (QR scanned, connected, disconnected)
    // -----------------------------------------------------------------------
    if (event.event === "onStateChange") {
        const state = typeof event.response === "string" ? event.response : "";

        if (state === "CONNECTED") {
            // Mark connected; phone_number is updated via DB poll or future onSession event
            await admin
                .from("whatsapp_connections")
                .update({
                    status: "connected",
                    connected_at: new Date().toISOString(),
                })
                .eq("session_name", event.session);
        } else if (
            state === "DISCONNECTED" ||
            state === "UNPAIRED" ||
            state === "TIMEOUT"
        ) {
            await admin
                .from("whatsapp_connections")
                .update({ status: "disconnected" })
                .eq("session_name", event.session);
        }
        // qrReadSuccess / PAIRING / STARTING → leave status as-is (still connecting)
    }

    // -----------------------------------------------------------------------
    // onSession — fires after QR scan with device info including phone number
    // -----------------------------------------------------------------------
    else if (event.event === "onSession") {
        const resp = event.response as { id?: string; pushName?: string } | null;
        if (resp?.id) {
            const rawId = resp.id.replace(/@c\.us$/, "");
            await admin
                .from("whatsapp_connections")
                .update({
                    status: "connected",
                    phone_number: "+" + rawId,
                    display_name: resp.pushName ?? null,
                    connected_at: new Date().toISOString(),
                })
                .eq("session_name", event.session);
        }
    }

    // -----------------------------------------------------------------------
    // onMessage — incoming WhatsApp message
    // -----------------------------------------------------------------------
    else if (event.event === "onMessage") {
        const payload = event.response as WppMessageResponse;

        if (payload.isGroupMsg || payload.type !== "chat" || !payload.body) {
            return NextResponse.json({ ok: true });
        }

        const waId = payload.from.replace(/@c\.us$/, "");
        const senderPhone = "+" + waId;
        const providerId = "wpp_" + payload.id;

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
