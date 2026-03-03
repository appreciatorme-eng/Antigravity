import "server-only";

/* ------------------------------------------------------------------
 * Smart Alert Preferences -- configurable thresholds for proactive alerts.
 *
 * Reads user preferences to customize alert behavior:
 * - Minimum overdue amount to trigger invoice alerts
 * - Trip alert lead time (days before trip)
 * - Dormant client threshold (days since last contact)
 * - Alert channels (whatsapp, email, or both)
 * - Quiet hours (don't send alerts during these hours)
 *
 * All functions read from assistant_preferences table. Pure where possible.
 * ------------------------------------------------------------------ */

import type { ActionContext } from "./types";
import { getPreference } from "./preferences";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AlertThresholds {
  readonly minOverdueAmountInr: number;
  readonly tripLeadTimeDays: number;
  readonly dormantClientDays: number;
  readonly maxAlertsPerCycle: number;
  readonly alertsEnabled: boolean;
  readonly quietHoursStart: number; // 0-23
  readonly quietHoursEnd: number; // 0-23
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_THRESHOLDS: AlertThresholds = {
  minOverdueAmountInr: 0, // Alert for all overdue amounts
  tripLeadTimeDays: 1, // Trips starting tomorrow
  dormantClientDays: 30, // 30 days without contact
  maxAlertsPerCycle: 3, // Max 3 alerts per check
  alertsEnabled: true, // Alerts on by default
  quietHoursStart: 22, // No alerts 10 PM to 7 AM
  quietHoursEnd: 7,
};

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Load alert thresholds for a user from their assistant preferences.
 * Falls back to sensible defaults for any missing preferences.
 */
export async function getAlertThresholds(
  ctx: ActionContext,
): Promise<AlertThresholds> {
  try {
    const [
      minAmount,
      leadTime,
      dormantDays,
      maxAlerts,
      enabled,
      quietStart,
      quietEnd,
    ] = await Promise.all([
      getPreference(ctx, "alert_min_overdue_amount"),
      getPreference(ctx, "alert_trip_lead_days"),
      getPreference(ctx, "alert_dormant_client_days"),
      getPreference(ctx, "alert_max_per_cycle"),
      getPreference(ctx, "alerts_enabled"),
      getPreference(ctx, "alert_quiet_hours_start"),
      getPreference(ctx, "alert_quiet_hours_end"),
    ]);

    return {
      minOverdueAmountInr: parseNumber(
        minAmount,
        DEFAULT_THRESHOLDS.minOverdueAmountInr,
      ),
      tripLeadTimeDays: parseNumber(
        leadTime,
        DEFAULT_THRESHOLDS.tripLeadTimeDays,
      ),
      dormantClientDays: parseNumber(
        dormantDays,
        DEFAULT_THRESHOLDS.dormantClientDays,
      ),
      maxAlertsPerCycle: parseNumber(
        maxAlerts,
        DEFAULT_THRESHOLDS.maxAlertsPerCycle,
      ),
      alertsEnabled: parseBoolean(enabled, DEFAULT_THRESHOLDS.alertsEnabled),
      quietHoursStart: parseNumber(
        quietStart,
        DEFAULT_THRESHOLDS.quietHoursStart,
      ),
      quietHoursEnd: parseNumber(quietEnd, DEFAULT_THRESHOLDS.quietHoursEnd),
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

/**
 * Check if the current hour is within quiet hours.
 * Returns true if alerts should be suppressed.
 */
export function isQuietHours(thresholds: AlertThresholds): boolean {
  const currentHour = new Date().getUTCHours();
  // Convert to IST (UTC+5:30)
  const istHour = (currentHour + 5) % 24;

  const { quietHoursStart, quietHoursEnd } = thresholds;

  if (quietHoursStart <= quietHoursEnd) {
    // Simple range: e.g. 22-23 or 1-7
    return istHour >= quietHoursStart && istHour < quietHoursEnd;
  }
  // Wrapping range: e.g. 22-7 means 22,23,0,1,2,3,4,5,6
  return istHour >= quietHoursStart || istHour < quietHoursEnd;
}
