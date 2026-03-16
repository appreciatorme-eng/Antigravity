import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  getMarketplaceListingPlan,
  type MarketplaceListingPlanId,
} from "@/lib/marketplace-listing-plans";
import { verifyRazorpayPaymentSignature } from "@/lib/payments/payment-links.server";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

const verifyListingSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

type MarketplaceListingSubscriptionRow =
  Database["public"]["Tables"]["marketplace_listing_subscriptions"]["Row"];

const MARKETPLACE_LISTING_SUBSCRIPTION_SELECT = [
  "amount_paise",
  "boost_score",
  "cancelled_at",
  "created_at",
  "created_by",
  "currency",
  "current_period_end",
  "id",
  "marketplace_profile_id",
  "organization_id",
  "plan_id",
  "razorpay_order_id",
  "razorpay_payment_id",
  "started_at",
  "status",
  "updated_at",
].join(", ");

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { user: null, profile: null };
  }

  return { user, profile };
}

function resolveCurrentPeriodEnd(
  planId: MarketplaceListingPlanId,
  current: MarketplaceListingSubscriptionRow | null,
) {
  const plan = getMarketplaceListingPlan(planId);
  const now = Date.now();
  const anchor =
    current?.status === "active" &&
    current.current_period_end &&
    new Date(current.current_period_end).getTime() > now
      ? new Date(current.current_period_end).getTime()
      : now;

  return new Date(anchor + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getAuthContext();
    if (!user || !profile) {
      return apiError("Unauthorized", 401);
    }

    if (profile.role !== "admin") {
      return apiError("Forbidden", 403);
    }
    const organizationId = profile.organization_id;
    if (!organizationId) {
      return apiError("Organization not found", 404);
    }

    const body = await request.json().catch(() => null);
    const parsed = verifyListingSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid listing verification payload", 400, {
        issues: parsed.error.flatten(),
      });
    }

    const admin = createAdminClient();
    const { data: subscriptionData, error: subscriptionError } = await admin
      .from("marketplace_listing_subscriptions")
      .select(MARKETPLACE_LISTING_SUBSCRIPTION_SELECT)
      .eq("id", parsed.data.subscriptionId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    const subscription = subscriptionData as unknown as MarketplaceListingSubscriptionRow | null;

    if (subscriptionError || !subscription) {
      return apiError("Listing upgrade not found", 404);
    }

    if (subscription.razorpay_order_id !== parsed.data.razorpay_order_id) {
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

    const { data: currentActiveData } = await admin
      .from("marketplace_listing_subscriptions")
      .select(MARKETPLACE_LISTING_SUBSCRIPTION_SELECT)
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    const currentActive = currentActiveData as unknown as MarketplaceListingSubscriptionRow | null;

    const currentPeriodEnd = resolveCurrentPeriodEnd(
      subscription.plan_id as MarketplaceListingPlanId,
      currentActive,
    );
    const plan = getMarketplaceListingPlan(
      subscription.plan_id as MarketplaceListingPlanId,
    );
    const startedAt = new Date().toISOString();

    const { data: marketplaceProfile, error: profileError } = await admin
      .from("marketplace_profiles")
      .upsert(
        {
          organization_id: organizationId,
          listing_tier: plan.id,
          is_featured: true,
          featured_until: currentPeriodEnd,
          boost_score: plan.boostScore,
          updated_at: startedAt,
        },
        { onConflict: "organization_id" },
      )
      .select("id, listing_tier, is_featured, featured_until, boost_score")
      .single();

    if (profileError || !marketplaceProfile) {
      return apiError("Failed to activate marketplace plan", 500);
    }

    await admin
      .from("marketplace_listing_subscriptions")
      .update({
        status: "expired",
        updated_at: startedAt,
      })
      .eq("organization_id", organizationId)
      .eq("status", "active");

    const { data: updatedSubscriptionData, error: updateError } = await admin
      .from("marketplace_listing_subscriptions")
      .update({
        marketplace_profile_id: marketplaceProfile.id,
        status: "active",
        razorpay_payment_id: parsed.data.razorpay_payment_id,
        started_at: startedAt,
        current_period_end: currentPeriodEnd,
        updated_at: startedAt,
      })
      .eq("id", subscription.id)
      .select(MARKETPLACE_LISTING_SUBSCRIPTION_SELECT)
      .single();
    const updatedSubscription = updatedSubscriptionData as unknown as MarketplaceListingSubscriptionRow | null;

    if (updateError || !updatedSubscription) {
      return apiError("Failed to finalize marketplace plan", 500);
    }

    return apiSuccess({
      subscription: updatedSubscription,
      marketplaceProfile,
      plan,
    });
  } catch (error) {
    logError("[marketplace/listing-subscription/verify] failed", error);
    return apiError("Failed to verify marketplace listing payment", 500);
  }
}
