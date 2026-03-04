"use client";

import { useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Liveline } from "liveline";
import type { LivelinePoint } from "liveline";

export type RevenueMetricMode = "revenue" | "bookings";

export interface RevenueChartPoint {
  monthKey: string;
  label: string;
  revenue: number;
  bookings: number;
  conversionRate?: number;
}

interface RevenueChartProps {
  data: RevenueChartPoint[];
  metric: RevenueMetricMode;
  loading?: boolean;
  onPointSelect?: (point: RevenueChartPoint) => void;
}

function monthKeyToUnix(monthKey: string): number {
  return new Date(`${monthKey}-01T00:00:00Z`).getTime() / 1000;
}

const REVENUE_COLOR = "#10b981";
const BOOKINGS_COLOR = "#3b82f6";

export default function RevenueChart({ data, metric, loading = false, onPointSelect }: RevenueChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const revenuePoints = useMemo<LivelinePoint[]>(
    () => data.map((p) => ({ time: monthKeyToUnix(p.monthKey), value: p.revenue })),
    [data]
  );

  const bookingPoints = useMemo<LivelinePoint[]>(
    () => data.map((p) => ({ time: monthKeyToUnix(p.monthKey), value: p.bookings })),
    [data]
  );

  const activePoints = metric === "revenue" ? revenuePoints : bookingPoints;
  const latestValue = activePoints.length > 0 ? (activePoints[activePoints.length - 1]?.value ?? 0) : 0;
  const activeColor = metric === "revenue" ? REVENUE_COLOR : BOOKINGS_COLOR;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onPointSelect || data.length === 0 || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      const idx = Math.min(data.length - 1, Math.max(0, Math.round(relativeX * (data.length - 1))));
      const point = data[idx];
      if (point) onPointSelect(point);
    },
    [data, onPointSelect]
  );

  if (loading) {
    return <div className="h-[300px] w-full mt-4 rounded-2xl bg-gray-50/80 animate-pulse" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full mt-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-text-muted">
        No trend data available yet.
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="h-[300px] w-full mt-4 cursor-pointer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={handleClick}
    >
      <Liveline
        data={activePoints}
        value={latestValue}
        color={activeColor}
        theme="light"
        grid
        badge
        momentum
        scrub
      />
    </motion.div>
  );
}
