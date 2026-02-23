import "server-only";

import { sendWhatsAppText } from "@/lib/whatsapp.server";

function normalizeText(value: string, maxLength: number): string {
    return value.trim().slice(0, maxLength);
}

function normalizeUrl(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
        const url = new URL(trimmed);
        if (url.protocol !== "http:" && url.protocol !== "https:") return null;
        return url.toString();
    } catch {
        return null;
    }
}

export async function sendItineraryToWhatsApp(
    phoneNumber: string,
    itineraryTitle: string,
    pdfUrl: string
): Promise<boolean> {
    const normalizedTitle = normalizeText(itineraryTitle, 120);
    const normalizedPdfUrl = normalizeUrl(pdfUrl);

    if (!phoneNumber?.trim() || !normalizedTitle || !normalizedPdfUrl) {
        return false;
    }

    const message = `Hi, your itinerary "${normalizedTitle}" is ready: ${normalizedPdfUrl}`;
    const result = await sendWhatsAppText(phoneNumber, message);

    if (!result.success) {
        console.error("[WhatsApp] Failed to send itinerary message", {
            error: result.error,
        });
    }

    return result.success;
}
