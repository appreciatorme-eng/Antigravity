import type { Json } from "@/lib/database.types";

export function isMissingSharedItineraryPaymentConfigColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return message.includes("payment_config") && message.includes("shared_itineraries");
}

export async function withOptionalSharedItineraryPaymentConfig<T>(
  primary: () => PromiseLike<{ data: unknown; error: unknown }>,
  fallback: () => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<{ data: T; error: unknown; paymentConfigSupported: boolean }> {
  const result = await primary();
  if (!result.error || !isMissingSharedItineraryPaymentConfigColumn(result.error)) {
    return {
      data: result.data as T,
      error: result.error,
      paymentConfigSupported: !result.error,
    };
  }

  const fallbackResult = await fallback();
  return {
    data: fallbackResult.data as T,
    error: fallbackResult.error,
    paymentConfigSupported: false,
  };
}

export function maybeAttachSharedItineraryPaymentConfig<T extends Record<string, unknown>>(
  payload: T,
  paymentConfigSupported: boolean,
  paymentConfig: Json | null,
): T {
  if (!paymentConfigSupported) return payload;
  return {
    ...payload,
    payment_config: paymentConfig,
  };
}
