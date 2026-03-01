"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock3,
  Target,
  ArrowUpRight,
  Gift,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassModal } from "@/components/glass/GlassModal";
import { cn } from "@/lib/utils";
import { BILLING_PLANS, getPlanById } from "./plans";
import { useBillingData } from "./useBillingData";
import {
  OUTCOME_PACKAGES,
  buildOutcomeUpgradePrompts,
  getPromptPackages,
} from "@/lib/billing/outcome-upgrade";

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

export function BillingView() {
  const {
    subscription,
    invoices,
    usage,
    usageHealth,
    currentPlan,
    loading,
    showUpgradeModal,
    setShowUpgradeModal,
    selectedPlan,
    setSelectedPlan,
    upgrading,
    showCancelModal,
    setShowCancelModal,
    cancelling,
    handleUpgrade,
    handleCancelSubscription,
  } = useBillingData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const recoveredRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const estimatedHoursSaved = Math.round(Math.max(1, usage.proposalsUsed) * 0.7);
  const suggestedPlan = BILLING_PLANS.find((plan) => plan.id === "pro_monthly") || BILLING_PLANS[1];
  const unpaidInvoices = invoices.filter((invoice) => invoice.status !== "paid");
  const pendingFollowUps = invoices.filter((invoice) => invoice.status === "pending").length;

  const upgradePrompts = buildOutcomeUpgradePrompts({
    currentPlanId: currentPlan.id,
    usageHealth: {
      clientsPct: usageHealth.clientsPct,
      proposalsPct: usageHealth.proposalsPct,
      aiPct: usageHealth.aiPct,
    },
    usage: {
      clientsUsed: usage.clientsUsed,
      proposalsUsed: usage.proposalsUsed,
      aiRequestsUsed: usage.aiRequestsUsed,
    },
    recoveredRevenueInr: recoveredRevenue,
    unpaidInvoiceCount: unpaidInvoices.length,
    pendingFollowUps,
  });

  const directPackages = getPromptPackages(upgradePrompts);
  const recommendedPackages = directPackages.length > 0 ? directPackages : Object.values(OUTCOME_PACKAGES);

  return (
    <motion.div
      className="space-y-8 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Billing</span>
            <h1 className="text-4xl font-serif text-secondary dark:text-white leading-tight">Billing & Invoices</h1>
            <p className="text-text-muted mt-1 text-sm font-medium">Outcome-driven plans for growth-focused tour operators.</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.08 }}
      >
        <div className="lg:col-span-2 space-y-4">
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
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Plan
                  </GlassButton>
                )}
                {currentPlan.id !== "enterprise" && (
                  <GlassButton
                    variant="primary"
                    className="rounded-2xl shadow-lg shadow-primary/20"
                    onClick={() => {
                      setSelectedPlan("pro_annual");
                      setShowUpgradeModal(true);
                    }}
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
                    {usage.clientsUsed}/{currentPlan.limits.clients === -1 ? "∞" : currentPlan.limits.clients}
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
                    {usage.proposalsUsed}/{currentPlan.limits.proposals === -1 ? "∞" : currentPlan.limits.proposals}
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
                  onClick={() => {
                    setSelectedPlan("pro_monthly");
                    setShowUpgradeModal(true);
                  }}
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
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.1 }}
      >
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
                        onClick={() => {
                          setSelectedPlan(prompt.recommended_plan_id);
                          setShowUpgradeModal(true);
                        }}
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
      </motion.div>

      <motion.div
        className="space-y-6"

        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
      >
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
                      {plan.price === 0 ? "Free" : `₹${(plan.price / (plan.id.includes("annual") ? 12 : 1)).toLocaleString()}`}
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
                      <li key={outcome} className="text-xs font-semibold text-secondary">• {outcome}</li>
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
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setShowUpgradeModal(true);
                  }}
                >
                  {isCurrentPlan ? "Current Plan" : "Choose Plan"}
                </GlassButton>
              </GlassCard>
            );
          })}
        </div>

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
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.16 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-secondary dark:text-white">Billing History</h2>
          <GlassButton variant="ghost" size="sm" className="rounded-xl h-9">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </GlassButton>
        </div>

        <GlassCard padding="none" className="overflow-hidden border-gray-100">
          {invoices.length === 0 ? (
            <div className="text-center py-24 px-6">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gray-100">
                <FileText className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-xl font-serif text-secondary">No Invoices Yet</h3>
              <p className="text-text-secondary mt-2 text-sm max-w-xs mx-auto">Your invoice history will appear here once you make a payment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Transaction ID</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Timestamp</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="group hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-secondary">INV-{invoice.id.slice(0, 8).toUpperCase()}</span>
                          <span className="text-[10px] text-text-muted font-medium">{invoice.clients?.email || "System Payment"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-text-secondary">{formatDate(invoice.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-secondary">{formatCurrency(invoice.amount, invoice.currency)}</span>
                          <span className="text-[9px] text-text-muted font-bold uppercase tracking-tighter">
                            {invoice.cgst > 0 || invoice.sgst > 0 || invoice.igst > 0
                              ? `CGST: ₹${invoice.cgst} | SGST: ₹${invoice.sgst}${invoice.igst > 0 ? ` | IGST: ₹${invoice.igst}` : ""}`
                              : "Incl. GST"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {invoice.status === "paid" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-600">Verified</span>
                        ) : invoice.status === "pending" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-600">Pending</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-100 text-[9px] font-black uppercase tracking-widest text-rose-600">Overdue</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-xl bg-white border border-gray-100 hover:border-primary hover:text-primary transition-all shadow-sm">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {showUpgradeModal ? (
        <GlassModal isOpen={showUpgradeModal} onClose={() => !upgrading && setShowUpgradeModal(false)} title="Upgrade Plan">
          <div className="space-y-6">
            <div className="p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl">
              <p className="text-sm font-medium text-text-secondary leading-relaxed">
                {selectedPlan
                  ? `Upgrading to ${getPlanById(selectedPlan).name}. Expect faster proposal throughput and stronger recovery workflows.`
                  : "Select a plan to upgrade to:"}
              </p>
            </div>

            {selectedPlan ? (
              <GlassCard padding="lg" className="border-primary/20 bg-white shadow-sm overflow-hidden relative">
                <h3 className="text-2xl font-serif text-secondary dark:text-white uppercase tracking-tight">{getPlanById(selectedPlan).name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-primary">{getPlanById(selectedPlan).priceLabel.split("/")[0]}</span>
                  <span className="text-text-muted text-xs font-bold uppercase">/{getPlanById(selectedPlan).priceLabel.split("/")[1] || "access"}</span>
                </div>
                <ul className="mt-4 space-y-1">
                  {getPlanById(selectedPlan).outcomes.map((outcome) => (
                    <li key={outcome} className="text-xs font-semibold text-secondary">• {outcome}</li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}

            <div className="flex gap-4">
              <GlassButton
                variant="ghost"
                className="flex-1 rounded-2xl font-bold text-xs uppercase tracking-widest"
                onClick={() => setShowUpgradeModal(false)}
                disabled={upgrading}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                className="flex-[2] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                onClick={() => selectedPlan && handleUpgrade(selectedPlan)}
                disabled={!selectedPlan || upgrading}
              >
                {upgrading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Confirm Upgrade"
                )}
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      ) : null}

      {showCancelModal ? (
        <GlassModal isOpen={showCancelModal} onClose={() => !cancelling && setShowCancelModal(false)} title="Cancel Subscription">
          <div className="space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-sm font-medium text-rose-700 leading-relaxed">
                Are you sure you want to cancel? You&apos;ll retain access until the end of your current billing period.
              </p>
            </div>

            {subscription ? (
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block mb-1">Access Until</span>
                  <span className="text-sm font-bold text-secondary">{formatDate(subscription.current_period_end)}</span>
                </div>
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
            ) : null}

            <div className="flex gap-4 pt-2">
              <GlassButton
                variant="primary"
                className="flex-[2] rounded-2xl font-black text-xs uppercase tracking-widest"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Plan
              </GlassButton>
              <GlassButton
                variant="ghost"
                className="flex-1 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-widest"
                onClick={() => void handleCancelSubscription()}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yes, Cancel"}
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      ) : null}

      {currentPlan.id === "free" ? (
        <GlassCard padding="lg" className="border-primary/30 bg-primary/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Unlock with Pro</p>
              <p className="text-sm text-secondary font-semibold mt-1">Interactive proposal analytics and revenue-risk action queue are Pro features.</p>
            </div>
            <GlassButton
              className="rounded-xl"
              onClick={() => {
                setSelectedPlan(suggestedPlan.id);
                setShowUpgradeModal(true);
              }}
            >
              Upgrade to Pro
            </GlassButton>
          </div>
        </GlassCard>
      ) : null}
    </motion.div>
  );
}
