// KpiCard — metric card with icon, value, trend badge, optional sparkline.
// Wraps in a Link when href is provided for drill-through navigation.

"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

export interface KpiCardProps {
    label: string;
    value: string | number;
    trend?: number;
    icon: React.ElementType;
    color?: "amber" | "emerald" | "blue" | "purple" | "red" | "cyan" | "pink";
    href?: string;
    sparklineData?: number[];
    loading?: boolean;
}

const COLOR_MAP: Record<NonNullable<KpiCardProps["color"]>, { icon: string; accent: string; stroke: string }> = {
    amber: { icon: "text-amber-400 bg-amber-400/10 border-amber-400/20", accent: "text-amber-400", stroke: "#f59e0b" },
    emerald: { icon: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", accent: "text-emerald-400", stroke: "#34d399" },
    blue: { icon: "text-blue-400 bg-blue-400/10 border-blue-400/20", accent: "text-blue-400", stroke: "#60a5fa" },
    purple: { icon: "text-purple-400 bg-purple-400/10 border-purple-400/20", accent: "text-purple-400", stroke: "#a78bfa" },
    red: { icon: "text-red-400 bg-red-400/10 border-red-400/20", accent: "text-red-400", stroke: "#f87171" },
    cyan: { icon: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", accent: "text-cyan-400", stroke: "#22d3ee" },
    pink: { icon: "text-pink-400 bg-pink-400/10 border-pink-400/20", accent: "text-pink-400", stroke: "#f472b6" },
};

function TrendBadge({ trend }: { trend: number }) {
    if (trend === 0) {
        return (
            <div className="flex items-center gap-1 text-xs text-gray-500">
                <Minus className="w-3 h-3" />
                <span>No change</span>
            </div>
        );
    }
    const positive = trend > 0;
    return (
        <div className={cn("flex items-center gap-1 text-xs", positive ? "text-emerald-400" : "text-red-400")}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{positive ? "+" : ""}{trend.toFixed(1)}%</span>
        </div>
    );
}

function SparklineChart({ data, stroke }: { data: number[]; stroke: string }) {
    const chartData = data.map((v, i) => ({ i, v }));
    return (
        <div className="h-12 mt-3">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={`grad-${stroke.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={stroke} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", fontSize: "12px" }}
                        itemStyle={{ color: "#9ca3af" }}
                        labelStyle={{ display: "none" }}
                        formatter={(v: number) => [v, ""]}
                    />
                    <Area
                        type="monotone"
                        dataKey="v"
                        stroke={stroke}
                        strokeWidth={1.5}
                        fill={`url(#grad-${stroke.replace("#", "")})`}
                        dot={false}
                        activeDot={{ r: 3, fill: stroke }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function CardContent({ label, value, trend, icon: Icon, color = "amber", sparklineData, loading }: KpiCardProps) {
    const colors = COLOR_MAP[color];

    if (loading) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="flex items-start justify-between">
                    <div className="w-9 h-9 bg-gray-800 rounded-lg" />
                    <div className="w-16 h-4 bg-gray-800 rounded" />
                </div>
                <div className="mt-4 w-20 h-7 bg-gray-800 rounded" />
                <div className="mt-1 w-24 h-3 bg-gray-800 rounded" />
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between">
                <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0", colors.icon)}>
                    <Icon className="w-4 h-4" />
                </div>
                {trend !== undefined && <TrendBadge trend={trend} />}
            </div>
            <div className="mt-3">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
            {sparklineData && sparklineData.length > 0 && (
                <SparklineChart data={sparklineData} stroke={colors.stroke} />
            )}
        </div>
    );
}

export default function KpiCard(props: KpiCardProps) {
    if (props.href && !props.loading) {
        return (
            <Link href={props.href} className="block group">
                <CardContent {...props} />
            </Link>
        );
    }

    return <CardContent {...props} />;
}
