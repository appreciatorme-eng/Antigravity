"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { TIERS, type TierName } from "@/lib/billing/tiers";

interface BillingSnapshot {
  current_tier: string;
  subscription: {
    current_period_end: string | null;
    status: string;
  } | null;
  usage: {
    clients_used: number;
    proposals_used: number;
    team_members_used: number;
  };
  limits: {
    clients: number | null;
    proposals: number | null;
    team_members: number | null;
  };
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const percentage = limit === null ? 10 : limit === 0 ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = limit !== null && percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className="text-xs font-semibold text-secondary dark:text-white">
          {used} / {limit === null ? "Unlimited" : limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? "bg-amber-500" : "bg-primary"
          }`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  );
}

export function BillingOverviewTab() {
  const router = useRouter();
  const [data, setData] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/billing/subscription", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload?.data) {
          setData(payload.data as BillingSnapshot);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentTier = (data?.current_tier || "free") as TierName;
  const tier = TIERS[currentTier] || TIERS.free;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-secondary dark:text-white">Billing & Plan</h2>
          <p className="text-sm text-text-secondary mt-0.5">Manage your subscription, view usage, and access invoices.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Current Plan</p>
            <h3 className="mt-1 text-xl font-bold text-secondary dark:text-white">{tier.displayName}</h3>
            {data?.subscription?.current_period_end && (
              <p className="mt-1 text-xs text-text-secondary">
                Next billing: {new Date(data.subscription.current_period_end).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase bg-gradient-to-r ${tier.color} text-white`}>
            {tier.badge || tier.displayName}
          </div>
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Usage This Month</p>
          <UsageBar label="Clients" used={data.usage.clients_used} limit={data.limits.clients} />
          <UsageBar label="Monthly Proposals" used={data.usage.proposals_used} limit={data.limits.proposals} />
          <UsageBar label="Team Members" used={data.usage.team_members_used} limit={data.limits.team_members} />
        </div>
      )}

      <GlassButton
        variant="primary"
        className="w-full"
        onClick={() => router.push("/billing")}
      >
        Manage Plan
        <ArrowRight className="h-4 w-4" />
      </GlassButton>
    </div>
  );
}
