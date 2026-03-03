/* ------------------------------------------------------------------
 * Report generation action -- aggregates revenue, trips, clients,
 * and proposal data across a configurable time period.
 *
 * Every query is scoped to `organization_id` from the ActionContext.
 * All execute handlers are wrapped in try/catch and return a
 * failure ActionResult on any error.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** First day of a month as YYYY-MM-DD. */
const firstOfMonth = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

/** Last day of a month as YYYY-MM-DD. */
const lastOfMonth = (date: Date): string => {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
};

/** Monday of the current week as YYYY-MM-DD. */
const mondayOfWeek = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  // Shift Sunday (0) to 7 so Monday is always index 1
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
};

/** Sunday of the current week as YYYY-MM-DD. */
const sundayOfWeek = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
};

/**
 * Derive a [start, end] date range from a period label.
 * For "custom", callers must supply explicit date_from / date_to.
 */
const dateRangeForPeriod = (
  period: string,
  dateFrom?: string,
  dateTo?: string,
): { readonly start: string; readonly end: string } | null => {
  const now = new Date();

  switch (period) {
    case "this_week":
      return { start: mondayOfWeek(now), end: sundayOfWeek(now) };

    case "this_month":
      return { start: firstOfMonth(now), end: lastOfMonth(now) };

    case "last_month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start: firstOfMonth(prev), end: lastOfMonth(prev) };
    }

    case "custom": {
      if (dateFrom === undefined || dateTo === undefined) {
        return null;
      }
      return { start: dateFrom, end: dateTo };
    }

    default:
      return { start: firstOfMonth(now), end: lastOfMonth(now) };
  }
};

/** Format a number as INR with commas. */
const formatINR = (amount: number): string =>
  `INR ${amount.toLocaleString("en-IN")}`;

/** Safely compute a percentage, returning 0 when denominator is 0. */
const safePercent = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

/** Friendly period label. */
const periodLabel = (period: string, start: string, end: string): string => {
  if (period === "custom") {
    return `${start} to ${end}`;
  }
  return period.replace(/_/g, " ");
};

// ---------------------------------------------------------------------------
// generate_report
// ---------------------------------------------------------------------------

