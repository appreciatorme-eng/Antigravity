/* ------------------------------------------------------------------
 * WhatsApp Webhook -- Meta Cloud API
 *
 * Handles inbound events (location shares, text messages, images)
 * from the Meta Cloud API webhook.
 * WhatsApp: Meta Cloud API only. WPPConnect path removed — see CLAUDE.md.
 *
 * GET: Webhook verification challenge (hub.mode subscribe).
 * POST: Process incoming location, text, and image messages.
 *
 * Security: HMAC-SHA256 signature verification on POST requests.
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse, after } from "next/server";
import { apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "node:crypto";
import { safeEqual } from "@/lib/security/safe-equal";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { parseWhatsAppLocationMessages, parseWhatsAppImageMessages, parseWhatsAppTextMessages, downloadWhatsAppMedia } from "@/lib/whatsapp.server";
import { handleWhatsAppMessage } from "@/lib/assistant/channel-adapters/whatsapp";
import { getRequestContext, getRequestId, logError, logEvent } from "@/lib/observability/logger";
import { isUnsignedWebhookAllowed } from "@/lib/security/whatsapp-webhook-config";
import { loadCommsSequences, updateCommsSequence } from "@/lib/platform/business-comms";
import { runBusinessOsEventAutomation } from "@/lib/platform/business-os";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";
import type { Json } from "@/lib/supabase/database.types";

const supabaseAdmin = createAdminClient();
const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || null;
const appSecret = process.env.WHATSAPP_APP_SECRET || null;

type InboundOrgResolution = {
    orgId: string | null;
    isInternalOperator: boolean;
};

type WhatsAppCommsLinkResult = {
    linked: boolean;
    orgId: string | null;
    commsSequenceId: string | null;
    automationTriggered: boolean;
};

function toIsoFromUnixSeconds(value: string): string {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return new Date().toISOString();
    }
    return new Date(parsed * 1000).toISOString();
}

async function resolveCurrentTripId(driverId: string): Promise<string | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
        .from("trips")
        .select("id, start_date, end_date")
        .eq("driver_id", driverId)
        .in("status", ["in_progress", "confirmed"])
        .lte("start_date", today)
        .order("updated_at", { ascending: false })
        .limit(10);

    const active = (data || []).find((trip) => {
        const start = trip.start_date || today;
        const end = trip.end_date || start;
        return start <= today && end >= today;
    });

    return active?.id || null;
}

function payloadHash(rawBody: string): string {
    if (!appSecret) {
        throw new Error("WHATSAPP_APP_SECRET is required for HMAC operations");
    }
    return createHmac("sha256", appSecret).update(rawBody).digest("hex");
}

async function updateWebhookEvent(
    providerMessageId: string,
    updates: Record<string, unknown>,
    requestContext: ReturnType<typeof getRequestContext>,
): Promise<void> {
    const { error } = await supabaseAdmin
        .from("whatsapp_webhook_events")
        .update(updates)
        .eq("provider_message_id", providerMessageId);
    if (error) {
        logError("Failed to update whatsapp_webhook_events", error, {
            ...requestContext,
            provider_message_id: providerMessageId,
        });
    }
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!appSecret) return false;
    if (!signatureHeader?.startsWith("sha256=")) return false;

    const provided = signatureHeader.slice("sha256=".length);
    const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const providedBuffer = Buffer.from(provided, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(providedBuffer, expectedBuffer);
}

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function normalizeDigits(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const digits = value.replace(/\D/g, "");
    return digits.length > 6 ? digits : null;
}

function isoToMs(value: string | null): number {
    if (!value) return 0;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function inferReplyDisposition(message: string): "positive" | "blocked" | "needs_follow_up" | "not_interested" {
    const text = message.trim().toLowerCase();
    if (!text) return "needs_follow_up";
    if (/\b(not interested|stop|unsubscribe|no thanks|don't contact|do not contact)\b/.test(text)) {
        return "not_interested";
    }
    if (/\b(can't|cannot|busy|later|next week|blocked|issue|problem|budget|expensive)\b/.test(text)) {
        return "blocked";
    }
    if (/\b(yes|ok|okay|sure|done|paid|great|works|approved|confirm)\b/.test(text)) {
        return "positive";
    }
    return "needs_follow_up";
}

async function resolveInboundOrganization(waId: string): Promise<InboundOrgResolution> {
    const lookupProfile = async (column: "phone_normalized" | "phone_whatsapp" | "phone", values: string[]) => {
        if (!values.length) return null;
        const uniqueValues = [...new Set(values.filter(Boolean))];
        if (!uniqueValues.length) return null;
        const query = supabaseAdmin
            .from("profiles")
            .select("organization_id, role, updated_at")
            .not("organization_id", "is", null)
            .in(column, uniqueValues)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        const { data } = await query;
        return data ?? null;
    };

    const withPlus = `+${waId}`;
    const byNormalized = await lookupProfile("phone_normalized", [waId]);
    if (byNormalized?.organization_id) {
        return {
            orgId: byNormalized.organization_id,
            isInternalOperator: byNormalized.role === "admin" || byNormalized.role === "super_admin",
        };
    }

    const byWhatsApp = await lookupProfile("phone_whatsapp", [waId, withPlus]);
    if (byWhatsApp?.organization_id) {
        return {
            orgId: byWhatsApp.organization_id,
            isInternalOperator: byWhatsApp.role === "admin" || byWhatsApp.role === "super_admin",
        };
    }

    const byPhone = await lookupProfile("phone", [waId, withPlus]);
    if (byPhone?.organization_id) {
        return {
            orgId: byPhone.organization_id,
            isInternalOperator: byPhone.role === "admin" || byPhone.role === "super_admin",
        };
    }

    const { data: contactName } = await supabaseAdmin
        .from("whatsapp_contact_names")
        .select("org_id, updated_at")
        .eq("wa_id", waId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return {
        orgId: contactName?.org_id ?? null,
        isInternalOperator: false,
    };
}

async function linkInboundReplyToCommsSequence(
    waId: string,
    messageId: string,
    body: string,
): Promise<WhatsAppCommsLinkResult> {
    const inbound = await resolveInboundOrganization(waId);
    if (!inbound.orgId || inbound.isInternalOperator) {
        return {
            linked: false,
            orgId: inbound.orgId,
            commsSequenceId: null,
            automationTriggered: false,
        };
    }

    const sequences = await loadCommsSequences(supabaseAdmin as never, inbound.orgId, "all");
    const candidates = sequences
        .filter((sequence) => sequence.status !== "completed")
        .map((sequence) => {
            const metadata = normalizeMetadata(sequence.metadata) ?? {};
            if (metadata.send_state !== "sent" && metadata.send_state !== "approved_pending_send") {
                return null;
            }
            if (typeof metadata.customer_replied_at === "string") return null;

            const recipientPhone = normalizeDigits(metadata.recipient_phone);
            const recipientWaId = normalizeDigits(metadata.wa_id);
            const replyTargetPhone = normalizeDigits(metadata.reply_to_phone);
            const sentVia = typeof metadata.sent_via === "string" ? metadata.sent_via : null;

            let score = 0;
            if (sequence.channel === "whatsapp") score += 70;
            else if (sequence.channel === "mixed") score += 35;

            if (sentVia === "whatsapp") score += 60;
            if (recipientPhone && recipientPhone === waId) score += 90;
            if (recipientWaId && recipientWaId === waId) score += 90;
            if (replyTargetPhone && replyTargetPhone === waId) score += 80;
            if (sequence.last_sent_at) score += 10;

            return {
                sequence,
                metadata,
                score,
                lastSentAtMs: isoToMs(sequence.last_sent_at),
            };
        })
        .filter((item): item is {
            sequence: Awaited<ReturnType<typeof loadCommsSequences>>[number];
            metadata: Record<string, unknown>;
            score: number;
            lastSentAtMs: number;
        } => Boolean(item))
        .sort((a, b) => b.score - a.score || b.lastSentAtMs - a.lastSentAtMs);

    const candidate = candidates[0] ?? null;
    if (!candidate) {
        return {
            linked: false,
            orgId: inbound.orgId,
            commsSequenceId: null,
            automationTriggered: false,
        };
    }

    // Guard against ambiguous low-confidence matches across multiple sequences.
    const second = candidates[1] ?? null;
    if (candidate.score < 35 || (second && candidate.score <= 45 && second.score >= candidate.score - 5)) {
        return {
            linked: false,
            orgId: inbound.orgId,
            commsSequenceId: null,
            automationTriggered: false,
        };
    }

    const replyAt = new Date().toISOString();
    const updated = await updateCommsSequence(supabaseAdmin as never, candidate.sequence.id, {
        channel: candidate.sequence.channel === "email" ? "mixed" : candidate.sequence.channel,
        metadata: {
            ...candidate.metadata,
            send_state: "replied",
            customer_replied_at: replyAt,
            customer_replied_by: "whatsapp_webhook",
            reply_summary: body.slice(0, 500),
            reply_disposition: inferReplyDisposition(body),
            reply_channel: "whatsapp",
            reply_source_message_id: messageId,
            reply_source_wa_id: waId,
        },
    });

    if (!updated) {
        return {
            linked: false,
            orgId: inbound.orgId,
            commsSequenceId: null,
            automationTriggered: false,
        };
    }

    await recordOrgActivityEvent(supabaseAdmin as never, {
        org_id: inbound.orgId,
        actor_id: null,
        event_type: "comms_sequence_reply_recorded",
        title: "Captured WhatsApp customer reply",
        detail: body.slice(0, 500),
        entity_type: "comms_sequence",
        entity_id: candidate.sequence.id,
        source: "whatsapp_webhook",
        metadata: {
            channel: "whatsapp",
            source_message_id: messageId,
            wa_id: waId,
            disposition: inferReplyDisposition(body),
        },
    });

    await runBusinessOsEventAutomation(supabaseAdmin as never, {
        orgId: inbound.orgId,
        currentUserId: null,
        trigger: "comms_updated",
    });

    return {
        linked: true,
        orgId: inbound.orgId,
        commsSequenceId: candidate.sequence.id,
        automationTriggered: true,
    };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && verifyToken && safeEqual(token, verifyToken)) {
        return new NextResponse(challenge ?? "", { status: 200 });
    }

    return apiError("Verification failed", 403);
}

export async function POST(request: NextRequest) {
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);

    if (process.env.NODE_ENV === 'production' && isUnsignedWebhookAllowed()) {
        logError('SECURITY: unsigned WhatsApp webhooks are allowed in production', new Error('UnsignedWebhookInProduction'));
        return apiError('Webhook configuration error', 500);
    }

    try {
        const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
        if (contentLength > 1_048_576) {
            return apiError("Payload too large", 413);
        }

        const allowUnsignedWebhook = isUnsignedWebhookAllowed();
        const rawBody = await request.text();

        if (rawBody.length > 1_048_576) {
            return apiError("Payload too large", 413);
        }
        const signatureHeader = request.headers.get("x-hub-signature-256");
        const signatureValid = verifySignature(rawBody, signatureHeader);

        if (!signatureValid && !allowUnsignedWebhook) {
            // Rate limit logging of invalid signature attempts to prevent DB spam.
            // An attacker spamming invalid signatures would otherwise insert unbounded rows.
            const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
            const logRateLimit = await enforceRateLimit({
                identifier: `webhook:invalid-sig:${clientIp}`,
                limit: 10,
                windowMs: 60_000,
                prefix: "wh:invalid",
            });

            if (logRateLimit.success) {
                try {
                    await supabaseAdmin.from("whatsapp_webhook_events").insert({
                        provider_message_id: `invalid-signature-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
                        wa_id: null,
                        event_type: "location",
                        payload_hash: payloadHash(rawBody),
                        processing_status: "rejected",
                        reject_reason: appSecret
                            ? "invalid_signature"
                            : "missing_whatsapp_app_secret",
                        metadata: {
                            signature_present: !!signatureHeader,
                            mode: allowUnsignedWebhook ? "permissive_non_prod" : "strict",
                        },
                    });
                } catch (error) {
                    // Signature validation must fail-closed even if telemetry storage is unavailable.
                    logError("WhatsApp webhook signature rejection telemetry failed", error, requestContext);
                }
            }

            logEvent("warn", "WhatsApp webhook rejected due to signature validation", {
                ...requestContext,
                signature_present: !!signatureHeader,
                webhook_signature_mode: allowUnsignedWebhook ? "permissive_non_prod" : "strict",
                log_rate_limited: !logRateLimit.success,
            });
            return apiError("Invalid webhook signature", 401);
        }

        const payload = JSON.parse(rawBody) as unknown;
        const locations = parseWhatsAppLocationMessages(payload);
        let stored = 0;
        let duplicates = 0;

        for (const location of locations) {
            const { error: eventError } = await supabaseAdmin
                .from("whatsapp_webhook_events")
                .insert({
                    provider_message_id: location.messageId,
                    wa_id: location.waId,
                    event_type: "location",
                    payload_hash: payloadHash(rawBody),
                    processing_status: "received",
                    metadata: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        signature_verified: signatureValid,
                    },
                });

            if (eventError?.code === "23505") {
                duplicates += 1;
                continue;
            }
            if (eventError) {
                logError("Failed to persist location webhook event", eventError, requestContext);
                continue;
            }

            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("id, role")
                .eq("phone_normalized", location.waId)
                .maybeSingle();

            if (!profile || profile.role !== "driver") {
                await updateWebhookEvent(
                    location.messageId,
                    {
                        processing_status: "rejected",
                        reject_reason: "driver_not_found",
                    },
                    requestContext,
                );
                continue;
            }

            const tripId = await resolveCurrentTripId(profile.id);
            const { error } = await supabaseAdmin.from("driver_locations").insert({
                driver_id: profile.id,
                trip_id: tripId,
                latitude: location.latitude,
                longitude: location.longitude,
                recorded_at: toIsoFromUnixSeconds(location.timestamp),
            });

            if (!error) {
                stored += 1;
                await updateWebhookEvent(
                    location.messageId,
                    {
                        processing_status: "processed",
                        processed_at: new Date().toISOString(),
                    },
                    requestContext,
                );
            } else {
                await updateWebhookEvent(
                    location.messageId,
                    {
                        processing_status: "rejected",
                        reject_reason: safeErrorMessage(error, "location_processing_failed"),
                    },
                    requestContext,
                );
            }
        }

        // Parse text messages synchronously so we can include counts in the response
        const textMessages = parseWhatsAppTextMessages(payload);

        after(async () => {
            try {
                await processWhatsAppTextMessages(payload, rawBody, signatureValid, requestContext);
            } catch (error) {
                logError("WhatsApp text message processing failed", error, requestContext);
            }
            try {
                await processWhatsAppImages(payload, rawBody, signatureValid, requestContext);
            } catch (error) {
                logError("WhatsApp image processing failed", error, requestContext);
            }
        });

        return NextResponse.json({
            ok: true,
            signature_verified: signatureValid || allowUnsignedWebhook,
            location_messages: locations.length,
            stored_locations: stored,
            duplicate_messages: duplicates,
            text_messages: textMessages.length,
        });
    } catch (error) {
        logError("WhatsApp webhook processing failed", error, requestContext);
        return apiError("Internal webhook processing error", 500);
    }
}

async function processWhatsAppTextMessages(
    payload: unknown,
    rawBody: string,
    signatureValid: boolean,
    requestContext: ReturnType<typeof getRequestContext>,
) {
    const textMessages = parseWhatsAppTextMessages(payload);
    logEvent("info", "WhatsApp text batch processing started", {
        ...requestContext,
        text_messages: textMessages.length,
    });

    // Extract pushName from contacts array in the Meta Cloud API payload
    const pushNameMap = new Map<string, string>();
    const payloadObj = payload as Record<string, unknown>;
    for (const entry of ((payloadObj as Record<string, unknown[]>)?.entry ?? [])) {
        const entryObj = entry as Record<string, unknown[]>;
        for (const change of (entryObj?.changes ?? [])) {
            const changeObj = change as Record<string, Record<string, unknown[]>>;
            for (const contact of (changeObj?.value?.contacts ?? [])) {
                const c = contact as Record<string, unknown>;
                const profile = c?.profile as Record<string, unknown> | undefined;
                if (c?.wa_id && profile?.name) {
                    pushNameMap.set(c.wa_id as string, profile.name as string);
                }
            }
        }
    }

    for (const textMsg of textMessages) {
        const pushName = pushNameMap.get(textMsg.waId) ?? undefined;
        const eventMetadata: Record<string, unknown> = {
            body_preview: textMsg.body.slice(0, 100),
            signature_verified: signatureValid,
            push_name: pushName,
        };

        // 1. Log event for deduplication
        const { error: eventError } = await supabaseAdmin
            .from("whatsapp_webhook_events")
            .insert({
                provider_message_id: textMsg.messageId,
                wa_id: textMsg.waId,
                event_type: "text",
                payload_hash: payloadHash(rawBody),
                processing_status: "received",
                metadata: eventMetadata as Json,
            });

        if (eventError?.code === "23505") continue; // duplicate
        if (eventError) {
            logError("Failed to persist text webhook event", eventError, requestContext);
            continue;
        }

        // 2. Process through assistant
        try {
            const result = await handleWhatsAppMessage(textMsg.waId, textMsg.body, textMsg.waId);
            eventMetadata.reply_sent = result.replySent;

            const commsLink = await linkInboundReplyToCommsSequence(textMsg.waId, textMsg.messageId, textMsg.body);
            if (commsLink.orgId) eventMetadata.org_id = commsLink.orgId;
            if (commsLink.linked) {
                eventMetadata.comms_sequence_id = commsLink.commsSequenceId;
                eventMetadata.business_os_automation_triggered = commsLink.automationTriggered;
            }

            await updateWebhookEvent(
                textMsg.messageId,
                {
                    processing_status: result.success ? "processed" : "rejected",
                    reject_reason: result.error || null,
                    processed_at: new Date().toISOString(),
                    metadata: eventMetadata,
                },
                requestContext,
            );
        } catch (error) {
            eventMetadata.reply_sent = false;
            try {
                const commsLink = await linkInboundReplyToCommsSequence(textMsg.waId, textMsg.messageId, textMsg.body);
                if (commsLink.orgId) eventMetadata.org_id = commsLink.orgId;
                if (commsLink.linked) {
                    eventMetadata.comms_sequence_id = commsLink.commsSequenceId;
                    eventMetadata.business_os_automation_triggered = commsLink.automationTriggered;
                }
            } catch (linkError) {
                logError("Failed to link inbound WhatsApp reply to Business OS", linkError, {
                    ...requestContext,
                    wa_id: textMsg.waId,
                    provider_message_id: textMsg.messageId,
                });
            }
            await updateWebhookEvent(
                textMsg.messageId,
                {
                    processing_status: "rejected",
                    reject_reason: safeErrorMessage(error, "text_processing_failed"),
                    metadata: eventMetadata,
                },
                requestContext,
            );
        }

        // AI auto-classification: classify new contacts as personal/business
        // Only on first message from an unknown number, fire-and-forget
        if (textMsg.body.length > 3) {
            try {
                // Table pending type generation -- use untyped access
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: existingContact } = await (supabaseAdmin as any)
                    .from("whatsapp_contact_names")
                    .select("id")
                    .eq("wa_id", textMsg.waId)
                    .maybeSingle();

                if (!existingContact) {
                    const { getGeminiModel } = await import("@/lib/ai/gemini.server");
                    const model = getGeminiModel();
                    const result = await model.generateContent(
                        `Is this WhatsApp message from a potential travel/tourism customer or a personal contact? Message: "${textMsg.body.slice(0, 200)}". Reply with ONLY one word: BUSINESS or PERSONAL`,
                    );
                    const classification = result.response.text().trim().toUpperCase();
                    const isPersonal = classification.includes("PERSONAL");
                    eventMetadata.ai_classification = isPersonal ? "personal" : "business";

                    await updateWebhookEvent(
                        textMsg.messageId,
                        {
                            metadata: eventMetadata,
                        },
                        requestContext,
                    );
                }
            } catch {
                // Classification is best-effort — silent failure
            }
        }
    }
}

async function processWhatsAppImages(
    payload: unknown,
    rawBody: string,
    signatureValid: boolean,
    requestContext: ReturnType<typeof getRequestContext>,
) {
    const images = parseWhatsAppImageMessages(payload);
    logEvent("info", "WhatsApp image batch processing started", {
        ...requestContext,
        image_messages: images.length,
    });

    for (const image of images) {
        // 1. Log event
        const { error: eventError } = await supabaseAdmin
            .from("whatsapp_webhook_events")
            .insert({
                provider_message_id: image.messageId,
                wa_id: image.waId,
                event_type: "image",
                payload_hash: payloadHash(rawBody),
                processing_status: "received",
                metadata: {
                    image_id: image.imageId,
                    signature_verified: signatureValid,
                },
            });

        if (eventError?.code === "23505") continue; // duplicate
        if (eventError) {
            logError("Failed to persist image webhook event", eventError, requestContext);
            continue;
        }

        // 2. Find org by user
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, organization_id, role")
            .eq("phone_normalized", image.waId)
            .maybeSingle();

        if (!profile || !profile.organization_id) {
            await updateWebhookEvent(
                image.messageId,
                {
                    processing_status: "rejected",
                    reject_reason: "user_or_org_not_found",
                },
                requestContext,
            );
            continue;
        }

        // 3. Download Media
        const mediaBuffer = await downloadWhatsAppMedia(image.imageId);
        if (!mediaBuffer) {
            await updateWebhookEvent(
                image.messageId,
                {
                    processing_status: "rejected",
                    reject_reason: "media_download_failed",
                },
                requestContext,
            );
            continue;
        }

        // 4. Upload to Supabase Storage
        const fileExt = image.mimeType?.split('/')[1] || 'jpeg';
        const fileName = `wa_${image.imageId}_${Date.now()}.${fileExt}`;
        const filePath = `${profile.organization_id}/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('social-media')
            .upload(filePath, mediaBuffer, {
                contentType: image.mimeType || 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            await updateWebhookEvent(
                image.messageId,
                {
                    processing_status: "rejected",
                    reject_reason: "storage_upload_failed",
                },
                requestContext,
            );
            continue;
        }

        // 5. Save directly to social_media_library
        const { error: socialLibraryInsertError } = await supabaseAdmin.from('social_media_library').insert({
            organization_id: profile.organization_id,
            file_path: filePath,
            mime_type: image.mimeType || 'image/jpeg',
            source: 'whatsapp',
            source_contact_phone: image.waId,
            caption: image.caption || '',
            tags: {
                message_id: image.messageId
            }
        });
        if (socialLibraryInsertError) {
            logError("Failed to persist social media library record", socialLibraryInsertError, {
                ...requestContext,
                provider_message_id: image.messageId,
            });
            await updateWebhookEvent(
                image.messageId,
                {
                    processing_status: "rejected",
                    reject_reason: "social_media_library_insert_failed",
                },
                requestContext,
            );
            continue;
        }

        // 6. Mark processed
        await updateWebhookEvent(
            image.messageId,
            {
                processing_status: "processed",
                processed_at: new Date().toISOString(),
            },
            requestContext,
        );
    }
}
