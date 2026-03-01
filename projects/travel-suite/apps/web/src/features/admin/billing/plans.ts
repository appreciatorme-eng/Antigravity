import { PLAN_CATALOG, limitToUiValue } from "@/lib/billing/plan-catalog";

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  gstLabel?: string;
  savings?: string;
  features: string[];
  outcomes: string[];
  limits: {
    clients: number;
    proposals: number;
    users: number;
    aiRequests?: number;
  };
  popular?: boolean;
}

const FREE = PLAN_CATALOG.free;
const PRO_MONTHLY = PLAN_CATALOG.pro_monthly;
const PRO_ANNUAL = PLAN_CATALOG.pro_annual;
const ENTERPRISE = PLAN_CATALOG.enterprise;

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: FREE.id,
    name: "Free",
    price: FREE.monthlyPriceInr,
    priceLabel: "Free",
    features: [
      "Up to 10 clients",
      "5 proposals per month",
      "Basic email support",
      "Community access",
    ],
    outcomes: ["Start operations quickly", "Validate demand with low setup cost"],
    limits: {
      clients: limitToUiValue(FREE.limits.clients),
      proposals: limitToUiValue(FREE.limits.proposals),
      users: limitToUiValue(FREE.limits.users),
      aiRequests: FREE.limits.aiRequests ?? undefined,
    },
  },
  {
    id: PRO_MONTHLY.id,
    name: "Pro",
    price: PRO_MONTHLY.monthlyPriceInr,
    priceLabel: `₹${PRO_MONTHLY.monthlyPriceInr.toLocaleString("en-IN")}/month`,
    gstLabel: "+ ₹900 GST",
    features: [
      "Unlimited clients",
      "Unlimited proposals",
      "Interactive proposal system",
      "Priority support",
      "Advanced analytics",
      "WhatsApp integration",
    ],
    outcomes: ["Recover delayed revenue with action queue", "Increase close-rate with conversion insights"],
    popular: true,
    limits: {
      clients: limitToUiValue(PRO_MONTHLY.limits.clients),
      proposals: limitToUiValue(PRO_MONTHLY.limits.proposals),
      users: limitToUiValue(PRO_MONTHLY.limits.users),
      aiRequests: PRO_MONTHLY.limits.aiRequests ?? undefined,
    },
  },
  {
    id: PRO_ANNUAL.id,
    name: "Pro Annual",
    price: PRO_ANNUAL.annualTotalInr || PRO_ANNUAL.monthlyPriceInr * 12,
    priceLabel: `₹${(PRO_ANNUAL.annualTotalInr || PRO_ANNUAL.monthlyPriceInr * 12).toLocaleString("en-IN")}/year`,
    gstLabel: "+ ₹8,998 GST",
    savings: "Save ₹9,990 (2 months free)",
    features: [
      "Everything in Pro Monthly",
      "2 months free",
      "Annual billing discount",
      "Dedicated account manager",
    ],
    outcomes: ["Lower CAC payback window", "Predictable yearly operating costs"],
    limits: {
      clients: limitToUiValue(PRO_ANNUAL.limits.clients),
      proposals: limitToUiValue(PRO_ANNUAL.limits.proposals),
      users: limitToUiValue(PRO_ANNUAL.limits.users),
      aiRequests: PRO_ANNUAL.limits.aiRequests ?? undefined,
    },
  },
  {
    id: ENTERPRISE.id,
    name: "Enterprise",
    price: ENTERPRISE.monthlyPriceInr,
    priceLabel: "Custom",
    features: [
      "Unlimited everything",
      "White-label branding",
      "Custom integrations",
      "SLA guarantees",
      "Dedicated success team",
      "On-premise deployment option",
    ],
    outcomes: ["Run multi-brand operations in one control plane", "Automate high-volume trip pipelines safely"],
    limits: {
      clients: limitToUiValue(ENTERPRISE.limits.clients),
      proposals: limitToUiValue(ENTERPRISE.limits.proposals),
      users: limitToUiValue(ENTERPRISE.limits.users),
      aiRequests: ENTERPRISE.limits.aiRequests ?? undefined,
    },
  },
];

export function getPlanById(planId: string | null | undefined): BillingPlan {
  return BILLING_PLANS.find((plan) => plan.id === planId) || BILLING_PLANS[0];
}
