import { safeEqual } from "@/lib/security/safe-equal";

export function validateWahaWebhookSecret(options: {
  requestUrl: string;
  configuredSecret: string | undefined;
  allowUnsigned: boolean;
  providedHeaderSecret: string | null;
}) {
  const { requestUrl, configuredSecret, allowUnsigned, providedHeaderSecret } = options;

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

  // Check header first (preferred)
  const headerSecret = providedHeaderSecret?.trim() ?? "";
  if (headerSecret && safeEqual(headerSecret, configuredSecret)) {
    return { ok: true as const };
  }

  // Fallback: check ?secret= query param (WPPConnect doesn't send custom headers)
  try {
    const url = new URL(requestUrl);
    const querySecret = url.searchParams.get("secret")?.trim() ?? "";
    if (querySecret && safeEqual(querySecret, configuredSecret)) {
      return { ok: true as const };
    }
  } catch {
    // Invalid URL — fall through to rejection
  }

  return {
    ok: false as const,
    status: 401,
    error: "Invalid or missing webhook secret",
  };
}
