"use client";

import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import type { Subscription } from "./useBillingData";
import type { BillingPlan } from "./plans";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface UsageHealth {
  clientsPct: number;
  proposalsPct: number;
  aiPct: number;
  nearingLimit: boolean;
}

interface BillingUsage {
  clientsUsed: number;
  proposalsUsed: number;
  aiRequestsUsed: number;
  aiUtilizationPct: number;
}

export interface BillingPlanSectionProps {
  currentPlan: BillingPlan;
  subscription: Subscription | null;
  usage: BillingUsage;
  usageHealth: UsageHealth;
  recoveredRevenue: number;
  estimatedHoursSaved: number;
  onOpenUpgradeModal: (planId: string) => void;
  onOpenCancelModal: () => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency = "INR") {
  if (currency === "INR") return `₹${amount.toLocaleString("en-IN")}`;
  return `$${amount.toLocaleString("en-US")}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BillingPlanSection({
  currentPlan,
  subscription,
  usage,
  usageHealth,
  recoveredRevenue,
  estimatedHoursSaved,
  onOpenUpgradeModal,
  onOpenCancelModal,
}: BillingPlanSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {/* Current Plan Card */}
        <GlassCard padding="lg" className="border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                  Current Plan
                </div>
                <h2 className="text-3xl font-serif text-secondary dark:text-white uppercase tracking-tight">{currentPlan.name}</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-secondary">{currentPlan.priceLabel.split("/")[0]}</span>
                <span className="text-text-muted text-sm font-medium">/{currentPlan.priceLabel.split("/")[1] || "access"}</span>
              </div>
              {subscription && (
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block mb-1">Billing Cycle</span>
                    <span className="text-xs font-bold text-secondary capitalize bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {subscription.billing_cycle}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block mb-1">Next Statement</span>
                    <span className="text-xs font-bold text-secondary bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {formatDate(subscription.current_period_end)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {subscription && !subscription.cancel_at_period_end && (
                <GlassButton
                  variant="ghost"
                  className="rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50"
                  onClick={onOpenCancelModal}
                >
                  Cancel Plan
                </GlassButton>
              )}
              {currentPlan.id !== "enterprise" && (
                <GlassButton
                  variant="primary"
                  className="rounded-2xl shadow-lg shadow-primary/20"
                  onClick={() => onOpenUpgradeModal("pro_annual")}
                >
                  Upgrade Plan
                </GlassButton>
              )}
            </div>
          </div>

          {subscription?.cancel_at_period_end ? (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <p className="text-sm text-rose-700 font-medium">
                Cancellation scheduled. Access continues until <span className="font-bold">{formatDate(subscription.current_period_end)}</span>.
              </p>
            </div>
          ) : null}
        </GlassCard>

        {/* ROI Snapshot */}
        <GlassCard padding="lg" className="border-emerald-200/60 bg-emerald-50/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">ROI Snapshot</p>
              <h3 className="text-lg font-serif text-secondary mt-1">Premium features tied to measurable outcomes</h3>
              <p className="text-sm text-text-muted mt-1">Estimated with your current monthly usage footprint.</p>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-white border border-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">Recovered Revenue</p>
              <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(recoveredRevenue)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">Hours Saved</p>
              <p className="text-xl font-black text-secondary mt-1">{estimatedHoursSaved} hrs/month</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">Conversion Lift Target</p>
              <p className="text-xl font-black text-secondary mt-1">+8% close-rate</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Usage Meter Sidebar */}
      <div className="space-y-4">
        <GlassCard padding="lg" className="border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">Usage Meter</span>
              <span className="text-sm font-bold text-secondary">Plan Capacity</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted">Clients</span>
                <span className="font-bold text-secondary">
                  {usage.clientsUsed}/{currentPlan.limits.clients === -1 ? "\u221E" : currentPlan.limits.clients}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${currentPlan.limits.clients === -1 ? 0 : usageHealth.clientsPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted">Monthly proposals</span>
                <span className="font-bold text-secondary">
                  {usage.proposalsUsed}/{currentPlan.limits.proposals === -1 ? "\u221E" : currentPlan.limits.proposals}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${currentPlan.limits.proposals === -1 ? 0 : usageHealth.proposalsPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted">AI usage</span>
                <span className="font-bold text-secondary">{usage.aiUtilizationPct.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${usageHealth.aiPct}%` }} />
              </div>
            </div>
          </div>

          {usageHealth.nearingLimit ? (
            <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-xs font-bold text-amber-700">Usage is nearing your plan limits.</p>
              <p className="text-xs text-amber-700/90 mt-1">Unlock with Pro to avoid throttled proposal flow and maintain response speed.</p>
              <GlassButton
                className="mt-3 h-8 rounded-lg text-[11px] uppercase tracking-wider"
                onClick={() => onOpenUpgradeModal("pro_monthly")}
              >
                Unlock with Pro
              </GlassButton>
            </div>
          ) : null}
        </GlassCard>

        <button className="w-full p-4 rounded-3xl border border-gray-100 bg-white hover:border-primary/30 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <CreditCard className="w-5 h-5 text-text-muted group-hover:text-primary" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">Payment Method</span>
              <span className="text-sm font-bold text-secondary truncate">Manage in settings</span>
            </div>
          </div>
          <X className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors rotate-45" />
        </button>
      </div>
    </div>
  );
}
