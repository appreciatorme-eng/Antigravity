/* ------------------------------------------------------------------
 * Invoice read actions -- search, detail view, and overdue tracking
 * for invoices.
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

/** Format a currency amount with its currency code. */
const formatAmount = (amount: number, currency: string): string =>
  `${currency} ${amount.toLocaleString("en-IN")}`;

/** Clamp a numeric value between min and max (inclusive). */
const clampLimit = (raw: unknown, defaultVal: number, max: number): number => {
  const parsed = typeof raw === "number" ? raw : defaultVal;
  return Math.min(Math.max(1, Math.round(parsed)), max);
};

/** Compute the number of days between two YYYY-MM-DD dates. */
const daysBetween = (from: string, to: string): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return Math.round((toDate.getTime() - fromDate.getTime()) / msPerDay);
};

/** Check whether a string looks like an invoice number (starts with INV). */
const looksLikeInvoiceNumber = (text: string): boolean =>
  text.toUpperCase().startsWith("INV");

// ---------------------------------------------------------------------------
// Line-item type guard
// ---------------------------------------------------------------------------

interface LineItem {
  readonly description?: string;
  readonly quantity?: number;
  readonly rate?: number;
  readonly amount?: number;
}

/** Safely extract line items from invoice metadata. */
const parseLineItems = (metadata: unknown): readonly LineItem[] => {
  if (metadata === null || metadata === undefined) {
    return [];
  }

  const obj = metadata as Record<string, unknown>;
  const items = obj.line_items;

  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item: unknown) => {
    const entry = (item ?? {}) as Record<string, unknown>;
    return {
      description: typeof entry.description === "string" ? entry.description : undefined,
      quantity: typeof entry.quantity === "number" ? entry.quantity : undefined,
      rate: typeof entry.rate === "number" ? entry.rate : undefined,
      amount: typeof entry.amount === "number" ? entry.amount : undefined,
    };
  });
};

// ---------------------------------------------------------------------------
// 1. search_invoices
// ---------------------------------------------------------------------------

const searchInvoices: ActionDefinition = {
  name: "search_invoices",
  description:
    "Search invoices by client name, invoice number, status, or date range",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Search text -- matches invoice number (if starts with INV) or client name",
      },
      status: {
        type: "string",
        description: "Filter by invoice status",
        enum: [
          "draft",
          "issued",
          "partially_paid",
          "paid",
          "overdue",
          "cancelled",
        ],
      },
      date_from: {
        type: "string",
        description: "Invoices created from this date (YYYY-MM-DD)",
      },
      date_to: {
        type: "string",
        description: "Invoices created before this date (YYYY-MM-DD)",
      },
      limit: {
        type: "number",
        description: "Max results to return (default 10, max 20)",
      },
    },
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const query = typeof params.query === "string" ? params.query.trim() : "";
      const status = typeof params.status === "string" ? params.status : "";
      const dateFrom = typeof params.date_from === "string" ? params.date_from : "";
      const dateTo = typeof params.date_to === "string" ? params.date_to : "";
      const limit = clampLimit(params.limit, 10, 20);

      // Build the base query with client profile join
      let dbQuery = ctx.supabase
        .from("invoices")
        .select(
          "id, invoice_number, status, total_amount, balance_amount, currency, due_date, created_at, profiles!invoices_client_id_fkey(full_name)",
        )
        .eq("organization_id", ctx.organizationId);

      // Apply status filter
      if (status !== "") {
        dbQuery = dbQuery.eq("status", status);
      }

      // Apply date range filters
      if (dateFrom !== "") {
        dbQuery = dbQuery.gte("created_at", dateFrom);
      }
      if (dateTo !== "") {
        dbQuery = dbQuery.lte("created_at", dateTo);
      }

      // Apply text search filter
      if (query !== "") {
        if (looksLikeInvoiceNumber(query)) {
          dbQuery = dbQuery.ilike("invoice_number", `%${query}%`);
        } else {
          // Search by client name via the joined profiles table
          dbQuery = dbQuery.ilike(
            "profiles.full_name",
            `%${query}%`,
          );
        }
      }

      const { data, error } = await dbQuery
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          message: `Failed to search invoices: ${error.message}`,
        };
      }

      const rows = data ?? [];

      // Filter out rows where the profile join returned null when searching by name
      // (Supabase ilike on a joined column still returns rows with null profiles)
      const filtered =
        query !== "" && !looksLikeInvoiceNumber(query)
          ? rows.filter((row) => {
              const profiles = row.profiles as
                | { full_name: string | null }
                | null;
              return profiles?.full_name !== null && profiles?.full_name !== undefined;
            })
          : rows;

      if (filtered.length === 0) {
        return {
          success: true,
          message: "No invoices found matching your search criteria.",
          data: [],
        };
      }

      const lines = filtered.map((row) => {
        const profiles = row.profiles as
          | { full_name: string | null }
          | null;
        const clientName = profiles?.full_name ?? "Unknown client";
        const amount = formatAmount(row.total_amount, row.currency);
        const due = row.due_date !== null ? ` | Due: ${row.due_date}` : "";
        return `- #${row.invoice_number} -- ${clientName}: ${amount} (${row.status})${due}`;
      });

      const message = [
        `Found ${filtered.length} invoice(s):`,
        ...lines,
      ].join("\n");

      return {
        success: true,
        message,
        data: filtered.map((row) => {
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
            status: row.status,
            dueDate: row.due_date,
          };
        }),
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to search invoices: ${detail}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. get_invoice_details
// ---------------------------------------------------------------------------

