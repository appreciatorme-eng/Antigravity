/* ------------------------------------------------------------------
 * Write actions for invoice mutations.
 *
 * All actions require user confirmation before execution.
 * Every query is scoped to `organization_id` from the ActionContext.
 * All handlers are wrapped in try/catch and return ActionResult.
 * Immutable patterns used throughout -- no mutation of input data.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";
import type { Json } from "@/lib/database.types";
import {
  INVOICE_ORGANIZATION_SELECT,
  INVOICE_PROFILE_SELECT,
  buildClientSnapshot,
  buildOrganizationSnapshot,
  calculateInvoiceTotals,
  calculateTaxBreakdown,
  getNextInvoiceNumber,
  normalizeIsoDate,
} from "@/lib/invoices/module";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a currency amount with its currency code. */
const formatAmount = (amount: number, currency: string): string =>
  `${currency} ${amount.toLocaleString("en-IN")}`;

async function resolveClientByName(
  ctx: ActionContext,
  clientName: string,
): Promise<
  | { readonly clientId: string; readonly fullName: string }
  | { readonly error: string }
> {
  const { data, error } = await ctx.supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", ctx.organizationId)
    .eq("role", "client")
    .ilike("full_name", `%${clientName}%`)
    .limit(5);

  if (error) {
    return { error: `Failed to find client: ${error.message}` };
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return { error: `No client found matching "${clientName}".` };
  }

  if (rows.length > 1) {
    const names = rows.map((row) => row.full_name ?? row.id).join(", ");
    return { error: `Multiple clients matched "${clientName}": ${names}. Please be more specific.` };
  }

  return {
    clientId: rows[0].id,
    fullName: rows[0].full_name ?? clientName,
  };
}

// ---------------------------------------------------------------------------
// 1. create_invoice
// ---------------------------------------------------------------------------

