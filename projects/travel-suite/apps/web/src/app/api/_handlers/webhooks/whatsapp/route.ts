/* ------------------------------------------------------------------
 * WhatsApp Inbound Webhook -- handles Meta Cloud API webhook events.
 *
 * GET: Webhook verification challenge (one-time setup).
 * POST: Process incoming text messages and route to assistant.
 *
 * Security: HMAC-SHA256 signature verification on POST requests.
 * ------------------------------------------------------------------ */

import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { handleWhatsAppMessage } from "@/lib/assistant/channel-adapters/whatsapp";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatsAppTextMessage {
  readonly from: string;
  readonly id: string;
  readonly timestamp: string;
  readonly text?: { readonly body: string };
  readonly type: string;
}

interface MetaWebhookPayload {
  readonly object: string;
  readonly entry: ReadonlyArray<{
    readonly id: string;
    readonly changes: ReadonlyArray<{
      readonly value: {
        readonly messaging_product: string;
        readonly metadata: {
          readonly display_phone_number: string;
          readonly phone_number_id: string;
        };
        readonly messages?: ReadonlyArray<WhatsAppTextMessage>;
        readonly statuses?: ReadonlyArray<unknown>;
      };
      readonly field: string;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum time (ms) to wait for message processing before returning to Meta. */
const PROCESSING_TIMEOUT_MS = 4000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify the HMAC-SHA256 signature sent by Meta in the
 * `X-Hub-Signature-256` header.
 */
function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature.startsWith("sha256=")) return false;
  const provided = signature.slice("sha256=".length);
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

// ---------------------------------------------------------------------------
// GET -- webhook verification challenge
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST -- process incoming messages
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // 1. Read raw body for signature verification
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error("[WhatsApp webhook] failed to read request body:", err);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  // 2. HMAC signature verification (fail-closed)
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signatureHeader = request.headers.get("X-Hub-Signature-256");

  if (!appSecret) {
    console.error("[WhatsApp webhook] WHATSAPP_APP_SECRET not configured");
    return new Response("Webhook not configured", { status: 500 });
  }
  if (!signatureHeader) {
    console.error("[WhatsApp webhook] Missing X-Hub-Signature-256 header");
    return new Response("Unauthorized", { status: 401 });
  }
  if (!verifySignature(rawBody, signatureHeader, appSecret)) {
    console.error("[WhatsApp webhook] HMAC signature mismatch");
    return new Response("Unauthorized", { status: 401 });
  }

  // 3. Parse body
  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch (err) {
    console.error("[WhatsApp webhook] failed to parse JSON body:", err);
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  // 4. Ignore non-WhatsApp webhooks
  if (payload.object !== "whatsapp_business_account") {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  // 5. Extract and process text messages
  const processingPromises: Promise<unknown>[] = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const messages = change.value.messages ?? [];

      for (const message of messages) {
        if (message.type !== "text" || !message.text?.body) continue;

        const waId = message.from;
        const senderPhone = "+" + message.from;

        processingPromises.push(
          handleWhatsAppMessage(waId, message.text.body, senderPhone).catch(
            (err) =>
              console.error(
                "[WhatsApp webhook] message processing error:",
                err,
              ),
          ),
        );
      }
    }
  }

  // 6. Wait for processing, but cap at PROCESSING_TIMEOUT_MS to avoid Meta timeout
  await Promise.race([
    Promise.allSettled(processingPromises),
    new Promise((resolve) => setTimeout(resolve, PROCESSING_TIMEOUT_MS)),
  ]);

  return NextResponse.json({ status: "ok" });
}
