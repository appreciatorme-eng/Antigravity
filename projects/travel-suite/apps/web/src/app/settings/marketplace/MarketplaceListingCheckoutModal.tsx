"use client";

import { Loader2 } from "lucide-react";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassModal } from "@/components/glass/GlassModal";
import {
  formatMarketplaceListingPrice,
  type MarketplaceListingPlan,
} from "@/lib/marketplace-listing-plans";

type MarketplaceListingCheckoutModalProps = {
  isOpen: boolean;
  selectedPlan: MarketplaceListingPlan | null;
  submitting: boolean;
  checkoutEnabled: boolean;
  publicKey?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function MarketplaceListingCheckoutModal({
  isOpen,
  selectedPlan,
  submitting,
  checkoutEnabled,
  publicKey,
  onClose,
  onConfirm,
}: MarketplaceListingCheckoutModalProps) {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedPlan ? `Upgrade to ${selectedPlan.name}` : "Upgrade Listing"}
      description="Marketplace listing upgrades are billed monthly and applied only when your listing clears the quality floor."
    >
      {selectedPlan ? (
        <div className="space-y-5">
          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600 dark:text-white/60">Selected plan</p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {selectedPlan.name}
                </h3>
              </div>
              <GlassBadge variant="primary">{selectedPlan.badge}</GlassBadge>
            </div>
            <p className="text-sm text-slate-700 dark:text-white/75">
              {selectedPlan.description}
            </p>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-3">
              <p className="text-sm text-slate-600 dark:text-white/60">Monthly charge</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {formatMarketplaceListingPrice(selectedPlan.pricePaise)}
              </p>
            </div>
          </GlassCard>

          {!checkoutEnabled || !publicKey ? (
            <GlassCard className="border-amber-200 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-sm text-slate-700 dark:text-white/80">
                Checkout is not configured for this workspace yet. Add Razorpay keys before
                enabling paid listing purchases.
              </p>
            </GlassCard>
          ) : null}

          <div className="flex justify-end gap-3">
            <GlassButton
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={() => void onConfirm()}
              disabled={submitting || !checkoutEnabled || !publicKey}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Proceed to checkout
            </GlassButton>
          </div>
        </div>
      ) : null}
    </GlassModal>
  );
}
