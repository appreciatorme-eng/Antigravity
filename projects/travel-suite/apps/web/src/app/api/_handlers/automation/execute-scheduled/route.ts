import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/whatsapp.server";
import { resolveVariables } from "@/lib/automation/resolve-variables";
import { hasAlreadySent, recordSent } from "@/lib/automation/dedup";
import { checkAutomationRateLimit } from "@/lib/automation/rate-limiter";
import { getTemplateById } from "@/lib/automation/templates";
import { logError, logEvent } from "@/lib/observability/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScheduledPayload {
  orgId: string;
  ruleType: string;
  contactPhone: string;
  entityId: string;
  entityType: string;
}

// ─── QStash Signature Verification ──────────────────────────────────────────

async function verifyQStashSignature(
  request: NextRequest,
  body: string,
): Promise<boolean> {
  const signature = request.headers.get("upstash-signature");

  // If no signature header, allow in non-production (for testing)
  if (!signature) {
    if (process.env.NODE_ENV === "production") {
      logEvent("warn", "[execute-scheduled] Missing QStash signature in production");
      return false;
    }
    return true;
  }

  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY?.trim();
  if (!signingKey) {
    logEvent("warn", "[execute-scheduled] QSTASH_CURRENT_SIGNING_KEY not set, skipping verification");
    return true;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(signingKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signatureBytes = Uint8Array.from(
      atob(signature),
      (c) => c.charCodeAt(0),
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(body),
    );
  } catch (error) {
    logError("[execute-scheduled] Signature verification error", error);
    return false;
  }
}

// ─── Contact Override Check ─────────────────────────────────────────────────

async function isContactDisabled(
  orgId: string,
  contactPhone: string,
  ruleType: string,
): Promise<boolean> {
  const admin = createAdminClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from("automation_contact_overrides")
      .select("disabled")
      .eq("organization_id", orgId)
      .eq("contact_phone", contactPhone)
      .eq("rule_type", ruleType)
      .maybeSingle();

    return data?.disabled === true;
  } catch (error) {
    logError("[execute-scheduled] Failed to check contact override", error);
    return false;
  }
}

// ─── Payload Validation ─────────────────────────────────────────────────────

function validatePayload(data: unknown): ScheduledPayload | null {
  if (typeof data !== "object" || data === null) return null;

  const d = data as Record<string, unknown>;

  if (typeof d.orgId !== "string" || !d.orgId) return null;
  if (typeof d.ruleType !== "string" || !d.ruleType) return null;
  if (typeof d.contactPhone !== "string" || !d.contactPhone) return null;
  if (typeof d.entityId !== "string" || !d.entityId) return null;
  if (typeof d.entityType !== "string" || !d.entityType) return null;

  return {
    orgId: d.orgId,
    ruleType: d.ruleType,
    contactPhone: d.contactPhone,
    entityId: d.entityId,
    entityType: d.entityType,
  };
}

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Step 1: Verify QStash signature
  const signatureValid = await verifyQStashSignature(request, rawBody);
  if (!signatureValid) {
    return apiError("Invalid signature", 401);
  }

  // Step 2: Parse and validate payload
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const payload = validatePayload(parsed);
  if (!payload) {
    return apiError("Invalid payload: missing required fields", 400);
  }

  const { orgId, ruleType, contactPhone, entityId, entityType } = payload;

  try {
    // Step 3: Check per-contact override
    const disabled = await isContactDisabled(orgId, contactPhone, ruleType);
    if (disabled) {
      logEvent("info", "[execute-scheduled] Contact disabled, skipping", {
        orgId, ruleType, contactPhone,
      });
      return apiSuccess({ action: "skipped", reason: "contact_disabled" });
    }

    // Step 4: Check dedup
    const alreadySent = await hasAlreadySent(orgId, ruleType, contactPhone);
    if (alreadySent) {
      logEvent("info", "[execute-scheduled] Already sent, skipping", {
        orgId, ruleType, contactPhone,
      });
      return apiSuccess({ action: "skipped", reason: "already_sent" });
    }

    // Step 5: Check rate limit
    const allowed = await checkAutomationRateLimit(contactPhone, ruleType);
    if (!allowed) {
      return apiSuccess({ action: "skipped", reason: "rate_limited" });
    }

    // Step 6: Resolve template variables
    const template = getTemplateById(ruleType as Parameters<typeof getTemplateById>[0]);
    if (!template) {
      return apiError(`Unknown rule type: ${ruleType}`, 400);
    }

    const message = await resolveVariables(
      template.action_config.message_template,
      entityType as "proposal" | "payment" | "trip" | "booking",
      entityId,
      orgId,
    );

    // Step 7: Send WhatsApp message
    const result = await sendWhatsAppText(contactPhone, message);

    if (!result.success) {
      logError("[execute-scheduled] WhatsApp send failed", new Error(result.error ?? "Unknown"), {
        orgId, ruleType, contactPhone,
      });
      return apiError(result.error ?? "WhatsApp send failed", 502);
    }

    // Step 8: Record for dedup
    await recordSent(orgId, ruleType, contactPhone, message);

    logEvent("info", "[execute-scheduled] Message sent successfully", {
      orgId, ruleType, contactPhone, messageId: result.messageId,
    });

    return apiSuccess({
      action: "sent",
      messageId: result.messageId,
    });
  } catch (error) {
    logError("[execute-scheduled] Unexpected error", error, {
      orgId, ruleType, contactPhone,
    });
    return apiError("Internal server error", 500);
  }
}
