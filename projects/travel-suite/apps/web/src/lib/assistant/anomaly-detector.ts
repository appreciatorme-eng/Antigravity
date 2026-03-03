import "server-only";

/* ------------------------------------------------------------------
 * Anomaly Detector -- compares current week metrics to 4-week average.
 *
 * Detects significant deviations (>= 50%) in revenue, trip volume,
 * and proposal conversion. Returns AlertTrigger objects compatible
 * with the alerts system for queuing via notification_queue.
 *
 * All queries use the passed supabase client. Never throws.
 * ------------------------------------------------------------------ */

import type { ActionContext } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnomalyAlertTrigger {
  readonly type:
    | "revenue_spike"
    | "revenue_drop"
    | "trip_spike"
    | "trip_drop"
    | "proposal_drop";
  readonly message: string;
  readonly entityType: "metric";
  readonly entityId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANOMALY_THRESHOLD = 0.5; // 50% deviation triggers alert
const MIN_AVERAGE = 1; // avoid false alarms when average is near zero
const PAST_WEEKS = [1, 2, 3, 4] as const;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Returns ISO date string for start of ISO week N weeks ago (Monday). */
function weekStartISO(weeksAgo: number): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now.getTime() - daysToLastMonday * 86400000);
  const targetMonday = new Date(
    thisMonday.getTime() - weeksAgo * 7 * 86400000,
  );
  return targetMonday.toISOString().slice(0, 10);
}

/** Returns ISO date string for end of ISO week N weeks ago (Sunday 23:59:59). */
function weekEndISO(weeksAgo: number): string {
  const start = new Date(weekStartISO(weeksAgo));
  const end = new Date(start.getTime() + 6 * 86400000);
  return end.toISOString().slice(0, 10) + "T23:59:59Z";
}

// ---------------------------------------------------------------------------
// Individual metric helpers
// ---------------------------------------------------------------------------

/** Sum of paid / partially-paid invoice amounts for a given week. */
async function fetchWeekRevenue(
  ctx: ActionContext,
  weeksAgo: number,
): Promise<number> {
  try {
    const { data, error } = await ctx.supabase
      .from("invoices")
      .select("total_amount")
      .eq("organization_id", ctx.organizationId)
      .in("status", ["paid", "partially_paid"])
      .gte("created_at", weekStartISO(weeksAgo))
      .lte("created_at", weekEndISO(weeksAgo));

    if (error || !data) return 0;
    return data.reduce(
      (sum, row) => sum + (Number(row.total_amount) || 0),
      0,
    );
  } catch {
    return 0;
  }
}