const generateReport: ActionDefinition = {
  name: "generate_report",
  description:
    "Generate a business report for a time period covering revenue, trips, clients, and proposals",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      period: {
        type: "string",
        description: "Time period for the report",
        enum: ["this_week", "this_month", "last_month", "custom"],
      },
      type: {
        type: "string",
        description: "Type of report to generate (default: summary)",
        enum: ["summary", "revenue", "trips", "clients"],
      },
      date_from: {
        type: "string",
        description: "Start date for custom period (YYYY-MM-DD)",
      },
      date_to: {
        type: "string",
        description: "End date for custom period (YYYY-MM-DD)",
      },
    },
    required: ["period"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const period =
        typeof params.period === "string" ? params.period : "this_month";
      const reportType =
        typeof params.type === "string" ? params.type : "summary";
      const dateFrom =
        typeof params.date_from === "string" ? params.date_from : undefined;
      const dateTo =
        typeof params.date_to === "string" ? params.date_to : undefined;

      // Resolve the date range
      const range = dateRangeForPeriod(period, dateFrom, dateTo);

      if (range === null) {
        return {
          success: false,
          message:
            "Custom period requires both date_from and date_to in YYYY-MM-DD format.",
        };
      }

      const { start, end } = range;

      // Run all queries in parallel
      const [tripsResult, invoicesResult, clientsResult, proposalsResult] =
        await Promise.all([
          // Trip count + completed count
          ctx.supabase
            .from("trips")
            .select("id, status")
            .eq("organization_id", ctx.organizationId)
            .gte("created_at", start)
            .lte("created_at", end),

          // Invoice stats
          ctx.supabase
            .from("invoices")
            .select("status, total_amount, balance_amount, currency")
            .eq("organization_id", ctx.organizationId)
            .gte("created_at", start)
            .lte("created_at", end),

          // New clients count
          ctx.supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", ctx.organizationId)
            .gte("created_at", start)
            .lte("created_at", end),

          // Proposal stats
          ctx.supabase
            .from("proposals")
            .select("status")
            .eq("organization_id", ctx.organizationId)
            .gte("created_at", start)
            .lte("created_at", end),
        ]);

      // -- Trip metrics --
      const tripRows = tripsResult.data ?? [];
      const totalTrips = tripRows.length;
      const completedTrips = tripRows.filter(
        (t) => t.status === "completed",
      ).length;

      // -- Invoice metrics --
      const invoiceRows = invoicesResult.data ?? [];
      const totalIssued = invoiceRows.length;
      const paidRows = invoiceRows.filter((r) => r.status === "paid");
      const overdueRows = invoiceRows.filter((r) => r.status === "overdue");

      const totalPaidAmount = paidRows.reduce(
        (sum, r) => sum + (r.total_amount ?? 0),
        0,
      );
      const totalOverdueAmount = overdueRows.reduce(
        (sum, r) => sum + (r.balance_amount ?? r.total_amount ?? 0),
        0,
      );
      const totalIssuedAmount = invoiceRows.reduce(
        (sum, r) => sum + (r.total_amount ?? 0),
        0,
      );

      // Collection rate
      const collectionRate = safePercent(totalPaidAmount, totalIssuedAmount);

      // -- Client metrics --
      const newClients = clientsResult.count ?? 0;

      // -- Proposal metrics --
      const proposalRows = proposalsResult.data ?? [];
      const totalProposalsSent = proposalRows.filter(
        (p) =>
          p.status !== null &&
          ["sent", "viewed", "approved", "accepted", "rejected"].includes(
            p.status,
          ),
      ).length;
      const totalProposalsConverted = proposalRows.filter(
        (p) =>
          p.status !== null &&
          ["approved", "accepted"].includes(p.status),
      ).length;
      const proposalConversion = safePercent(
        totalProposalsConverted,
        totalProposalsSent,
      );

      // -- Build message based on report type --
      const label = periodLabel(period, start, end);
      const sections: string[] = [];

      sections.push(`**Business Report (${label})**\n`);

      if (reportType === "summary" || reportType === "revenue") {
        sections.push("**Revenue:**");
        sections.push(`- Total invoiced: ${formatINR(totalIssuedAmount)}`);
        sections.push(`- Total collected: ${formatINR(totalPaidAmount)}`);
        sections.push(`- Outstanding overdue: ${formatINR(totalOverdueAmount)}`);
        sections.push(`- Collection rate: ${collectionRate}%`);
      }

      if (reportType === "summary" || reportType === "trips") {
        sections.push("\n**Trips:**");
        sections.push(`- Total trips: ${totalTrips}`);
        sections.push(`- Completed: ${completedTrips}`);
        sections.push(
          `- In progress: ${totalTrips - completedTrips}`,
        );
      }

      if (reportType === "summary" || reportType === "clients") {
        sections.push("\n**Clients:**");
        sections.push(`- New clients: ${newClients}`);
      }

      if (reportType === "summary" || reportType === "revenue") {
        sections.push("\n**Proposals:**");
        sections.push(`- Sent: ${totalProposalsSent}`);
        sections.push(`- Converted: ${totalProposalsConverted}`);
        sections.push(`- Conversion rate: ${proposalConversion}%`);
      }

      return {
        success: true,
        message: sections.join("\n"),
        data: {
          period,
          reportType,
          dateRange: { start, end },
          revenue: {
            totalIssuedAmount,
            totalPaidAmount,
            totalOverdueAmount,
            collectionRate,
            invoiceCount: totalIssued,
            paidCount: paidRows.length,
            overdueCount: overdueRows.length,
          },
          trips: {
            total: totalTrips,
            completed: completedTrips,
            inProgress: totalTrips - completedTrips,
          },
          clients: {
            newClients,
          },
          proposals: {
            sent: totalProposalsSent,
            converted: totalProposalsConverted,
            conversionRate: proposalConversion,
          },
        },
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to generate report: ${detail}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const reportActions: readonly ActionDefinition[] = [generateReport];
