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
import {
    getEvolutionMediaBase64,
    createEvolutionGroup,
    updateEvolutionGroupDescription,
    sendEvolutionText,
} from "@/lib/whatsapp-evolution.server";
import { transcribeVoiceMessage } from "@/lib/whatsapp/voice-transcription";
import { notifyNewLead } from "@/lib/whatsapp/assistant-notifications";

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
        readonly audioMessage?: {
            readonly mimetype?: string;
            readonly seconds?: number;
            readonly ptt?: boolean;
        };
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

function isVoiceMessage(msg: EvolutionMessageData): boolean {
    return !!msg.message?.audioMessage;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Assistant group command handler
// ---------------------------------------------------------------------------

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function handleAssistantGroupCommand(
    admin: SupabaseAdmin,
    instanceName: string,
    groupJid: string,
    command: string,
): Promise<boolean> {
    // Verify this is actually the assistant group
    const { data: rawConn } = await admin
        .from("whatsapp_connections")
        .select("organization_id, assistant_group_jid")
        .eq("session_name", instanceName)
        .maybeSingle();
    const conn = rawConn as { organization_id?: string; assistant_group_jid?: string } | null;

    if (!conn?.assistant_group_jid || conn.assistant_group_jid !== groupJid) {
        return false; // Not the assistant group — skip
    }

    const orgId = conn.organization_id as string;
    let reply = "";

    switch (command) {
        case "help":
        case "?":
            reply = [
                "🤖 *TripBuilt Assistant Commands*",
                "",
                "📋 *pickups* — Today's pickup schedule",
                "💰 *payments* — Pending payments",
                "🆕 *leads* — Recent unresponded leads",
                "📊 *brief* — Re-send today's daily briefing",
                "❓ *help* — Show this menu",
            ].join("\n");
            break;

        case "pickups":
        case "pickup":
        case "trips today": {
            const today = new Date().toISOString().slice(0, 10);
            const { data: trips } = await admin
                .from("trips")
                .select("id, destination, start_date, pax_count, status, itineraries(trip_title)")
                .eq("organization_id", orgId)
                .eq("start_date", today)
                .limit(10);

            if (!trips || trips.length === 0) {
                reply = "📋 *Today's Pickups*\n\nNo trips scheduled for today.";
            } else {
                const lines = trips.map((t, i) => {
                    const title = (t.itineraries as { trip_title?: string } | null)?.trip_title ?? t.destination ?? "Untitled";
                    return `${i + 1}. ${title} — ${t.pax_count ?? "?"} pax (${t.status ?? "active"})`;
                });
                reply = `📋 *Today's Pickups (${trips.length})*\n\n${lines.join("\n")}`;
            }
            break;
        }

        case "payments":
        case "payment":
        case "pending": {
            const { data: rawLinks } = await admin
                .from("payment_links")
                .select("client_name, amount_paise, status, created_at")
                .eq("organization_id", orgId)
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(10);
            const links = (rawLinks ?? []) as ReadonlyArray<{ client_name: string | null; amount_paise: number; status: string; created_at: string }>;

            if (links.length === 0) {
                reply = "💰 *Pending Payments*\n\nNo pending payments. All clear! ✅";
            } else {
                const total = links.reduce((sum, l) => sum + (l.amount_paise ?? 0), 0);
                const lines = links.map((l) => {
                    const amt = `₹${((l.amount_paise ?? 0) / 100).toLocaleString("en-IN")}`;
                    return `• ${l.client_name ?? "Unknown"} — ${amt}`;
                });
                reply = [
                    `💰 *Pending Payments (${links.length})*`,
                    `Total: ₹${(total / 100).toLocaleString("en-IN")}`,
                    "",
                    ...lines,
                ].join("\n");
            }
            break;
        }

        case "leads":
        case "lead":
        case "new": {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: rawEvents } = await admin
                .from("whatsapp_webhook_events")
                .select("wa_id, metadata")
                .filter("metadata->>direction", "eq", "in")
                .gte("created_at", yesterday)
                .order("created_at", { ascending: false })
                .limit(15);
            const events = (rawEvents ?? []) as ReadonlyArray<{ wa_id: string; metadata: Record<string, unknown> | null }>;

            // Deduplicate by wa_id
            const seen = new Set<string>();
            const unique = events.filter((e) => {
                if (seen.has(e.wa_id)) return false;
                seen.add(e.wa_id);
                return true;
            });

            if (unique.length === 0) {
                reply = "🆕 *Recent Leads*\n\nNo new inbound messages in the last 24 hours.";
            } else {
                const lines = unique.slice(0, 8).map((e) => {
                    const meta = e.metadata as { body_preview?: string; pushName?: string } | null;
                    const name = meta?.pushName ?? `+${e.wa_id}`;
                    const preview = (meta?.body_preview ?? "").slice(0, 40);
                    return `• ${name}: "${preview}"`;
                });
                reply = `🆕 *Recent Leads (${unique.length})*\n\n${lines.join("\n")}`;
            }
            break;
        }

        case "brief":
        case "briefing":
        case "summary":
            reply = "📊 Generating your daily briefing...\n\n(Full briefing is sent automatically at 6:30 AM IST)";
            // TODO: call the briefing generator and send the full brief
            break;

        default:
            return false; // Unknown command — don't consume the message
    }

    if (reply) {
        await sendEvolutionText(instanceName, groupJid, reply).catch((err) => {
            logError("[webhooks/evolution] Failed to send assistant command reply", err);
        });
    }

    return true;
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

            // Auto-create TripBuilt Assistant WhatsApp group (best-effort, non-blocking)
            void (async () => {
                try {
                    const { data: rawConn2 } = await admin
                        .from("whatsapp_connections")
                        .select("assistant_group_jid, phone_number")
                        .eq("session_name", event.instance)
                        .maybeSingle();
                    const conn = rawConn2 as { assistant_group_jid?: string; phone_number?: string } | null;

                    // Skip if group already exists or no phone number
                    if (conn?.assistant_group_jid || !conn?.phone_number) return;

                    const operatorDigits = conn.phone_number.replace(/\D/g, "");
                    const groupJid = await createEvolutionGroup(
                        event.instance,
                        "\u{1F916} TripBuilt Assistant",
                        [operatorDigits],
                    );

                    await admin
                        .from("whatsapp_connections")
                        .update({ assistant_group_jid: groupJid } as Record<string, unknown>)
                        .eq("session_name", event.instance);

                    await updateEvolutionGroupDescription(
                        event.instance,
                        groupJid,
                        "Your private TripBuilt notification channel. Daily briefings, new leads, payments, and driver updates — all here.",
                    );

                    // Send welcome message
                    await sendEvolutionText(event.instance, groupJid, [
                        "\u{1F916} *TripBuilt Assistant is ready!*",
                        "",
                        "I'll send you:",
                        "\u{1F4CB} Daily briefings at 6:30 AM",
                        "\u{1F514} New lead alerts",
                        "\u{1F4B0} Payment notifications",
                        "\u{1F697} Driver updates",
                        "",
                        'Reply "help" anytime for commands.',
                    ].join("\n"));

                    logEvent("info", `[webhooks/evolution] Created assistant group ${groupJid} for ${event.instance}`);
                } catch (err) {
                    logError("[webhooks/evolution] Failed to create assistant group", err);
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

        // Handle assistant group commands (operator replies in the TripBuilt group)
        if (isGroupJid(remoteJid) && payload.key?.fromMe) {
            const cmdText = extractMessageText(payload).trim().toLowerCase();
            if (cmdText) {
                const handled = await handleAssistantGroupCommand(
                    admin,
                    event.instance,
                    remoteJid,
                    cmdText,
                );
                if (handled) return NextResponse.json({ ok: true });
            }
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
            const audioInfo = payload.message?.audioMessage;
            const duration = audioInfo?.seconds ?? 0;
            let transcript = "";
            let intentData = null;

            // Attempt transcription (best-effort — store message even if transcription fails)
            try {
                const base64Audio = await getEvolutionMediaBase64(event.instance, payload.key.id);
                if (base64Audio) {
                    const result = await transcribeVoiceMessage(
                        base64Audio,
                        audioInfo?.mimetype ?? "audio/ogg",
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

            await admin.from("whatsapp_webhook_events").insert({
                provider_message_id: providerId,
                wa_id: waId,
                event_type: "voice",
                payload_hash: payloadHash,
                processing_status: "received",
                metadata: voiceMetadata,
            });

            // Voice messages don't trigger chatbot (yet) — just store and return
            return NextResponse.json({ ok: true });
        }

        // Store both inbound AND outbound text messages
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

        const { data: rawConnection } = await admin
            .from("whatsapp_connections")
            .select("organization_id, session_name, session_token, assistant_group_jid")
            .eq("session_name", event.instance)
            .maybeSingle();
        const connection = rawConnection as { organization_id?: string; session_name?: string; session_token?: string; assistant_group_jid?: string } | null;

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

        // Notify operator about new inbound message (best-effort, non-blocking)
        if ((connection as { assistant_group_jid?: string }).assistant_group_jid) {
            void notifyNewLead(
                organizationId,
                senderPhone,
                messageText,
            );
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

        if (isGroupJid(remoteJid) || !remoteJid.includes("@s.whatsapp.net")) {
            return NextResponse.json({ ok: true });
        }

        const messageText = extractMessageText(payload);
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
