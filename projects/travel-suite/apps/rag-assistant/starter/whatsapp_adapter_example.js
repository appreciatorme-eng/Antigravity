const { getConfig } = require("./config");
const { handleMessage } = require("./orchestrator");

// Production: replace this stub with a real Supabase lookup.
// The existing webhook resolves tenants via the `profiles` table:
//   SELECT id, organization_id FROM profiles
//   WHERE phone_normalized = normalized AND role = 'operator'
// phone_normalized strips all non-digits, matching the existing
// normalizeWaId() in apps/web/src/lib/whatsapp.server.ts.
// Never accept operator messages without confirming organization_id from DB.
function mapSenderToTenant(senderPhone) {
  if (!senderPhone) {
    return null;
  }
  const normalized = senderPhone.replace(/\D/g, "");
  // TODO: replace stub below with:
  //   const { data } = await supabaseAdmin.from("profiles")
  //     .select("id, organization_id")
  //     .eq("phone_normalized", normalized)
  //     .maybeSingle();
  //   if (!data?.organization_id) return null;
  //   return { organizationId: data.organization_id, userId: data.id };
  return {
    organizationId: "org_demo_123",
    userId: `wa_${normalized}`
  };
}

// Production requirements before calling handleMessage from a real webhook:
// 1. Verify HMAC-SHA256 signature using X-Hub-Signature-256 header and WHATSAPP_APP_SECRET.
//    (See apps/web/src/app/api/whatsapp/webhook/route.ts -> verifySignature)
// 2. Reject duplicate messages using provider_message_id unique constraint (error code 23505).
//    The existing webhook uses whatsapp_webhook_events table for idempotency.
// 3. Log all messages to whatsapp_webhook_events before processing.
function handleWhatsAppWebhook({ senderPhone, text, pendingAction }) {
  const mapping = mapSenderToTenant(senderPhone);
  if (!mapping) {
    return {
      response: "I could not map this number to an organization yet."
    };
  }

  return handleMessage({
    tenantId: mapping.organizationId,
    userId: mapping.userId,
    channel: "whatsapp",
    message: text,
    config: getConfig(),
    pendingAction
  });
}

module.exports = {
  handleWhatsAppWebhook,
  mapSenderToTenant
};
