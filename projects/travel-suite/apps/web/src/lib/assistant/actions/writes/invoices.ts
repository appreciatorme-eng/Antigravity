/* ------------------------------------------------------------------
 * Write actions for invoice mutations.
 *
 * All actions require user confirmation before execution.
 * Every query is scoped to `organization_id` from the ActionContext.
 * All handlers are wrapped in try/catch and return ActionResult.
 * Immutable patterns used throughout -- no mutation of input data.
 * ------------------------------------------------------------------ */

import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a currency amount with its currency code. */
const formatAmount = (amount: number, currency: string): string =>
  `${currency} ${amount.toLocaleString("en-IN")}`;

// ---------------------------------------------------------------------------
// 1. mark_invoice_paid
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
// 2. send_invoice_reminder
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
  markInvoicePaid,
  sendInvoiceReminder,
];
