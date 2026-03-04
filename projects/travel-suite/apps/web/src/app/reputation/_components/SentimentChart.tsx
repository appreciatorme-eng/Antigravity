"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SentimentDataPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentChartProps {
  data: SentimentDataPoint[];
}

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral: "#eab308",
  negative: "#ef4444",
} as const;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg bg-[#1a1b23]/95 backdrop-blur-md border border-white/10 px-3 py-2.5 shadow-xl">
      <p className="text-[11px] text-white/50 mb-1.5 font-medium">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-white/70 capitalize">{entry.name}</span>
            </span>
            <span className="text-white font-medium tabular-nums">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SentimentChart({ data }: SentimentChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[280px] w-full rounded-xl border border-dashed border-white/10 flex items-center justify-center text-sm text-white/40">
        No sentiment data available yet.
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="sentimentPositiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SENTIMENT_COLORS.positive} stopOpacity={0.3} />
              <stop offset="95%" stopColor={SENTIMENT_COLORS.positive} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sentimentNeutralGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SENTIMENT_COLORS.neutral} stopOpacity={0.25} />
              <stop offset="95%" stopColor={SENTIMENT_COLORS.neutral} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sentimentNegativeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SENTIMENT_COLORS.negative} stopOpacity={0.3} />
              <stop offset="95%" stopColor={SENTIMENT_COLORS.negative} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="rgba(255,255,255,0.06)"
          />

          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.3)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={36}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "rgba(255,255,255,0.15)",
              strokeWidth: 1,
            }}
          />

          <Area
            type="monotone"
            dataKey="positive"
            stackId="sentiment"
            stroke={SENTIMENT_COLORS.positive}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#sentimentPositiveGrad)"
          />
          <Area
            type="monotone"
            dataKey="neutral"
            stackId="sentiment"
            stroke={SENTIMENT_COLORS.neutral}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#sentimentNeutralGrad)"
          />
          <Area
            type="monotone"
            dataKey="negative"
            stackId="sentiment"
            stroke={SENTIMENT_COLORS.negative}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#sentimentNegativeGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
