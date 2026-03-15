import "server-only";

import { z } from "zod";
import { logError } from "@/lib/observability/logger";

// ─── Webhook Payload Schemas ────────────────────────────────────────────────
// Meta Cloud API delivers webhook payloads in a nested envelope structure.
// We validate the shape with Zod before accessing fields to avoid unsafe casts.

const _WhatsAppMsgBaseSchema = z.object({
    from: z.string(),
    id: z.string(),
    type: z.string(),
    timestamp: z.string(),
});

const _WhatsAppWebhookEnvelopeSchema = z.object({
    entry: z.array(z.object({
        changes: z.array(z.object({
            value: z.object({
                messages: z.array(_WhatsAppMsgBaseSchema.passthrough()).optional(),
            }).passthrough().optional(),
        })).optional(),
    })).optional(),
});

const _WhatsAppLocationMsgSchema = _WhatsAppMsgBaseSchema.extend({
    type: z.literal("location"),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
    }),
});

const _WhatsAppImageMsgSchema = _WhatsAppMsgBaseSchema.extend({
    type: z.literal("image"),
    image: z.object({
        id: z.string(),
        caption: z.string().optional(),
        mime_type: z.string().optional(),
    }),
});

const _WhatsAppTextMsgSchema = _WhatsAppMsgBaseSchema.extend({
    type: z.literal("text"),
    text: z.object({
        body: z.string(),
    }),
});
// ────────────────────────────────────────────────────────────────────────────

export interface WhatsAppSendResult {
    success: boolean;
    provider: "meta_cloud_api";
    messageId?: string;
    error?: string;
}

export interface WhatsAppLocationMessage {
    waId: string;
    messageId: string;
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    timestamp: string;
}

const WHATSAPP_MAX_ATTEMPTS = 3;

function normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

function normalizeWaId(waId: string): string {
    return waId.replace(/\D/g, "");
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callMetaWhatsAppApi(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneNumberId) {
        return {
            success: false,
            provider: "meta_cloud_api",
            error: "WhatsApp provider not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID missing)",
        };
    }

    for (let attempt = 1; attempt <= WHATSAPP_MAX_ATTEMPTS; attempt += 1) {
        try {
            const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const body = await response.json().catch(() => ({}));
            if (response.ok) {
                return {
                    success: true,
                    provider: "meta_cloud_api",
                    messageId: (body as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id,
                };
            }

            const providerError =
                (body as { error?: { message?: string } })?.error?.message || `HTTP ${response.status}`;
            const isRetryable = response.status === 429 || response.status >= 500;
            if (!isRetryable || attempt === WHATSAPP_MAX_ATTEMPTS) {
                return {
                    success: false,
                    provider: "meta_cloud_api",
                    error: providerError,
                };
            }
        } catch (error: unknown) {
            if (attempt === WHATSAPP_MAX_ATTEMPTS) {
                return {
                    success: false,
                    provider: "meta_cloud_api",
                    error: error instanceof Error ? error.message : "Unknown WhatsApp error",
                };
            }
        }

        await wait(300 * attempt);
    }

    return {
        success: false,
        provider: "meta_cloud_api",
        error: "WhatsApp send failed",
    };
}

export async function sendWhatsAppText(phone: string, message: string): Promise<WhatsAppSendResult> {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
        return {
            success: false,
            provider: "meta_cloud_api",
            error: "Invalid phone number",
        };
    }

    return callMetaWhatsAppApi({
        messaging_product: "whatsapp",
        to: normalizedPhone.replace("+", ""),
        type: "text",
        text: {
            preview_url: false,
            body: message,
        },
    });
}

export async function sendWhatsAppTemplate(
    phone: string,
    templateName: string,
    bodyParams: string[],
    languageCode = "en"
): Promise<WhatsAppSendResult> {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
        return {
            success: false,
            provider: "meta_cloud_api",
            error: "Invalid phone number",
        };
    }

    if (!templateName) {
        return {
            success: false,
            provider: "meta_cloud_api",
            error: "Missing template name",
        };
    }

    return callMetaWhatsAppApi({
        messaging_product: "whatsapp",
        to: normalizedPhone.replace("+", ""),
        type: "template",
        template: {
            name: templateName,
            language: { code: languageCode },
            components: [
                {
                    type: "body",
                    parameters: bodyParams.map((value) => ({
                        type: "text",
                        text: value,
                    })),
                },
            ],
        },
    });
}

