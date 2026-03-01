export function isUnsignedWebhookAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.WHATSAPP_ALLOW_UNSIGNED_WEBHOOK === "true";
}
