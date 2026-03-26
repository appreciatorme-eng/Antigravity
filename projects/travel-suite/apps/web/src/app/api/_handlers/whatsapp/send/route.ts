import crypto from "node:crypto";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { guardedSendText } from "@/lib/whatsapp-evolution.server";
import { logError } from "@/lib/observability/logger";

const SendWhatsAppSchema = z.object({
  phone: z.string().trim().min(8),
  message: z.string().trim().min(1).max(4096),
  subject: z.string().trim().max(160).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { userId, organizationId, adminClient } = auth;

    const body = await request.json();
    const parsed = SendWhatsAppSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid WhatsApp send payload", 400, {
        details: parsed.error.flatten(),
      });
    }

    const admin = adminClient;
    const { data: connection, error: connectionError } = await admin
      .from("whatsapp_connections")
      .select("session_name, session_token, status")
      .eq("organization_id", organizationId!)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (connectionError) {
      logError("[whatsapp/send] failed to load connection", connectionError);
      return apiError("Failed to load WhatsApp connection", 500);
    }

    if (
      !connection ||
      connection.status !== "connected" ||
      !connection.session_name ||
      !connection.session_token
    ) {
      return apiError("WhatsApp not connected", 409, {
        code: "whatsapp_not_connected",
      });
    }

    const digits = parsed.data.phone.replace(/\D/g, "");
    if (digits.length < 10) {
      return apiError("Invalid phone number", 400);
    }

    const text = parsed.data.subject
      ? `${parsed.data.subject}\n\n${parsed.data.message}`
      : parsed.data.message;

    await guardedSendText(connection.session_name, digits, text, false);

    const sentAt = new Date().toISOString();
    const providerMessageId = crypto.randomUUID();
    const payloadHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          session: connection.session_name,
          wa_id: digits,
          body_preview: text,
          sent_at: sentAt,
        })
      )
      .digest("hex");

    await admin.from("whatsapp_webhook_events").insert({
      provider_message_id: providerMessageId,
      payload_hash: payloadHash,
      event_type: "text",
      wa_id: digits,
      metadata: {
        session: connection.session_name,
        direction: "out",
        body_preview: parsed.data.message,
        subject: parsed.data.subject || null,
        sent_by: userId,
      },
      processing_status: "processed",
      processed_at: sentAt,
      received_at: sentAt,
    });

    return apiSuccess({
      message: {
        id: providerMessageId,
        type: "text",
        direction: "out",
        body: parsed.data.message,
        subject: parsed.data.subject,
        timestamp: new Date(sentAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        status: "sent",
      },
      connection_status: "connected",
    });
  } catch (error) {
    logError("[whatsapp/send] unexpected error", error);
    return apiError("Failed to send WhatsApp message", 500);
  }
}
