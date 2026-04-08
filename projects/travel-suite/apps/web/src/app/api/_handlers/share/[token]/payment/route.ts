import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentLinkRecord, getPaymentLinkByToken } from "@/lib/payments/payment-links.server";
import {
  getIntegrationDisabledMessage,
  isPaymentsIntegrationEnabled,
} from "@/lib/integrations";
import { enforcePublicRouteRateLimit } from "@/lib/security/public-rate-limit";
import { logError } from "@/lib/observability/logger";
import {
  getSharePaymentAmountForOption,
  normalizeSharePaymentConfig,
  type SharePaymentOption,
} from "@/lib/share/payment-config";

const tokenSchema = z.string().min(8).max(200);
const bodySchema = z.object({
  option: z.enum(["full", "deposit"]),
});

const PUBLIC_SHARE_PAYMENT_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_SHARE_PAYMENT_RATE_LIMIT_MAX || "10",
);
const PUBLIC_SHARE_PAYMENT_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_SHARE_PAYMENT_RATE_LIMIT_WINDOW_MS || 60_000,
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    if (!isPaymentsIntegrationEnabled()) {
      return apiError(getIntegrationDisabledMessage("payments"), 503, { disabled: true });
    }

    const { token } = await params;
    const parsedToken = tokenSchema.safeParse(token);
    if (!parsedToken.success) {
      return apiError("Invalid share token", 400);
    }

    const rateLimitResponse = await enforcePublicRouteRateLimit(request, {
      identifier: parsedToken.data,
      limit: PUBLIC_SHARE_PAYMENT_RATE_LIMIT_MAX,
      windowMs: PUBLIC_SHARE_PAYMENT_RATE_LIMIT_WINDOW_MS,
      prefix: "public:share-payment:create",
      message: "Too many payment attempts. Please try again later.",
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return apiError("Invalid share payment payload", 400);
    }

    const option: SharePaymentOption = parsedBody.data.option;
    const admin = createAdminClient();

    const { data: share } = await admin
      .from("shared_itineraries")
      .select(`
        id,
        expires_at,
        payment_config,
        itineraries (
          id,
          user_id,
          trip_title,
          destination
        )
      `)
      .eq("share_code", parsedToken.data)
      .maybeSingle();

    if (!share || !share.itineraries) {
      return apiError("Shared itinerary not found", 404);
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return apiError("This share link has expired", 410);
    }

    const paymentConfig = normalizeSharePaymentConfig(share.payment_config);
    if (!paymentConfig) {
      return apiError("Payment is not enabled for this share", 400);
    }

    if (option === "deposit" && paymentConfig.mode === "full_only") {
      return apiError("Deposit payment is not available for this share", 400);
    }

    if (option === "full" && paymentConfig.mode === "deposit_only") {
      return apiError("Full payment is not available for this share", 400);
    }

    const itinerary = Array.isArray(share.itineraries) ? share.itineraries[0] : share.itineraries;
    const { data: trip } = await admin
      .from("trips")
      .select("id, client_id, organization_id")
      .eq("itinerary_id", itinerary.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!trip?.id || !trip.client_id || !trip.organization_id) {
      return apiError("Payment is only available for linked trips with an assigned client", 400);
    }

    const { data: clientProfile } = await admin
      .from("profiles")
      .select("full_name, email, phone, phone_whatsapp")
      .eq("id", trip.client_id)
      .maybeSingle();

    const amount = getSharePaymentAmountForOption(paymentConfig, option);
    if (!amount || amount <= 0) {
      return apiError("This payment option is not configured correctly", 400);
    }

    const optionLabel =
      option === "deposit"
        ? `${paymentConfig.deposit_percent}% deposit`
        : "full payment";
    const description = paymentConfig.title?.trim()
      ? `${paymentConfig.title.trim()} · ${optionLabel}`
      : `${itinerary.trip_title || itinerary.destination || "Trip"} · ${optionLabel}`;

    const { data: existingLinkRow } = await admin
      .from("payment_links")
      .select("token, status, expires_at, created_at")
      .eq("booking_id", trip.id)
      .eq("amount_paise", amount)
      .eq("currency", "INR")
      .in("status", ["pending", "viewed", "paid"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingLinkRow?.token) {
      const existingLink = await getPaymentLinkByToken(admin, existingLinkRow.token, new URL(request.url).origin);
      if (existingLink) {
        if (existingLink.status === "paid") {
          return apiSuccess({
            link: existingLink,
            token: existingLink.token,
            paymentUrl: existingLink.paymentUrl,
            razorpayOrderId: existingLink.razorpayOrderId,
            amount: existingLink.amount,
            currency: existingLink.currency,
          });
        }

        if (existingLink.status === "pending" || existingLink.status === "viewed") {
          return apiSuccess({
            link: existingLink,
            token: existingLink.token,
            paymentUrl: existingLink.paymentUrl,
            razorpayOrderId: existingLink.razorpayOrderId,
            amount: existingLink.amount,
            currency: existingLink.currency,
          });
        }
      }
    }

    const { link, order } = await createPaymentLinkRecord(admin, {
      bookingId: trip.id,
      clientId: trip.client_id,
      clientName: clientProfile?.full_name || undefined,
      clientEmail: clientProfile?.email || undefined,
      clientPhone: clientProfile?.phone_whatsapp || clientProfile?.phone || undefined,
      amount,
      currency: "INR",
      description,
      expiresInHours: 24 * 7,
      organizationId: trip.organization_id,
      createdBy: itinerary.user_id || trip.client_id,
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
    logError("[share/:token/payment] create failed", error);
    return apiError("Failed to create payment link", 500);
  }
}
