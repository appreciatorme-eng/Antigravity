"use client";

import { useEffect, useState } from "react";
import { FileText, CreditCard, CheckCircle2, AlertCircle, Download, X, Loader2, Search } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassModal } from "@/components/glass/GlassModal";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">Billing</span>
            <h1 className="text-4xl font-serif text-secondary dark:text-white leading-tight">
              Billing & Invoices
            </h1>
            <p className="text-text-muted mt-1 text-sm font-medium">
              Manage your subscription and billing history.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="lg:col-span-2">
          <GlassCard padding="lg" className="h-full border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                    Current Plan
                  </div>
                  <h2 className="text-3xl font-serif text-secondary dark:text-white uppercase tracking-tight">
                    {currentPlan.name}
                  </h2>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-secondary">{currentPlan.priceLabel.split('/')[0]}</span>
                  <span className="text-text-muted text-sm font-medium">/{currentPlan.priceLabel.split('/')[1] || 'access'}</span>
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
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    Upgrade Plan
                  </GlassButton>
                )}
              </div>
            </div>

            {subscription?.cancel_at_period_end && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <p className="text-sm text-rose-700 font-medium">
                  Cancellation scheduled. Access continues until <span className="font-bold">{formatDate(subscription.current_period_end)}</span>.
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Quick Stats/Links */}
        <div className="space-y-4">
          <GlassCard padding="lg" className="border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">System Status</span>
                <span className="text-sm font-bold text-secondary">Active</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Client Seats</span>
                <span className="font-bold text-secondary">
                  {currentPlan.limits.clients === -1 ? '∞' : currentPlan.limits.clients} Available
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                <div className="h-full bg-primary w-1/3 rounded-full" />
              </div>
            </div>
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

      {/* Available Plans */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-secondary dark:text-white">
            Available Plans
          </h2>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Monthly</span>
            <div className="w-10 h-5 rounded-full bg-primary/20 border border-primary/30 relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full" />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Annual</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
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
                {plan.popular && (
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif text-secondary dark:text-white">
                    {plan.name}
                  </h3>
                  {isCurrentPlan ? (
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[8px] font-black uppercase tracking-widest text-primary">Active</span>
                  ) : plan.popular && (
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-100 border border-indigo-200 text-[8px] font-black uppercase tracking-widest text-indigo-600">Popular</span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-secondary">
                      {plan.price === 0 ? 'Free' : `₹${(plan.price / (plan.id.includes('annual') ? 12 : 1)).toLocaleString()}`}
                    </span>
                    {plan.price > 0 && <span className="text-text-muted text-xs font-medium">/mo</span>}
                  </div>
                  {plan.savings && (
                    <div className="mt-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 inline-block">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                        {plan.savings}
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs text-text-secondary font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <GlassButton
                  variant={isCurrentPlan ? "ghost" : plan.popular ? "primary" : "secondary"}
                  fullWidth
                  className={cn(
                    "rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]",
                    isCurrentPlan ? "opacity-30" : ""
                  )}
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

      {/* Billing History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-secondary dark:text-white">
            Billing History
          </h2>
          <div className="flex items-center gap-2">
            <GlassButton variant="ghost" size="sm" className="rounded-xl h-9">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </GlassButton>
          </div>
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
                          <span className="text-[10px] text-text-muted font-medium">{invoice.clients?.email || 'System Payment'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-text-secondary">{formatDate(invoice.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-secondary">{formatCurrency(invoice.amount, invoice.currency)}</span>
                          <span className="text-[9px] text-text-muted font-bold uppercase tracking-tighter">
                            {invoice.cgst > 0 || invoice.sgst > 0 || invoice.igst > 0 ? (
                              `CGST: ₹${invoice.cgst} | SGST: ₹${invoice.sgst}${invoice.igst > 0 ? ` | IGST: ₹${invoice.igst}` : ''}`
                            ) : 'Incl. GST'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex">
                          {invoice.status === "paid" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-600">Verified</span>
                          ) : invoice.status === "pending" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-100 text-[9px] font-black uppercase tracking-widest text-amber-600">Pending</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-100 text-[9px] font-black uppercase tracking-widest text-rose-600">Overdue</span>
                          )}
                        </div>
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
      </div>

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <GlassModal
          isOpen={showUpgradeModal}
          onClose={() => !upgrading && setShowUpgradeModal(false)}
          title="Upgrade Plan"
        >
          <div className="space-y-6">
            <div className="p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl">
              <p className="text-sm font-medium text-text-secondary leading-relaxed">
                {selectedPlan
                  ? `Upgrading to ${plans.find((p) => p.id === selectedPlan)?.name} plan. You'll get immediate access to all features.`
                  : "Select a plan to upgrade to:"}
              </p>
            </div>

            {selectedPlan && (
              <GlassCard padding="lg" className="border-primary/20 bg-white shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                {plans
                  .filter((p) => p.id === selectedPlan)
                  .map((plan) => (
                    <div key={plan.id} className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Selected Plan</span>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>
                      <h3 className="text-2xl font-serif text-secondary dark:text-white uppercase tracking-tight">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-black text-primary">
                          {plan.priceLabel.split('/')[0]}
                        </span>
                        <span className="text-text-muted text-xs font-bold uppercase">/{plan.priceLabel.split('/')[1] || 'access'}</span>
                      </div>
                      {plan.savings && (
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{plan.savings}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </GlassCard>
            )}

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
      )}

      {/* Cancel Plan Modal */}
      {showCancelModal && (
        <GlassModal
          isOpen={showCancelModal}
          onClose={() => !cancelling && setShowCancelModal(false)}
          title="Cancel Subscription"
        >
          <div className="space-y-6">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-sm font-medium text-rose-700 leading-relaxed">
                Are you sure you want to cancel? You'll retain access until the end of your current billing period.
              </p>
            </div>

            {subscription && (
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block mb-1">Access Until</span>
                  <span className="text-sm font-bold text-secondary">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
            )}

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
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Yes, Cancel"
                )}
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
