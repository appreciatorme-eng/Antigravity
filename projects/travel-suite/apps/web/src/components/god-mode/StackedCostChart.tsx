// StackedCostChart — stacked bar chart for API cost breakdown by category.

"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export interface CostDataPoint {
    date: string;
    amadeus?: number;
    image_search?: number;
    ai_image?: number;
    ai_poster?: number;
    ai_text?: number;
}

const CATEGORY_COLORS = {
    amadeus: "#60a5fa",
    image_search: "#34d399",
    ai_image: "#a78bfa",
    ai_poster: "#f472b6",
    ai_text: "#fbbf24",
};

const CATEGORY_LABELS = {
    amadeus: "Amadeus",
    image_search: "Image Search",
    ai_image: "AI Image",
    ai_poster: "AI Poster",
    ai_text: "AI Text",
};

interface StackedCostChartProps {
    data: CostDataPoint[];
    height?: number;
    onClickBar?: (data: CostDataPoint) => void;
}

export default function StackedCostChart({ data, height = 240, onClickBar }: StackedCostChartProps) {
    const categories = Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[];

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                onClick={(payload) => {
                    if (payload?.activePayload && onClickBar) {
                        const item = (payload.activePayload as Array<{ payload: CostDataPoint }>)[0]?.payload;
                        if (item) onClickBar(item);
                    }
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "#374151" }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }}
                    itemStyle={{ color: "#9ca3af" }}
                    labelStyle={{ color: "#d1d5db" }}
                    formatter={(v: number, name: string) => [`$${v.toFixed(3)}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
                {categories.map((cat) => (
                    <Bar
                        key={cat}
                        dataKey={cat}
                        name={CATEGORY_LABELS[cat]}
                        stackId="cost"
                        fill={CATEGORY_COLORS[cat]}
                        opacity={0.85}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
