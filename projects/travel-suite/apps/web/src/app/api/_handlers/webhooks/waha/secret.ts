import { timingSafeEqual } from "crypto";

export function validateWahaWebhookSecret(options: {
  requestUrl: string;
  configuredSecret: string | undefined;
  allowUnsigned: boolean;
  providedHeaderSecret: string | null;
}) {
  const { requestUrl, configuredSecret, allowUnsigned, providedHeaderSecret } =
    options;

  if (!configuredSecret) {
    if (allowUnsigned) {
      return { ok: true as const };
    }

    return {
      ok: false as const,
      status: 503,
      error: "Webhook not configured",
    };
  }

  const url = new URL(requestUrl);
  const providedSecret =
    providedHeaderSecret?.trim() ?? url.searchParams.get("secret")?.trim() ?? "";
  const providedBuffer = Buffer.from(providedSecret, "utf8");
  const expectedBuffer = Buffer.from(configuredSecret, "utf8");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid or missing webhook secret",
    };
  }

  return { ok: true as const };
}
