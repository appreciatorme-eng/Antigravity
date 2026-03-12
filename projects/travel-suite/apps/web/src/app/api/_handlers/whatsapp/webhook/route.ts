/* ------------------------------------------------------------------
 * WhatsApp Webhook -- WPPConnect / self-hosted WhatsApp
 *
 * Handles inbound events (location shares, text messages, images)
 * from the self-hosted WPPConnect (WAHA) gateway, as opposed to the
 * Meta Cloud API webhook at /api/webhooks/whatsapp.
 *
 * GET: Webhook verification challenge (hub.mode subscribe).
 * POST: Process incoming location, text, and image messages.
 *
 * Security: HMAC-SHA256 signature verification on POST requests.
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse, after } from "next/server";
import { apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "node:crypto";
import { safeEqual } from "@/lib/security/safe-equal";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { parseWhatsAppLocationMessages, parseWhatsAppImageMessages, parseWhatsAppTextMessages, downloadWhatsAppMedia } from "@/lib/whatsapp.server";
import { handleWhatsAppMessage } from "@/lib/assistant/channel-adapters/whatsapp";
import { getRequestContext, getRequestId, logError, logEvent } from "@/lib/observability/logger";
import { isUnsignedWebhookAllowed } from "@/lib/security/whatsapp-webhook-config";

const supabaseAdmin = createAdminClient();
const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || null;
const appSecret = process.env.WHATSAPP_APP_SECRET || null;

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
            logEvent("warn", "WhatsApp webhook rejected due to signature validation", {
                ...requestContext,
                signature_present: !!signatureHeader,
                webhook_signature_mode: allowUnsignedWebhook ? "permissive_non_prod" : "strict",
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

            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("id, role")
                .eq("phone_normalized", location.waId)
                .maybeSingle();

            if (!profile || profile.role !== "driver") {
                await supabaseAdmin
                    .from("whatsapp_webhook_events")
                    .update({
                        processing_status: "rejected",
                        reject_reason: "driver_not_found",
                    })
                    .eq("provider_message_id", location.messageId);
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
                await supabaseAdmin
                    .from("whatsapp_webhook_events")
                    .update({
                        processing_status: "processed",
                        processed_at: new Date().toISOString(),
                    })
                    .eq("provider_message_id", location.messageId);
            } else {
                await supabaseAdmin
                    .from("whatsapp_webhook_events")
                    .update({
                        processing_status: "rejected",
                        reject_reason: safeErrorMessage(error, "location_processing_failed"),
                    })
                    .eq("provider_message_id", location.messageId);
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

    for (const textMsg of textMessages) {
        // 1. Log event for deduplication
        const { error: eventError } = await supabaseAdmin
            .from("whatsapp_webhook_events")
            .insert({
                provider_message_id: textMsg.messageId,
                wa_id: textMsg.waId,
                event_type: "text",
                payload_hash: payloadHash(rawBody),
                processing_status: "received",
                metadata: {
                    body_preview: textMsg.body.slice(0, 100),
                    signature_verified: signatureValid,
                },
            });

        if (eventError?.code === "23505") continue; // duplicate

        // 2. Process through assistant
        try {
            const result = await handleWhatsAppMessage(textMsg.waId, textMsg.body, textMsg.waId);

            await supabaseAdmin.from("whatsapp_webhook_events").update({
                processing_status: result.success ? "processed" : "rejected",
                reject_reason: result.error || null,
                processed_at: new Date().toISOString(),
                metadata: {
                    body_preview: textMsg.body.slice(0, 100),
                    signature_verified: signatureValid,
                    reply_sent: result.replySent,
                },
            }).eq("provider_message_id", textMsg.messageId);
        } catch (error) {
            await supabaseAdmin.from("whatsapp_webhook_events").update({
                processing_status: "rejected",
                reject_reason: safeErrorMessage(error, "text_processing_failed"),
            }).eq("provider_message_id", textMsg.messageId);
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

        // 2. Find org by user
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, organization_id, role")
            .eq("phone_normalized", image.waId)
            .maybeSingle();

        if (!profile || !profile.organization_id) {
            await supabaseAdmin.from("whatsapp_webhook_events").update({
                processing_status: "rejected", reject_reason: "user_or_org_not_found"
            }).eq("provider_message_id", image.messageId);
            continue;
        }

        // 3. Download Media
        const mediaBuffer = await downloadWhatsAppMedia(image.imageId);
        if (!mediaBuffer) {
            await supabaseAdmin.from("whatsapp_webhook_events").update({
                processing_status: "rejected", reject_reason: "media_download_failed"
            }).eq("provider_message_id", image.messageId);
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
            await supabaseAdmin.from("whatsapp_webhook_events").update({
                processing_status: "rejected", reject_reason: "storage_upload_failed"
            }).eq("provider_message_id", image.messageId);
            continue;
        }

        // 5. Save directly to social_media_library
        await supabaseAdmin.from('social_media_library').insert({
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

        // 6. Mark processed
        await supabaseAdmin.from("whatsapp_webhook_events").update({
            processing_status: "processed", processed_at: new Date().toISOString()
        }).eq("provider_message_id", image.messageId);
    }
}
