import "server-only";

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
    const body = payload as {
        entry?: Array<{ changes?: Array<{ value?: { messages?: Array<Record<string, unknown>> } }> }>;
    };

    const entries = body.entry || [];
    const output: WhatsAppLocationMessage[] = [];

    for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
            const messages = change.value?.messages || [];
            for (const message of messages) {
                if (message.type !== "location") continue;

                const location = message.location as Record<string, unknown> | undefined;
                const from = typeof message.from === "string" ? message.from : "";
                const messageId = typeof message.id === "string" ? message.id : "";
                const timestamp = typeof message.timestamp === "string" ? message.timestamp : "";

                const latitude = Number(location?.latitude);
                const longitude = Number(location?.longitude);
                if (!from || !messageId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
                    continue;
                }

                output.push({
                    waId: normalizeWaId(from),
                    messageId,
                    latitude,
                    longitude,
                    name: typeof location?.name === "string" ? location.name : undefined,
                    address: typeof location?.address === "string" ? location.address : undefined,
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

export function parseWhatsAppImageMessages(payload: unknown): WhatsAppImageMessage[] {
    const body = payload as any;
    const entries = body.entry || [];
    const output: WhatsAppImageMessage[] = [];

    for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
            const messages = change.value?.messages || [];
            for (const message of messages) {
                if (message.type !== "image") continue;

                const image = message.image;
                const from = typeof message.from === "string" ? message.from : "";
                const messageId = typeof message.id === "string" ? message.id : "";
                const timestamp = typeof message.timestamp === "string" ? message.timestamp : "";

                if (!from || !messageId || !image?.id) {
                    continue;
                }

                output.push({
                    waId: normalizeWaId(from),
                    messageId,
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
        console.error('Error downloading WA media:', error);
        return null;
    }
}
