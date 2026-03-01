"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Wallet,
  BarChart3,
  Building2,
} from "lucide-react";

type CostCategory = "amadeus" | "image_search" | "ai_image";

type CategoryAggregate = {
  allowed_requests: number;
  denied_requests: number;
  estimated_cost_usd: number;
  last_daily_spend_usd: number;
  last_plan_cap_usd: number;
  last_emergency_cap_usd: number;
};

type OrganizationAggregate = {
  organization_id: string;
  organization_name: string;
  tier: string;
  categories: Record<CostCategory, CategoryAggregate>;
  total_estimated_cost_usd: number;
  ai_monthly_requests: number;
  ai_monthly_estimated_cost_usd: number;
};

type CostOverviewPayload = {
  period: {
    days: number;
    since: string;
  };
  emergency_caps_usd: Record<CostCategory, number>;
  organizations: OrganizationAggregate[];
};

const CATEGORY_LABEL: Record<CostCategory, string> = {
  amadeus: "Flights & Hotels API",
  image_search: "Image Search",
  ai_image: "AI Image Generation",
};

const CATEGORY_COLOR: Record<CostCategory, string> = {
  amadeus: "text-blue-600",
  image_search: "text-amber-600",
  ai_image: "text-emerald-600",
};

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function AdminCostOverviewPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CostOverviewPayload | null>(null);
  const [capDrafts, setCapDrafts] = useState<Record<CostCategory, string>>({
    amadeus: "",
    image_search: "",
    ai_image: "",
  });
  const [savingCategory, setSavingCategory] = useState<CostCategory | null>(null);

  const loadData = useCallback(
    async (showToast = false) => {
      setError(null);
      if (showToast) setRefreshing(true);
      else setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Unauthorized");
        }

        const response = await fetch(`/api/admin/cost/overview?days=${days}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const json = (await response.json()) as CostOverviewPayload & { error?: string };
        if (!response.ok) {
          throw new Error(json.error || "Failed to load cost overview");
        }

        setPayload(json);
        setCapDrafts({
          amadeus: String(json.emergency_caps_usd.amadeus.toFixed(2)),
          image_search: String(json.emergency_caps_usd.image_search.toFixed(2)),
          ai_image: String(json.emergency_caps_usd.ai_image.toFixed(2)),
        });

        if (showToast) {
          toast({
            title: "Cost dashboard refreshed",
            description: "Latest spend telemetry loaded.",
            variant: "success",
          });
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load cost telemetry";
        setError(message);
        if (showToast) {
          toast({
            title: "Refresh failed",
            description: message,
            variant: "error",
          });
        }
      } finally {
        if (showToast) setRefreshing(false);
        else setLoading(false);
      }
    },
    [days, supabase, toast]
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const totals = useMemo(() => {
    const organizations = payload?.organizations || [];
    const byCategory: Record<CostCategory, number> = {
      amadeus: 0,
      image_search: 0,
      ai_image: 0,
    };

    let deniedRequests = 0;
    let allowedRequests = 0;
    let totalSpend = 0;

    for (const org of organizations) {
      totalSpend += org.total_estimated_cost_usd;
      for (const category of Object.keys(byCategory) as CostCategory[]) {
        const aggregate = org.categories[category];
        byCategory[category] += aggregate.estimated_cost_usd;
        deniedRequests += aggregate.denied_requests;
        allowedRequests += aggregate.allowed_requests;
      }
    }

    return {
      totalSpend,
      byCategory,
      deniedRequests,
      allowedRequests,
      organizationCount: organizations.length,
    };
  }, [payload]);

  const saveEmergencyCap = useCallback(
    async (category: CostCategory) => {
      const draft = Number(capDrafts[category]);
      if (!Number.isFinite(draft) || draft <= 0) {
        toast({
          title: "Invalid cap",
          description: "Emergency cap must be a positive number.",
          variant: "error",
        });
        return;
      }

      setSavingCategory(category);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Unauthorized");
        }

        const response = await fetch("/api/admin/cost/overview", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            capUsd: draft,
          }),
        });

        const json = (await response.json()) as { category?: string; cap_usd?: number; error?: string };
        if (!response.ok) {
          throw new Error(json.error || "Failed to update emergency cap");
        }

        toast({
          title: "Emergency cap updated",
          description: `${CATEGORY_LABEL[category]} is now capped at ${formatUsd(json.cap_usd || draft)}.`,
          variant: "success",
        });
        await loadData(false);
      } catch (updateError) {
        toast({
          title: "Update failed",
          description: updateError instanceof Error ? updateError.message : "Unable to save cap",
          variant: "error",
        });
      } finally {
        setSavingCategory(null);
      }
    },
    [capDrafts, loadData, supabase, toast]
  );

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white px-5 py-3 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">Loading margin monitor...</span>
        </div>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="space-y-4">
        <GlassCard padding="lg" className="border-rose-200 bg-rose-50/60">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5" />
            <div className="space-y-2">
              <h1 className="text-xl font-serif text-rose-700">Cost guardrail dashboard unavailable</h1>
              <p className="text-sm text-rose-700/90">{error}</p>
            </div>
          </div>
        </GlassCard>
        <GlassButton onClick={() => void loadData(true)} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </GlassButton>
      </div>
    );
  }

  const organizations = payload?.organizations || [];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-[0.16em] font-black text-primary">
            <Wallet className="w-3.5 h-3.5" />
            Cost guardrails
          </span>
          <h1 className="text-4xl font-serif text-secondary dark:text-white">Margin Monitor</h1>
          <p className="text-sm text-text-muted">
            Per-tenant spend telemetry, hard-cap controls, and denial trends for provider-cost routes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={`h-9 px-3 rounded-lg text-xs font-bold border transition-colors ${
                days === range
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-text-muted border-gray-200 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {range}d
            </button>
          ))}
          <GlassButton
            variant="outline"
            className="h-9 rounded-lg"
            onClick={() => void loadData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </GlassButton>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard padding="md" className="border-primary/20">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Estimated spend</p>
          <p className="text-3xl font-black text-secondary mt-2">{formatUsd(totals.totalSpend)}</p>
          <p className="text-xs text-text-muted mt-1">Window: last {payload?.period.days || days} days</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Allowed requests</p>
          <p className="text-3xl font-black text-secondary mt-2">{totals.allowedRequests.toLocaleString("en-US")}</p>
          <p className="text-xs text-text-muted mt-1">Requests served under limits</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Denied requests</p>
          <p className="text-3xl font-black text-secondary mt-2">{totals.deniedRequests.toLocaleString("en-US")}</p>
          <p className="text-xs text-text-muted mt-1">Rate-limit + spend-cap denials</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">Tracked organizations</p>
          <p className="text-3xl font-black text-secondary mt-2">{totals.organizationCount.toLocaleString("en-US")}</p>
          <p className="text-xs text-text-muted mt-1">Tenants with cost metering logs</p>
        </GlassCard>
      </div>

      <GlassCard padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-serif text-secondary dark:text-white">Emergency Cap Controls</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(CATEGORY_LABEL) as CostCategory[]).map((category) => (
            <div key={category} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div>
                <p className={`text-sm font-bold ${CATEGORY_COLOR[category]}`}>{CATEGORY_LABEL[category]}</p>
                <p className="text-xs text-text-muted">
                  Current cap: {formatUsd(payload?.emergency_caps_usd[category] || 0)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={capDrafts[category]}
                  onChange={(event) =>
                    setCapDrafts((previous) => ({
                      ...previous,
                      [category]: event.target.value,
                    }))
                  }
                  className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
                <GlassButton
                  className="h-9 rounded-lg px-3"
                  disabled={savingCategory === category}
                  onClick={() => void saveEmergencyCap(category)}
                >
                  {savingCategory === category ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </GlassButton>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-serif text-secondary dark:text-white">Tenant Spend Breakdown</h2>
        </div>

        {organizations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
            <p className="text-sm text-text-muted">
              No metering entries yet for this time range. Cost events appear once guarded routes are used.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((organization) => (
              <div key={organization.organization_id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-secondary">{organization.organization_name}</p>
                    <p className="text-xs text-text-muted">
                      Tier: {organization.tier} · AI monthly: {" "}
                      {organization.ai_monthly_requests.toLocaleString("en-US")} requests ({formatUsd(
                        organization.ai_monthly_estimated_cost_usd
                      )})
                    </p>
                  </div>
                  <p className="text-sm font-black text-secondary">
                    Window spend: {formatUsd(organization.total_estimated_cost_usd)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.keys(CATEGORY_LABEL) as CostCategory[]).map((category) => {
                    const entry = organization.categories[category];
                    const cap = entry.last_plan_cap_usd || 0;
                    const utilization = cap > 0 ? Math.min(100, (entry.last_daily_spend_usd / cap) * 100) : 0;
                    return (
                      <div key={category} className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                        <p className={`text-xs font-bold ${CATEGORY_COLOR[category]}`}>{CATEGORY_LABEL[category]}</p>
                        <p className="text-xs text-text-muted">
                          Allowed {entry.allowed_requests.toLocaleString("en-US")} · Denied{" "}
                          {entry.denied_requests.toLocaleString("en-US")}
                        </p>
                        <p className="text-xs text-text-muted">
                          Spend {formatUsd(entry.estimated_cost_usd)} · Today {formatUsd(entry.last_daily_spend_usd)}
                        </p>
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                            <span>Plan cap</span>
                            <span>{cap > 0 ? `${utilization.toFixed(0)}%` : "n/a"}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                utilization >= 85 ? "bg-rose-500" : utilization >= 65 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
