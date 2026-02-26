"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { getPlanById } from "./plans";

export interface Subscription {
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

export interface Invoice {
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

interface AiUsageResponse {
  usage?: { ai_requests?: number };
  utilization?: { requests_pct?: number; spend_pct?: number };
}

interface BillingUsage {
  clientsUsed: number;
  proposalsUsed: number;
  aiRequestsUsed: number;
  aiUtilizationPct: number;
}

const EMPTY_USAGE: BillingUsage = {
  clientsUsed: 0,
  proposalsUsed: 0,
  aiRequestsUsed: 0,
  aiUtilizationPct: 0,
};

function asNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function useBillingData() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<BillingUsage>(EMPTY_USAGE);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([fetch("/api/subscriptions"), fetch("/api/invoices?limit=10")]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription((subData?.subscription as Subscription | null) || null);
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices((invData?.invoices || []) as Invoice[]);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        const orgId = profile?.organization_id;
        if (orgId) {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const [clientsRes, proposalsRes] = await Promise.all([
            supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
            supabase
              .from("proposals")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", orgId)
              .gte("created_at", monthStart.toISOString()),
          ]);

          let aiRequestsUsed = 0;
          let aiUtilizationPct = 0;

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.access_token) {
            const usageRes = await fetch("/api/admin/insights/ai-usage", {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (usageRes.ok) {
              const usageJson = (await usageRes.json()) as AiUsageResponse;
              aiRequestsUsed = asNumber(usageJson.usage?.ai_requests);
              aiUtilizationPct = Math.max(
                asNumber(usageJson.utilization?.requests_pct),
                asNumber(usageJson.utilization?.spend_pct)
              );
            }
          }

          setUsage({
            clientsUsed: Number(clientsRes.count || 0),
            proposalsUsed: Number(proposalsRes.count || 0),
            aiRequestsUsed,
            aiUtilizationPct,
          });
        }
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentPlan = useMemo(() => getPlanById(subscription?.plan_id), [subscription?.plan_id]);

  const usageHealth = useMemo(() => {
    const clientsPct = currentPlan.limits.clients > 0 ? (usage.clientsUsed / currentPlan.limits.clients) * 100 : 0;
    const proposalsPct = currentPlan.limits.proposals > 0 ? (usage.proposalsUsed / currentPlan.limits.proposals) * 100 : 0;
    const aiPct = currentPlan.limits.aiRequests && currentPlan.limits.aiRequests > 0
      ? (usage.aiRequestsUsed / currentPlan.limits.aiRequests) * 100
      : usage.aiUtilizationPct;

    return {
      clientsPct: Math.min(100, Math.max(0, clientsPct)),
      proposalsPct: Math.min(100, Math.max(0, proposalsPct)),
      aiPct: Math.min(100, Math.max(0, aiPct)),
      nearingLimit: Math.max(clientsPct, proposalsPct, aiPct) >= 80,
    };
  }, [currentPlan.limits.aiRequests, currentPlan.limits.clients, currentPlan.limits.proposals, usage]);

  const handleUpgrade = useCallback(
    async (planId: string) => {
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

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to upgrade subscription");
        }

        await loadData();
        setShowUpgradeModal(false);
        setSelectedPlan(null);
        toast({
          title: "Subscription updated",
          description: "Your plan has been updated successfully.",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Upgrade failed",
          description: error instanceof Error ? error.message : "Failed to upgrade subscription.",
          variant: "error",
        });
      } finally {
        setUpgrading(false);
      }
    },
    [loadData, toast]
  );

  const handleCancelSubscription = useCallback(async () => {
    setCancelling(true);
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_at_period_end: true }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to cancel subscription");
      }

      await loadData();
      setShowCancelModal(false);
      toast({
        title: "Cancellation scheduled",
        description: "Subscription will cancel at the end of the current period.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Cancellation failed",
        description: error instanceof Error ? error.message : "Failed to cancel subscription.",
        variant: "error",
      });
    } finally {
      setCancelling(false);
    }
  }, [loadData, toast]);

  return {
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
  };
}
