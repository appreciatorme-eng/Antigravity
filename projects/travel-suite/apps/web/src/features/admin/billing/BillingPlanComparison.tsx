"use client";

import {
  CheckCircle2,
  Target,
  TrendingUp,
  Clock3,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/utils";
import { BILLING_PLANS } from "./plans";
import type { BillingPlan } from "./plans";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface BillingPlanComparisonProps {
  currentPlan: BillingPlan;
  onOpenUpgradeModal: (planId: string) => void;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BillingPlanComparison({
  currentPlan,
  onOpenUpgradeModal,
}: BillingPlanComparisonProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-secondary dark:text-white">Plan Comparison by Outcome</h2>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
          <Target className="w-3.5 h-3.5" />
          Outcome-first pricing
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {BILLING_PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan.id;
          return (
            <GlassCard
              key={plan.id}
              padding="lg"
              className={cn(
                "flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden",
                isCurrentPlan ? "border-primary/40 bg-primary/[0.02]" : "border-gray-100",
                plan.popular && !isCurrentPlan ? "border-indigo-200" : ""
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif text-secondary dark:text-white">{plan.name}</h3>
                {isCurrentPlan ? (
                  <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary">Active</span>
                ) : plan.popular ? (
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-100 border border-indigo-200 text-[8px] font-black uppercase tracking-widest text-indigo-600">Popular</span>
                ) : null}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-secondary">
                    {plan.price === 0 ? "Free" : `\u20B9${(plan.price / (plan.id.includes("annual") ? 12 : 1)).toLocaleString()}`}
                  </span>
                  {plan.price > 0 ? <span className="text-text-muted text-xs font-medium">/mo</span> : null}
                </div>
                {plan.savings ? (
                  <div className="mt-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 inline-block">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">{plan.savings}</span>
                  </div>
                ) : null}
              </div>

              <div className="mb-4 p-3 rounded-xl border border-gray-100 bg-white/70">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-text-muted">Operator outcomes</p>
                <ul className="mt-2 space-y-1">
                  {plan.outcomes.map((outcome) => (
                    <li key={outcome} className="text-xs font-semibold text-secondary">{"\u2022"} {outcome}</li>
                  ))}
                </ul>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <span className="text-xs text-text-secondary font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <GlassButton
                variant={isCurrentPlan ? "ghost" : plan.popular ? "primary" : "secondary"}
                fullWidth
                className={cn("rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]", isCurrentPlan ? "opacity-40" : "")}
                disabled={isCurrentPlan}
                onClick={() => onOpenUpgradeModal(plan.id)}
              >
                {isCurrentPlan ? "Current Plan" : "Choose Plan"}
              </GlassButton>
            </GlassCard>
          );
        })}
      </div>

      {/* Case Studies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard padding="lg" className="border-blue-200/60 bg-blue-50/40">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Case Study: Jaipur Trails Co.</p>
          </div>
          <p className="text-sm text-secondary font-semibold">Moved from Free to Pro and reduced unpaid invoices by 31% in 45 days.</p>
          <p className="text-xs text-text-muted mt-2">Used action queue + follow-up reminders to recover delayed revenue.</p>
        </GlassCard>

        <GlassCard padding="lg" className="border-purple-200/60 bg-purple-50/40">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-700">Case Study: Nomad Routes</p>
          </div>
          <p className="text-sm text-secondary font-semibold">Saved ~22 operator hours/month by switching to interactive proposals and AI-assisted quoting.</p>
          <p className="text-xs text-text-muted mt-2">Scaled team output without adding headcount in peak season.</p>
        </GlassCard>
      </div>
    </div>
  );
}
