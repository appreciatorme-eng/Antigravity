import "server-only";

export interface WhatsAppSendResult {
    success: boolean;
    provider: "meta_cloud_api";
    messageId?: string;
    error?: string;
}

function normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
}

export async function sendWhatsAppText(phone: string, message: string): Promise<WhatsAppSendResult> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
        return {
            success: false,
            provider: "meta_cloud_api",
            error: "Invalid phone number",
        };
    }

    if (!token || !phoneNumberId) {
        return {
            success: false,
            provider: "meta_cloud_api",
            error: "WhatsApp provider not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID missing)",
        };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: normalizedPhone.replace("+", ""),
                type: "text",
                text: {
                    preview_url: false,
                    body: message,
                },
            }),
        });

        const payload = await response.json();
        if (!response.ok) {
            return {
                success: false,
                provider: "meta_cloud_api",
                error: payload?.error?.message || `HTTP ${response.status}`,
            };
        }

        return {
            success: true,
            provider: "meta_cloud_api",
            messageId: payload?.messages?.[0]?.id,
        };
    } catch (error) {
        return {
            success: false,
            provider: "meta_cloud_api",
            error: error instanceof Error ? error.message : "Unknown WhatsApp error",
        };
    }
}
