import { safeEqual } from "@/lib/security/safe-equal";

export function validateWahaWebhookSecret(options: {
  requestUrl: string;
  configuredSecret: string | undefined;
  allowUnsigned: boolean;
  providedHeaderSecret: string | null;
}) {
  const { configuredSecret, allowUnsigned, providedHeaderSecret } = options;

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

  const providedSecret = providedHeaderSecret?.trim() ?? "";

  if (!safeEqual(providedSecret, configuredSecret)) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid or missing webhook secret",
    };
  }

  return { ok: true as const };
}
