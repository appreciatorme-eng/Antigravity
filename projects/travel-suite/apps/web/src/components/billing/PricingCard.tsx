"use client";

import { motion } from "framer-motion";
import { Check, Star, Zap } from "lucide-react";
import { type Tier, type TierName } from "@/lib/billing/tiers";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  tier: Tier;
  billing: "monthly" | "annual";
  currentTier: TierName;
  onSelect: () => void;
}

function formatPriceDisplay(amount: number): string {
  if (amount === 0) return "Free";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getCtaLabel(tierName: TierName, currentTier: TierName): string {
  if (tierName === currentTier) return "Current Plan";
  if (tierName === "free") return "Start Free";
  if (tierName === "pro") return "Upgrade to Pro";
  if (tierName === "business") return "Get Business";
  return "Contact Sales";
}

function getBadgeStyle(badge: string): string {
  if (badge === "Most Popular") return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  if (badge === "Scale Fast") return "bg-violet-500/20 text-violet-400 border border-violet-500/30";
  if (badge === "Full Control") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  return "bg-white/10 text-white/70 border border-white/20";
}

function getAnnualSavings(tier: Tier): number {
  return (tier.price.monthly - tier.price.annual) * 12;
}

export function PricingCard({ tier, billing, currentTier, onSelect }: PricingCardProps) {
  const isCurrentPlan = tier.name === currentTier;
  const isRecommended = tier.name === "pro";
  const activePrice = billing === "annual" ? tier.price.annual : tier.price.monthly;
  const annualSavings = getAnnualSavings(tier);
  const ctaLabel = getCtaLabel(tier.name, currentTier);

  return (
    <motion.div
      whileHover={{ scale: isCurrentPlan ? 1 : 1.02, y: isCurrentPlan ? 0 : -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white/5 backdrop-blur-xl p-6 transition-all duration-300",
        isRecommended
          ? "border-emerald-500/40 shadow-[0_0_40px_rgba(0,208,132,0.15)] ring-1 ring-emerald-500/20"
          : "border-white/10",
        isCurrentPlan && "opacity-80"
      )}
    >
      {/* Gradient top accent */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r",
          tier.color
        )}
      />

      {/* Badge */}
      {tier.badge && (
        <div className="mb-4 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide",
              getBadgeStyle(tier.badge)
            )}
          >
            {tier.name === "pro" && <Star className="h-3 w-3 fill-current" />}
            {tier.name === "business" && <Zap className="h-3 w-3 fill-current" />}
            {tier.badge}
          </span>
        </div>
      )}
      {!tier.badge && <div className="mb-4 h-7" />}

      {/* Tier name */}
      <h3 className="text-xl font-bold text-white">{tier.displayName}</h3>

      {/* Price */}
      <div className="mt-4 flex items-end gap-1">
        <span
          className={cn(
            "text-4xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent",
            tier.color
          )}
        >
          {formatPriceDisplay(activePrice)}
        </span>
        {activePrice > 0 && (
          <span className="mb-1 text-sm text-white/50">/mo</span>
        )}
      </div>

      {/* Annual billing note */}
      {billing === "annual" && activePrice > 0 && (
        <p className="mt-1 text-xs text-white/40">
          ₹{(tier.price.annual * 12).toLocaleString("en-IN")} billed annually
        </p>
      )}
      {billing === "monthly" && activePrice > 0 && (
        <p className="mt-1 text-xs text-white/40">billed monthly</p>
      )}
      {activePrice === 0 && (
        <p className="mt-1 text-xs text-white/40">no credit card required</p>
      )}

      {/* Annual savings */}
      {billing === "annual" && annualSavings > 0 && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">
            Save ₹{annualSavings.toLocaleString("en-IN")}/year
          </span>
        </div>
      )}
      {(billing === "monthly" || annualSavings === 0) && (
        <div className="mt-3 h-7" />
      )}

      {/* Divider */}
      <div className="my-5 h-px bg-white/10" />

      {/* Feature list */}
      <ul className="flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br", tier.color)}>
              <Check className="h-2.5 w-2.5 text-white font-black" />
            </div>
            <span className="text-sm text-white/70 leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-6">
        {isCurrentPlan ? (
          <div className="flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white/50">
            Current Plan
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onSelect}
            className={cn(
              "w-full rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
              isRecommended
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110"
                : tier.name === "free"
                ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
                : `bg-gradient-to-r ${tier.color} text-white hover:brightness-110 shadow-lg`
            )}
          >
            {ctaLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
