/**
 * Shared formatter for FEATURE_LIMIT_EXCEEDED API error payloads.
 *
 * Centralised here so every consumer uses the same typed signature
 * instead of duplicating the function with `any` casts.
 */

export interface FeatureLimitErrorPayload {
  readonly code?: string;
  readonly limit?: number | null;
  readonly used?: number | null;
  readonly feature?: string;
  readonly error?: string;
  readonly [key: string]: unknown;
}

/**
 * If the API response payload carries `code: "FEATURE_LIMIT_EXCEEDED"`,
 * return a human-readable limit message. Otherwise return the fallback.
 */
export function formatFeatureLimitError(
  payload: FeatureLimitErrorPayload | null | undefined,
  fallback: string,
): string {
  if (payload?.code !== "FEATURE_LIMIT_EXCEEDED") return fallback;

  const limit = Number(payload?.limit || 0);
  const used = Number(payload?.used || 0);
  const feature = String(payload?.feature || "usage");

  if (limit > 0) {
    return `Limit reached for ${feature}: ${used}/${limit}. Upgrade in Billing to continue.`;
  }

  return typeof payload?.error === "string" ? payload.error : fallback;
}
