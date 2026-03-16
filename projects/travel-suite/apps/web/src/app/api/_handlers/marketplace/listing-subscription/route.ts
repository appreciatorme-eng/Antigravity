import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  getMarketplaceListingPlan,
  listMarketplaceListingPlans,
  type MarketplaceListingPlanId,
} from "@/lib/marketplace-listing-plans";
import { paymentService } from "@/lib/payments/payment-service";
import type { Database } from "@/lib/database.types";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";

const createListingSubscriptionSchema = z.object({
  planId: z.enum(["featured_lite", "featured_pro", "top_placement"]),
});

const cancelListingSubscriptionSchema = z.object({
  action: z.literal("downgrade_to_free"),
});

type MarketplaceListingSubscriptionRow =
  Database["public"]["Tables"]["marketplace_listing_subscriptions"]["Row"];
type MarketplaceListingSubscriptionSummary = Omit<
  MarketplaceListingSubscriptionRow,
  "created_by" | "razorpay_order_id" | "razorpay_payment_id"
>;
type AdminClient = Extract<
  Awaited<ReturnType<typeof requireAdmin>>,
  { ok: true }
>["adminClient"];

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

async function normalizeCurrentSubscription(
  admin: AdminClient,
  organizationId: string,
): Promise<MarketplaceListingSubscriptionRow | null> {
  const { data, error } = await admin
    .from("marketplace_listing_subscriptions")
    .select(MARKETPLACE_LISTING_SUBSCRIPTION_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const subscription = data as unknown as MarketplaceListingSubscriptionRow | null;

  if (error) {
    throw error;
  }

  if (!subscription) {
    return null;
  }

  if (
    subscription.status === "active" &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end).getTime() < Date.now()
  ) {
    const { data: expiredData, error: updateError } = await admin
      .from("marketplace_listing_subscriptions")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .select(MARKETPLACE_LISTING_SUBSCRIPTION_SELECT)
      .single();
    const expired = expiredData as unknown as MarketplaceListingSubscriptionRow | null;

    if (updateError) {
      throw updateError;
    }

    const { error: profileUpdateError } = await admin
      .from("marketplace_profiles")
      .update({
        listing_tier: "free",
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
    if (profileUpdateError) {
      throw profileUpdateError;
    }

    return expired;
  }

  return subscription;
}

function sanitizeSubscription(
  subscription: MarketplaceListingSubscriptionRow | null,
): MarketplaceListingSubscriptionSummary | null {
  if (!subscription) {
    return null;
  }

  return {
    amount_paise: subscription.amount_paise,
    boost_score: subscription.boost_score,
    cancelled_at: subscription.cancelled_at,
    created_at: subscription.created_at,
    currency: subscription.currency,
    current_period_end: subscription.current_period_end,
    id: subscription.id,
    marketplace_profile_id: subscription.marketplace_profile_id,
    organization_id: subscription.organization_id,
    plan_id: subscription.plan_id,
    started_at: subscription.started_at,
    status: subscription.status,
    updated_at: subscription.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }
    const organizationId = auth.organizationId;
    if (!organizationId) {
      return apiError("Organization not found", 404);
    }

    const admin = auth.adminClient;
    const [subscription, marketplaceProfile] = await Promise.all([
      normalizeCurrentSubscription(admin, organizationId),
      admin
        .from("marketplace_profiles")
        .select("id, listing_tier, is_featured, featured_until, boost_score")
        .eq("organization_id", organizationId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error;
          return data;
        }),
    ]);

    return apiSuccess({
      currentSubscription: sanitizeSubscription(subscription),
      currentTier: marketplaceProfile?.listing_tier || "free",
      currentBoostScore: marketplaceProfile?.boost_score || 0,
      isFeatured: marketplaceProfile?.is_featured || false,
      featuredUntil: marketplaceProfile?.featured_until || null,
      plans: listMarketplaceListingPlans(),
      checkoutEnabled: Boolean(
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
          process.env.RAZORPAY_KEY_SECRET &&
          process.env.RAZORPAY_KEY_ID,
      ),
    });
  } catch (error) {
    logError("[marketplace/listing-subscription] load failed", error);
    return apiError("Failed to load listing subscription", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }

    const organizationId = auth.organizationId!;
    const admin = auth.adminClient;

    const body = await request.json().catch(() => null);
    const parsed = createListingSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid listing upgrade request", 400, {
        issues: parsed.error.flatten(),
      });
    }

    const plan = getMarketplaceListingPlan(parsed.data.planId);

    const { data: marketplaceProfile, error: profileError } = await admin
      .from("marketplace_profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (profileError) {
      return apiError("Failed to load marketplace profile", 500);
    }

    const order = await paymentService.createOrder(
      plan.pricePaise / 100,
      "INR",
      organizationId,
      {
        source: "marketplace_listing",
        plan_id: parsed.data.planId,
      },
    );

    const { data: subscriptionData, error: insertError } = await admin
      .from("marketplace_listing_subscriptions")
      .insert({
        organization_id: organizationId,
        marketplace_profile_id: marketplaceProfile?.id || null,
        plan_id: parsed.data.planId,
        status: "pending",
        amount_paise: plan.pricePaise,
        currency: "INR",
        boost_score: plan.boostScore,
        razorpay_order_id: order.id,
        created_by: auth.userId,
      })
      .select(MARKETPLACE_LISTING_SUBSCRIPTION_SELECT)
      .single();
    const subscription = subscriptionData as unknown as MarketplaceListingSubscriptionRow | null;

    if (insertError || !subscription) {
      return apiError("Failed to create listing upgrade", 500);
    }

    return apiSuccess({
      subscription,
      order,
      plan,
    });
  } catch (error) {
    logError("[marketplace/listing-subscription] create failed", error);
    return apiError("Failed to start marketplace listing checkout", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) {
      return auth.response;
    }

    const organizationId = auth.organizationId!;
    const admin = auth.adminClient;

    const body = await request.json().catch(() => null);
    const parsed = cancelListingSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid listing action", 400);
    }

    const { error: subscriptionUpdateError } = await admin
      .from("marketplace_listing_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .in("status", ["pending", "active"]);
    if (subscriptionUpdateError) {
      return apiError("Failed to cancel listing subscription", 500);
    }

    const { error: profileUpdateError } = await admin
      .from("marketplace_profiles")
      .update({
        listing_tier: "free",
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);
    if (profileUpdateError) {
      return apiError("Failed to update marketplace profile", 500);
    }

    return apiSuccess({
      status: "cancelled",
      tier: "free" as MarketplaceListingPlanId,
    });
  } catch (error) {
    logError("[marketplace/listing-subscription] cancel failed", error);
    return apiError("Failed to update listing plan", 500);
  }
}
