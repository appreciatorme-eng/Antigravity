/* ------------------------------------------------------------------
 * Dashboard read actions -- surface high-level business summaries,
 * pending items, and KPI snapshots.
 *
 * Every query is scoped to `organization_id` from the ActionContext.
 * All execute handlers are wrapped in try/catch and return a
 * failure ActionResult on any error.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Today as YYYY-MM-DD for date-range comparisons. */
const todayISO = (): string => new Date().toISOString().slice(0, 10);

/** First day of a month as YYYY-MM-DD. */
const firstOfMonth = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

/** Last day of a month as YYYY-MM-DD. */
const lastOfMonth = (date: Date): string => {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
};

/**
 * Derive a [start, end] date range from a period label.
 * Returns YYYY-MM-DD strings suitable for Supabase range filters.
 */
const dateRangeForPeriod = (
  period: string,
): { readonly start: string; readonly end: string } => {
  const now = new Date();

  switch (period) {
    case "last_month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start: firstOfMonth(prev), end: lastOfMonth(prev) };
    }
    case "this_year": {
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
      };
    }
    case "this_month":
    default: {
      return { start: firstOfMonth(now), end: lastOfMonth(now) };
    }
  }
};

/** ISO date string for N days from now. */
const nDaysFromNowISO = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Format a number as INR with commas. */
const formatINR = (amount: number): string =>
  `INR ${amount.toLocaleString("en-IN")}`;

// ---------------------------------------------------------------------------
// 1. get_today_summary
// ---------------------------------------------------------------------------

