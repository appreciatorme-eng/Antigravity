"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MapPinned } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import type { AdminDestinationMetric } from "@/features/admin/dashboard/types";

interface TopDestinationsWidgetProps {
  destinations: AdminDestinationMetric[];
  loading?: boolean;
}

export function TopDestinationsWidget({
  destinations,
  loading = false,
}: TopDestinationsWidgetProps) {
  return (
    <GlassCard padding="xl" className="space-y-5">
      <div className="flex items-center gap-2">
        <MapPinned className="h-4 w-4 text-sky-400" />
        <div>
          <h3 className="text-xl font-serif text-secondary dark:text-white">Top Destinations</h3>
          <p className="text-sm text-text-muted">Which destinations are generating the most proposal demand.</p>
        </div>
      </div>

      {loading ? (
        <div className="h-[280px] animate-pulse rounded-2xl bg-white/5" />
      ) : destinations.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/50">
          No destination demand captured in this range.
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={destinations}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 32 }}
            >
              <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="rgba(148,163,184,0.18)" />
              <XAxis type="number" axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.45)" />
              <YAxis
                type="category"
                dataKey="destination"
                axisLine={false}
                tickLine={false}
                stroke="rgba(255,255,255,0.65)"
                width={120}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "12px",
                }}
              />
              <Bar dataKey="count" fill="#38bdf8" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
}