/** Number of trips starting in a given week. */
async function fetchWeekTripCount(
  ctx: ActionContext,
  weeksAgo: number,
): Promise<number> {
  try {
    const { count, error } = await ctx.supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .gte("start_date", weekStartISO(weeksAgo))
      .lte("start_date", weekEndISO(weeksAgo).slice(0, 10));

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Proposal conversion rate (%) for a given week. */
async function fetchWeekProposalConversion(
  ctx: ActionContext,
  weeksAgo: number,
): Promise<number> {
  try {
    const { data, error } = await ctx.supabase
      .from("proposals")
      .select("status")
      .eq("organization_id", ctx.organizationId)
      .gte("created_at", weekStartISO(weeksAgo))
      .lte("created_at", weekEndISO(weeksAgo));

    if (error || !data || data.length === 0) return 0;
    const accepted = data.filter((row) => row.status === "accepted").length;
    return (accepted / data.length) * 100;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Anomaly computation
// ---------------------------------------------------------------------------

function computeAnomaly(
  current: number,
  weekValues: readonly number[],
): { readonly spike: boolean; readonly drop: boolean } {
  const avg = weekValues.reduce((s, v) => s + v, 0) / weekValues.length;
  if (avg < MIN_AVERAGE) return { spike: false, drop: false };
  const ratio = current / avg;
  return {
    spike: ratio > 1 + ANOMALY_THRESHOLD,
    drop: ratio < 1 - ANOMALY_THRESHOLD,
  };
}

/** Percentage deviation from average, formatted as a positive integer. */
function deviationPct(current: number, avg: number): number {
  return Math.abs(Math.round((current / avg - 1) * 100));
}

/** Average of an array of numbers. */
function avg(values: readonly number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Extract fulfilled values from settled results, defaulting rejected to 0. */
function settledValue(r: PromiseSettledResult<number>): number {
  return r.status === "fulfilled" ? r.value : 0;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Detect anomalies by comparing current-week metrics to 4-week rolling
 * averages. Returns alert triggers for any metric with >= 50% deviation.
 *
 * Never throws -- individual query failures yield zero values which
 * naturally suppress false positives.
 */
export async function detectAnomalies(
  ctx: ActionContext,
): Promise<readonly AnomalyAlertTrigger[]> {
  try {
    // Fetch current (0) + past 4 weeks (1-4) for all 3 metrics in parallel
    const settled = await Promise.allSettled([
      fetchWeekRevenue(ctx, 0),
      ...PAST_WEEKS.map((w) => fetchWeekRevenue(ctx, w)),
      fetchWeekTripCount(ctx, 0),
      ...PAST_WEEKS.map((w) => fetchWeekTripCount(ctx, w)),
      fetchWeekProposalConversion(ctx, 0),
      ...PAST_WEEKS.map((w) => fetchWeekProposalConversion(ctx, w)),
    ]);

    // Indices: 0=revCurrent, 1-4=revPast, 5=tripsCurrent, 6-9=tripsPast,
    //          10=convCurrent, 11-14=convPast
    const currentRevenue = settledValue(settled[0]);
    const pastRevenue = settled.slice(1, 5).map(settledValue);

    const currentTrips = settledValue(settled[5]);
    const pastTrips = settled.slice(6, 10).map(settledValue);

    const currentConversion = settledValue(settled[10]);
    const pastConversion = settled.slice(11, 15).map(settledValue);

    const alerts: AnomalyAlertTrigger[] = [];
    const weekKey = weekStartISO(0);

    // --- Revenue anomalies ---
    const revenueAnomaly = computeAnomaly(currentRevenue, pastRevenue);
    const revenueAvg = avg(pastRevenue);

    if (revenueAnomaly.spike) {
      const pct = deviationPct(currentRevenue, revenueAvg);
      alerts.push({
        type: "revenue_spike",
        message: `Revenue this week (\u20B9${currentRevenue.toFixed(0)}) is ${pct}% above the 4-week average of \u20B9${revenueAvg.toFixed(0)}.`,
        entityType: "metric",
        entityId: `revenue:${weekKey}`,
      });
    }

    if (revenueAnomaly.drop) {
      const pct = deviationPct(currentRevenue, revenueAvg);
      alerts.push({
        type: "revenue_drop",
        message: `Revenue this week (\u20B9${currentRevenue.toFixed(0)}) is ${pct}% below the 4-week average of \u20B9${revenueAvg.toFixed(0)}.`,
        entityType: "metric",
        entityId: `revenue:${weekKey}`,
      });
    }

    // --- Trip volume anomalies ---
    const tripAnomaly = computeAnomaly(currentTrips, pastTrips);
    const tripAvg = avg(pastTrips);

    if (tripAnomaly.spike) {
      const pct = deviationPct(currentTrips, tripAvg);
      alerts.push({
        type: "trip_spike",
        message: `Trip volume this week (${currentTrips}) is ${pct}% above the 4-week average of ${tripAvg.toFixed(1)}.`,
        entityType: "metric",
        entityId: `trips:${weekKey}`,
      });
    }

    if (tripAnomaly.drop) {
      const pct = deviationPct(currentTrips, tripAvg);
      alerts.push({
        type: "trip_drop",
        message: `Trip volume this week (${currentTrips}) is ${pct}% below the 4-week average of ${tripAvg.toFixed(1)}.`,
        entityType: "metric",
        entityId: `trips:${weekKey}`,
      });
    }

    // --- Proposal conversion anomalies (drop only) ---
    const conversionAnomaly = computeAnomaly(currentConversion, pastConversion);
    const conversionAvg = avg(pastConversion);

    if (conversionAnomaly.drop) {
      const pct = deviationPct(currentConversion, conversionAvg);
      alerts.push({
        type: "proposal_drop",
        message: `Proposal conversion this week (${currentConversion.toFixed(1)}%) is ${pct}% below the 4-week average (${conversionAvg.toFixed(1)}%).`,
        entityType: "metric",
        entityId: `proposals:${weekKey}`,
      });
    }

    return alerts;
  } catch {
    return [];
  }
}
