import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPaymentLinkRecord } from "@/lib/payments/payment-links.server";
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from "@/lib/integrations";

const createPaymentLinkSchema = z.object({
  proposalId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().trim().min(1).max(120).optional(),
  clientPhone: z.string().trim().max(32).optional(),
  clientEmail: z.string().email().optional(),
  amount: z.number().int().positive(),
  currency: z.enum(["INR", "USD"]).default("INR"),
  description: z.string().trim().min(1).max(255),
  expiresInHours: z.number().int().positive().max(24 * 30).optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!isPaymentsIntegrationEnabled()) {
      return apiError(getIntegrationDisabledMessage("payments"), 503, { disabled: true });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json().catch(() => null);
    const parsed = createPaymentLinkSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid payment link payload", 400, {
        issues: parsed.error.flatten(),
      });
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return apiError("Organization not found", 404);
    }

    const payload = { ...parsed.data };

    if (payload.proposalId) {
      const { data: proposal } = await admin
        .from("proposals")
        .select("id, client_id, total_price, client_selected_price, title")
        .eq("id", payload.proposalId)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();

      if (!proposal) {
        return apiError("Proposal not found", 404);
      }

      payload.clientId = payload.clientId || proposal.client_id;
      if (!payload.description) {
        payload.description = proposal.title;
      }
      if (!payload.amount) {
        const resolvedAmount = proposal.client_selected_price ?? proposal.total_price ?? 0;
        payload.amount = Math.round(resolvedAmount * 100);
      }
    }

    if (payload.clientId) {
      const { data: clientProfile } = await admin
        .from("profiles")
        .select("full_name, email, phone, phone_whatsapp")
        .eq("id", payload.clientId)
        .maybeSingle();

      if (clientProfile) {
        payload.clientName = payload.clientName || clientProfile.full_name || undefined;
        payload.clientEmail = payload.clientEmail || clientProfile.email || undefined;
        payload.clientPhone =
          payload.clientPhone ||
          clientProfile.phone_whatsapp ||
          clientProfile.phone ||
          undefined;
      }
    }

    const { link, order } = await createPaymentLinkRecord(admin, {
      ...payload,
      organizationId: profile.organization_id,
      createdBy: user.id,
      baseUrl: new URL(request.url).origin,
    });

    return apiSuccess({
      link,
      token: link.token,
      paymentUrl: link.paymentUrl,
      razorpayOrderId: order.id,
      amount: link.amount,
      currency: link.currency,
    });
  } catch (error) {
    console.error("[payments/links] create failed:", error);
    return apiError("Failed to create payment link", 500);
  }
}
