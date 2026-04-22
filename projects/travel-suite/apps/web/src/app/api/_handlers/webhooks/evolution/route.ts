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
    markCustomerFlowWelcomeSent,
    processChatbotMessage,
    sendChatbotReply,
} from "@/lib/whatsapp/chatbot-flow";
import { isUnsignedWebhookAllowed } from "@/lib/security/whatsapp-webhook-config";
import { validateWahaWebhookSecret } from "../waha/secret";
import { logError, logEvent, logWarn } from "@/lib/observability/logger";
import {
    getEvolutionMediaBase64,
    getEvolutionStatus,
} from "@/lib/whatsapp-evolution.server";
import { transcribeVoiceMessage } from "@/lib/whatsapp/voice-transcription";
import { ensureAssistantGroup } from "@/lib/whatsapp/ensure-assistant-group";
import { routeAssistantCommand } from "@/lib/whatsapp/assistant-commands";
import { getGeminiModel } from "@/lib/ai/gemini.server";
import { linkInboundReplyToCommsSequence } from "@/lib/platform/business-os-comms-linking";
import { maybeSendFirstContactWelcome } from "@/lib/whatsapp/first-contact-welcome.server";
import { findLatestTripRequestForPhone } from "@/lib/whatsapp/trip-intake.server";
import {
    describeAssistantMessageShape,
    extractAssistantMessageText,
    hasAudioMessageContent,
    shouldAttemptAssistantGroupRouting,
} from "@/lib/whatsapp/assistant-group-routing";

// ---------------------------------------------------------------------------
// In-memory lock: prevent duplicate assistant group creation during reconnect
// (connection.update fires multiple times in quick succession)
// ---------------------------------------------------------------------------

const groupCreationInProgress = new Set<string>();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvolutionMessageKey {
    readonly remoteJid: string;
    readonly id: string;
    readonly fromMe?: boolean;
    readonly participant?: string;
}

interface EvolutionMessageData {
    readonly key: EvolutionMessageKey;
    readonly message?: Record<string, unknown>;
    readonly pushName?: string;
    readonly messageTimestamp?: number | string;
    readonly participant?: string;
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
    return extractAssistantMessageText(msg.message);
}

function isGroupJid(jid: string): boolean {
    return jid.includes("@g.us");
}

