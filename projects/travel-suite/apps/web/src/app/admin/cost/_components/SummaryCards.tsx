"use client";

import { GlassCard } from "@/components/glass/GlassCard";
import { formatUsd } from "./types";

export interface SummaryCardsProps {
  readonly totalSpend: number;
  readonly allowedRequests: number;
  readonly deniedRequests: number;
  readonly organizationCount: number;
  readonly windowDays: number;
}

export function SummaryCards({
  totalSpend,
  allowedRequests,
  deniedRequests,
  organizationCount,
  windowDays,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <GlassCard padding="md" className="border-primary/20">
        <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">
          Estimated spend
        </p>
        <p className="text-3xl font-black text-secondary mt-2">
          {formatUsd(totalSpend)}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Window: last {windowDays} days
        </p>
      </GlassCard>
      <GlassCard padding="md">
        <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">
          Allowed requests
        </p>
        <p className="text-3xl font-black text-secondary mt-2">
          {allowedRequests.toLocaleString("en-US")}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Requests served under limits
        </p>
      </GlassCard>
      <GlassCard padding="md">
        <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">
          Denied requests
        </p>
        <p className="text-3xl font-black text-secondary mt-2">
          {deniedRequests.toLocaleString("en-US")}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Rate-limit + spend-cap denials
        </p>
      </GlassCard>
      <GlassCard padding="md">
        <p className="text-[10px] uppercase tracking-[0.14em] font-black text-text-muted">
          Tracked organizations
        </p>
        <p className="text-3xl font-black text-secondary mt-2">
          {organizationCount.toLocaleString("en-US")}
        </p>
        <p className="text-xs text-text-muted mt-1">
          Tenants with cost metering logs
        </p>
      </GlassCard>
    </div>
  );
}
