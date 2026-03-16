import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { sendPaymentReceipt } from "@/lib/email/notifications";
import { DEFAULT_PAYMENT_RECEIPT_GST_LABEL } from "@/lib/payments/payment-receipt-config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPaymentLinkByToken,
  recordPaymentLinkEvent,
  verifyRazorpayPaymentSignature,
} from "@/lib/payments/payment-links.server";
import { logError } from "@/lib/observability/logger";

const verifySchema = z.object({
  token: z.string().min(8).max(200),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid payment verification payload", 400);
    }

    const admin = createAdminClient();

    // Idempotency guard: if this payment was already verified, return early
    const { data: existingCapture, error: captureCheckError } = await admin
      .from("payment_events")
      .select("id")
      .eq("external_id", parsed.data.razorpay_payment_id)
      .eq("status", "captured")
      .limit(1)
      .maybeSingle();

    if (captureCheckError) {
      logError("[payments/verify] Failed to check idempotency", captureCheckError);
    }

    if (existingCapture) {
      return apiSuccess({ alreadyVerified: true, verified: true });
    }

    const link = await getPaymentLinkByToken(admin, parsed.data.token, new URL(request.url).origin);
    if (!link) {
      return apiError("Payment link not found", 404);
    }

    if (link.razorpayOrderId !== parsed.data.razorpay_order_id) {
      return apiError("Order mismatch", 400);
    }

    const signatureValid = verifyRazorpayPaymentSignature(
      parsed.data.razorpay_order_id,
      parsed.data.razorpay_payment_id,
      parsed.data.razorpay_signature,
    );

    if (!signatureValid) {
      return apiError("Invalid payment signature", 401);
    }

    const updatedLink = await recordPaymentLinkEvent(admin, {
      token: parsed.data.token,
      event: "paid",
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      metadata: {
        razorpay_order_id: parsed.data.razorpay_order_id,
      },
      baseUrl: new URL(request.url).origin,
      _callerVerified: true,
    });

    if (!updatedLink) {
      return apiError("Payment link not found", 404);
    }

    if (updatedLink.proposalId) {
      const { error: proposalUpdateError } = await admin
        .from("proposals")
        .update({ status: "converted" })
        .eq("id", updatedLink.proposalId);

      if (proposalUpdateError) {
        logError("[payments/verify] Failed to update proposal status", {
          proposalId: updatedLink.proposalId,
          error: proposalUpdateError.message,
        });
      }
    }

    if (updatedLink.clientEmail) {
      const paidAt = updatedLink.paidAt || new Date().toISOString();
      const paidAtLabel = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(paidAt));

      void sendPaymentReceipt({
        to: updatedLink.clientEmail,
        recipientName: updatedLink.clientName || "Traveler",
        amountLabel: `₹${Math.round(updatedLink.amount / 100).toLocaleString("en-IN")}`,
        paymentId: parsed.data.razorpay_payment_id,
        bookingReference: updatedLink.proposalTitle || updatedLink.token,
        paidAt: paidAtLabel,
        operatorName: updatedLink.organizationName || "Antigravity Travel",
        gstLabel: DEFAULT_PAYMENT_RECEIPT_GST_LABEL,
        invoiceUrl: null,
      });
    }

    return apiSuccess({
      link: updatedLink,
      verified: true,
    });
  } catch (error) {
    logError("[payments/verify] verification failed", error);
    return apiError("Failed to verify payment", 500);
  }
}
