/* ------------------------------------------------------------------
 * Evolution API inbound webhook -- handles connection.update and messages.upsert events.
 *
 * POST /api/webhooks/evolution
 *
 * Security: shared secret provided via x-webhook-secret header,
 * with ?secret= query-param compatibility for transition.
 *
 * Evolution event shapes:
 *   { event: "connection.update", instance: "org_xxx", data: { state: "open" | "close" | "connecting" } }
 *   { event: "messages.upsert", instance: "org_xxx", data: { key: { remoteJid, id }, message: { conversation }, pushName } }
 *   { event: "qrcode.updated", instance: "org_xxx", data: { qrcode: { base64 } } }
 * ------------------------------------------------------------------ */

import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";

import { createAdminClient } from "@/lib/supabase/admin";
import { handleWhatsAppMessage } from "@/lib/assistant/channel-adapters/whatsapp";
import {
    findInternalWhatsAppProfile,
    hasRecentHumanReply,
    isWhatsAppChatbotEnabled,
    processChatbotMessage,
    sendChatbotReply,
} from "@/lib/whatsapp/chatbot-flow";
import { isUnsignedWebhookAllowed } from "@/lib/security/whatsapp-webhook-config";
import { validateWahaWebhookSecret } from "../waha/secret";
import { logError, logWarn } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvolutionMessageKey {
    readonly remoteJid: string;
    readonly id: string;
    readonly fromMe?: boolean;
}

interface EvolutionMessageData {
    readonly key: EvolutionMessageKey;
    readonly message?: {
        readonly conversation?: string;
        readonly extendedTextMessage?: { readonly text?: string };
    };
    readonly pushName?: string;
}

interface EvolutionConnectionData {
    readonly state: string;
}

interface EvolutionEvent {
    readonly event: string;
    readonly instance: string;
    readonly data: EvolutionConnectionData | EvolutionMessageData | unknown;
}

// ---------------------------------------------------------------------------
// POST -- main handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
    let rawBody: string;
    try {
        rawBody = await request.text();
    } catch {
        return NextResponse.json({ ok: true });
    }

    const webhookSecret =
        process.env.EVOLUTION_WEBHOOK_SECRET?.trim() ||
        process.env.WPPCONNECT_WEBHOOK_SECRET?.trim();

    const validation = validateWahaWebhookSecret({
        requestUrl: request.url,
        configuredSecret: webhookSecret,
        allowUnsigned: isUnsignedWebhookAllowed(),
        providedHeaderSecret: request.headers.get("x-webhook-secret"),
    });
    if (!validation.ok) {
        if (validation.status === 503) {
            logError("[webhooks/evolution] webhook secret not configured", undefined);
        } else {
            logWarn("[webhooks/evolution] Invalid or missing webhook secret");
        }
        return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    let event: EvolutionEvent;
    try {
        event = JSON.parse(rawBody) as EvolutionEvent;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    const admin = createAdminClient();

    // -----------------------------------------------------------------------
    // connection.update -- session lifecycle
    // -----------------------------------------------------------------------
    if (event.event === "connection.update") {
        const data = event.data as EvolutionConnectionData;
        const state = data.state ?? "";

        if (state === "open") {
            await admin
                .from("whatsapp_connections")
                .update({
                    status: "connected",
                    connected_at: new Date().toISOString(),
                })
                .eq("session_name", event.instance);
        } else if (state === "close") {
            await admin
                .from("whatsapp_connections")
                .update({ status: "disconnected" })
                .eq("session_name", event.instance);
        }
        // "connecting" -- leave status as-is (still connecting)
    }

    // -----------------------------------------------------------------------
    // messages.upsert -- incoming WhatsApp message
    // -----------------------------------------------------------------------
    else if (event.event === "messages.upsert") {
        const payload = event.data as EvolutionMessageData;

        const remoteJid = payload.key?.remoteJid ?? "";

        // Skip group messages
        if (remoteJid.includes("@g.us")) {
            return NextResponse.json({ ok: true });
        }

        // Skip outgoing messages
        if (payload.key?.fromMe) {
            return NextResponse.json({ ok: true });
        }

        const messageText =
            payload.message?.conversation ??
            payload.message?.extendedTextMessage?.text ??
            "";

        if (!messageText) {
            return NextResponse.json({ ok: true });
        }

        const waId = remoteJid.replace(/@s\.whatsapp\.net$/, "");
        const senderPhone = "+" + waId;
        const providerId = "evo_" + payload.key.id;

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
            processing_status: "received",
            metadata: {
                session: event.instance,
                body_preview: messageText.slice(0, 500),
                direction: "in",
                pushName: payload.pushName ?? null,
            },
        });

        const { data: connection } = await admin
            .from("whatsapp_connections")
            .select("organization_id, session_name, session_token")
            .eq("session_name", event.instance)
            .maybeSingle();

        if (!connection?.organization_id) {
            return NextResponse.json({ ok: true });
        }

        const organizationId = connection.organization_id as string;
        const internalProfile = await findInternalWhatsAppProfile(
            organizationId,
            senderPhone,
        ).catch((error) => {
            logError("[webhooks/evolution] failed to resolve whatsapp profile", error);
            return null;
        });

        const isInternalOperator =
            internalProfile?.role === "admin" || internalProfile?.role === "super_admin";

        if (isInternalOperator) {
            await handleWhatsAppMessage(waId, messageText, senderPhone).catch(
                (err) => {
                    logError("[webhooks/evolution] message processing error", err);
                },
            );
            return NextResponse.json({ ok: true });
        }

        const chatbotEnabled = await isWhatsAppChatbotEnabled().catch((error) => {
            logError("[webhooks/evolution] failed to resolve chatbot flag", error);
            return false;
        });

        if (!chatbotEnabled) {
            return NextResponse.json({ ok: true });
        }

        const recentHumanReply = await hasRecentHumanReply(event.instance, waId).catch(
            (error) => {
                logError("[webhooks/evolution] failed to inspect recent human reply", error);
                return true;
            },
        );

        if (recentHumanReply) {
            return NextResponse.json({ ok: true });
        }

        const chatbotResult = await processChatbotMessage({
            phone: senderPhone,
            incomingMessage: messageText,
            organizationId,
        }).catch((error) => {
            logError("[webhooks/evolution] chatbot processing error", error);
            return null;
        });

        if (!chatbotResult?.reply) {
            return NextResponse.json({ ok: true });
        }

        await sendChatbotReply({
            organizationId,
            sessionName: event.instance,
            sessionToken: connection.session_token ?? "",
            waId,
            chatbotSessionId: chatbotResult.sessionId,
            reply: chatbotResult.reply,
        }).catch((error) => {
            logError("[webhooks/evolution] failed to send chatbot reply", error);
        });
    }

    return NextResponse.json({ ok: true });
}
