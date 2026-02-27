import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "node:crypto";
import { parseWhatsAppLocationMessages, parseWhatsAppImageMessages, downloadWhatsAppMedia } from "@/lib/whatsapp.server";

const supabaseAdmin = createAdminClient();
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || null;
const appSecret = process.env.WHATSAPP_APP_SECRET || null;
const allowUnsignedWebhook = process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK === "true";

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
    return createHmac("sha256", appSecret || "fallback").update(rawBody).digest("hex");
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

    if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
        return new NextResponse(challenge ?? "", { status: 200 });
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signatureHeader = request.headers.get("x-hub-signature-256");
        const signatureValid = verifySignature(rawBody, signatureHeader);

        if (!signatureValid && !allowUnsignedWebhook) {
            await supabaseAdmin.from("whatsapp_webhook_events").insert({
                provider_message_id: `invalid-signature-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                wa_id: null,
                event_type: "location",
                payload_hash: payloadHash(rawBody),
                processing_status: "rejected",
                reject_reason: appSecret
                    ? "invalid_signature"
                    : "missing_whatsapp_app_secret",
                metadata: {
                    signature_present: !!signatureHeader,
                    mode: "strict",
                },
            });
            return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
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
                        reject_reason: error.message,
                    })
                    .eq("provider_message_id", location.messageId);
            }
        }

        // Process images asynchronously to avoid blocking the webhook response
        // In a real production app this should be queued (e.g. Inngest / SQS)
        processWhatsAppImages(payload, rawBody, signatureValid).catch(console.error);

        return NextResponse.json({
            ok: true,
            signature_verified: signatureValid || allowUnsignedWebhook,
            location_messages: locations.length,
            stored_locations: stored,
            duplicate_messages: duplicates,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

async function processWhatsAppImages(payload: unknown, rawBody: string, signatureValid: boolean) {
    const images = parseWhatsAppImageMessages(payload);

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
                processing_status: "rejected", reject_reason: `storage_error: ${uploadError.message}`
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
