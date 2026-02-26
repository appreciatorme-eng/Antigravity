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

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free",
    features: ["Up to 10 clients", "5 proposals per month", "Basic email support", "Community access"],
    outcomes: ["Start operations quickly", "Validate demand with low setup cost"],
    limits: {
      clients: 10,
      proposals: 5,
      users: 1,
      aiRequests: 200,
    },
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: 4999,
    priceLabel: "₹4,999/month",
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
      clients: -1,
      proposals: -1,
      users: 5,
      aiRequests: 3000,
    },
  },
  {
    id: "pro_annual",
    name: "Pro Annual",
    price: 49990,
    priceLabel: "₹49,990/year",
    gstLabel: "+ ₹8,998 GST",
    savings: "Save ₹9,990 (2 months free)",
    features: ["Everything in Pro Monthly", "2 months free", "Annual billing discount", "Dedicated account manager"],
    outcomes: ["Lower CAC payback window", "Predictable yearly operating costs"],
    limits: {
      clients: -1,
      proposals: -1,
      users: 10,
      aiRequests: 5000,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 15000,
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
      clients: -1,
      proposals: -1,
      users: -1,
      aiRequests: 20000,
    },
  },
];

export function getPlanById(planId: string | null | undefined): BillingPlan {
  return BILLING_PLANS.find((plan) => plan.id === planId) || BILLING_PLANS[0];
}
