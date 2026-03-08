"use client";

import {
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Filter } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import type { AdminFunnelStage } from "@/features/admin/dashboard/types";

interface FunnelWidgetProps {
  stages: AdminFunnelStage[];
  loading?: boolean;
}

export function FunnelWidget({ stages, loading = false }: FunnelWidgetProps) {
  return (
    <GlassCard padding="xl" className="space-y-5">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-xl font-serif text-secondary dark:text-white">Conversion Funnel</h3>
          <p className="text-sm text-text-muted">From inbound interest to paid bookings.</p>
        </div>
      </div>

      {loading ? (
        <div className="h-[280px] animate-pulse rounded-2xl bg-white/5" />
      ) : stages.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/50">
          No funnel data in the selected range.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.92)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "12px",
                  }}
                  formatter={(value: number, _name, payload) => {
                    const stage = payload?.payload as AdminFunnelStage | undefined;
                    const suffix =
                      typeof stage?.conversionRate === "number"
                        ? ` (${stage.conversionRate.toFixed(1)}% from previous)`
                        : "";
                    return [`${Number(value).toLocaleString("en-IN")}${suffix}`, stage?.label || "Stage"];
                  }}
                />
                <Funnel
                  dataKey="count"
                  data={stages}
                  isAnimationActive
                  stroke="rgba(255,255,255,0.1)"
                  fill="var(--color-primary)"
                >
                  <LabelList
                    position="right"
                    fill="#e2e8f0"
                    stroke="none"
                    dataKey="label"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div
                key={stage.key}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                    {index + 1}. {stage.label}
                  </p>
                  <span className="text-lg font-black text-white tabular-nums">
                    {stage.count.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-white/60">
                  {typeof stage.conversionRate === "number"
                    ? `${stage.conversionRate.toFixed(1)}% conversion from previous stage`
                    : "Entry stage"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
