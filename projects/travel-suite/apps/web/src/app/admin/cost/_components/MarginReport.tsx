"use client";

import { GlassCard } from "@/components/glass/GlassCard";
import { Wallet } from "lucide-react";
import type { WeeklyMarginRow } from "./types";
import { formatUsd, formatInr } from "./types";

export interface MarginReportProps {
  readonly rows: readonly WeeklyMarginRow[];
}

export function MarginReport({ rows }: MarginReportProps) {
  return (
    <GlassCard padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-serif text-secondary dark:text-white">
          Weekly Margin Report (Per Tenant)
        </h2>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-text-muted">
            Weekly tenant margin appears once paid invoices or metered
            provider spend are recorded.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                  Revenue (7d)
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                  Variable COGS
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                  Gross Margin
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                  Cap Denial Rate
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.organization_id}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-secondary">
                      {row.organization_name}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Tier: {row.tier}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-secondary">
                    {formatInr(row.revenue_inr)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-secondary">
                      {formatInr(row.variable_cost_inr)}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {formatUsd(row.variable_cost_usd)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-lg border text-[11px] font-bold ${
                        row.gross_margin_pct < 45
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : row.gross_margin_pct < 60
                            ? "text-amber-700 bg-amber-50 border-amber-200"
                            : "text-emerald-700 bg-emerald-50 border-emerald-200"
                      }`}
                    >
                      {row.gross_margin_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {row.cap_denial_rate_pct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {row.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
