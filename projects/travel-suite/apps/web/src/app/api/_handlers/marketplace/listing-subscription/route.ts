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
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const createListingSubscriptionSchema = z.object({
  planId: z.enum(["featured_lite", "featured_pro", "top_placement"]),
});

const cancelListingSubscriptionSchema = z.object({
  action: z.literal("downgrade_to_free"),
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

async function normalizeCurrentSubscription(
  admin: ReturnType<typeof createAdminClient>,
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

    await admin
      .from("marketplace_profiles")
      .update({
        listing_tier: "free",
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);

    return expired;
  }

  return subscription;
}

export async function GET() {
  try {
    const { user, profile } = await getAuthContext();
    if (!user || !profile) {
      return apiError("Unauthorized", 401);
    }
    const organizationId = profile.organization_id;
    if (!organizationId) {
      return apiError("Organization not found", 404);
    }

    const admin = createAdminClient();
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
      currentSubscription: subscription,
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
    console.error("[marketplace/listing-subscription] load failed:", error);
    return apiError("Failed to load listing subscription", 500);
  }
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
    const parsed = createListingSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid listing upgrade request", 400, {
        issues: parsed.error.flatten(),
      });
    }

    const plan = getMarketplaceListingPlan(parsed.data.planId);
    const admin = createAdminClient();

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
        created_by: user.id,
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
    console.error("[marketplace/listing-subscription] create failed:", error);
    return apiError("Failed to start marketplace listing checkout", 500);
  }
}

export async function PATCH(request: NextRequest) {
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
    const parsed = cancelListingSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid listing action", 400);
    }

    const admin = createAdminClient();
    await admin
      .from("marketplace_listing_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .in("status", ["pending", "active"]);

    await admin
      .from("marketplace_profiles")
      .update({
        listing_tier: "free",
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);

    return apiSuccess({
      status: "cancelled",
      tier: "free" as MarketplaceListingPlanId,
    });
  } catch (error) {
    console.error("[marketplace/listing-subscription] cancel failed:", error);
    return apiError("Failed to update listing plan", 500);
  }
}
