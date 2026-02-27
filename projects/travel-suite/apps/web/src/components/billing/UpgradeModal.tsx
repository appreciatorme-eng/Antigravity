"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, Check, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { TIERS, type TierName } from "@/lib/billing/tiers";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredTier: TierName;
}

const FEATURE_BENEFITS: Record<string, { icon: React.ElementType; headline: string; stat: string }> = {
  whatsappAutomations: {
    icon: Clock,
    headline: "WhatsApp automations save operators 4.5 hours/week",
    stat: "4.5 hrs saved/week",
  },
  clientPortal: {
    icon: TrendingUp,
    headline: "Branded client portals increase repeat bookings by 32%",
    stat: "32% more repeat bookings",
  },
  gstInvoicing: {
    icon: TrendingUp,
    headline: "GST invoicing gets you compliant and paid 2x faster",
    stat: "2x faster payments",
  },
  aiInsights: {
    icon: TrendingUp,
    headline: "AI lead scoring helps close 28% more proposals",
    stat: "28% more conversions",
  },
  revenueAnalytics: {
    icon: TrendingUp,
    headline: "Revenue analytics help operators grow 40% year-on-year",
    stat: "40% YoY growth",
  },
  razorpayIntegration: {
    icon: TrendingUp,
    headline: "Online payments reduce collection time by 5 days on average",
    stat: "5 days faster collection",
  },
  prioritySupport: {
    icon: Clock,
    headline: "Dedicated support resolves issues 10x faster",
    stat: "10x faster resolution",
  },
  whiteLabelPortal: {
    icon: TrendingUp,
    headline: "White-label portals make your brand look enterprise-grade",
    stat: "Professional brand image",
  },
  tripTemplates: {
    icon: Clock,
    headline: "Ready-made templates cut itinerary creation time by 80%",
    stat: "80% faster itineraries",
  },
  apiAccess: {
    icon: TrendingUp,
    headline: "API access lets you integrate with your existing tools",
    stat: "Unlimited integrations",
  },
};

function getTierPriceDisplay(tierName: TierName): string {
  const tier = TIERS[tierName];
  if (tier.price.monthly === 0) return "Free";
  return `₹${tier.price.monthly.toLocaleString("en-IN")}/mo`;
}

function getTierGradientClass(tierName: TierName): string {
  return TIERS[tierName].color;
}

export function UpgradeModal({ isOpen, onClose, feature, requiredTier }: UpgradeModalProps) {
  const tier = TIERS[requiredTier];
  const benefit = FEATURE_BENEFITS[feature] ?? {
    icon: TrendingUp,
    headline: `Unlock ${feature} to supercharge your operations`,
    stat: "Boost productivity",
  };
  const BenefitIcon = benefit.icon;

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1628] backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Gradient top accent */}
              <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", getTierGradientClass(requiredTier))} />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex items-start gap-4">
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br", getTierGradientClass(requiredTier))}>
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                      Feature Locked
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white leading-tight">
                      Upgrade to unlock{" "}
                      <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", getTierGradientClass(requiredTier))}>
                        {feature.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </span>
                    </h2>
                  </div>
                </div>

                {/* Benefit banner */}
                <div className={cn("mb-5 rounded-xl border bg-gradient-to-r p-4", `from-${requiredTier === 'pro' ? 'emerald' : requiredTier === 'business' ? 'violet' : 'amber'}-500/10 to-transparent border-${requiredTier === 'pro' ? 'emerald' : requiredTier === 'business' ? 'violet' : 'amber'}-500/20`)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", getTierGradientClass(requiredTier))}>
                      <BenefitIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug">{benefit.headline}</p>
                      <p className={cn("mt-1 text-xs font-bold bg-gradient-to-r bg-clip-text text-transparent", getTierGradientClass(requiredTier))}>
                        {benefit.stat}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mini tier card */}
                <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                        {tier.displayName} Plan includes
                      </p>
                      <p className={cn("mt-1 text-2xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent", tier.color)}>
                        {getTierPriceDisplay(requiredTier)}
                      </p>
                    </div>
                    {tier.badge && (
                      <span className={cn("rounded-full px-3 py-1 text-xs font-bold", getTierGradientClass(requiredTier), "bg-gradient-to-r text-white")}>
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {tier.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br", tier.color)}>
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-xs text-white/60 leading-snug">{f}</span>
                      </li>
                    ))}
                    {tier.features.length > 4 && (
                      <li className="text-xs text-white/40 pl-6">
                        +{tier.features.length - 4} more features...
                      </li>
                    )}
                  </ul>
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className={cn(
                    "w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110",
                    "bg-gradient-to-r",
                    tier.color,
                    requiredTier === "pro" && "shadow-emerald-500/25 hover:shadow-emerald-500/40",
                    requiredTier === "business" && "shadow-violet-500/25 hover:shadow-violet-500/40",
                    requiredTier === "enterprise" && "shadow-amber-500/25 hover:shadow-amber-500/40"
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    Upgrade to {tier.displayName} — {getTierPriceDisplay(requiredTier)}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>

                {/* Secondary link */}
                <div className="mt-3 text-center">
                  <Link
                    href="/billing"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white/60"
                  >
                    See all plans & compare features
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
