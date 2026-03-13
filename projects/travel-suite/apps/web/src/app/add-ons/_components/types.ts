import type { GlassBadgeProps } from "@/components/glass/GlassBadge";

export interface AddOn {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  duration: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Stats {
  totalRevenue: number;
  totalSales: number;
  topAddOn: string;
  totalAddOns: number;
  activeAddOns: number;
}

export type BadgeVariant = NonNullable<GlassBadgeProps["variant"]>;

export const CATEGORY_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  Activities: "primary",
  Dining: "warning",
  Transport: "info",
  Upgrades: "success",
};

export const getCategoryColor = (category: string): BadgeVariant =>
  CATEGORY_BADGE_VARIANTS[category] || "default";

export interface AddOnFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  duration: string;
}

export const EMPTY_FORM_DATA: AddOnFormData = {
  name: "",
  description: "",
  price: "",
  category: "Activities",
  image_url: "",
  duration: "",
};

export const PACKAGE_TEMPLATES: Record<
  string,
  {
    name: string;
    description: string;
    price: string;
    category: string;
    duration: string;
  }
> = {
  ai_credits: {
    name: "AI Credits Pack",
    description: "Prepaid AI generation capacity for peak proposal workflows.",
    price: "2999",
    category: "Upgrades",
    duration: "Monthly",
  },
  whatsapp_volume: {
    name: "WhatsApp Volume Pack",
    description:
      "Higher reminder volume for collections and quote follow-up automation.",
    price: "1999",
    category: "Upgrades",
    duration: "Monthly",
  },
  premium_templates: {
    name: "Premium Templates Pack",
    description:
      "High-conversion proposal templates designed for upsell moments.",
    price: "1499",
    category: "Upgrades",
    duration: "Monthly",
  },
  ai_credits_starter: {
    name: "AI Starter Credits",
    description: "1,000 prepaid AI requests for controlled overage spending.",
    price: "2999",
    category: "Upgrades",
    duration: "Monthly",
  },
  ai_credits_growth: {
    name: "AI Growth Credits",
    description: "5,000 prepaid AI requests for high-volume teams.",
    price: "11999",
    category: "Upgrades",
    duration: "Monthly",
  },
  media_credits_growth: {
    name: "Media Search Credits",
    description:
      "Prepaid credits for stock discovery and media lookup operations.",
    price: "2499",
    category: "Upgrades",
    duration: "Monthly",
  },
  automation_recovery: {
    name: "Collections Automation Pack",
    description:
      "Outcome-focused automation actions for payment and quote recovery.",
    price: "4999",
    category: "Upgrades",
    duration: "Monthly",
  },
};
