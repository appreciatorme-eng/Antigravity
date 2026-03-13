"use client";

import Link from "next/link";
import {
  Target,
  Gift,
  Sparkles,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import type { OutcomeUpgradePrompt, OutcomePackage } from "@/lib/billing/outcome-upgrade";
import type { CreditPackOffer, PremiumAutomationGate } from "@/lib/billing/credit-packs";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface BillingUpgradeSectionProps {
  upgradePrompts: OutcomeUpgradePrompt[];
  recommendedPackages: OutcomePackage[];
  creditPacks: CreditPackOffer[];
  premiumAutomationGate: PremiumAutomationGate | null;
  onOpenUpgradeModal: (planId: string) => void;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BillingUpgradeSection({
  upgradePrompts,
  recommendedPackages,
  creditPacks,
  premiumAutomationGate,
  onOpenUpgradeModal,
}: BillingUpgradeSectionProps) {
  return (
    <>
      {/* Upgrade Prompts + Add-on Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard padding="lg" className="border-indigo-200/60 bg-indigo-50/40">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">Upgrade Moments</p>
              <h3 className="text-lg font-serif text-secondary mt-1">Prompts triggered by measurable usage signals</h3>
            </div>
            <Target className="w-5 h-5 text-indigo-600" />
          </div>

          {upgradePrompts.length === 0 ? (
            <div className="rounded-xl border border-indigo-100 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-secondary">No hard upgrade trigger right now.</p>
              <p className="text-xs text-text-muted mt-1">
                Prompts appear automatically when usage, collections, or ROI thresholds are crossed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upgradePrompts.map((prompt) => (
                <div key={prompt.id} className="rounded-xl border border-indigo-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-secondary">{prompt.title}</p>
                      <p className="text-xs text-text-muted mt-1">{prompt.detail}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">
                      {prompt.trigger_metric_value}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">
                    {prompt.trigger_metric_label} · {prompt.threshold_label}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {prompt.recommended_plan_id ? (
                      <GlassButton
                        className="h-8 rounded-lg text-[11px] uppercase tracking-[0.12em]"
                        onClick={() => onOpenUpgradeModal(prompt.recommended_plan_id!)}
                      >
                        {prompt.cta_label}
                      </GlassButton>
                    ) : null}
                    {prompt.recommended_package_key ? (
                      <Link
                        href={`/add-ons?package=${prompt.recommended_package_key}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                      >
                        View add-on pack
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard padding="lg" className="border-amber-200/60 bg-amber-50/40">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Add-on Packaging</p>
              <h3 className="text-lg font-serif text-secondary mt-1">Outcome bundles to monetize value moments</h3>
            </div>
            <Gift className="w-5 h-5 text-amber-600" />
          </div>

          <div className="space-y-3">
            {recommendedPackages.map((pkg) => (
              <div key={pkg.key} className="rounded-xl border border-amber-100 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-secondary">{pkg.name}</p>
                    <p className="text-xs text-text-muted mt-1">{pkg.description}</p>
                  </div>
                  <span className="text-[11px] font-black text-amber-700">{pkg.price_label}</span>
                </div>
                <p className="text-[11px] text-text-muted mt-2">Expected impact: {pkg.expected_impact}</p>
                <Link
                  href={`/add-ons?package=${pkg.key}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 hover:text-amber-900"
                >
                  Configure package
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Credit Packs + Automation Gate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard padding="lg" className="border-emerald-200/60 bg-emerald-50/30">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Prepaid Overage Packs</p>
              <h3 className="text-lg font-serif text-secondary mt-1">Margin-safe credits for predictable COGS</h3>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>

          {creditPacks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-white px-4 py-5 text-sm text-text-muted">
              Credit pack catalog will appear once subscription limits are available.
            </div>
          ) : (
            <div className="space-y-3">
              {creditPacks.map((pack) => (
                <div key={pack.key} className="rounded-xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-secondary">{pack.name}</p>
                      <p className="text-xs text-text-muted mt-1">{pack.description}</p>
                    </div>
                    <span className="text-[11px] font-black text-emerald-700">{"\u20B9"}{pack.price_inr.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="mt-2 text-[11px] text-text-muted">
                    {pack.included_credits.toLocaleString("en-IN")} {pack.unit_label} · Gross margin {pack.margin_pct.toFixed(1)}%
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {pack.requires_plan_upgrade ? (
                      <GlassButton
                        className="h-8 rounded-lg text-[11px] uppercase tracking-[0.12em]"
                        onClick={() => {
                          if (pack.required_plan_id) {
                            onOpenUpgradeModal(pack.required_plan_id);
                          }
                        }}
                      >
                        Unlock with {pack.required_plan_id === "enterprise" ? "Enterprise" : "Pro"}
                      </GlassButton>
                    ) : (
                      <Link
                        href={`/add-ons?package=${pack.key}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Add prepaid pack
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard padding="lg" className="border-indigo-200/60 bg-indigo-50/30">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">Automation Gate</p>
              <h3 className="text-lg font-serif text-secondary mt-1">Premium workflows and SLA-ready automations</h3>
            </div>
            <Lock className="w-5 h-5 text-indigo-600" />
          </div>

          {premiumAutomationGate?.enabled ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-semibold text-emerald-700">Premium automation is active</p>
              <p className="text-xs text-emerald-700/90 mt-1">{premiumAutomationGate.reason}</p>
              <Link
                href="/admin/operations"
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
              >
                Open command center
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-white px-4 py-4">
              <p className="text-sm font-semibold text-secondary">Premium automation is locked</p>
              <p className="text-xs text-text-muted mt-1">
                {premiumAutomationGate?.reason ||
                  "Upgrade your plan to unlock collection automation, quote rescue workflows, and SLA-driven triggers."}
              </p>
              <GlassButton
                className="mt-3 h-8 rounded-lg text-[11px] uppercase tracking-[0.12em]"
                onClick={() => {
                  const nextPlan = premiumAutomationGate?.required_plan_id || "pro_monthly";
                  onOpenUpgradeModal(nextPlan);
                }}
              >
                Upgrade to unlock
              </GlassButton>
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
