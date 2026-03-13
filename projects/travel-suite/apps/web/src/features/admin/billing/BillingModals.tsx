"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassModal } from "@/components/glass/GlassModal";
import { getPlanById } from "./plans";
import type { Subscription } from "./useBillingData";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface BillingModalsProps {
  showUpgradeModal: boolean;
  selectedPlan: string | null;
  upgrading: boolean;
  showCancelModal: boolean;
  cancelling: boolean;
  subscription: Subscription | null;
  onCloseUpgradeModal: () => void;
  onCloseCancelModal: () => void;
  onConfirmUpgrade: (planId: string) => void;
  onConfirmCancel: () => void;
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

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BillingModals({
  showUpgradeModal,
  selectedPlan,
  upgrading,
  showCancelModal,
  cancelling,
  subscription,
  onCloseUpgradeModal,
  onCloseCancelModal,
  onConfirmUpgrade,
  onConfirmCancel,
}: BillingModalsProps) {
  return (
    <>
      {showUpgradeModal ? (
        <GlassModal isOpen={showUpgradeModal} onClose={() => !upgrading && onCloseUpgradeModal()} title="Upgrade Plan">
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
                    <li key={outcome} className="text-xs font-semibold text-secondary">{"\u2022"} {outcome}</li>
                  ))}
                </ul>
              </GlassCard>
            ) : null}

            <div className="flex gap-4">
              <GlassButton
                variant="ghost"
                className="flex-1 rounded-2xl font-bold text-xs uppercase tracking-widest"
                onClick={onCloseUpgradeModal}
                disabled={upgrading}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                className="flex-[2] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                onClick={() => selectedPlan && onConfirmUpgrade(selectedPlan)}
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
        <GlassModal isOpen={showCancelModal} onClose={() => !cancelling && onCloseCancelModal()} title="Cancel Subscription">
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
                onClick={onCloseCancelModal}
                disabled={cancelling}
              >
                Keep Plan
              </GlassButton>
              <GlassButton
                variant="ghost"
                className="flex-1 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 font-bold text-xs uppercase tracking-widest"
                onClick={onConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yes, Cancel"}
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      ) : null}
    </>
  );
}
