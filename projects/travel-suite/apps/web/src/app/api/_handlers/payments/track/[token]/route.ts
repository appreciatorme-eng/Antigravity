import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPaymentLinkByToken,
  recordPaymentLinkEvent,
} from "@/lib/payments/payment-links.server";

const tokenSchema = z.string().min(8).max(200);
const eventSchema = z.object({
  event: z.enum(["created", "sent", "viewed", "reminder_sent", "paid", "expired", "cancelled"]),
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const parsedToken = tokenSchema.safeParse(token);
    if (!parsedToken.success) {
      return apiError("Invalid payment link token", 400);
    }

    const admin = createAdminClient();
    const link = await getPaymentLinkByToken(admin, parsedToken.data, new URL(request.url).origin);
    if (!link) {
      return apiError("Payment link not found", 404);
    }

    return apiSuccess(link);
  } catch (error) {
    console.error("[payments/track/:token] load failed:", error);
    return apiError("Failed to load payment status", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const parsedToken = tokenSchema.safeParse(token);
    if (!parsedToken.success) {
      return apiError("Invalid payment link token", 400);
    }

    const body = await request.json().catch(() => null);
    const parsedBody = eventSchema.safeParse(body);
    if (!parsedBody.success) {
      return apiError("Invalid payment tracking payload", 400);
    }

    const admin = createAdminClient();
    const link = await recordPaymentLinkEvent(admin, {
      token: parsedToken.data,
      event: parsedBody.data.event,
      metadata: parsedBody.data.metadata,
      razorpayPaymentId: parsedBody.data.metadata?.razorpay_payment_id || null,
      baseUrl: new URL(request.url).origin,
    });

    if (!link) {
      return apiError("Payment link not found", 404);
    }

    return apiSuccess(link);
  } catch (error) {
    console.error("[payments/track/:token] update failed:", error);
    return apiError("Failed to update payment status", 500);
  }
}
