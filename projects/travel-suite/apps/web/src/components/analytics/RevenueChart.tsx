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

export type RevenueMetricMode = "revenue" | "bookings";

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

export interface RevenueChartPoint {
  monthKey: string;
  label: string;
  revenue: number;
  bookings: number;
  conversionRate?: number;
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
  if (mode === "bookings") {
    return `${value}`;
  }
  if (value >= 100000) return `₹${Math.round(value / 1000)}k`;
  return `₹${Math.round(value)}`;
}

function formatTooltipValue(value: number, mode: RevenueMetricMode): string {
  if (mode === "bookings") return `${Math.round(value)} bookings`;
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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
        revenueLabel: formatTooltipValue(point.revenue, "revenue"),
        bookingsLabel: `${point.bookings} bookings`,
      })),
    [data],
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
            <linearGradient id="dashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={metric === "revenue" ? 0.32 : 0.12} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dashboardBookingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={metric === "bookings" ? 0.24 : 0.1} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
            formatter={(value, name) => {
              const numeric = Number(value || 0);
              if (name === "revenue") {
                return [formatTooltipValue(numeric, "revenue"), "Revenue"];
              }
              return [formatTooltipValue(numeric, "bookings"), "Bookings"];
            }}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-primary)"
            strokeWidth={metric === "revenue" ? 3 : 2}
            strokeOpacity={metric === "revenue" ? 1 : 0.55}
            fillOpacity={1}
            fill="url(#dashboardRevenueGradient)"
            dot={renderDot("var(--color-primary)")}
            activeDot={renderDot("var(--color-primary)")}
          />

          <Area
            type="monotone"
            dataKey="bookings"
            stroke="#3b82f6"
            strokeWidth={metric === "bookings" ? 3 : 2}
            strokeOpacity={metric === "bookings" ? 1 : 0.55}
            fillOpacity={1}
            fill="url(#dashboardBookingGradient)"
            dot={renderDot("#3b82f6")}
            activeDot={renderDot("#3b82f6")}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
