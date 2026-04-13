"use client";

import { useMemo, useCallback } from "react";
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

export type RevenueMetricMode =
  | "revenue"
  | "bookings"
  | "booked"
  | "cash"
  | "trips";

export interface RevenueChartTripPoint {
  id: string;
  title: string;
  destination: string;
  clientName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
}

export interface RevenueChartItemPoint {
  id: string;
  kind: "trip" | "proposal" | "invoice";
  title: string;
  subtitle: string;
  href: string;
  status: string;
  amountLabel: string;
  dateLabel: string;
}

export interface RevenueChartPoint {
  monthKey: string;
  label: string;
  revenue: number;
  bookings: number;
  conversionRate?: number;
  bookedValue?: number;
  cashCollected?: number;
  tripCount?: number;
  bookedItems?: RevenueChartItemPoint[];
  cashItems?: RevenueChartItemPoint[];
  tripItems?: RevenueChartItemPoint[];
  trips?: RevenueChartTripPoint[];
}

interface RevenueChartProps {
  data: RevenueChartPoint[];
  metric: RevenueMetricMode;
  loading?: boolean;
  onPointSelect?: (point: RevenueChartPoint) => void;
}

interface ChartClickState {
  activePayload?: Array<{
    payload?: RevenueChartPoint;
  }>;
}

interface RevenueDotProps {
  cx?: number;
  cy?: number;
  fill?: string;
  payload?: RevenueChartPoint;
  onSelect?: (point: RevenueChartPoint) => void;
}

function formatAxisValue(value: number, mode: RevenueMetricMode): string {
  if (mode === "bookings" || mode === "trips") {
    return `${value}`;
  }
  if (value >= 100000) return `₹${Math.round(value / 1000)}k`;
  return `₹${Math.round(value)}`;
}

function formatTooltipValue(value: number, mode: RevenueMetricMode): string {
  if (mode === "bookings" || mode === "trips") {
    return `${Math.round(value)} trips`;
  }
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function resolveMetricValue(point: RevenueChartPoint, mode: RevenueMetricMode) {
  if (mode === "booked") return Number(point.bookedValue ?? point.revenue ?? 0);
  if (mode === "cash") return Number(point.cashCollected ?? point.revenue ?? 0);
  if (mode === "trips") return Number(point.tripCount ?? point.bookings ?? 0);
  if (mode === "bookings") return Number(point.bookings ?? 0);
  return Number(point.revenue ?? 0);
}

function metricLabel(mode: RevenueMetricMode) {
  if (mode === "booked") return "Won Value";
  if (mode === "cash") return "Collected Cash";
  if (mode === "trips" || mode === "bookings") return "Trips";
  return "Revenue";
}

function metricColor(mode: RevenueMetricMode) {
  if (mode === "booked") return "#16a34a";
  if (mode === "cash") return "var(--color-primary)";
  if (mode === "trips" || mode === "bookings") return "#3b82f6";
  return "var(--color-primary)";
}

function RevenueDot({ cx, cy, fill, payload, onSelect }: RevenueDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  const handleSelect = () => {
    if (!payload || !onSelect) return;
    onSelect(payload);
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={fill}
      stroke="transparent"
      strokeWidth={6}
      className={onSelect ? "cursor-pointer" : undefined}
      onClick={handleSelect}
    />
  );
}

export default function RevenueChart({ data, metric, loading = false, onPointSelect }: RevenueChartProps) {
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        chartValue: resolveMetricValue(point, metric),
      })),
    [data, metric],
  );

  const handleChartClick = useCallback(
    (state: unknown) => {
      if (!onPointSelect) return;
      const clickState = state as ChartClickState;
      const point = clickState.activePayload?.[0]?.payload;
      if (!point) return;
      onPointSelect(point);
    },
    [onPointSelect],
  );

  const renderDot = useCallback(
    (fill: string) =>
      function DotRenderer(props: RevenueDotProps) {
        return <RevenueDot {...props} fill={fill} onSelect={onPointSelect} />;
      },
    [onPointSelect],
  );

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
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} onClick={handleChartClick}>
          <defs>
            <linearGradient id="dashboardMetricGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={metricColor(metric)} stopOpacity={0.28} />
              <stop offset="95%" stopColor={metricColor(metric)} stopOpacity={0} />
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
            width={52}
          />

          <Tooltip
            cursor={{ stroke: "var(--color-primary)", strokeOpacity: 0.35, strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "12px",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value) => {
              const numeric = Number(value || 0);
              return [formatTooltipValue(numeric, metric), metricLabel(metric)];
            }}
          />

          <Area
            type="monotone"
            dataKey="chartValue"
            stroke={metricColor(metric)}
            strokeWidth={3}
            strokeOpacity={1}
            fillOpacity={1}
            fill="url(#dashboardMetricGradient)"
            dot={renderDot(metricColor(metric))}
            activeDot={renderDot(metricColor(metric))}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
