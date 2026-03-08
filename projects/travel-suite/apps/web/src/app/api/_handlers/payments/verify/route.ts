import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPaymentLinkByToken,
  recordPaymentLinkEvent,
  verifyRazorpayPaymentSignature,
} from "@/lib/payments/payment-links.server";

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
    });

    if (!updatedLink) {
      return apiError("Payment link not found", 404);
    }

    if (updatedLink.proposalId) {
      await admin
        .from("proposals")
        .update({ status: "converted" })
        .eq("id", updatedLink.proposalId);
    }

    return apiSuccess({
      link: updatedLink,
      verified: true,
    });
  } catch (error) {
    console.error("[payments/verify] verification failed:", error);
    return apiError("Failed to verify payment", 500);
  }
}
