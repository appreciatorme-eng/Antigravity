// API Cost Dashboard — real-time and MTD spend by category and org.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import StackedCostChart from "@/components/god-mode/StackedCostChart";
import TimeRangePicker from "@/components/god-mode/TimeRangePicker";
import DrillDownTable from "@/components/god-mode/DrillDownTable";
import StatCard from "@/components/god-mode/StatCard";
import type { TableColumn } from "@/components/god-mode/DrillDownTable";

interface CategoryRow {
    category: string;
    today_usd: number;
    mtd_usd: number;
    cap_usd: number;
    utilization_pct: number;
}

interface OrgRow {
    org_id: string;
    org_name: string;
    tier: string;
    mtd_usd: number;
    requests: number;
}

interface TrendDay {
    date: string;
    estimated_usd: number;
}

interface CostData {
    today: { total_usd: number } & Record<string, number>;
    month_to_date: { total_usd: number };
    by_category: CategoryRow[];
    by_org: OrgRow[];
}

const CATEGORY_LABELS: Record<string, string> = {
    amadeus: "Amadeus (Flights)",
    image_search: "Image Search",
    ai_image: "AI Image (FAL)",
    ai_poster: "AI Poster",
    ai_text: "AI Text (OpenAI)",
};

const TIER_CLASS: Record<string, string> = {
    free: "text-gray-400", pro: "text-blue-400", enterprise: "text-amber-400",
};

const ORG_COLS: TableColumn<OrgRow>[] = [
    {
        key: "org_name", label: "Organization",
        render: (v) => <span className="font-medium text-white">{v as string}</span>,
    },
    {
        key: "tier", label: "Tier",
        render: (v) => (
            <span className={`text-xs font-semibold uppercase ${TIER_CLASS[v as string] ?? "text-gray-400"}`}>{v as string}</span>
        ),
    },
    {
        key: "mtd_usd", label: "MTD Spend", sortable: true,
        render: (v) => <span className="text-white font-semibold">${(v as number).toFixed(2)}</span>,
    },
    {
        key: "requests", label: "Requests", sortable: true,
        render: (v) => <span className="text-gray-300">{(v as number).toLocaleString()}</span>,
    },
];

function utilizationColor(pct: number): string {
    if (pct >= 95) return "bg-red-500";
    if (pct >= 80) return "bg-amber-500";
    return "bg-emerald-500";
}

export default function CostsPage() {
    const router = useRouter();
    const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
    const [costData, setCostData] = useState<CostData | null>(null);
    const [trendData, setTrendData] = useState<TrendDay[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [aggRes, trendRes] = await Promise.all([
                fetch("/api/superadmin/cost/aggregate"),
                fetch(`/api/superadmin/cost/trends?range=${range}`),
            ]);
            if (aggRes.ok) setCostData(await aggRes.json());
            if (trendRes.ok) {
                const t = await trendRes.json();
                setTrendData(t.daily ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const highAlerts = costData?.by_category.filter((c) => c.utilization_pct >= 80) ?? [];

    // Build chart data — use trendData mapped as stacked structure (single series for now)
    const chartData = trendData.map((d) => ({
        date: d.date,
        total: d.estimated_usd,
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">API Cost Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Real-time and month-to-date API spending</p>
                </div>
                <div className="flex items-center gap-3">
                    <TimeRangePicker value={range} onChange={(v) => setRange(v as "7d" | "30d" | "90d")} />
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                                   hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Alert banner */}
            {highAlerts.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-950/40 border border-amber-900/60">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-amber-300">
                        {highAlerts.map((c) => CATEGORY_LABELS[c.category] ?? c.category).join(", ")} {highAlerts.length === 1 ? "is" : "are"} above 80% of daily cap
                    </p>
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard
                    label="Today's Total Spend"
                    value={loading ? "…" : `$${(costData?.today.total_usd ?? 0).toFixed(2)}`}
                    accent="red"
                />
                <StatCard
                    label="Month-to-Date Spend"
                    value={loading ? "…" : `$${(costData?.month_to_date.total_usd ?? 0).toFixed(2)}`}
                    accent="amber"
                />
            </div>

            {/* Category cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(costData?.by_category ?? []).map((cat) => (
                    <div
                        key={cat.category}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">
                                    {CATEGORY_LABELS[cat.category] ?? cat.category}
                                </p>
                                <p className="text-lg font-bold text-white mt-1">
                                    ${cat.today_usd.toFixed(2)}
                                    <span className="text-xs text-gray-500 font-normal ml-1">today</span>
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${cat.utilization_pct >= 95 ? "bg-red-900/60 text-red-300" : cat.utilization_pct >= 80 ? "bg-amber-900/60 text-amber-300" : "bg-gray-800 text-gray-400"}`}>
                                {cat.utilization_pct}%
                            </span>
                        </div>
                        {/* Utilization bar */}
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full transition-all ${utilizationColor(cat.utilization_pct)}`}
                                style={{ width: `${Math.min(100, cat.utilization_pct)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Cap: ${cat.cap_usd} / day
                        </p>
                    </div>
                ))}
            </div>

            {/* Trend chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                    Daily Cost Trend
                </h2>
                {chartData.length > 0 ? (
                    <StackedCostChart data={chartData} />
                ) : (
                    <div className="h-52 bg-gray-800 animate-pulse rounded-lg" />
                )}
            </div>

            {/* Per-org table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                    Per-Organization MTD Spend
                </h2>
                <DrillDownTable<OrgRow>
                    columns={ORG_COLS}
                    data={costData?.by_org ?? []}
                    searchable
                    onRowClick={(row) => router.push(`/god/costs/org/${row.org_id}`)}
                    emptyMessage="No cost data available"
                />
            </div>
        </div>
    );
}
