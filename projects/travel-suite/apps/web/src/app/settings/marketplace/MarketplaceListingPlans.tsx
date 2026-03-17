"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Crown, Sparkles, Star, TrendingUp } from "lucide-react";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { useToast } from "@/components/ui/toast";
import {
  formatMarketplaceListingPrice,
  type MarketplaceListingPlan,
  type MarketplaceListingPlanId,
} from "@/lib/marketplace-listing-plans";
import { MarketplaceListingCheckoutModal } from "./MarketplaceListingCheckoutModal";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type ListingSubscription = {
  id: string;
  plan_id: MarketplaceListingPlanId;
  status: string;
  current_period_end: string | null;
  amount_paise: number;
} | null;

type ListingState = {
  currentSubscription: ListingSubscription;
  currentTier: MarketplaceListingPlanId;
  currentBoostScore: number;
  isFeatured: boolean;
  featuredUntil: string | null;
  checkoutEnabled: boolean;
  plans: MarketplaceListingPlan[];
};

type MarketplaceListingPlansProps = {
  listingState: ListingState | null;
  organizationName?: string | null;
  onRefresh: () => Promise<void> | void;
};

async function loadRazorpayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay checkout")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function iconForPlan(planId: MarketplaceListingPlanId) {
  if (planId === "featured_lite") return Sparkles;
  if (planId === "featured_pro") return Star;
  if (planId === "top_placement") return Crown;
  return BadgeCheck;
}

export function MarketplaceListingPlans({
  listingState,
  organizationName,
  onRefresh,
}: MarketplaceListingPlansProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<MarketplaceListingPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  const currentPlan = useMemo(() => {
    if (!listingState) return null;
    return (
      listingState.plans.find((plan) => plan.id === listingState.currentTier) ??
      listingState.plans[0] ??
      null
    );
  }, [listingState]);

  if (!listingState) {
    return null;
  }
  const checkoutEnabled = listingState.checkoutEnabled;

  async function handleDowngrade() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/marketplace/listing-subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "downgrade_to_free" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update marketplace plan");
      }

      toast({
        title: "Listing downgraded",
        description: "Your listing will continue on the free marketplace tier.",
        variant: "success",
      });
      await onRefresh();
    } catch (error) {
      toast({
        title: "Could not update marketplace plan",
        description:
          error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmUpgrade() {
    if (!selectedPlan || selectedPlan.id === "free") {
      setIsModalOpen(false);
      return;
    }

    if (!checkoutEnabled || !publicKey) {
      toast({
        title: "Checkout not configured",
        description:
          "Marketplace listing checkout is not configured yet. Add Razorpay keys before upgrading.",
        variant: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      const createResponse = await fetch("/api/marketplace/listing-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id }),
      });

      const createPayload = await createResponse.json().catch(() => null);
      if (!createResponse.ok || !createPayload?.data?.subscription || !createPayload?.data?.order) {
        throw new Error(createPayload?.error || "Failed to create marketplace listing checkout");
      }

      await loadRazorpayCheckoutScript();
      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable");
      }

      const subscriptionId = String(createPayload.data.subscription.id);
      const orderId = String(createPayload.data.order.id);

      const checkout = new window.Razorpay({
        key: publicKey,
        amount: selectedPlan.pricePaise,
        currency: "INR",
        name: organizationName || "TripBuilt",
        description: `${selectedPlan.name} marketplace listing`,
        order_id: orderId,
        theme: { color: "#14b8a6" },
        handler: async (response: Record<string, unknown>) => {
          try {
            const verifyResponse = await fetch(
              "/api/marketplace/listing-subscription/verify",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscriptionId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            );

            const verifyPayload = await verifyResponse.json().catch(() => null);
            if (!verifyResponse.ok) {
              throw new Error(
                verifyPayload?.error || "Failed to activate marketplace listing",
              );
            }

            toast({
              title: `${selectedPlan.name} activated`,
              description: "Your featured listing is now live in marketplace discovery.",
              variant: "success",
            });
            setIsModalOpen(false);
            setSelectedPlan(null);
            await onRefresh();
          } catch (error) {
            toast({
              title: "Marketplace listing activation failed",
              description:
                error instanceof Error
                  ? error.message
                  : "The payment was received but the listing could not be activated.",
              variant: "error",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      });

      checkout.open();
    } catch (error) {
      toast({
        title: "Marketplace listing checkout failed",
        description:
          error instanceof Error ? error.message : "Unable to launch checkout.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <GlassCard className="space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Featured marketplace placement
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-white/60">
              Turn strong profile quality into paid visibility. Paid boosts only apply after your
              listing clears the organic quality floor.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <GlassBadge variant={listingState.isFeatured ? "success" : "default"}>
              {currentPlan?.name || "Free Listing"}
            </GlassBadge>
            {listingState.featuredUntil ? (
              <GlassBadge variant="info">
                Active until {formatDate(listingState.featuredUntil)}
              </GlassBadge>
            ) : null}
            <GlassBadge variant="warning">
              Boost +{listingState.currentBoostScore}
            </GlassBadge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {listingState.plans.map((plan) => {
            const Icon = iconForPlan(plan.id);
            const isCurrent = plan.id === listingState.currentTier;
            return (
              <GlassCard
                key={plan.id}
                className={`space-y-4 border ${isCurrent ? "border-primary/50 bg-primary/5" : "border-slate-200 dark:border-white/10"}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                        <Icon className="w-4 h-4 text-slate-700 dark:text-white/80" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-white/50">{plan.badge}</p>
                      </div>
                    </div>
                    {isCurrent ? (
                      <GlassBadge variant="primary">Current</GlassBadge>
                    ) : null}
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {formatMarketplaceListingPrice(plan.pricePaise)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-white/60">{plan.description}</p>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-sm text-slate-700 dark:text-white/75 flex items-start gap-2"
                    >
                      <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <GlassButton
                    variant="outline"
                    fullWidth
                    disabled={listingState.currentTier === "free" || submitting}
                    onClick={() => void handleDowngrade()}
                  >
                    Downgrade to Free
                  </GlassButton>
                ) : (
                  <GlassButton
                    fullWidth
                    disabled={isCurrent || submitting}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsModalOpen(true);
                    }}
                  >
                    {isCurrent ? "Current plan" : "Upgrade Listing"}
                  </GlassButton>
                )}
              </GlassCard>
            );
          })}
        </div>
      </GlassCard>

      <MarketplaceListingCheckoutModal
        isOpen={isModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            setSelectedPlan(null);
          }
        }}
        selectedPlan={selectedPlan}
        submitting={submitting}
        checkoutEnabled={checkoutEnabled}
        publicKey={publicKey}
        onConfirm={handleConfirmUpgrade}
      />
    </>
  );
}