export function parseWhatsAppLocationMessages(payload: unknown): WhatsAppLocationMessage[] {
    const envelope = _WhatsAppWebhookEnvelopeSchema.safeParse(payload);
    if (!envelope.success) {
        logError("[whatsapp] Invalid webhook payload (location)", envelope.error);
        return [];
    }

    const output: WhatsAppLocationMessage[] = [];
    for (const entry of (envelope.data.entry ?? [])) {
        for (const change of (entry.changes ?? [])) {
            for (const rawMsg of (change.value?.messages ?? [])) {
                if (rawMsg.type !== "location") continue;
                const msg = _WhatsAppLocationMsgSchema.safeParse(rawMsg);
                if (!msg.success) continue;
                const { from, id, location, timestamp } = msg.data;
                output.push({
                    waId: normalizeWaId(from),
                    messageId: id,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    name: location.name,
                    address: location.address,
                    timestamp,
                });
            }
        }
    }
    return output;
}

export interface WhatsAppImageMessage {
    waId: string;
    messageId: string;
    imageId: string;
    caption?: string;
    mimeType?: string;
    timestamp: string;
}

export interface WhatsAppTextMessage {
    readonly waId: string;
    readonly messageId: string;
    readonly body: string;
    readonly timestamp: string;
}

export function parseWhatsAppImageMessages(payload: unknown): WhatsAppImageMessage[] {
    const envelope = _WhatsAppWebhookEnvelopeSchema.safeParse(payload);
    if (!envelope.success) {
        logError("[whatsapp] Invalid webhook payload (image)", envelope.error);
        return [];
    }

    const output: WhatsAppImageMessage[] = [];
    for (const entry of (envelope.data.entry ?? [])) {
        for (const change of (entry.changes ?? [])) {
            for (const rawMsg of (change.value?.messages ?? [])) {
                if (rawMsg.type !== "image") continue;
                const msg = _WhatsAppImageMsgSchema.safeParse(rawMsg);
                if (!msg.success) continue;
                const { from, id, image, timestamp } = msg.data;
                output.push({
                    waId: normalizeWaId(from),
                    messageId: id,
                    imageId: image.id,
                    caption: image.caption,
                    mimeType: image.mime_type,
                    timestamp,
                });
            }
        }
    }
    return output;
}

export function parseWhatsAppTextMessages(payload: unknown): WhatsAppTextMessage[] {
    const envelope = _WhatsAppWebhookEnvelopeSchema.safeParse(payload);
    if (!envelope.success) {
        logError("[whatsapp] Invalid webhook payload (text)", envelope.error);
        return [];
    }

    const output: WhatsAppTextMessage[] = [];
    for (const entry of (envelope.data.entry ?? [])) {
        for (const change of (entry.changes ?? [])) {
            for (const rawMsg of (change.value?.messages ?? [])) {
                if (rawMsg.type !== "text") continue;
                const msg = _WhatsAppTextMsgSchema.safeParse(rawMsg);
                if (!msg.success) continue;
                const { from, id, text, timestamp } = msg.data;
                output.push({
                    waId: normalizeWaId(from),
                    messageId: id,
                    body: text.body,
                    timestamp,
                });
            }
        }
    }
    return output;
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<Buffer | null> {
    const token = process.env.WHATSAPP_TOKEN;
    if (!token) return null;

    try {
        // Step 1: Get download URL
        const urlRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!urlRes.ok) return null;

        const urlData = await urlRes.json();
        const downloadUrl = urlData.url;

        if (!downloadUrl) return null;

        // Step 2: Download the binary data
        const mediaRes = await fetch(downloadUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!mediaRes.ok) return null;

        const arrayBuffer = await mediaRes.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        logError('Error downloading WA media', error);
        return null;
    }
}
