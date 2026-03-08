export type MarketplaceListingPlanId =
  | "free"
  | "featured_lite"
  | "featured_pro"
  | "top_placement";

export type MarketplaceListingPlan = {
  id: MarketplaceListingPlanId;
  name: string;
  pricePaise: number;
  boostScore: number;
  badge: string;
  description: string;
  features: string[];
  durationDays: number;
};

export const MARKETPLACE_LISTING_PLANS: Record<
  MarketplaceListingPlanId,
  MarketplaceListingPlan
> = {
  free: {
    id: "free",
    name: "Free Listing",
    pricePaise: 0,
    boostScore: 0,
    badge: "Included",
    description:
      "Stay discoverable in the marketplace with your verified profile, reviews, and rate card.",
    features: [
      "Basic marketplace profile",
      "Organic ranking from profile quality",
      "Standard inquiry routing",
    ],
    durationDays: 30,
  },
  featured_lite: {
    id: "featured_lite",
    name: "Featured Lite",
    pricePaise: 99_900,
    boostScore: 12,
    badge: "₹999/mo",
    description:
      "A light visibility boost for operators with complete profiles and consistent review quality.",
    features: [
      "Priority placement in relevant searches",
      "Featured badge on listing cards",
      "Visibility stats and inquiry attribution",
    ],
    durationDays: 30,
  },
  featured_pro: {
    id: "featured_pro",
    name: "Featured Pro",
    pricePaise: 199_900,
    boostScore: 22,
    badge: "₹1,999/mo",
    description:
      "Designed for operators who want stronger lead share without compromising ranking quality.",
    features: [
      "Higher discovery boost for qualified listings",
      "Featured badge and marketplace highlighting",
      "Priority placement in high-intent searches",
    ],
    durationDays: 30,
  },
  top_placement: {
    id: "top_placement",
    name: "Top Placement",
    pricePaise: 299_900,
    boostScore: 32,
    badge: "₹2,999/mo",
    description:
      "Maximum marketplace visibility for high-quality operators with strong reviews and complete profiles.",
    features: [
      "Top placement boost for eligible listings",
      "Featured badge and premium callout styling",
      "Best placement on destination discovery pages",
    ],
    durationDays: 30,
  },
};

export function getMarketplaceListingPlan(
  planId: MarketplaceListingPlanId,
): MarketplaceListingPlan {
  return MARKETPLACE_LISTING_PLANS[planId];
}

export function listMarketplaceListingPlans(): MarketplaceListingPlan[] {
  return [
    MARKETPLACE_LISTING_PLANS.free,
    MARKETPLACE_LISTING_PLANS.featured_lite,
    MARKETPLACE_LISTING_PLANS.featured_pro,
    MARKETPLACE_LISTING_PLANS.top_placement,
  ];
}

export function formatMarketplaceListingPrice(pricePaise: number): string {
  if (pricePaise <= 0) return "Included";
  return `₹${Math.round(pricePaise / 100).toLocaleString("en-IN")}/mo`;
}
