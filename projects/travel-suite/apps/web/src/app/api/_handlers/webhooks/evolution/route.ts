/* ------------------------------------------------------------------
 * Evolution API inbound webhook -- handles connection, message, and history events.
 *
 * POST /api/webhooks/evolution
 *
 * Supported events:
 *   connection.update  — session lifecycle (open/close/connecting)
 *   messages.upsert    — real-time inbound + outbound messages
 *   messages.set       — full history dump (fires once after QR scan)
 *   send.message       — outbound messages sent via WhatsApp app
 *   qrcode.updated     — QR code changes during auth
 *
 * Security: shared secret via x-webhook-secret header,
 * with ?secret= query-param compatibility for transition.
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
import { logError, logEvent, logWarn } from "@/lib/observability/logger";

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
    readonly messageTimestamp?: number | string;
}

interface EvolutionConnectionData {
    readonly state: string;
}

interface EvolutionEvent {
    readonly event: string;
    readonly instance: string;
    readonly data: EvolutionConnectionData | EvolutionMessageData | readonly EvolutionMessageData[] | unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractMessageText(msg: EvolutionMessageData): string {
    return (
        msg.message?.conversation ??
        msg.message?.extendedTextMessage?.text ??
        ""
    );
}

function isGroupJid(jid: string): boolean {
    return jid.includes("@g.us");
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
    }

    // -----------------------------------------------------------------------
    // messages.upsert -- real-time inbound + outbound message
    // -----------------------------------------------------------------------
    else if (event.event === "messages.upsert") {
        const payload = event.data as EvolutionMessageData;
        const remoteJid = payload.key?.remoteJid ?? "";

        if (isGroupJid(remoteJid)) {
            return NextResponse.json({ ok: true });
        }

        const messageText = extractMessageText(payload);
        if (!messageText) {
            return NextResponse.json({ ok: true });
        }

        const waId = remoteJid.replace(/@s\.whatsapp\.net$/, "");
        const senderPhone = "+" + waId;
        const providerId = "evo_" + payload.key.id;
        const isFromMe = payload.key?.fromMe === true;

        // Deduplication check
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

        // Store both inbound AND outbound messages
        await admin.from("whatsapp_webhook_events").insert({
            provider_message_id: providerId,
            wa_id: waId,
            event_type: "text",
            payload_hash: payloadHash,
            processing_status: "received",
            metadata: {
                session: event.instance,
                body_preview: messageText.slice(0, 500),
                direction: isFromMe ? "out" : "in",
                pushName: payload.pushName ?? null,
            },
        });

        // Outbound messages: store only, no chatbot processing
        if (isFromMe) {
            return NextResponse.json({ ok: true });
        }

        // --- Inbound message processing (chatbot flow) ---

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

        // Skip chatbot for personal contacts — only auto-reply to business contacts.
        // A personal contact has imported message history but is NOT in the CRM.
        if (!internalProfile) {
            const { count: historyCount } = await admin
                .from("whatsapp_webhook_events")
                .select("id", { count: "exact", head: true })
                .eq("wa_id", waId)
                .filter("metadata->>session", "eq", event.instance)
                .filter("metadata->>imported", "eq", "true");

            if ((historyCount ?? 0) > 0) {
                // Has chat history but not in CRM — likely a friend/family member
                return NextResponse.json({ ok: true });
            }
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

    // -----------------------------------------------------------------------
    // messages.set -- history sync (fires once after QR scan with all loaded messages)
    // -----------------------------------------------------------------------
    else if (event.event === "messages.set") {
        const messages = Array.isArray(event.data)
            ? event.data as readonly EvolutionMessageData[]
            : [];

        if (messages.length === 0) {
            return NextResponse.json({ ok: true });
        }

        logEvent("info",`[webhooks/evolution] messages.set: importing ${messages.length} historical messages for ${event.instance}`);

        // Filter to personal chats with text content only
        const validMessages = messages.filter((msg) => {
            const jid = msg.key?.remoteJid ?? "";
            return !isGroupJid(jid) && jid.includes("@s.whatsapp.net") && extractMessageText(msg);
        });

        // Batch insert in chunks of 100
        const BATCH_SIZE = 100;
        let imported = 0;

        for (let i = 0; i < validMessages.length; i += BATCH_SIZE) {
            const batch = validMessages.slice(i, i + BATCH_SIZE);

            const rows = batch.map((msg) => {
                const waId = (msg.key?.remoteJid ?? "").replace(/@s\.whatsapp\.net$/, "");
                const providerId = "evo_hist_" + msg.key.id;
                const messageText = extractMessageText(msg);
                const isFromMe = msg.key?.fromMe === true;

                // Parse timestamp -- Baileys sends Unix epoch (seconds)
                const ts = msg.messageTimestamp;
                const receivedAt = ts
                    ? new Date(typeof ts === "string" ? parseInt(ts, 10) * 1000 : ts * 1000).toISOString()
                    : new Date().toISOString();

                return {
                    provider_message_id: providerId,
                    wa_id: waId,
                    event_type: "text" as const,
                    payload_hash: createHmac("sha256", providerId).update(providerId).digest("hex"),
                    processing_status: "received" as const,
                    received_at: receivedAt,
                    metadata: {
                        session: event.instance,
                        body_preview: messageText.slice(0, 500),
                        direction: isFromMe ? "out" : "in",
                        pushName: msg.pushName ?? null,
                        imported: true,
                    },
                };
            });

            // Upsert with ON CONFLICT DO NOTHING to skip duplicates
            const { error } = await admin
                .from("whatsapp_webhook_events")
                .upsert(rows, { onConflict: "provider_message_id", ignoreDuplicates: true });

            if (error) {
                logError(`[webhooks/evolution] messages.set batch insert error`, error);
            } else {
                imported += batch.length;
            }
        }

        logEvent("info",`[webhooks/evolution] messages.set: imported ${imported}/${validMessages.length} messages for ${event.instance}`);

        // Mark history as imported on the connection record
        await admin
            .from("whatsapp_connections")
            .update({ history_imported: true })
            .eq("session_name", event.instance);
    }

    // -----------------------------------------------------------------------
    // send.message -- outbound message sent via WhatsApp app (not through TripBuilt)
    // -----------------------------------------------------------------------
    else if (event.event === "send.message") {
        const payload = event.data as EvolutionMessageData;
        const remoteJid = payload.key?.remoteJid ?? "";

        if (isGroupJid(remoteJid) || !remoteJid.includes("@s.whatsapp.net")) {
            return NextResponse.json({ ok: true });
        }

        const messageText = extractMessageText(payload);
        if (!messageText) {
            return NextResponse.json({ ok: true });
        }

        const waId = remoteJid.replace(/@s\.whatsapp\.net$/, "");
        const providerId = "evo_out_" + payload.key.id;

        // Insert outbound message (skip if duplicate)
        await admin
            .from("whatsapp_webhook_events")
            .upsert([{
                provider_message_id: providerId,
                wa_id: waId,
                event_type: "text",
                payload_hash: createHmac("sha256", providerId).update(providerId).digest("hex"),
                processing_status: "received",
                metadata: {
                    session: event.instance,
                    body_preview: messageText.slice(0, 500),
                    direction: "out",
                    pushName: payload.pushName ?? null,
                },
            }], { onConflict: "provider_message_id", ignoreDuplicates: true });
    }

    return NextResponse.json({ ok: true });
}
