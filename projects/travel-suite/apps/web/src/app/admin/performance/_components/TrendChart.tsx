"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { OperatorScorecardPayload } from "@/lib/admin/operator-scorecard";

export type TrendMetricMode = "revenue" | "approvalRate" | "paymentConversion";

export interface TrendChartPoint {
  monthKey: string;
  label: string;
  revenue: number;
  approvalRate: number;
  paymentConversion: number;
}

interface TrendChartProps {
  data: OperatorScorecardPayload[];
  metric: TrendMetricMode;
  loading?: boolean;
}

function formatAxisValue(value: number, mode: TrendMetricMode): string {
  if (mode === "revenue") {
    if (value >= 100000) return `₹${Math.round(value / 1000)}k`;
    return `₹${Math.round(value)}`;
  }
  return `${Math.round(value)}%`;
}

function formatTooltipValue(value: number, mode: TrendMetricMode): string {
  if (mode === "revenue") {
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `${value.toFixed(1)}%`;
}

function getMetricLabel(mode: TrendMetricMode): string {
  if (mode === "revenue") return "Revenue";
  if (mode === "approvalRate") return "Approval Rate";
  return "Payment Conversion";
}

function getMetricColor(mode: TrendMetricMode): string {
  if (mode === "revenue") return "var(--color-primary)";
  if (mode === "approvalRate") return "#3b82f6";
  return "#10b981";
}

function getGradientId(mode: TrendMetricMode): string {
  if (mode === "revenue") return "trendRevenueGradient";
  if (mode === "approvalRate") return "trendApprovalGradient";
  return "trendPaymentGradient";
}

export function TrendChart({ data, metric, loading = false }: TrendChartProps) {
  const chartData = useMemo<TrendChartPoint[]>(
    () =>
      data.map((scorecard) => ({
        monthKey: scorecard.monthKey,
        label: scorecard.monthLabel,
        revenue: scorecard.metrics.revenueInr,
        approvalRate: scorecard.metrics.approvalRate,
        paymentConversion: scorecard.metrics.paymentConversionRate,
      })),
    [data],
  );

  const metricColor = getMetricColor(metric);
  const gradientId = getGradientId(metric);
  const metricLabel = getMetricLabel(metric);

  if (loading) {
    return <div className="h-[300px] w-full mt-4 rounded-2xl bg-gray-50/80 animate-pulse" />;
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full mt-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-text-muted">
        No trend data available yet.
      </div>
    );
  }

  return (
    <motion.div
      className="h-[300px] w-full mt-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendRevenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.32} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trendApprovalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trendPaymentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.45} />

          <XAxis
            dataKey="label"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatAxisValue(Number(value), metric)}
            width={60}
          />

          <Tooltip
            cursor={{ stroke: metricColor, strokeOpacity: 0.35, strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "12px",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value) => {
              const numeric = Number(value || 0);
              return [formatTooltipValue(numeric, metric), metricLabel];
            }}
          />

          <Area
            type="monotone"
            dataKey={metric === "revenue" ? "revenue" : metric === "approvalRate" ? "approvalRate" : "paymentConversion"}
            stroke={metricColor}
            strokeWidth={3}
            strokeOpacity={1}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, strokeWidth: 0, fill: metricColor }}
            activeDot={{ r: 5, strokeWidth: 1, stroke: "#ffffff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
