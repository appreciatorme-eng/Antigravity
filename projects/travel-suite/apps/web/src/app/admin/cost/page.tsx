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
} from "lucide-react";
import type {
  CostCategory,
  CostOverviewCacheMeta,
  CostOverviewPayload,
} from "./_components/types";
import { AlertsList } from "./_components/AlertsList";
import { CapEditor } from "./_components/CapEditor";
import { MarginReport } from "./_components/MarginReport";
import { OrgCostCard } from "./_components/OrgCostCard";
import { SummaryCards } from "./_components/SummaryCards";

/* -------------------------------------------------------------------------- */
/*  Cache status helpers                                                      */
/* -------------------------------------------------------------------------- */

function cacheStatusLabel(meta: CostOverviewCacheMeta): string {
  if (meta.status === "hit") return `Cache hit · ${meta.age_seconds}s old`;
  if (meta.status === "stale_fallback")
    return `Stale fallback · ${meta.age_seconds}s old`;
  return "Fresh query";
}

function cacheStatusStyle(meta: CostOverviewCacheMeta): string {
  if (meta.status === "hit") return "text-blue-700 bg-blue-50 border-blue-200";
  if (meta.status === "stale_fallback")
    return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function AdminCostOverviewPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<CostOverviewPayload | null>(null);

  /* ----- data fetching --------------------------------------------------- */

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

        const json = (await response.json()) as CostOverviewPayload & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(json.error || "Failed to load cost overview");
        }

        setPayload(json);

        if (showToast) {
          toast({
            title: "Cost dashboard refreshed",
            description: "Latest spend telemetry loaded.",
            variant: "success",
          });
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load cost telemetry";
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
    [days, supabase, toast],
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  /* ----- derived data ---------------------------------------------------- */

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

  /* ----- callbacks for children ------------------------------------------ */

  const handleCapSaved = useCallback(async () => {
    await loadData(false);
  }, [loadData]);

  const handlePayloadChange = useCallback(
    (
      updater: (
        previous: CostOverviewPayload | null,
      ) => CostOverviewPayload | null,
    ) => {
      setPayload(updater);
    },
    [],
  );

  /* ----- loading state --------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white px-5 py-3 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">
            Loading margin monitor...
          </span>
        </div>
      </div>
    );
  }

  /* ----- error state (no data) ------------------------------------------- */

  if (error && !payload) {
    return (
      <div className="space-y-4">
        <GlassCard padding="lg" className="border-rose-200 bg-rose-50/60">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5" />
            <div className="space-y-2">
              <h1 className="text-xl font-serif text-rose-700">
                Cost guardrail dashboard unavailable
              </h1>
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

  /* ----- derived values from payload ------------------------------------- */

  const alerts = payload?.alerts || [];
  const weeklyMargin = payload?.weekly_margin_report || [];
  const organizations = payload?.organizations || [];
  const cacheMeta = payload?.cache;

  /* ----- main render ----------------------------------------------------- */

  return (
    <div className="space-y-8 pb-16">
      {/* Header + controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-[0.16em] font-black text-primary">
            <Wallet className="w-3.5 h-3.5" />
            Cost guardrails
          </span>
          <h1 className="text-4xl font-serif text-secondary dark:text-white">
            Margin Monitor
          </h1>
          <p className="text-sm text-text-muted">
            Per-tenant spend telemetry, hard-cap controls, and denial trends for
            provider-cost routes.
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
          {cacheMeta ? (
            <span
              className={`h-9 inline-flex items-center px-3 rounded-lg border text-[11px] font-bold ${cacheStatusStyle(cacheMeta)}`}
            >
              {cacheStatusLabel(cacheMeta)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Stale-data warning */}
      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Alerts */}
      <AlertsList alerts={alerts} onPayloadChange={handlePayloadChange} />

      {/* Summary cards */}
      <SummaryCards
        totalSpend={totals.totalSpend}
        allowedRequests={totals.allowedRequests}
        deniedRequests={totals.deniedRequests}
        organizationCount={totals.organizationCount}
        windowDays={payload?.period.days || days}
      />

      {/* Emergency cap controls */}
      {payload ? (
        <CapEditor
          emergencyCapsUsd={payload.emergency_caps_usd}
          onCapSaved={handleCapSaved}
        />
      ) : null}

      {/* Weekly margin report */}
      <MarginReport rows={weeklyMargin} />

      {/* Tenant spend breakdown */}
      <OrgCostCard organizations={organizations} />
    </div>
  );
}
