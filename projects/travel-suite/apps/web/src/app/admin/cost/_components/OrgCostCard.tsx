"use client";

import { GlassCard } from "@/components/glass/GlassCard";
import { Building2 } from "lucide-react";
import type { CostCategory, OrganizationAggregate } from "./types";
import { CATEGORY_LABEL, CATEGORY_COLOR, formatUsd } from "./types";

export interface OrgCostCardProps {
  readonly organizations: readonly OrganizationAggregate[];
}

function CategoryBreakdown({
  category,
  entry,
}: {
  readonly category: CostCategory;
  readonly entry: {
    readonly allowed_requests: number;
    readonly denied_requests: number;
    readonly estimated_cost_usd: number;
    readonly last_daily_spend_usd: number;
    readonly last_plan_cap_usd: number;
  };
}) {
  const cap = entry.last_plan_cap_usd || 0;
  const utilization =
    cap > 0
      ? Math.min(100, (entry.last_daily_spend_usd / cap) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
      <p className={`text-xs font-bold ${CATEGORY_COLOR[category]}`}>
        {CATEGORY_LABEL[category]}
      </p>
      <p className="text-xs text-text-muted">
        Allowed {entry.allowed_requests.toLocaleString("en-US")} ·
        Denied {entry.denied_requests.toLocaleString("en-US")}
      </p>
      <p className="text-xs text-text-muted">
        Spend {formatUsd(entry.estimated_cost_usd)} · Today{" "}
        {formatUsd(entry.last_daily_spend_usd)}
      </p>
      <div>
        <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
          <span>Plan cap</span>
          <span>
            {cap > 0 ? `${utilization.toFixed(0)}%` : "n/a"}
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              utilization >= 85
                ? "bg-rose-500"
                : utilization >= 65
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${utilization}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function OrgCostCard({ organizations }: OrgCostCardProps) {
  return (
    <GlassCard padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-serif text-secondary dark:text-white">
          Tenant Spend Breakdown
        </h2>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-text-muted">
            No metering entries yet for this time range. Cost events appear
            once guarded routes are used.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {organizations.map((organization) => (
            <div
              key={organization.organization_id}
              className="rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-secondary">
                    {organization.organization_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Tier: {organization.tier} · AI monthly:{" "}
                    {organization.ai_monthly_requests.toLocaleString("en-US")}{" "}
                    requests (
                    {formatUsd(organization.ai_monthly_estimated_cost_usd)})
                  </p>
                </div>
                <p className="text-sm font-black text-secondary">
                  Window spend:{" "}
                  {formatUsd(organization.total_estimated_cost_usd)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(CATEGORY_LABEL) as CostCategory[]).map(
                  (category) => (
                    <CategoryBreakdown
                      key={category}
                      category={category}
                      entry={organization.categories[category]}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
