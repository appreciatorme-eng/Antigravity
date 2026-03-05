"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { GlassCard } from "@/components/glass/GlassCard";
import { formatINRShort } from "@/lib/india/formats";
import { CATEGORY_LABELS } from "../types";
import type { CategoryBreakdown } from "../types";

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const chartData = data.map((d) => ({
    category: CATEGORY_LABELS[d.category] || d.category,
    Cost: d.totalCost,
    Price: d.totalPrice,
    Profit: d.profit,
  }));

  return (
    <GlassCard padding="lg">
      <h3 className="text-lg font-serif text-secondary mb-1">Category Cost vs Price</h3>
      <p className="text-xs text-text-muted mb-4">Which services are most profitable</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8" }} />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(v: number) => formatINRShort(v)}
            width={60}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            formatter={(value: number, name: string) => [formatINRShort(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="Cost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Price" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