const getInvoiceDetails: ActionDefinition = {
  name: "get_invoice_details",
  description:
    "Get full details of a specific invoice including line items, payment info, and tax breakdown",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      invoice_id: {
        type: "string",
        description: "The UUID of the invoice to retrieve",
      },
    },
    required: ["invoice_id"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const invoiceId =
        typeof params.invoice_id === "string" ? params.invoice_id.trim() : "";

      if (invoiceId === "") {
        return {
          success: false,
          message: "Invoice ID is required.",
        };
      }

      const { data, error } = await ctx.supabase
        .from("invoices")
        .select(
          "*, profiles!invoices_client_id_fkey(full_name, email, phone)",
        )
        .eq("id", invoiceId)
        .eq("organization_id", ctx.organizationId)
        .single();

      if (error || !data) {
        return {
          success: false,
          message:
            error?.code === "PGRST116"
              ? "Invoice not found or you do not have access to it."
              : `Failed to fetch invoice: ${error?.message ?? "Not found"}`,
        };
      }

      const profiles = data.profiles as
        | { full_name: string | null; email: string | null; phone: string | null }
        | null;

      const clientName = profiles?.full_name ?? "Unknown client";
      const clientEmail = profiles?.email ?? null;
      const clientPhone = profiles?.phone ?? null;
      const currency = data.currency;

      // Build message sections
      const sections: string[] = [];

      // Header
      sections.push(`**Invoice #${data.invoice_number}**`);
      sections.push(`Status: ${data.status}`);
      sections.push(`Client: ${clientName}`);

      if (clientEmail !== null) {
        sections.push(`Email: ${clientEmail}`);
      }
      if (clientPhone !== null) {
        sections.push(`Phone: ${clientPhone}`);
      }

      // Dates
      const dates: string[] = [];
      if (data.issued_at !== null) {
        dates.push(`Issued: ${data.issued_at}`);
      }
      if (data.due_date !== null) {
        dates.push(`Due: ${data.due_date}`);
      }
      if (data.paid_at !== null) {
        dates.push(`Paid: ${data.paid_at}`);
      }
      if (dates.length > 0) {
        sections.push(dates.join(" | "));
      }

      // Line items
      const lineItems = parseLineItems(data.metadata);
      if (lineItems.length > 0) {
        sections.push("\n**Line Items:**");
        for (const item of lineItems) {
          const desc = item.description ?? "Unnamed item";
          const qty = item.quantity !== undefined ? `x${item.quantity}` : "";
          const rate =
            item.rate !== undefined ? `@ ${formatAmount(item.rate, currency)}` : "";
          const amt =
            item.amount !== undefined ? `= ${formatAmount(item.amount, currency)}` : "";
          sections.push(`- ${desc} ${qty} ${rate} ${amt}`.trim());
        }
      }

      // Financial summary
      sections.push("\n**Financial Summary:**");
      sections.push(`Subtotal: ${formatAmount(data.subtotal_amount, currency)}`);

      // Tax breakdown
      const taxParts: string[] = [];
      if (data.cgst !== null && data.cgst > 0) {
        taxParts.push(`CGST: ${formatAmount(data.cgst, currency)}`);
      }
      if (data.sgst !== null && data.sgst > 0) {
        taxParts.push(`SGST: ${formatAmount(data.sgst, currency)}`);
      }
      if (data.igst !== null && data.igst > 0) {
        taxParts.push(`IGST: ${formatAmount(data.igst, currency)}`);
      }
      if (taxParts.length > 0) {
        sections.push(taxParts.join(" | "));
      }
      sections.push(`Tax: ${formatAmount(data.tax_amount, currency)}`);

      if (data.tds_amount !== null && data.tds_amount > 0) {
        sections.push(`TDS: ${formatAmount(data.tds_amount, currency)}`);
      }

      sections.push(`**Total: ${formatAmount(data.total_amount, currency)}**`);
      sections.push(`Paid: ${formatAmount(data.paid_amount, currency)}`);
      sections.push(`Balance: ${formatAmount(data.balance_amount, currency)}`);

      // GST details
      const gstParts: string[] = [];
      if (data.gstin !== null) {
        gstParts.push(`GSTIN: ${data.gstin}`);
      }
      if (data.place_of_supply !== null) {
        gstParts.push(`Place of Supply: ${data.place_of_supply}`);
      }
      if (data.sac_code !== null) {
        gstParts.push(`SAC: ${data.sac_code}`);
      }
      if (gstParts.length > 0) {
        sections.push(`\n**GST Details:** ${gstParts.join(" | ")}`);
      }

      // Payment info
      if (data.razorpay_invoice_id !== null || data.razorpay_payment_id !== null) {
        sections.push("\n**Payment Info:**");
        if (data.razorpay_invoice_id !== null) {
          sections.push(`Razorpay Invoice: ${data.razorpay_invoice_id}`);
        }
        if (data.razorpay_payment_id !== null) {
          sections.push(`Razorpay Payment: ${data.razorpay_payment_id}`);
        }
      }

      return {
        success: true,
        message: sections.join("\n"),
        data: {
          id: data.id,
          invoiceNumber: data.invoice_number,
          status: data.status,
          clientName,
          clientEmail,
          clientPhone,
          issuedAt: data.issued_at,
          dueDate: data.due_date,
          paidAt: data.paid_at,
          subtotalAmount: data.subtotal_amount,
          taxAmount: data.tax_amount,
          cgst: data.cgst,
          sgst: data.sgst,
          igst: data.igst,
          tdsAmount: data.tds_amount,
          totalAmount: data.total_amount,
          paidAmount: data.paid_amount,
          balanceAmount: data.balance_amount,
          currency,
          lineItems,
          gstin: data.gstin,
          placeOfSupply: data.place_of_supply,
          sacCode: data.sac_code,
          razorpayInvoiceId: data.razorpay_invoice_id,
          razorpayPaymentId: data.razorpay_payment_id,
        },
        affectedEntities: [{ type: "invoice", id: data.id }],
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch invoice details: ${detail}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 3. get_overdue_invoices
// ---------------------------------------------------------------------------

const getOverdueInvoices: ActionDefinition = {
  name: "get_overdue_invoices",
  description:
    "Get all overdue invoices that need follow-up, sorted by most overdue first",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Max results to return (default 10, max 20)",
      },
    },
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const limit = clampLimit(params.limit, 10, 20);
      const today = todayISO();

      // Fetch invoices that are explicitly overdue OR past due date while
      // still in an unpaid status (issued / partially_paid)
      const { data, error } = await ctx.supabase
        .from("invoices")
        .select(
          "id, invoice_number, status, total_amount, balance_amount, currency, due_date, client_id, profiles!invoices_client_id_fkey(full_name, email, phone)",
        )
        .eq("organization_id", ctx.organizationId)
        .or(
          `status.eq.overdue,and(status.in.("issued","partially_paid"),due_date.lt.${today})`,
        )
        .order("due_date", { ascending: true })
        .limit(limit);

      if (error) {
        return {
          success: false,
          message: `Failed to fetch overdue invoices: ${error.message}`,
        };
      }

      const rows = data ?? [];

      if (rows.length === 0) {
        return {
          success: true,
          message: "No overdue invoices found. All payments are on track.",
          data: [],
        };
      }

      const lines = rows.map((row) => {
        const profiles = row.profiles as
          | { full_name: string | null; email: string | null; phone: string | null }
          | null;

        const clientName = profiles?.full_name ?? "Unknown client";
        const balance = formatAmount(row.balance_amount, row.currency);
        const daysOverdue =
          row.due_date !== null ? daysBetween(row.due_date, today) : 0;

        const urgency =
          daysOverdue > 30
            ? "[CRITICAL]"
            : daysOverdue > 14
              ? "[HIGH]"
              : daysOverdue > 7
                ? "[MEDIUM]"
                : "[LOW]";

        const contactParts: string[] = [];
        if (profiles?.email !== null && profiles?.email !== undefined) {
          contactParts.push(profiles.email);
        }
        if (profiles?.phone !== null && profiles?.phone !== undefined) {
          contactParts.push(profiles.phone);
        }
        const contact =
          contactParts.length > 0 ? ` | Contact: ${contactParts.join(", ")}` : "";

        return `- ${urgency} #${row.invoice_number} -- ${clientName}: ${balance} outstanding, ${daysOverdue} day(s) overdue${contact}`;
      });

      const totalOutstanding = rows.reduce(
        (sum, row) => sum + row.balance_amount,
        0,
      );
      const primaryCurrency = rows[0]?.currency ?? "INR";

      const message = [
        `Found ${rows.length} overdue invoice(s) totaling ${formatAmount(totalOutstanding, primaryCurrency)} outstanding:`,
        ...lines,
      ].join("\n");

      return {
        success: true,
        message,
        data: rows.map((row) => {
          const profiles = row.profiles as
            | { full_name: string | null; email: string | null; phone: string | null }
            | null;
          const daysOverdue =
            row.due_date !== null ? daysBetween(row.due_date, today) : 0;

          return {
            id: row.id,
            invoiceNumber: row.invoice_number,
            clientName: profiles?.full_name ?? null,
            clientEmail: profiles?.email ?? null,
            clientPhone: profiles?.phone ?? null,
            totalAmount: row.total_amount,
            balanceAmount: row.balance_amount,
            currency: row.currency,
            dueDate: row.due_date,
            daysOverdue,
            status: row.status,
          };
        }),
      };
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Failed to fetch overdue invoices: ${detail}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const invoiceActions: readonly ActionDefinition[] = [
  searchInvoices,
  getInvoiceDetails,
  getOverdueInvoices,
];
