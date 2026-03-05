"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ReviewToRevenueDataPoint {
  month: string;
  avgRating: number;
  bookings: number;
}

interface ReviewToRevenueChartProps {
  data: ReviewToRevenueDataPoint[];
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-500">
            {entry.dataKey === "avgRating" ? "Avg Rating" : "Bookings"}:
          </span>
          <span className="text-gray-900 font-medium">
            {entry.dataKey === "avgRating"
              ? entry.value.toFixed(1)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReviewToRevenueChart({
  data,
}: ReviewToRevenueChartProps) {
  const correlationText = useMemo(() => {
    if (data.length < 2) return null;

    const first = data[0];
    const last = data[data.length - 1];
    const ratingChange = last.avgRating - first.avgRating;
    const bookingChange =
      first.bookings > 0
        ? ((last.bookings - first.bookings) / first.bookings) * 100
        : 0;

    const ratingDirection = ratingChange >= 0 ? "improved" : "declined";
    const bookingDirection = bookingChange >= 0 ? "increased" : "decreased";

    return {
      ratingFrom: first.avgRating.toFixed(1),
      ratingTo: last.avgRating.toFixed(1),
      ratingDirection,
      bookingChange: Math.abs(bookingChange).toFixed(0),
      bookingDirection,
      isPositive: bookingChange >= 0,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-[320px] rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">
        No review-to-revenue data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Correlation text */}
      {correlationText && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3"
        >
          {correlationText.isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          )}
          <p className="text-xs text-gray-600">
            Since your rating {correlationText.ratingDirection} from{" "}
            <span className="font-semibold text-gray-900">
              {correlationText.ratingFrom}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900">
              {correlationText.ratingTo}
            </span>
            , bookings {correlationText.bookingDirection}{" "}
            <span
              className={`font-semibold ${
                correlationText.isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {correlationText.bookingChange}%
            </span>
          </p>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div
        className="h-[300px] w-full"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#f3f4f6"
            />

            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 5]}
              tickFormatter={(v: number) => v.toFixed(1)}
              width={40}
              label={{
                value: "Rating",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#64748b", fontSize: 10 },
              }}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={50}
              label={{
                value: "Bookings",
                angle: 90,
                position: "insideRight",
                style: { fill: "#64748b", fontSize: 10 },
              }}
            />

            <Tooltip content={<ChartTooltip />} />

            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              formatter={(value: string) =>
                value === "avgRating" ? "Avg Rating" : "Bookings"
              }
            />

            <Bar
              yAxisId="right"
              dataKey="bookings"
              fill="url(#bookingsGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgRating"
              stroke="#00d084"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#00d084", strokeWidth: 0 }}
              activeDot={{
                r: 5,
                stroke: "#e5e7eb",
                strokeWidth: 1,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
