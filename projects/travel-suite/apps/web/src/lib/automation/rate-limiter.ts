import "server-only";

/* ------------------------------------------------------------------
 * Automation Rate Limiter
 *
 * Enforces per-contact rate limits for automation messages:
 * max 1 message per contact per hour per automation type.
 *
 * Uses Upstash Redis (same instance as the main rate limiter).
 * Falls back to allowing sends if Redis is unavailable.
 * ------------------------------------------------------------------ */

import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logEvent } from "@/lib/observability/logger";

const AUTOMATION_RATE_LIMIT = 1;
const AUTOMATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const AUTOMATION_PREFIX = "automation:send";

/**
 * Check if a message can be sent to this contact for this automation type.
 *
 * @returns true if the message is allowed, false if rate-limited
 */
export async function checkAutomationRateLimit(
  contactPhone: string,
  ruleType: string,
): Promise<boolean> {
  const identifier = `${ruleType}:${contactPhone}`;

  const result = await enforceRateLimit({
    identifier,
    limit: AUTOMATION_RATE_LIMIT,
    windowMs: AUTOMATION_WINDOW_MS,
    prefix: AUTOMATION_PREFIX,
  });

  if (!result.success) {
    logEvent("info", "[automation-rate-limit] Rate limited", {
      contactPhone,
      ruleType,
      remaining: result.remaining,
      reset: result.reset,
    });
  }

  return result.success;
}

/**
 * Delay between sends in a batch to avoid burst.
 * Returns a promise that resolves after 1.5 seconds.
 */
export function batchSendDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1500));
}
