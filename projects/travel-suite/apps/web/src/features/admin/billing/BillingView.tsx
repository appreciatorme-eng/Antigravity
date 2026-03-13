"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { BILLING_PLANS } from "./plans";
import { useBillingData } from "./useBillingData";
import {
  OUTCOME_PACKAGES,
  buildOutcomeUpgradePrompts,
  getPromptPackages,
} from "@/lib/billing/outcome-upgrade";
import { BillingPlanSection } from "./BillingPlanSection";
import { BillingUpgradeSection } from "./BillingUpgradeSection";
import { BillingPlanComparison } from "./BillingPlanComparison";
import { BillingHistorySection } from "./BillingHistorySection";
import { BillingModals } from "./BillingModals";

/* ------------------------------------------------------------------ */
/* Animation presets                                                   */
/* ------------------------------------------------------------------ */

const FADE_IN = { opacity: 0, y: 8 } as const;
const FADE_VISIBLE = { opacity: 1, y: 0 } as const;
const EASE = { duration: 0.28, ease: "easeOut" as const };

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BillingView() {
  const {
    subscription,
    invoices,
    usage,
    creditPacks,
    premiumAutomationGate,
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

  const openUpgradeModal = useCallback(
    (planId: string) => {
      setSelectedPlan(planId);
      setShowUpgradeModal(true);
    },
    [setSelectedPlan, setShowUpgradeModal],
  );

  const openCancelModal = useCallback(() => {
    setShowCancelModal(true);
  }, [setShowCancelModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  /* ---- Derived data ---- */

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

  /* ---- Render ---- */

  return (
    <motion.div
      className="space-y-8 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        initial={FADE_IN}
        animate={FADE_VISIBLE}
        transition={{ ...EASE, delay: 0.04 }}
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

      {/* Current Plan + Usage Meter */}
      <motion.div initial={FADE_IN} animate={FADE_VISIBLE} transition={{ ...EASE, delay: 0.08 }}>
        <BillingPlanSection
          currentPlan={currentPlan}
          subscription={subscription}
          usage={usage}
          usageHealth={usageHealth}
          recoveredRevenue={recoveredRevenue}
          estimatedHoursSaved={estimatedHoursSaved}
          onOpenUpgradeModal={openUpgradeModal}
          onOpenCancelModal={openCancelModal}
        />
      </motion.div>

      {/* Upgrade Prompts + Add-on Packages + Credit Packs + Automation Gate */}
      <motion.div className="space-y-6" initial={FADE_IN} animate={FADE_VISIBLE} transition={{ ...EASE, delay: 0.1 }}>
        <BillingUpgradeSection
          upgradePrompts={upgradePrompts}
          recommendedPackages={recommendedPackages}
          creditPacks={creditPacks}
          premiumAutomationGate={premiumAutomationGate}
          onOpenUpgradeModal={openUpgradeModal}
        />
      </motion.div>

      {/* Plan Comparison */}
      <motion.div initial={FADE_IN} animate={FADE_VISIBLE} transition={{ ...EASE, delay: 0.12 }}>
        <BillingPlanComparison
          currentPlan={currentPlan}
          onOpenUpgradeModal={openUpgradeModal}
        />
      </motion.div>

      {/* Billing History */}
      <motion.div initial={FADE_IN} animate={FADE_VISIBLE} transition={{ ...EASE, delay: 0.16 }}>
        <BillingHistorySection invoices={invoices} />
      </motion.div>

      {/* Modals */}
      <BillingModals
        showUpgradeModal={showUpgradeModal}
        selectedPlan={selectedPlan}
        upgrading={upgrading}
        showCancelModal={showCancelModal}
        cancelling={cancelling}
        subscription={subscription}
        onCloseUpgradeModal={() => setShowUpgradeModal(false)}
        onCloseCancelModal={() => setShowCancelModal(false)}
        onConfirmUpgrade={handleUpgrade}
        onConfirmCancel={() => void handleCancelSubscription()}
      />

      {/* Free-plan CTA */}
      {currentPlan.id === "free" ? (
        <GlassCard padding="lg" className="border-primary/30 bg-primary/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Unlock with Pro</p>
              <p className="text-sm text-secondary font-semibold mt-1">Interactive proposal analytics and revenue-risk action queue are Pro features.</p>
            </div>
            <GlassButton
              className="rounded-xl"
              onClick={() => openUpgradeModal(suggestedPlan.id)}
            >
              Upgrade to Pro
            </GlassButton>
          </div>
        </GlassCard>
      ) : null}
    </motion.div>
  );
}
