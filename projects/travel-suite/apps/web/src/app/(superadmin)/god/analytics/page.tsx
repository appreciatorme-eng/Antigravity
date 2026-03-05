// Feature Usage Analytics — cross-org feature usage with drill-down per feature.

"use client";

import { useEffect, useState, useCallback } from "react";
import { Map, FileText, Sparkles, Share2, RefreshCw } from "lucide-react";
import TrendChart from "@/components/god-mode/TrendChart";
import TimeRangePicker from "@/components/god-mode/TimeRangePicker";
import DrillDownTable from "@/components/god-mode/DrillDownTable";
import StatCard from "@/components/god-mode/StatCard";
import type { TableColumn } from "@/components/god-mode/DrillDownTable";

interface FeatureStats {
    total: number;
    change_pct: number;
}

interface TopOrg {
    org_id: string;
    org_name: string;
    tier: string;
    trips: number;
}

interface AnalyticsData {
    range: string;
    features: {
        trips: FeatureStats;
        proposals: FeatureStats;
        ai_sessions: FeatureStats;
        social_posts: FeatureStats;
    };
    top_orgs: TopOrg[];
}

interface DrillRow {
    org_id: string;
    org_name: string;
    tier: string;
    count: number;
    pct_of_total: number;
    last_used: string | null;
}

interface DrillData {
    feature: string;
    range: string;
    total: number;
    rows: DrillRow[];
}

const FEATURE_CONFIG = [
    { key: "trips" as const, label: "Trips", icon: Map, color: "emerald" as const },
    { key: "proposals" as const, label: "Proposals", icon: FileText, color: "blue" as const },
    { key: "ai_sessions" as const, label: "AI Sessions", icon: Sparkles, color: "purple" as const },
    { key: "social_posts" as const, label: "Social Posts", icon: Share2, color: "pink" as const },
] as const;

const TIER_LABEL: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const TIER_CLASS: Record<string, string> = {
    free: "text-gray-400", pro: "text-blue-400", enterprise: "text-amber-400",
};

const TOP_ORG_COLS: TableColumn<TopOrg>[] = [
    { key: "org_name", label: "Organization", render: (v) => <span className="font-medium text-white">{v as string}</span> },
    {
        key: "tier", label: "Tier", render: (v) => (
            <span className={`text-xs font-semibold uppercase ${TIER_CLASS[v as string] ?? "text-gray-400"}`}>
                {TIER_LABEL[v as string] ?? v as string}
            </span>
        ),
    },
    {
        key: "trips", label: "Trips", sortable: true,
        render: (v) => <span className="text-amber-400 font-semibold">{v as number}</span>,
    },
];

const DRILL_COLS: TableColumn<DrillRow>[] = [
    { key: "org_name", label: "Organization", render: (v) => <span className="font-medium text-white">{v as string}</span> },
    {
        key: "tier", label: "Tier", render: (v) => (
            <span className={`text-xs font-semibold uppercase ${TIER_CLASS[v as string] ?? "text-gray-400"}`}>
                {TIER_LABEL[v as string] ?? v as string}
            </span>
        ),
    },
    {
        key: "count", label: "Count", sortable: true,
        render: (v) => <span className="text-white font-semibold">{v as number}</span>,
    },
    {
        key: "pct_of_total", label: "% of Total", sortable: true,
        render: (v) => <span className="text-gray-300">{v as number}%</span>,
    },
    {
        key: "last_used", label: "Last Used",
        render: (v) => <span className="text-gray-400 text-sm">{v ? new Date(v as string).toLocaleDateString() : "—"}</span>,
    },
];

type FeatureKey = "trips" | "proposals" | "ai_sessions" | "social_posts";

export default function AnalyticsPage() {
    const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFeature, setSelectedFeature] = useState<FeatureKey | null>(null);
    const [drillData, setDrillData] = useState<DrillData | null>(null);
    const [drillLoading, setDrillLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/superadmin/analytics/feature-usage?range=${range}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function selectFeature(key: FeatureKey) {
        setSelectedFeature(key);
        setDrillLoading(true);
        try {
            const res = await fetch(`/api/superadmin/analytics/feature-usage/${key}?range=${range}`);
            if (res.ok) setDrillData(await res.json());
        } finally {
            setDrillLoading(false);
        }
    }

    // Build bar chart data from top orgs
    const chartData = data?.top_orgs.slice(0, 10).map((o) => ({
        date: o.org_name.slice(0, 12),
        count: o.trips,
    })) ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Feature Usage</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Cross-org feature adoption metrics</p>
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

            {/* Feature stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {FEATURE_CONFIG.map(({ key, label, color }) => {
                    const stats = data?.features[key];
                    const isSelected = selectedFeature === key;
                    return (
                        <button
                            key={key}
                            onClick={() => selectFeature(key)}
                            className={`text-left transition-all rounded-xl border p-0
                                        ${isSelected
                                    ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-950"
                                    : "hover:ring-1 hover:ring-gray-600"
                                }`}
                        >
                            <StatCard
                                label={label}
                                value={loading ? "…" : (stats?.total ?? 0).toLocaleString()}
                                subtitle={stats ? `${stats.change_pct > 0 ? "+" : ""}${stats.change_pct}% vs prev` : ""}
                                accent={color}
                            />
                        </button>
                    );
                })}
            </div>

            {/* Top orgs chart */}
            {!selectedFeature && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                        Top Orgs by Trips Created
                    </h2>
                    {chartData.length > 0 ? (
                        <TrendChart
                            data={chartData}
                            series={[{ key: "count", label: "Trips", color: "#f59e0b" }]}
                            type="bar"
                            height={220}
                        />
                    ) : (
                        <div className="h-52 bg-gray-800 animate-pulse rounded-lg" />
                    )}
                </div>
            )}

            {/* Drill-down table */}
            {selectedFeature && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                            {FEATURE_CONFIG.find((f) => f.key === selectedFeature)?.label} — Per-Org Breakdown
                            {drillData && <span className="text-gray-500 font-normal"> ({drillData.total.toLocaleString()} total)</span>}
                        </h2>
                        <button
                            onClick={() => { setSelectedFeature(null); setDrillData(null); }}
                            className="text-xs text-gray-500 hover:text-gray-300"
                        >
                            ✕ Close
                        </button>
                    </div>
                    {drillLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-10 bg-gray-800 animate-pulse rounded" />
                            ))}
                        </div>
                    ) : (
                        <DrillDownTable<DrillRow>
                            columns={DRILL_COLS}
                            data={drillData?.rows ?? []}
                            searchable
                            emptyMessage="No data for this feature"
                        />
                    )}
                </div>
            )}

            {/* Top orgs table */}
            {!selectedFeature && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                        Top Organizations by Activity
                    </h2>
                    <DrillDownTable<TopOrg>
                        columns={TOP_ORG_COLS}
                        data={data?.top_orgs ?? []}
                        emptyMessage="No data available"
                    />
                </div>
            )}
        </div>
    );
}