function isVoiceMessage(msg: EvolutionMessageData): boolean {
    return hasAudioMessageContent(msg.message);
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function maybeRouteAssistantGroupCommand(
    eventName: string,
    instanceName: string,
    payload: EvolutionMessageData,
): Promise<boolean> {
    const remoteJid = payload.key?.remoteJid ?? "";
    if (!isGroupJid(remoteJid)) {
        return false;
    }

    const extractedText = extractAssistantMessageText(payload.message).trim();
    const routingCandidate = extractedText.length > 0 && shouldAttemptAssistantGroupRouting(extractedText);

    logEvent("info", "[webhooks/evolution] assistant group message observed", {
        event: eventName,
        instance: instanceName,
        remoteJid,
        fromMe: payload.key?.fromMe ?? null,
        participant: payload.key?.participant ?? payload.participant ?? null,
        messageShapeKeys: describeAssistantMessageShape(payload.message),
        extractedText: extractedText.slice(0, 160),
        routingCandidate,
    });

    if (!routingCandidate) {
        return false;
    }

    const handled = await routeAssistantCommand(instanceName, remoteJid, extractedText);
    logEvent(handled ? "info" : "warn", "[webhooks/evolution] assistant group routing result", {
        event: eventName,
        instance: instanceName,
        remoteJid,
        extractedText: extractedText.slice(0, 160),
        handled,
    });
    return handled;
}

// Assistant group commands are handled by routeAssistantCommand()
// from "@/lib/whatsapp/assistant-commands" — supports keyword commands,
// natural language AI queries, and rich formatted responses.

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
            const evolutionStatus = await getEvolutionStatus(event.instance).catch(() => null);
            const connectedPhone = evolutionStatus?.me?.id
                ? "+" + evolutionStatus.me.id.replace(/@s\.whatsapp\.net$/, "")
                : null;
            const displayName = evolutionStatus?.me?.pushName ?? null;

            await admin
                .from("whatsapp_connections")
                .update({
                    status: "connected",
                    connected_at: new Date().toISOString(),
                    ...(connectedPhone ? { phone_number: connectedPhone } : {}),
                    ...(displayName ? { display_name: displayName } : {}),
                })
                .eq("session_name", event.instance);

            // Auto-create TripBuilt Assistant WhatsApp group (best-effort, non-blocking)
            // Uses in-memory lock to prevent duplicates from concurrent connection.update events
            void (async () => {
                if (groupCreationInProgress.has(event.instance)) return;
                groupCreationInProgress.add(event.instance);
                try {
                    await ensureAssistantGroup(event.instance);
                } catch (err) {
                    logError("[webhooks/evolution] Failed to create assistant group", err);
                } finally {
                    groupCreationInProgress.delete(event.instance);
                }
            })();
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

        if (await maybeRouteAssistantGroupCommand("messages.upsert", event.instance, payload)) {
            return NextResponse.json({ ok: true });
        }

        // Skip all other group messages
        if (isGroupJid(remoteJid)) {
            return NextResponse.json({ ok: true });
        }

        const messageText = extractMessageText(payload);
        const isVoice = isVoiceMessage(payload);

        // Skip messages with neither text nor voice content
        if (!messageText && !isVoice) {
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

        // Voice message: transcribe via Whisper, then store with transcript
        if (isVoice) {
            const audioInfo = (payload.message?.audioMessage ?? {}) as {
                readonly mimetype?: string;
                readonly seconds?: number;
            };
            const duration = audioInfo.seconds ?? 0;
            let transcript = "";
            let intentData = null;

            // Attempt transcription (best-effort — store message even if transcription fails)
            try {
                const base64Audio = await getEvolutionMediaBase64(event.instance, payload.key.id);
                if (base64Audio) {
                        const result = await transcribeVoiceMessage(
                            base64Audio,
                            audioInfo.mimetype ?? "audio/ogg",
                        );
                    if (result) {
                        transcript = result.text;
                        intentData = result.intent;
                    }
                }
            } catch (err) {
                logError("[webhooks/evolution] voice transcription error", err);
            }

            const voiceMetadata = {
                session: event.instance,
                body_preview: transcript.slice(0, 500) || "[Voice message]",
                direction: isFromMe ? "out" : "in",
                pushName: payload.pushName ?? null,
                voice_duration: formatDuration(duration),
                voice_duration_seconds: duration,
                transcript: transcript || null,
                trip_intent: intentData ? JSON.parse(JSON.stringify(intentData)) : null,
            };

            await admin.from("whatsapp_webhook_events").upsert([{
                provider_message_id: providerId,
                wa_id: waId,
                event_type: "voice",
                payload_hash: payloadHash,
                processing_status: "received",
                metadata: voiceMetadata,
            }], { onConflict: "provider_message_id", ignoreDuplicates: true });

            // Voice messages don't trigger chatbot (yet) — just store and return
            return NextResponse.json({ ok: true });
        }

        // Store both inbound AND outbound text messages
        // Use upsert with ignoreDuplicates to handle race conditions and
        // duplicate events (messages.upsert + send.message fire for the same msg)
        await admin.from("whatsapp_webhook_events").upsert([{
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
        }], { onConflict: "provider_message_id", ignoreDuplicates: true });

        // Outbound messages: store only, no chatbot processing
        if (isFromMe) {
            return NextResponse.json({ ok: true });
        }

        // --- Inbound message processing (chatbot flow) ---

        const { data: rawConnection } = await admin
            .from("whatsapp_connections")
            .select("organization_id, session_name, session_token, assistant_group_jid, phone_number")
            .eq("session_name", event.instance)
            .maybeSingle();
        const connection = rawConnection as { organization_id?: string; session_name?: string; session_token?: string; assistant_group_jid?: string; phone_number?: string } | null;

        if (!connection?.organization_id) {
            return NextResponse.json({ ok: true });
        }

        const organizationId = connection.organization_id;
        const internalProfile = await findInternalWhatsAppProfile(
            organizationId,
            senderPhone,
        ).catch((error) => {
            logError("[webhooks/evolution] failed to resolve whatsapp profile", error);
            return null;
        });

        let isInternalOperator =
            internalProfile?.role === "admin" || internalProfile?.role === "super_admin";

        // Fallback: if profile lookup missed, check if sender IS the connected WhatsApp number
        if (!isInternalOperator && !internalProfile && connection.phone_number) {
            if (connection.phone_number === waId) {
                isInternalOperator = true;
            }
        }

        if (isInternalOperator) {
            await handleWhatsAppMessage(waId, messageText, senderPhone).catch(
                (err) => {
                    logError("[webhooks/evolution] message processing error", err);
                },
            );
            return NextResponse.json({ ok: true });
        }

        await linkInboundReplyToCommsSequence(admin, {
            orgId: organizationId,
            waId,
            messageId: providerId,
            body: messageText,
        }).catch((error) => {
            logError("[webhooks/evolution] failed to link inbound reply to Business OS", error, {
                organization_id: organizationId,
                wa_id: waId,
                provider_message_id: providerId,
            });
        });

        if (!internalProfile) {
            const [{ count: historyCount }, { count: inboundCount }] = await Promise.all([
                admin
                    .from("whatsapp_webhook_events")
                    .select("id", { count: "exact", head: true })
                    .eq("wa_id", waId)
                    .filter("metadata->>session", "eq", event.instance)
                    .filter("metadata->>imported", "eq", "true"),
                admin
                    .from("whatsapp_webhook_events")
                    .select("id", { count: "exact", head: true })
                    .eq("wa_id", waId)
                    .filter("metadata->>session", "eq", event.instance)
                    .filter("metadata->>direction", "eq", "in"),
            ]);

            if ((historyCount ?? 0) > 0) {
                return NextResponse.json({ ok: true });
            }

            const isFirstInboundFromNewContact = (inboundCount ?? 0) <= 1;

            if (isFirstInboundFromNewContact && messageText.trim().length > 0) {
                try {
                    const model = getGeminiModel();
                    const classifyResult = await model.generateContent(
                        `A tour operator just received a first WhatsApp message from an unknown number. Classify this message as BUSINESS unless it is clearly personal, friend/family, or unrelated to travel services. Message: "${messageText.slice(0, 300)}". Reply with ONLY one word: BUSINESS or PERSONAL`,
                    );
                    const classification = classifyResult.response.text().trim().toUpperCase();
                    if (classification === "PERSONAL") {
                        logEvent("info", "[webhooks/evolution] skipped first-contact welcome — personal message", {
                            waId,
                            organizationId,
                        });
                        return NextResponse.json({ ok: true });
                    }
                } catch {
                    logWarn("[webhooks/evolution] first-contact classification failed, proceeding without personal block");
                }

                const welcomeSent = await maybeSendFirstContactWelcome({
                    organizationId,
                    sessionName: event.instance,
                    phone: senderPhone,
                    pushName: payload.pushName ?? null,
                    initialMessage: messageText,
                }).catch((error) => {
                    logError("[webhooks/evolution] failed to send first-contact welcome", error, {
                        organizationId,
                        waId,
                    });
                    return false;
                });

                if (welcomeSent) {
                    const latestDraft = await findLatestTripRequestForPhone(
                        organizationId,
                        senderPhone,
                    ).catch(() => null);

                    if (latestDraft) {
                        await markCustomerFlowWelcomeSent({
                            organizationId,
                            phone: senderPhone,
                            draftId: latestDraft.id,
                            formToken: latestDraft.formToken,
                        }).catch((error) => {
                            logError("[webhooks/evolution] failed to persist welcome customer flow state", error, {
                                organizationId,
                                waId,
                            });
                        });
                    }

                    return NextResponse.json({ ok: true });
                }
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
                const providerId = "evo_" + msg.key.id;
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

        if (isGroupJid(remoteJid)) {
            return NextResponse.json({ ok: true });
        }

        const messageText = extractMessageText(payload).trim();
        if (!remoteJid.includes("@s.whatsapp.net")) {
            return NextResponse.json({ ok: true });
        }

        if (!messageText) {
            return NextResponse.json({ ok: true });
        }

        const waId = remoteJid.replace(/@s\.whatsapp\.net$/, "");
        const providerId = "evo_" + payload.key.id;

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

    // -----------------------------------------------------------------------
    // presence.update -- typing, recording, available, unavailable
    // -----------------------------------------------------------------------
    else if (event.event === "presence.update") {
        const data = event.data as {
            readonly id?: string;
            readonly presences?: Record<string, { readonly lastKnownPresence?: string; readonly lastSeen?: number }>;
        };

        const jid = data.id ?? "";
        if (!jid.includes("@s.whatsapp.net")) {
            return NextResponse.json({ ok: true });
        }

        const waId = jid.replace(/@s\.whatsapp\.net$/, "");
        const presenceEntries = data.presences ?? {};
        const firstEntry = Object.values(presenceEntries)[0];
        const presence = firstEntry?.lastKnownPresence ?? "unavailable";
        const lastSeen = firstEntry?.lastSeen
            ? new Date(firstEntry.lastSeen * 1000).toISOString()
            : null;

        await admin
            .from("whatsapp_presence")
            .upsert({
                session_name: event.instance,
                wa_id: waId,
                presence,
                last_seen_at: lastSeen,
                updated_at: new Date().toISOString(),
            }, { onConflict: "session_name,wa_id" });
    }

    // -----------------------------------------------------------------------
    // messages.update -- delivery/read status changes
    // -----------------------------------------------------------------------
    else if (event.event === "messages.update") {
        const messageLikeUpdate = !Array.isArray(event.data)
            ? event.data as EvolutionMessageData
            : null;

        const updateRemoteJid = messageLikeUpdate?.key?.remoteJid ?? "";

        if (isGroupJid(updateRemoteJid)) {
            if (messageLikeUpdate) {
                await maybeRouteAssistantGroupCommand("messages.update", event.instance, messageLikeUpdate);
            }
            return NextResponse.json({ ok: true });
        }

        const updates = Array.isArray(event.data)
            ? event.data as ReadonlyArray<{
                readonly key?: { readonly id?: string; readonly remoteJid?: string };
                readonly update?: { readonly status?: number };
              }>
            : [];

        for (const upd of updates) {
            const msgId = upd.key?.id;
            const status = upd.update?.status;
            if (!msgId || !status) continue;

            // WhatsApp status codes: 1=pending, 2=sent(server), 3=delivered, 4=read, 5=played
            const statusMap: Record<number, string> = {
                2: "sent",
                3: "delivered",
                4: "read",
                5: "read",
            };
            const statusLabel = statusMap[status];
            if (!statusLabel) continue;

            // Update the stored message's status in metadata
            const providerId = "evo_" + msgId;
            const { data: existing } = await admin
                .from("whatsapp_webhook_events")
                .select("id, metadata")
                .eq("provider_message_id", providerId)
                .maybeSingle();

            if (existing) {
                const meta = (existing.metadata ?? {}) as Record<string, unknown>;
                await admin
                    .from("whatsapp_webhook_events")
                    .update({
                        metadata: { ...meta, status: statusLabel, status_updated_at: new Date().toISOString() },
                    })
                    .eq("id", existing.id);
            }
        }
    }

    return NextResponse.json({ ok: true });
}
