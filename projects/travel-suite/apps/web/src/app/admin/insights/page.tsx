"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { useToast } from "@/components/ui/toast";
import { Bot, RefreshCw, ShieldAlert, Sparkles, TrendingUp, Wallet } from "lucide-react";

type RoiData = {
  roi?: { score: number; estimated_hours_saved: number; estimated_value_created_usd: number };
  performance?: {
    conversion_rate: number;
    proposal_view_rate: number;
    paid_revenue_usd: number;
  };
  recommendations?: string[];
};

type RiskData = {
  summary?: { high_risk: number; medium_risk: number; low_risk: number };
  proposals?: Array<{ proposal_id: string; title: string; risk_level: string; risk_score: number; next_action: string }>;
};

type UpsellData = {
  recommendations?: Array<{
    add_on_id: string;
    name: string;
    score: number;
    conversion_rate: number;
    untapped_revenue_usd: number;
    recommendation: string;
  }>;
};

type CopilotData = {
  queue?: Array<{ id: string; title: string; type: string; priority: number; description: string; href: string }>;
};

type QuoteData = {
  recommended_package?: string;
  packages?: Array<{ name: string; price_usd: number; positioning: string }>;
};

export default function AdminInsightsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roi, setRoi] = useState<RoiData>({});
  const [risk, setRisk] = useState<RiskData>({});
  const [upsell, setUpsell] = useState<UpsellData>({});
  const [copilot, setCopilot] = useState<CopilotData>({});
  const [quote, setQuote] = useState<QuoteData>({});

  const loadInsights = useCallback(
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

        const headers = {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        };

        const [roiRes, riskRes, upsellRes, copilotRes, quoteRes] = await Promise.all([
          fetch("/api/admin/insights/roi?windowDays=30", { headers }),
          fetch("/api/admin/insights/proposal-risk?limit=8", { headers }),
          fetch("/api/admin/insights/upsell-recommendations?daysBack=90&limit=6", { headers }),
          fetch("/api/admin/insights/ops-copilot?limit=8", { headers }),
          fetch("/api/admin/insights/best-quote", {
            method: "POST",
            headers,
            body: JSON.stringify({ travelerCount: 2, targetMarginPct: 28 }),
          }),
        ]);

        if (!roiRes.ok || !riskRes.ok || !upsellRes.ok || !copilotRes.ok || !quoteRes.ok) {
          throw new Error("Failed to load one or more insight streams");
        }

        const [roiJson, riskJson, upsellJson, copilotJson, quoteJson] = await Promise.all([
          roiRes.json(),
          riskRes.json(),
          upsellRes.json(),
          copilotRes.json(),
          quoteRes.json(),
        ]);

        setRoi(roiJson as RoiData);
        setRisk(riskJson as RiskData);
        setUpsell(upsellJson as UpsellData);
        setCopilot(copilotJson as CopilotData);
        setQuote(quoteJson as QuoteData);

        if (showToast) {
          toast({
            title: "Insights refreshed",
            description: "Latest growth and operations signals are loaded.",
            variant: "success",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load insights";
        setError(message);
        toast({
          title: "Insights unavailable",
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
    void loadInsights(false);
  }, [loadInsights]);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Growth Intelligence
            </span>
          </div>
          <h1 className="text-4xl font-serif text-secondary dark:text-white tracking-tight">
            Insights Copilot
          </h1>
          <p className="text-sm text-text-muted mt-2">
            Monetization, risk, and operations recommendations for tour operators.
          </p>
        </div>
        <GlassButton
          onClick={() => void loadInsights(true)}
          disabled={refreshing}
          className="h-10 rounded-xl gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Insights
        </GlassButton>
      </div>

      {error ? (
        <GlassCard padding="lg" className="border-rose-200 bg-rose-50/30">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-secondary">ROI</h2>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-secondary dark:text-white">
              {loading ? "--" : roi.roi?.score?.toFixed(1) || "0.0"}
            </p>
            <p className="text-xs text-text-muted">
              Conversion {roi.performance?.conversion_rate?.toFixed(1) || "0.0"}% • View rate{" "}
              {roi.performance?.proposal_view_rate?.toFixed(1) || "0.0"}%
            </p>
            <p className="text-xs text-text-muted">
              Hours saved: {roi.roi?.estimated_hours_saved?.toFixed(1) || "0.0"}
            </p>
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-secondary">Upsell Gap</h2>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-secondary dark:text-white">
              {loading
                ? "--"
                : `$${
                    Math.round(
                      (upsell.recommendations || [])
                        .slice(0, 3)
                        .reduce((sum, row) => sum + (row.untapped_revenue_usd || 0), 0)
                    )
                  }`}
            </p>
            <p className="text-xs text-text-muted">Top-3 untapped add-on opportunity (90d)</p>
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-black uppercase tracking-[0.15em] text-secondary">Ops Queue</h2>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-black text-secondary dark:text-white">
              {loading ? "--" : copilot.queue?.length || 0}
            </p>
            <p className="text-xs text-text-muted">Prioritized daily actions generated</p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">
            Proposal Risk Radar
          </h3>
          <div className="space-y-3">
            {(risk.proposals || []).slice(0, 5).map((row) => (
              <div key={row.proposal_id} className="p-3 rounded-xl border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-secondary dark:text-white">{row.title}</p>
                    <p className="text-xs text-text-muted mt-1">{row.next_action}</p>
                  </div>
                  <GlassBadge
                    variant={row.risk_level === "high" ? "danger" : row.risk_level === "medium" ? "warning" : "success"}
                    className="text-[10px] uppercase font-black"
                  >
                    {row.risk_level} {row.risk_score}
                  </GlassBadge>
                </div>
              </div>
            ))}
            {!loading && (risk.proposals || []).length === 0 ? (
              <p className="text-xs text-text-muted">No proposal risk items detected.</p>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-secondary mb-4">
            Best Quote Composer
          </h3>
          <div className="space-y-3">
            {(quote.packages || []).map((pkg) => (
              <div key={pkg.name} className="p-3 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-secondary dark:text-white">{pkg.name}</p>
                    <p className="text-xs text-text-muted mt-1">{pkg.positioning}</p>
                  </div>
                  <span className="text-lg font-black text-secondary dark:text-white">
                    ${Math.round(pkg.price_usd || 0)}
                  </span>
                </div>
              </div>
            ))}
            {!loading && (quote.packages || []).length === 0 ? (
              <p className="text-xs text-text-muted">No quote variants available.</p>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

