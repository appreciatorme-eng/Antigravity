/* ------------------------------------------------------------------
 * POST /api/whatsapp/send-rich
 * Send rich media messages: documents, images, locations, polls.
 * Extends the text-only /api/whatsapp/send endpoint.
 * ------------------------------------------------------------------ */

import crypto from "node:crypto";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import {
    guardedSendMedia,
    guardedSendPoll,
    sendEvolutionLocation,
} from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

const MediaSchema = z.object({
    type: z.literal("media"),
    phone: z.string().trim().min(8),
    mediaUrl: z.string().url(),
    mediaType: z.enum(["image", "document", "audio", "video"]),
    caption: z.string().max(1024).optional(),
    fileName: z.string().max(255).optional(),
    mimetype: z.string().max(100).optional(),
});

const LocationSchema = z.object({
    type: z.literal("location"),
    phone: z.string().trim().min(8),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    name: z.string().max(255).optional(),
    address: z.string().max(500).optional(),
});

const PollSchema = z.object({
    type: z.literal("poll"),
    phone: z.string().trim().min(8),
    question: z.string().trim().min(1).max(256),
    options: z.array(z.string().trim().min(1).max(100)).min(2).max(12),
    selectableCount: z.number().int().min(1).max(12).optional(),
});

const SendRichSchema = z.discriminatedUnion("type", [
    MediaSchema,
    LocationSchema,
    PollSchema,
]);

export async function POST(request: Request) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { userId, organizationId, adminClient } = auth;

        const body = await request.json();
        const parsed = SendRichSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Invalid payload", 400, { details: parsed.error.flatten() });
        }

        const admin = adminClient;
        const { data: connection } = await admin
            .from("whatsapp_connections")
            .select("session_name, session_token, status")
            .eq("organization_id", organizationId!)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!connection || connection.status !== "connected" || !connection.session_name) {
            return apiError("WhatsApp not connected", 409, { code: "whatsapp_not_connected" });
        }

        const digits = parsed.data.phone.replace(/\D/g, "");
        if (digits.length < 10) {
            return apiError("Invalid phone number", 400);
        }

        const sentAt = new Date().toISOString();
        const providerMessageId = crypto.randomUUID();
        const sessionName = connection.session_name;

        let bodyPreview = "";
        let eventType = "text";

        if (parsed.data.type === "media") {
            const { mediaUrl, mediaType, caption, fileName, mimetype } = parsed.data;
            await guardedSendMedia(sessionName, digits, mediaUrl, mediaType, {
                caption, fileName, mimetype,
            }, false);
            bodyPreview = caption || `[${mediaType === "document" ? "Document" : mediaType === "image" ? "Image" : "Media"}: ${fileName ?? "file"}]`;
            eventType = mediaType === "document" ? "document" : mediaType === "image" ? "image" : "text";
        } else if (parsed.data.type === "location") {
            const { latitude, longitude, name, address } = parsed.data;
            await sendEvolutionLocation(sessionName, digits, latitude, longitude, name, address);
            bodyPreview = `📍 ${name ?? "Location"} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            eventType = "location";
        } else if (parsed.data.type === "poll") {
            const { question, options, selectableCount } = parsed.data;
            await guardedSendPoll(sessionName, digits, question, options, selectableCount ?? 1, false);
            bodyPreview = `📊 Poll: ${question}\n${options.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
            eventType = "text";
        }

        // Log the sent message
        const payloadHash = crypto
            .createHash("sha256")
            .update(JSON.stringify({ session: sessionName, wa_id: digits, body_preview: bodyPreview }))
            .digest("hex");

        await admin.from("whatsapp_webhook_events").insert({
            provider_message_id: providerMessageId,
            payload_hash: payloadHash,
            event_type: eventType,
            wa_id: digits,
            metadata: {
                session: sessionName,
                direction: "out",
                body_preview: bodyPreview,
                rich_type: parsed.data.type,
                sent_by: userId,
            },
            processing_status: "processed",
            processed_at: sentAt,
            received_at: sentAt,
        });

        return apiSuccess({
            message: {
                id: providerMessageId,
                type: eventType,
                direction: "out",
                body: bodyPreview,
                timestamp: new Date(sentAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit", hour12: true,
                }),
                status: "sent",
            },
        });
    } catch (error) {
        logError("[whatsapp/send-rich] unexpected error", error);
        return apiError("Failed to send rich message", 500);
    }
}
