"use client";

import { useEffect, useState } from "react";
import { FileText, CreditCard, CheckCircle2, AlertCircle, Download, X, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassModal } from "@/components/glass/GlassModal";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { z } from "zod";

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  currency: string;
  status: string;
  due_date: string;
  created_at: string;
  clients?: {
    name: string;
    email: string;
  };
}

const SubscriptionSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  status: z.string(),
  billing_cycle: z.string(),
  amount: z.coerce.number(),
  gst_amount: z.coerce.number(),
  total_amount: z.coerce.number(),
  current_period_end: z.string(),
  cancel_at_period_end: z.boolean(),
});

const InvoiceSchema = z.object({
  id: z.string(),
  amount: z.coerce.number(),
  subtotal: z.coerce.number(),
  cgst: z.coerce.number(),
  sgst: z.coerce.number(),
  igst: z.coerce.number(),
  currency: z.string(),
  status: z.string(),
  due_date: z.string(),
  created_at: z.string(),
  clients: z
    .object({
      name: z.string(),
      email: z.string(),
    })
    .optional(),
});

const SubscriptionResponseSchema = z.object({
  subscription: SubscriptionSchema.nullish(),
});

const InvoicesResponseSchema = z.object({
  invoices: z.array(InvoiceSchema).default([]),
});

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "Free",
    features: [
      "Up to 10 clients",
      "5 proposals per month",
      "Basic email support",
      "Community access",
    ],
    limits: {
      clients: 10,
      proposals: 5,
      users: 1,
    },
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: 4999,
    priceLabel: "₹4,999/month",
    gstLabel: "+ ₹900 GST",
    features: [
      "Unlimited clients",
      "Unlimited proposals",
      "Interactive proposal system",
      "Priority support",
      "Advanced analytics",
      "WhatsApp integration",
    ],
    popular: true,
    limits: {
      clients: -1, // unlimited
      proposals: -1,
      users: 5,
    },
  },
  {
    id: "pro_annual",
    name: "Pro Annual",
    price: 49990,
    priceLabel: "₹49,990/year",
    gstLabel: "+ ₹8,998 GST",
    savings: "Save ₹9,990 (2 months free)",
    features: [
      "Everything in Pro Monthly",
      "2 months free",
      "Annual billing discount",
      "Dedicated account manager",
    ],
    limits: {
      clients: -1,
      proposals: -1,
      users: 10,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 15000,
    priceLabel: "Custom",
    features: [
      "Unlimited everything",
      "White-label branding",
      "Custom integrations",
      "SLA guarantees",
      "Dedicated success team",
      "On-premise deployment option",
    ],
    limits: {
      clients: -1,
      proposals: -1,
      users: -1,
    },
  },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load current subscription
      const subRes = await fetch("/api/subscriptions");
      if (subRes.ok) {
        const subData = await subRes.json();
        const parsed = SubscriptionResponseSchema.safeParse(subData);
        if (parsed.success) {
          setSubscription((parsed.data.subscription as Subscription | null) || null);
        } else {
          console.error("Invalid subscriptions payload:", parsed.error.flatten());
        }
      }

      // Load invoices
      const invRes = await fetch("/api/invoices?limit=10");
      if (invRes.ok) {
        const invData = await invRes.json();
        const parsed = InvoicesResponseSchema.safeParse(invData);
        if (parsed.success) {
          setInvoices(parsed.data.invoices as Invoice[]);
        } else {
          console.error("Invalid invoices payload:", parsed.error.flatten());
        }
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(true);
    try {
      const billingCycle = planId.includes("annual") ? "annual" : "monthly";

      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle,
        }),
      });

      if (response.ok) {
        await loadData();
        setShowUpgradeModal(false);
        setSelectedPlan(null);
        toast({
          title: "Subscription updated",
          description: "Your plan has been updated successfully.",
          variant: "success",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Upgrade failed",
          description: `Failed to upgrade: ${error.error}`,
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      toast({
        title: "Upgrade failed",
        description: "Failed to upgrade subscription. Please try again.",
        variant: "error",
      });
    } finally {
      setUpgrading(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancel_at_period_end: true,
        }),
      });

      if (response.ok) {
        await loadData();
        setShowCancelModal(false);
        toast({
          title: "Cancellation scheduled",
          description: "Subscription will cancel at the end of the current period.",
          variant: "success",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Cancellation failed",
          description: `Failed to cancel: ${error.error}`,
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Cancellation failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "error",
      });
    } finally {
      setCancelling(false);
    }
  }

  function getCurrentPlan() {
    if (!subscription) return plans[0]; // Free plan
    return plans.find((p) => p.id === subscription.plan_id) || plans[0];
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatCurrency(amount: number, currency: string = "INR") {
    if (currency === "INR") {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
    return `$${amount.toLocaleString("en-US")}`;
  }

  const currentPlan = getCurrentPlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">
            Billing
          </span>
          <h1 className="text-3xl font-serif text-secondary dark:text-white">
            Billing & Subscriptions
          </h1>
          <p className="text-text-secondary mt-1">
            Manage your subscription and view invoice history
          </p>
        </div>
      </div>

      {/* Current Plan Card */}
      <GlassCard padding="lg" rounded="2xl" className="border-primary/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif text-secondary dark:text-white">
                Current Plan: {currentPlan.name}
              </h2>
              <GlassBadge variant="primary" size="sm">
                Active
              </GlassBadge>
            </div>
            <p className="text-2xl font-semibold text-primary mt-2">
              {currentPlan.priceLabel}
            </p>
            {currentPlan.gstLabel && (
              <p className="text-sm text-text-secondary mt-1">
                {currentPlan.gstLabel} (18% GST)
              </p>
            )}
            {subscription && (
              <div className="mt-4 space-y-1 text-sm text-text-secondary">
                <p>
                  Billing cycle:{" "}
                  <span className="text-secondary dark:text-white capitalize">
                    {subscription.billing_cycle}
                  </span>
                </p>
                <p>
                  Next billing date:{" "}
                  <span className="text-secondary dark:text-white">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </p>
                {subscription.cancel_at_period_end && (
                  <p className="text-red-600 dark:text-red-400 font-semibold">
                    ⚠️ Subscription will cancel on{" "}
                    {formatDate(subscription.current_period_end)}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {subscription && !subscription.cancel_at_period_end && (
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Plan
              </GlassButton>
            )}
            {currentPlan.id !== "enterprise" && (
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
              >
                Upgrade Plan
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-serif text-secondary dark:text-white mb-4">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id;
            return (
              <GlassCard
                key={plan.id}
                padding="lg"
                rounded="2xl"
                className={
                  isCurrentPlan
                    ? "border-primary/50"
                    : plan.popular
                    ? "border-primary/30"
                    : ""
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-serif text-secondary dark:text-white">
                    {plan.name}
                  </h3>
                  {isCurrentPlan && (
                    <GlassBadge variant="primary" size="sm">
                      Current
                    </GlassBadge>
                  )}
                  {plan.popular && !isCurrentPlan && (
                    <GlassBadge variant="success" size="sm">
                      Popular
                    </GlassBadge>
                  )}
                </div>
                <p className="text-2xl font-semibold text-secondary dark:text-white">
                  {plan.priceLabel}
                </p>
                {plan.gstLabel && (
                  <p className="text-xs text-text-secondary mt-1">{plan.gstLabel}</p>
                )}
                {plan.savings && (
                  <p className="text-sm text-primary font-semibold mt-1">
                    {plan.savings}
                  </p>
                )}
                <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <GlassButton
                  variant={isCurrentPlan ? "ghost" : "primary"}
                  fullWidth
                  className="mt-6"
                  disabled={isCurrentPlan}
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setShowUpgradeModal(true);
                  }}
                >
                  {isCurrentPlan ? "Current Plan" : "Select Plan"}
                </GlassButton>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <GlassCard padding="lg" rounded="2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif text-secondary dark:text-white">
            Invoice History
          </h2>
          <GlassButton variant="ghost" size="sm">
            <CreditCard className="w-4 h-4" />
            Update payment method
          </GlassButton>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
            <p className="text-sm mt-1">
              Invoices will appear here after your first payment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 dark:bg-white/5 px-4 py-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-secondary dark:text-white">
                    Invoice #{invoice.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(invoice.created_at)}
                    {invoice.clients && ` • ${invoice.clients.name}`}
                  </p>
                  {/* GST Breakdown */}
                  <div className="text-xs text-text-secondary mt-1">
                    Subtotal: {formatCurrency(invoice.subtotal || 0, invoice.currency)}
                    {invoice.cgst > 0 && (
                      <span className="ml-2">
                        CGST: {formatCurrency(invoice.cgst, invoice.currency)}
                      </span>
                    )}
                    {invoice.sgst > 0 && (
                      <span className="ml-2">
                        SGST: {formatCurrency(invoice.sgst, invoice.currency)}
                      </span>
                    )}
                    {invoice.igst > 0 && (
                      <span className="ml-2">
                        IGST: {formatCurrency(invoice.igst, invoice.currency)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-secondary dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Due: {formatDate(invoice.due_date)}
                    </p>
                  </div>
                  {invoice.status === "paid" ? (
                    <GlassBadge variant="success" size="sm" icon={CheckCircle2}>
                      Paid
                    </GlassBadge>
                  ) : invoice.status === "pending" ? (
                    <GlassBadge variant="warning" size="sm" icon={AlertCircle}>
                      Pending
                    </GlassBadge>
                  ) : (
                    <GlassBadge variant="danger" size="sm" icon={AlertCircle}>
                      Overdue
                    </GlassBadge>
                  )}
                  <GlassButton variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <GlassModal
          isOpen={showUpgradeModal}
          onClose={() => !upgrading && setShowUpgradeModal(false)}
          title="Upgrade Subscription"
        >
          <div className="space-y-4">
            <p className="text-text-secondary">
              {selectedPlan
                ? `Upgrade to ${plans.find((p) => p.id === selectedPlan)?.name} plan?`
                : "Select a plan to upgrade to:"}
            </p>

            {selectedPlan && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                {plans
                  .filter((p) => p.id === selectedPlan)
                  .map((plan) => (
                    <div key={plan.id}>
                      <h3 className="font-semibold text-secondary dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-xl font-bold text-primary mt-1">
                        {plan.priceLabel}
                      </p>
                      {plan.gstLabel && (
                        <p className="text-sm text-text-secondary">{plan.gstLabel}</p>
                      )}
                      {plan.savings && (
                        <p className="text-sm text-primary font-semibold mt-1">
                          {plan.savings}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <GlassButton
                variant="ghost"
                fullWidth
                onClick={() => setShowUpgradeModal(false)}
                disabled={upgrading}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                fullWidth
                onClick={() => selectedPlan && handleUpgrade(selectedPlan)}
                disabled={!selectedPlan || upgrading}
              >
                {upgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  "Confirm Upgrade"
                )}
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <GlassModal
          isOpen={showCancelModal}
          onClose={() => !cancelling && setShowCancelModal(false)}
          title="Cancel Subscription"
        >
          <div className="space-y-4">
            <p className="text-text-secondary">
              Are you sure you want to cancel your subscription? You'll continue to have
              access until the end of your current billing period.
            </p>
            {subscription && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-sm text-text-secondary">
                  Your subscription will end on:{" "}
                  <span className="font-semibold text-secondary dark:text-white">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <GlassButton
                variant="ghost"
                fullWidth
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Subscription
              </GlassButton>
              <GlassButton
                variant="danger"
                fullWidth
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