const getTodaySummary: ActionDefinition = {
  name: "get_today_summary",
  description:
    "Get a summary of today's business activity including active trips, pending invoices, and items needing attention",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (ctx: ActionContext): Promise<ActionResult> => {
    try {
      const today = todayISO();

      const [tripsResult, invoicesResult, proposalsResult] = await Promise.all([
        // Active trips today
        ctx.supabase
          .from("trips")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", ctx.organizationId)
          .lte("start_date", today)
          .gte("end_date", today),

        // Invoices grouped by status
        ctx.supabase
          .from("invoices")
          .select("status, total_amount, balance_amount, currency")
          .eq("organization_id", ctx.organizationId)
          .in("status", [
            "draft",
            "issued",
            "partially_paid",
            "paid",
            "overdue",
            "cancelled",
          ]),

        // Open proposals
        ctx.supabase
          .from("proposals")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", ctx.organizationId)
          .in("status", ["draft", "sent"]),
      ]);

      const activeTrips = tripsResult.count ?? 0;
      const openProposals = proposalsResult.count ?? 0;

      // Compute invoice breakdown from raw rows
      const invoiceRows = invoicesResult.data ?? [];

      const pendingStatuses = new Set([
        "issued",
        "partially_paid",
        "draft",
      ]);

      const pendingInvoices = invoiceRows.filter((r) =>
        pendingStatuses.has(r.status),
      );
      const overdueInvoices = invoiceRows.filter(
        (r) => r.status === "overdue",
      );

      const pendingTotal = pendingInvoices.reduce(
        (sum, r) => sum + (r.balance_amount ?? r.total_amount ?? 0),
        0,
      );

      const overdueTotal = overdueInvoices.reduce(
        (sum, r) => sum + (r.balance_amount ?? r.total_amount ?? 0),
        0,
      );

      const message = [
        `Here's your business summary for today:`,
        `- Active trips: ${activeTrips}`,
        `- Pending invoices: ${pendingInvoices.length} (totaling ${formatINR(pendingTotal)})`,
        `- Open proposals: ${openProposals}`,
        `- Overdue invoices: ${overdueInvoices.length}${overdueInvoices.length > 0 ? ` (totaling ${formatINR(overdueTotal)})` : ""}`,
      ].join("\n");

      return {
        success: true,
        message,
        data: {
          activeTrips,
          pendingInvoices: pendingInvoices.length,
          pendingTotal,
          openProposals,
          overdueInvoices: overdueInvoices.length,
          overdueTotal,
        },
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch today's summary: ${detail}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. get_pending_items
// ---------------------------------------------------------------------------

const getPendingItems: ActionDefinition = {
  name: "get_pending_items",
  description:
    "Get a list of items that need attention - overdue invoices, expiring proposals, trips without drivers",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (ctx: ActionContext): Promise<ActionResult> => {
    try {
      const today = todayISO();
      const threeDaysOut = nDaysFromNowISO(3);

      const [overdueResult, expiringResult, unassignedResult] =
        await Promise.all([
          // Overdue invoices with client name
          ctx.supabase
            .from("invoices")
            .select(
              "id, invoice_number, total_amount, balance_amount, currency, due_date, profiles!invoices_client_id_fkey(full_name)",
            )
            .eq("organization_id", ctx.organizationId)
            .eq("status", "overdue")
            .order("due_date", { ascending: true })
            .limit(5),

          // Proposals expiring within 3 days
          ctx.supabase
            .from("proposals")
            .select("id, title, expires_at, total_price, status")
            .eq("organization_id", ctx.organizationId)
            .in("status", ["draft", "sent"])
            .gte("expires_at", today)
            .lte("expires_at", threeDaysOut)
            .order("expires_at", { ascending: true })
            .limit(5),

          // Trips without a driver assigned
          ctx.supabase
            .from("trips")
            .select(
              "id, start_date, end_date, profiles!trips_client_id_fkey(full_name)",
            )
            .eq("organization_id", ctx.organizationId)
            .is("driver_id", null)
            .gte("end_date", today)
            .order("start_date", { ascending: true })
            .limit(5),
        ]);

      const sections: string[] = [];

      // -- Overdue invoices --
      const overdueRows = overdueResult.data ?? [];
      if (overdueRows.length > 0) {
        sections.push("**Overdue Invoices:**");
        for (const row of overdueRows) {
          const profiles = row.profiles as
            | { full_name: string | null }
            | null;
          const clientName = profiles?.full_name ?? "Unknown client";
          const balance = row.balance_amount ?? row.total_amount ?? 0;
          sections.push(
            `- #${row.invoice_number} -- ${clientName}: ${formatINR(balance)} (due ${row.due_date ?? "N/A"})`,
          );
        }
      } else {
        sections.push("**Overdue Invoices:** None");
      }

      // -- Expiring proposals --
      const expiringRows = expiringResult.data ?? [];
      if (expiringRows.length > 0) {
        sections.push("\n**Expiring Proposals (next 3 days):**");
        for (const row of expiringRows) {
          const price =
            row.total_price != null ? ` -- ${formatINR(row.total_price)}` : "";
          sections.push(
            `- "${row.title ?? "Untitled"}"${price} (expires ${row.expires_at ?? "N/A"})`,
          );
        }
      } else {
        sections.push("\n**Expiring Proposals (next 3 days):** None");
      }

      // -- Trips without drivers --
      const unassignedRows = unassignedResult.data ?? [];
      if (unassignedRows.length > 0) {
        sections.push("\n**Trips Without Drivers:**");
        for (const row of unassignedRows) {
          const profiles = row.profiles as
            | { full_name: string | null }
            | null;
          const clientName = profiles?.full_name ?? "Unknown client";
          sections.push(
            `- ${clientName} (${row.start_date ?? "?"} to ${row.end_date ?? "?"})`,
          );
        }
      } else {
        sections.push("\n**Trips Without Drivers:** None");
      }

      const totalItems =
        overdueRows.length + expiringRows.length + unassignedRows.length;

      const header =
        totalItems > 0
          ? `Found ${totalItems} item(s) needing attention:\n`
          : "No items currently need attention.";

      return {
        success: true,
        message: `${header}\n${sections.join("\n")}`,
        data: {
          overdueInvoices: overdueRows.length,
          expiringProposals: expiringRows.length,
          unassignedTrips: unassignedRows.length,
        },
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch pending items: ${detail}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 3. get_kpi_snapshot
// ---------------------------------------------------------------------------

const getKpiSnapshot: ActionDefinition = {
  name: "get_kpi_snapshot",
  description:
    "Get key performance indicators - revenue this month, trip count, client count, conversion rate",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      period: {
        type: "string",
        description:
          'Time period: "this_month", "last_month", "this_year". Defaults to this_month.',
        enum: ["this_month", "last_month", "this_year"],
      },
    },
    required: [],
  },
  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const period =
        typeof params.period === "string" ? params.period : "this_month";
      const { start, end } = dateRangeForPeriod(period);

      const [tripsResult, revenueResult, clientsResult, proposalsResult] =
        await Promise.all([
          // Trips created in period
          ctx.supabase
            .from("trips")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", ctx.organizationId)
            .gte("created_at", start)
            .lte("created_at", end),

          // Paid invoice revenue in period
          ctx.supabase
            .from("invoices")
            .select("total_amount, currency")
            .eq("organization_id", ctx.organizationId)
            .eq("status", "paid")
            .gte("created_at", start)
            .lte("created_at", end),

          // New clients in period
          ctx.supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", ctx.organizationId)
            .gte("created_at", start)
            .lte("created_at", end),

          // Proposals for conversion rate
          ctx.supabase
            .from("proposals")
            .select("status")
            .eq("organization_id", ctx.organizationId)
            .gte("created_at", start)
            .lte("created_at", end),
        ]);

      const tripCount = tripsResult.count ?? 0;
      const newClients = clientsResult.count ?? 0;

      // Revenue
      const revenueRows = revenueResult.data ?? [];
      const totalRevenue = revenueRows.reduce(
        (sum, r) => sum + (r.total_amount ?? 0),
        0,
      );

      // Conversion rate
      const proposalRows = proposalsResult.data ?? [];
      const sentOrApproved = proposalRows.filter(
        (p): p is typeof p & { readonly status: string } =>
          p.status != null &&
          ["sent", "approved", "accepted", "draft"].includes(p.status),
      );
      const approved = proposalRows.filter(
        (p): p is typeof p & { readonly status: string } =>
          p.status != null &&
          ["approved", "accepted"].includes(p.status),
      );
      const conversionRate =
        sentOrApproved.length > 0
          ? Math.round((approved.length / sentOrApproved.length) * 100)
          : 0;

      const periodLabel = period.replace(/_/g, " ");

      const message = [
        `KPI Snapshot (${periodLabel}):`,
        `- Revenue: ${formatINR(totalRevenue)}`,
        `- Trips created: ${tripCount}`,
        `- New clients: ${newClients}`,
        `- Proposal conversion rate: ${conversionRate}% (${approved.length}/${sentOrApproved.length})`,
      ].join("\n");

      return {
        success: true,
        message,
        data: {
          period,
          totalRevenue,
          tripCount,
          newClients,
          conversionRate,
          proposalsSent: sentOrApproved.length,
          proposalsApproved: approved.length,
        },
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch KPI snapshot: ${detail}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const dashboardActions: readonly ActionDefinition[] = [
  getTodaySummary,
  getPendingItems,
  getKpiSnapshot,
];
