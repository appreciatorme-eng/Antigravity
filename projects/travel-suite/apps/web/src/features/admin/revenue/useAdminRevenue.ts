"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  buildMoMDriverCallouts,
  getLastMonthKeys,
  monthKeyFromDate,
  monthLabel,
  RANGE_TO_MONTHS,
  type DashboardRange,
} from "@/lib/analytics/adapters";
import type { RevenueChartPoint } from "@/components/analytics/RevenueChart";

interface RevenueMetrics {
  mrr: number;
  totalRevenue: number;
  invoiceRevenue: number;
  addonRevenue: number;
  activeSubscriptions: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalClients: number;
}

interface AddOnRevenue {
  id: string;
  name: string;
  category: string;
  total_revenue: number;
  total_sales: number;
  avg_price: number;
}

interface SubscriptionRow {
  total_amount: number | string | null;
  billing_cycle: string | null;
}

interface InvoiceRow {
  total_amount: number | string | null;
  status: string | null;
  created_at: string | null;
}

interface AddOnRelation {
  name: string | null;
  category: string | null;
  organization_id: string;
}

interface AddOnPurchaseRow {
  amount_paid: number | string | null;
  add_on_id: string | null;
  add_ons: AddOnRelation | AddOnRelation[] | null;
}

const EMPTY_METRICS: RevenueMetrics = {
  mrr: 0,
  totalRevenue: 0,
  invoiceRevenue: 0,
  addonRevenue: 0,
  activeSubscriptions: 0,
  totalInvoices: 0,
  paidInvoices: 0,
  pendingInvoices: 0,
  totalClients: 0,
};

function asNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getAddOnMeta(value: AddOnPurchaseRow["add_ons"]): AddOnRelation | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return value;
}

export function useAdminRevenue() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RevenueMetrics>(EMPTY_METRICS);
  const [addonData, setAddonData] = useState<AddOnRevenue[]>([]);
  const [series, setSeries] = useState<RevenueChartPoint[]>([]);
  const [range, setRange] = useState<DashboardRange>("6m");

  const loadData = useCallback(
    async (showRefreshToast = false) => {
      if (showRefreshToast) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error("Unauthorized access");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.organization_id) throw new Error("Unable to resolve organization");

        const orgId = profile.organization_id;
        const purchasedAfter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

        const [subscriptionsResult, invoicesResult, addonsResult, clientsResult] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("total_amount,billing_cycle,status")
            .eq("organization_id", orgId)
            .eq("status", "active"),
          supabase
            .from("invoices")
            .select("total_amount,status,created_at")
            .eq("organization_id", orgId),
          supabase
            .from("client_add_ons")
            .select("amount_paid,add_on_id,add_ons!inner(name,category,organization_id)")
            .eq("status", "confirmed")
            .eq("add_ons.organization_id", orgId)
            .gte("purchased_at", purchasedAfter),
          supabase
            .from("clients")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId),
        ]);

        if (subscriptionsResult.error) throw subscriptionsResult.error;
        if (invoicesResult.error) throw invoicesResult.error;
        if (addonsResult.error) throw addonsResult.error;
        if (clientsResult.error) throw clientsResult.error;

        const subscriptions = (subscriptionsResult.data || []) as SubscriptionRow[];
        const invoices = (invoicesResult.data || []) as InvoiceRow[];
        const addOnPurchases = (addonsResult.data || []) as AddOnPurchaseRow[];

        let mrr = 0;
        let activeSubscriptions = 0;
        for (const subscription of subscriptions) {
          activeSubscriptions += 1;
          const amount = asNumber(subscription.total_amount);
          const billingCycle = (subscription.billing_cycle || "").toLowerCase();
          mrr += billingCycle === "annual" ? amount / 12 : amount;
        }

        let invoiceRevenue = 0;
        let paidInvoices = 0;
        let pendingInvoices = 0;

        const monthKeys = getLastMonthKeys(12);
        const monthMap = new Map(
          monthKeys.map((key) => [
            key,
            {
              monthKey: key,
              label: monthLabel(key),
              revenue: 0,
              bookings: 0,
            },
          ])
        );

        for (const invoice of invoices) {
          const status = (invoice.status || "").toLowerCase();
          const amount = asNumber(invoice.total_amount);

          if (status === "paid") {
            invoiceRevenue += amount;
            paidInvoices += 1;
            const monthKey = monthKeyFromDate(invoice.created_at);
            if (monthKey && monthMap.has(monthKey)) {
              monthMap.get(monthKey)!.revenue += amount;
              monthMap.get(monthKey)!.bookings += 1;
            }
          } else if (status !== "void" && status !== "cancelled") {
            pendingInvoices += 1;
          }
        }

        let addonRevenue = 0;
        const addonMap = new Map<string, AddOnRevenue>();

        for (const purchase of addOnPurchases) {
          const addOnId = purchase.add_on_id;
          const addOnMeta = getAddOnMeta(purchase.add_ons);
          if (!addOnId || !addOnMeta) continue;

          const amount = asNumber(purchase.amount_paid);
          addonRevenue += amount;

          const existing = addonMap.get(addOnId);
          if (existing) {
            existing.total_revenue += amount;
            existing.total_sales += 1;
            existing.avg_price = existing.total_revenue / existing.total_sales;
          } else {
            addonMap.set(addOnId, {
              id: addOnId,
              name: addOnMeta.name || "Unnamed add-on",
              category: addOnMeta.category || "General",
              total_revenue: amount,
              total_sales: 1,
              avg_price: amount,
            });
          }
        }

        setMetrics({
          mrr,
          totalRevenue: mrr + invoiceRevenue + addonRevenue,
          invoiceRevenue,
          addonRevenue,
          activeSubscriptions,
          totalInvoices: invoices.length,
          paidInvoices,
          pendingInvoices,
          totalClients: Number(clientsResult.count || 0),
        });

        setAddonData(Array.from(addonMap.values()).sort((a, b) => b.total_revenue - a.total_revenue));
        setSeries(monthKeys.map((key) => monthMap.get(key)!).filter(Boolean));

        if (showRefreshToast) {
          toast({
            title: "Revenue refreshed",
            description: "Latest financial metrics are loaded.",
            variant: "success",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load revenue dashboard";
        setError(message);
        setMetrics(EMPTY_METRICS);
        setAddonData([]);
        setSeries([]);
        toast({
          title: "Revenue load failed",
          description: message,
          variant: "error",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, toast]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const filteredSeries = useMemo(() => series.slice(-RANGE_TO_MONTHS[range]), [range, series]);

  const drivers = useMemo(
    () => buildMoMDriverCallouts(filteredSeries.map((row) => ({ revenue: row.revenue, bookings: row.bookings }))),
    [filteredSeries]
  );

  return {
    loading,
    refreshing,
    error,
    metrics,
    addonData,
    filteredSeries,
    drivers,
    range,
    setRange,
    reload: () => loadData(true),
  };
}
