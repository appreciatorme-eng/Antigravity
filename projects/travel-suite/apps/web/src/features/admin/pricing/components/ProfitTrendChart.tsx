"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { GlassCard } from "@/components/glass/GlassCard";
import { formatINRShort } from "@/lib/india/formats";
import type { MonthlyTrendPoint } from "../types";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
];
const MONTH_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface ProfitTrendChartProps {
  data: MonthlyTrendPoint[];
}

export function ProfitTrendChart({ data }: ProfitTrendChartProps) {
  return (
    <GlassCard padding="lg">
      <h3 className="text-lg font-serif text-secondary mb-1">Monthly Profit Trend</h3>
      <p className="text-xs text-text-muted mb-4">Last 6 months gross vs net profit</p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(v: string) => {
              const [y, m] = v.split("-");
              return `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`;
            }}
          />
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
            formatter={(value: number, name: string) => [
              formatINRShort(value),
              name === "grossProfit" ? "Gross Profit" : "Net Profit",
            ]}
            labelFormatter={(label: string) => {
              const [y, m] = label.split("-");
              return `${MONTH_FULL[parseInt(m) - 1]} ${y}`;
            }}
          />
          <Area
            type="monotone"
            dataKey="grossProfit"
            stroke="#10b981"
            fill="url(#grossGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            stroke="#0ea5e9"
            fill="url(#netGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
