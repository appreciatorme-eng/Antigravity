// TrendChart — Recharts AreaChart / BarChart wrapper for god-mode pages.
// Supports area and bar chart types with consistent dark theme styling.

"use client";

import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface ChartSeries {
    key: string;
    label: string;
    color: string;
}

interface TrendChartProps {
    data: Record<string, string | number>[];
    series: ChartSeries[];
    type?: "area" | "bar";
    height?: number;
    xKey?: string;
    onClickBar?: (data: Record<string, string | number>) => void;
    className?: string;
    formatY?: (v: number) => string;
    formatTooltip?: (v: number, name: string) => string;
}

const CHART_STYLE = {
    background: "transparent",
    fontSize: 11,
};

const TOOLTIP_STYLE = {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    borderRadius: "8px",
    fontSize: "12px",
};

interface ChartClickPayload {
    activePayload?: Array<{ payload: Record<string, string | number> }>;
}

export default function TrendChart({
    data,
    series,
    type = "area",
    height = 240,
    xKey = "date",
    onClickBar,
    className,
    formatY,
    formatTooltip,
}: TrendChartProps) {
    const commonProps = {
        data,
        style: CHART_STYLE,
        onClick: onClickBar ? (payload: ChartClickPayload) => {
            if (payload?.activePayload) {
                const item = payload.activePayload[0]?.payload;
                if (item) onClickBar(item);
            }
        } : undefined,
    };

    const xAxisProps = {
        dataKey: xKey,
        tick: { fill: "#6b7280", fontSize: 11 },
        axisLine: { stroke: "#374151" },
        tickLine: false,
    };

    const yAxisProps = {
        tick: { fill: "#6b7280", fontSize: 11 },
        axisLine: false,
        tickLine: false,
        tickFormatter: formatY,
    };

    const tooltipProps = {
        contentStyle: TOOLTIP_STYLE,
        itemStyle: { color: "#9ca3af" },
        labelStyle: { color: "#d1d5db", marginBottom: 4 },
        formatter: formatTooltip ? (v: number, name: string) => [formatTooltip(v, name), name] : undefined,
    };

    return (
        <div className={cn("min-w-0 w-full", className)}>
            <ResponsiveContainer width="100%" height={height}>
                {type === "area" ? (
                    <AreaChart {...commonProps}>
                        <defs>
                            {series.map((s) => (
                                <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisProps} />
                        <Tooltip {...tooltipProps} />
                        <Legend
                            wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
                        />
                        {series.map((s) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color}
                                strokeWidth={2}
                                fill={`url(#g-${s.key})`}
                                dot={false}
                                activeDot={{ r: 4, fill: s.color }}
                            />
                        ))}
                    </AreaChart>
                ) : (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis {...xAxisProps} />
                        <YAxis {...yAxisProps} />
                        <Tooltip {...tooltipProps} />
                        <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
                        {series.map((s) => (
                            <Bar
                                key={s.key}
                                dataKey={s.key}
                                name={s.label}
                                fill={s.color}
                                radius={[2, 2, 0, 0]}
                                opacity={0.85}
                            />
                        ))}
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