const createInvoice: ActionDefinition = {
  name: "create_invoice",
  description: "Create a draft invoice for an existing client",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_name: {
        type: "string",
        description: "Client name for the invoice",
      },
      amount: {
        type: "number",
        description: "Total invoice amount before tax",
      },
      currency: {
        type: "string",
        description: "Invoice currency code",
      },
      due_date: {
        type: "string",
        description: "Invoice due date",
      },
      description: {
        type: "string",
        description: "Line item or invoice description",
      },
    },
    required: ["client_name", "amount", "currency", "description"],
  },

  execute: async (
    ctx: ActionContext,
    params: Record<string, unknown>,
  ): Promise<ActionResult> => {
    try {
      const clientName =
        typeof params.client_name === "string" ? params.client_name.trim() : "";
      const amount =
        typeof params.amount === "number" && Number.isFinite(params.amount)
          ? params.amount
          : Number(params.amount);
      const currency =
        typeof params.currency === "string" && params.currency.trim().length > 0
          ? params.currency.trim().toUpperCase()
          : "INR";
      const dueDate = normalizeIsoDate(params.due_date);
      const description =
        typeof params.description === "string" ? params.description.trim() : "";

      if (!clientName) {
        return { success: false, message: "client_name is required." };
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return { success: false, message: "amount must be a positive number." };
      }

      if (!description) {
        return { success: false, message: "description is required." };
      }

      if (dueDate === undefined) {
        return { success: false, message: "due_date must be a valid date when provided." };
      }

      const clientResolution = await resolveClientByName(ctx, clientName);
      if ("error" in clientResolution) {
        return { success: false, message: clientResolution.error };
      }

      const [{ data: organization, error: orgError }, { data: clientProfile, error: clientError }] =
        await Promise.all([
          ctx.supabase
            .from("organizations")
            .select(INVOICE_ORGANIZATION_SELECT)
            .eq("id", ctx.organizationId)
            .maybeSingle(),
          ctx.supabase
            .from("profiles")
            .select(INVOICE_PROFILE_SELECT)
            .eq("id", clientResolution.clientId)
            .maybeSingle(),
        ]);

      if (orgError || !organization) {
        return {
          success: false,
          message: `Failed to load organization data: ${orgError?.message ?? "not found"}`,
        };
      }

      if (clientError || !clientProfile) {
        return {
          success: false,
          message: `Failed to load client profile: ${clientError?.message ?? "not found"}`,
        };
      }

      const organizationRow =
        organization as unknown as Parameters<typeof buildOrganizationSnapshot>[0];
      const clientProfileRow =
        clientProfile as unknown as NonNullable<Parameters<typeof buildClientSnapshot>[0]>;

      const totals = calculateInvoiceTotals([
        {
          description,
          quantity: 1,
          unit_price: amount,
          tax_rate: 0,
        },
      ]);

      const placeOfSupply = organizationRow.billing_state ?? null;
      const taxBreakdown = calculateTaxBreakdown(
        totals.taxTotal,
        organizationRow.billing_state,
        placeOfSupply,
      );
      const invoiceNumber = await getNextInvoiceNumber(ctx.supabase as never, ctx.organizationId);
      const nowIso = new Date().toISOString();
      const metadata = {
        notes: null,
        line_items: totals.items as unknown as Json,
        organization_snapshot: buildOrganizationSnapshot(organizationRow) as unknown as Json,
        client_snapshot: buildClientSnapshot(clientProfileRow) as unknown as Json,
        created_via: "assistant",
      } as unknown as Json;

      const { data: invoiceRow, error: insertError } = await ctx.supabase
        .from("invoices")
        .insert({
          organization_id: ctx.organizationId,
          client_id: clientResolution.clientId,
          trip_id: null,
          invoice_number: invoiceNumber,
          currency,
          subtotal_amount: totals.subtotal,
          tax_amount: totals.taxTotal,
          total_amount: totals.grandTotal,
          paid_amount: 0,
          balance_amount: totals.grandTotal,
          status: "draft",
          due_date: dueDate ?? null,
          issued_at: null,
          gstin: organizationRow.gstin,
          place_of_supply: placeOfSupply,
          sac_code: "998314",
          subtotal: totals.subtotal,
          cgst: taxBreakdown.cgst,
          sgst: taxBreakdown.sgst,
          igst: taxBreakdown.igst,
          metadata,
          created_by: ctx.userId,
        })
        .select("id, invoice_number")
        .single();

      if (insertError || !invoiceRow?.id) {
        return {
          success: false,
          message: `Failed to create invoice: ${insertError?.message ?? "unknown error"}`,
        };
      }

      return {
        success: true,
        data: {
          invoiceId: invoiceRow.id,
          invoiceNumber: invoiceRow.invoice_number,
          clientId: clientResolution.clientId,
          clientName: clientResolution.fullName,
          amount: totals.grandTotal,
          currency,
          dueDate: dueDate ?? null,
          createdAt: nowIso,
        },
        message:
          `Draft invoice #${invoiceRow.invoice_number} created for ${clientResolution.fullName} (${formatAmount(totals.grandTotal, currency)}).`,
        affectedEntities: [
          { type: "invoice", id: invoiceRow.id },
          { type: "client", id: clientResolution.clientId },
        ],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error creating invoice: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 2. mark_invoice_paid
// ---------------------------------------------------------------------------

const markInvoicePaid: ActionDefinition = {
  name: "mark_invoice_paid",
  description: "Mark an invoice as fully paid",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      invoice_id: {
        type: "string",
        description: "The UUID of the invoice to mark as paid",
      },
      payment_method: {
        type: "string",
        description: "Payment method used (e.g., bank_transfer, cash, card)",
      },
      payment_reference: {
        type: "string",
        description: "Payment reference or transaction ID",
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
      const paymentMethod =
        typeof params.payment_method === "string"
          ? params.payment_method.trim()
          : null;
      const paymentReference =
        typeof params.payment_reference === "string"
          ? params.payment_reference.trim()
          : null;

      if (!invoiceId) {
        return { success: false, message: "invoice_id is required." };
      }

      // Verify the invoice belongs to this organisation
      const { data: invoice, error: fetchError } = await ctx.supabase
        .from("invoices")
        .select(
          "id, invoice_number, status, total_amount, paid_amount, balance_amount, currency, metadata",
        )
        .eq("id", invoiceId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (fetchError) {
        return {
          success: false,
          message: `Failed to verify invoice: ${fetchError.message}`,
        };
      }

      if (!invoice) {
        return {
          success: false,
          message: "Invoice not found or access denied.",
        };
      }

      // Check that the invoice is not already paid or cancelled
      if (invoice.status === "paid") {
        return {
          success: false,
          message: `Invoice #${invoice.invoice_number} is already marked as paid.`,
        };
      }

      if (invoice.status === "cancelled") {
        return {
          success: false,
          message: `Invoice #${invoice.invoice_number} is cancelled and cannot be marked as paid.`,
        };
      }

      // Build updated metadata with payment info (immutable -- create new object)
      const existingMetadata =
        invoice.metadata !== null &&
        typeof invoice.metadata === "object" &&
        !Array.isArray(invoice.metadata)
          ? (invoice.metadata as Record<string, unknown>)
          : {};

      const updatedMetadata = {
        ...existingMetadata,
        ...(paymentMethod !== null ? { payment_method: paymentMethod } : {}),
        ...(paymentReference !== null
          ? { payment_reference: paymentReference }
          : {}),
      };

      // Update the invoice: mark as paid
      const { error: updateError } = await ctx.supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_amount: invoice.total_amount,
          balance_amount: 0,
          paid_at: new Date().toISOString(),
          metadata: updatedMetadata,
        })
        .eq("id", invoiceId)
        .eq("organization_id", ctx.organizationId);

      if (updateError) {
        return {
          success: false,
          message: `Failed to mark invoice as paid: ${updateError.message}`,
        };
      }

      const amount = formatAmount(invoice.total_amount, invoice.currency);

      return {
        success: true,
        data: {
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          totalAmount: invoice.total_amount,
          currency: invoice.currency,
          paymentMethod,
          paymentReference,
        },
        message: `Invoice #${invoice.invoice_number} marked as paid (${amount}).`,
        affectedEntities: [{ type: "invoice", id: invoiceId }],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error marking invoice as paid: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// 3. send_invoice_reminder
// ---------------------------------------------------------------------------

const sendInvoiceReminder: ActionDefinition = {
  name: "send_invoice_reminder",
  description:
    "Send a payment reminder for an outstanding invoice (queues a notification)",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      invoice_id: {
        type: "string",
        description: "The UUID of the invoice to send a reminder for",
      },
      message: {
        type: "string",
        description: "Custom reminder message",
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
      const customMessage =
        typeof params.message === "string" ? params.message.trim() : null;

      if (!invoiceId) {
        return { success: false, message: "invoice_id is required." };
      }

      // Verify the invoice belongs to this organisation and has an outstanding balance
      const { data: invoice, error: fetchError } = await ctx.supabase
        .from("invoices")
        .select(
          "id, invoice_number, status, total_amount, balance_amount, currency, due_date, client_id, trip_id",
        )
        .eq("id", invoiceId)
        .eq("organization_id", ctx.organizationId)
        .maybeSingle();

      if (fetchError) {
        return {
          success: false,
          message: `Failed to verify invoice: ${fetchError.message}`,
        };
      }

      if (!invoice) {
        return {
          success: false,
          message: "Invoice not found or access denied.",
        };
      }

      if (invoice.balance_amount <= 0) {
        return {
          success: false,
          message: `Invoice #${invoice.invoice_number} has no outstanding balance.`,
        };
      }

      // Get client info for the notification
      const clientId = invoice.client_id;

      if (!clientId) {
        return {
          success: false,
          message: `Invoice #${invoice.invoice_number} has no client assigned.`,
        };
      }

      const { data: client, error: clientError } = await ctx.supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", clientId)
        .maybeSingle();

      if (clientError) {
        return {
          success: false,
          message: `Failed to fetch client info: ${clientError.message}`,
        };
      }

      const clientName = client?.full_name ?? "Unknown client";
      const clientEmail = client?.email ?? null;
      const clientPhone = client?.phone ?? null;

      // Insert into notification_queue
      const payload = {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        balance_amount: invoice.balance_amount,
        currency: invoice.currency,
        due_date: invoice.due_date,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        ...(customMessage !== null ? { custom_message: customMessage } : {}),
      };

      const { error: queueError } = await ctx.supabase
        .from("notification_queue")
        .insert({
          notification_type: "invoice_reminder",
          trip_id: invoice.trip_id,
          user_id: clientId,
          recipient_email: clientEmail,
          recipient_phone: clientPhone,
          payload,
          scheduled_for: new Date().toISOString(),
        });

      if (queueError) {
        return {
          success: false,
          message: `Failed to queue reminder notification: ${queueError.message}`,
        };
      }

      const balance = formatAmount(invoice.balance_amount, invoice.currency);
      const contactParts: string[] = [];
      if (clientEmail) contactParts.push(clientEmail);
      if (clientPhone) contactParts.push(clientPhone);
      const contactInfo =
        contactParts.length > 0
          ? ` (${contactParts.join(", ")})`
          : "";

      return {
        success: true,
        data: {
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          clientName,
          clientEmail,
          clientPhone,
          balanceAmount: invoice.balance_amount,
          currency: invoice.currency,
        },
        message: `Payment reminder queued for ${clientName}${contactInfo} -- Invoice #${invoice.invoice_number}, outstanding balance: ${balance}.`,
        affectedEntities: [
          { type: "invoice", id: invoiceId },
          { type: "notification", id: invoiceId },
        ],
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        message: `Error sending invoice reminder: ${errorMessage}`,
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const invoiceWriteActions: readonly ActionDefinition[] = [
  createInvoice,
  markInvoicePaid,
  sendInvoiceReminder,
];
