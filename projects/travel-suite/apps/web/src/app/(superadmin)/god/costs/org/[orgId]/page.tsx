// Per-org cost detail page — shows cost breakdown for a single organization.

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TrendChart from "@/components/god-mode/TrendChart";
import StatCard from "@/components/god-mode/StatCard";

interface OrgCostData {
    org: { id: string; name: string; tier: string; created_at: string };
    range: string;
    today: Record<string, number>;
    range_total: number;
    by_category: Record<string, number>;
    mtd: { ai_requests: number; estimated_cost_usd: number };
    trend: { date: string; estimated_usd: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
    amadeus: "Amadeus",
    image_search: "Image Search",
    ai_image: "AI Image",
    ai_poster: "AI Poster",
    ai_text: "AI Text",
};

const TIER_CLASS: Record<string, string> = {
    free: "text-gray-400", pro: "text-blue-400", enterprise: "text-amber-400",
};

export default function OrgCostPage() {
    const params = useParams<{ orgId: string }>();
    const router = useRouter();
    const [data, setData] = useState<OrgCostData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/superadmin/cost/org/${params.orgId}?range=30d`);
                if (res.ok) setData(await res.json());
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.orgId]);

    const chartData = (data?.trend ?? []).map((d) => ({ date: d.date, cost: d.estimated_usd }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-white">
                            {data?.org.name ?? "Loading…"}
                        </h1>
                        {data?.org.tier && (
                            <span className={`text-sm font-semibold uppercase ${TIER_CLASS[data.org.tier] ?? "text-gray-400"}`}>
                                {data.org.tier}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">API cost breakdown — last 30 days</p>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    label="MTD AI Requests"
                    value={loading ? "…" : (data?.mtd.ai_requests ?? 0).toLocaleString()}
                    accent="blue"
                />
                <StatCard
                    label="MTD Estimated Cost"
                    value={loading ? "…" : `$${(data?.mtd.estimated_cost_usd ?? 0).toFixed(2)}`}
                    accent="amber"
                />
                <StatCard
                    label="Range Total (30d)"
                    value={loading ? "…" : `$${(data?.range_total ?? 0).toFixed(2)}`}
                    accent="red"
                />
            </div>

            {/* Per-category breakdown */}
            {data?.by_category && Object.keys(data.by_category).length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                        By Category (30d)
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(data.by_category)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, spend]) => (
                                <div key={cat} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">
                                        {CATEGORY_LABELS[cat] ?? cat}
                                    </span>
                                    <span className="text-sm font-semibold text-white">
                                        ${spend.toFixed(4)}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Daily trend */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                    Daily Spend Trend
                </h2>
                {chartData.length > 0 ? (
                    <TrendChart
                        data={chartData}
                        series={[{ key: "cost", label: "Estimated Cost ($)", color: "#f59e0b" }]}
                        type="area"
                        height={220}
                    />
                ) : (
                    <div className="h-52 bg-gray-800 animate-pulse rounded-lg" />
                )}
            </div>
        </div>
    );
}
