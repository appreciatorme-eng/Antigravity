/* ------------------------------------------------------------------
 * Context Engine -- auto-enriches the assistant with a business
 * snapshot drawn from the organisation's live data.
 *
 * Pure functions except for the Supabase DB calls.
 * Every query is scoped to `organization_id` from the ActionContext.
 * If any individual query fails the function returns an empty array;
 * callers are never exposed to thrown errors.
 * ------------------------------------------------------------------ */

import type { ActionContext, ContextSnapshot } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Today as YYYY-MM-DD for date-range comparisons. */
const todayISO = (): string => new Date().toISOString().slice(0, 10);

/** ISO date string for N days ago. */
const nDaysAgoISO = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// ---------------------------------------------------------------------------
// Individual enrichment queries
// ---------------------------------------------------------------------------

/** Trips whose date range overlaps today. */
export async function getTodaysTrips(
  ctx: ActionContext,
): Promise<ContextSnapshot["todayTrips"]> {
  try {
    const today = todayISO();

    const { data, error } = await ctx.supabase
      .from("trips")
      .select(
        "id, status, start_date, end_date, client_id, profiles!trips_client_id_fkey(full_name)",
      )
      .eq("organization_id", ctx.organizationId)
      .gte("end_date", today)
      .lte("start_date", today)
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((row) => {
      const profiles = row.profiles as
        | { full_name: string | null }
        | null;

      return {
        id: row.id,
        status: row.status,
        clientName: profiles?.full_name ?? null,
        startDate: row.start_date,
        endDate: row.end_date,
      };
    });
  } catch {
    return [];
  }
}

/** Invoices that are issued, partially paid, or overdue. */
export async function getPendingInvoices(
  ctx: ActionContext,
): Promise<ContextSnapshot["pendingInvoices"]> {
  try {
    const { data, error } = await ctx.supabase
      .from("invoices")
      .select(
        "id, invoice_number, total_amount, balance_amount, currency, due_date, status, client_id, profiles!invoices_client_id_fkey(full_name)",
      )
      .eq("organization_id", ctx.organizationId)
      .in("status", ["issued", "partially_paid", "overdue"])
      .order("due_date", { ascending: true })
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((row) => {
      const profiles = row.profiles as
        | { full_name: string | null }
        | null;

      return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        clientName: profiles?.full_name ?? null,
        totalAmount: row.total_amount,
        balanceAmount: row.balance_amount,
        currency: row.currency,
        dueDate: row.due_date,
        status: row.status,
      };
    });
  } catch {
    return [];
  }
}

/** Clients updated within the last N days. */
export async function getRecentlyActiveClients(
  ctx: ActionContext,
  days: number,
): Promise<ContextSnapshot["recentClients"]> {
  try {
    const cutoff = nDaysAgoISO(days);

    const { data, error } = await ctx.supabase
      .from("clients")
      .select(
        "id, profiles!clients_id_fkey(full_name, email, lifecycle_stage, last_contacted_at)",
      )
      .eq("organization_id", ctx.organizationId)
      .gte("updated_at", cutoff)
      .limit(10);

    if (error || !data) {
      return [];
    }

    return data.map((row) => {
      const profiles = row.profiles as
        | {
            full_name: string | null;
            email: string | null;
            lifecycle_stage: string | null;
            last_contacted_at: string | null;
          }
        | null;

      return {
        id: row.id,
        name: profiles?.full_name ?? null,
        email: profiles?.email ?? null,
        lifecycleStage: profiles?.lifecycle_stage ?? null,
        lastContactedAt: profiles?.last_contacted_at ?? null,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Notifications that failed to deliver.
 *
 * `notification_queue` does not have a direct `organization_id` column --
 * it references `trip_id` which links to `trips.organization_id`.
 * We use an inner join to scope by organisation. If the query shape
 * does not match (schema drift), we gracefully return empty.
 */
export async function getFailedNotifications(
  ctx: ActionContext,
): Promise<ContextSnapshot["failedNotifications"]> {
  try {
    const { data, error } = await ctx.supabase
      .from("notification_queue")
      .select(
        "id, channel_preference, error_message, user_id, profiles!notification_queue_user_id_fkey(full_name), trips!inner(organization_id)",
      )
      .eq("status", "failed")
      .eq("trips.organization_id", ctx.organizationId)
      .limit(5);

    if (error || !data) {
      return [];
    }

    return data.map((row) => {
      const profiles = row.profiles as
        | { full_name: string | null }
        | null;

      return {
        id: row.id,
        recipientName: profiles?.full_name ?? null,
        channel: row.channel_preference,
        errorMessage: row.error_message,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Snapshot builder
// ---------------------------------------------------------------------------

/** Run all enrichment queries in parallel and combine into one snapshot. */
export async function buildContextSnapshot(
  ctx: ActionContext,
): Promise<ContextSnapshot> {
  const [todayTrips, pendingInvoices, recentClients, failedNotifications] =
    await Promise.all([
      getTodaysTrips(ctx),
      getPendingInvoices(ctx),
      getRecentlyActiveClients(ctx, 7),
      getFailedNotifications(ctx),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    todayTrips,
    pendingInvoices,
    recentClients,
    failedNotifications,
  };
}

// ---------------------------------------------------------------------------
// Simple in-memory cache
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  readonly snapshot: ContextSnapshot;
  readonly expiresAt: number;
}

const snapshotCache = new Map<string, CacheEntry>();

/** Return a cached snapshot when still fresh, otherwise build a new one. */
export async function getCachedContextSnapshot(
  ctx: ActionContext,
): Promise<ContextSnapshot> {
  const key = ctx.organizationId;
  const cached = snapshotCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  const snapshot = await buildContextSnapshot(ctx);

  snapshotCache.set(key, {
    snapshot,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return snapshot;
}
