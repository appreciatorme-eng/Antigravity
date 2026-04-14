// Signups Dashboard — user signup trends and recent registrations.

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import TrendChart from "@/components/god-mode/TrendChart";
import StatCard from "@/components/god-mode/StatCard";
import TimeRangePicker from "@/components/god-mode/TimeRangePicker";
import DrillDownTable from "@/components/god-mode/DrillDownTable";
import type { TableColumn } from "@/components/god-mode/DrillDownTable";

interface SignupRow {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    org_name: string | null;
    org_tier: string | null;
    created_at: string | null;
    [key: string]: unknown;
}

interface SignupsData {
    trend: { date: string; count: number }[];
    recent: SignupRow[];
    totals: {
        total_users: number;
        users_in_range: number;
        orgs_in_range: number;
        users_this_month: number;
        avg_daily_signups: number;
    };
    pagination: { page: number; limit: number; total: number };
}

const tierColors: Record<string, string> = {
    free: "text-gray-400",
    pro: "text-blue-400",
    enterprise: "text-amber-400",
};

const roleColors: Record<string, string> = {
    super_admin: "text-red-400",
    admin: "text-emerald-400",
    client: "text-blue-400",
    driver: "text-purple-400",
};

const COLUMNS: TableColumn<SignupRow>[] = [
    {
        key: "full_name",
        label: "Name",
        render: (v) => <span className="font-medium text-white">{String(v ?? "—")}</span>,
    },
    { key: "email", label: "Email", render: (v) => <span className="text-gray-300 text-sm">{String(v ?? "—")}</span> },
    { key: "phone", label: "Phone", render: (v) => <span className="text-gray-400 text-sm">{String(v ?? "—")}</span> },
    {
        key: "role",
        label: "Role",
        render: (v) => (
            <span className={`text-xs font-medium uppercase ${roleColors[v as string] ?? "text-gray-400"}`}>
                {String(v ?? "—")}
            </span>
        ),
    },
    { key: "org_name", label: "Organization", render: (v) => <span className="text-gray-300">{String(v ?? "—")}</span> },
    {
        key: "org_tier",
        label: "Tier",
        render: (v) => (
            <span className={`text-xs uppercase font-semibold ${tierColors[v as string] ?? "text-gray-400"}`}>
                {String(v ?? "free")}
            </span>
        ),
    },
    {
        key: "created_at",
        label: "Signed Up",
        sortable: true,
        render: (v) => (
            <span className="text-gray-400 text-sm">
                {v ? new Date(v as string).toLocaleDateString() : "—"}
            </span>
        ),
    },
];

export default function SignupsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [range, setRange] = useState<"7d" | "30d" | "90d">((searchParams.get("range") as "7d" | "30d" | "90d") ?? "30d");
    const [data, setData] = useState<SignupsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(Math.max(0, Number(searchParams.get("page") || 0)));
    const selectedDate = searchParams.get("date");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                range,
                page: String(page),
                limit: "50",
            });
            if (selectedDate) params.set("date", selectedDate);
            const res = await fetch(`/api/superadmin/users/signups?${params}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [page, range, selectedDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", range);
        if (page > 0) params.set("page", String(page));
        else params.delete("page");
        if (!selectedDate) params.delete("date");

        const next = params.toString();
        if (next !== searchParams.toString()) {
            router.replace(`${pathname}?${next}`, { scroll: false });
        }
    }, [page, pathname, range, router, searchParams, selectedDate]);

    const totals = data?.totals;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Signups</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Registration trends and recent signups</p>
                </div>
                <div className="flex items-center gap-3">
                    <TimeRangePicker value={range} onChange={(v) => { setRange(v as "7d" | "30d" | "90d"); setPage(0); }} />
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

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={loading ? "…" : (totals?.total_users ?? "—")} accent="blue" />
                <StatCard label={`New Users (${range})`} value={loading ? "…" : (totals?.users_in_range ?? "—")} accent="amber" />
                <StatCard label={`Orgs Created (${range})`} value={loading ? "…" : (totals?.orgs_in_range ?? "—")} accent="emerald" />
                <StatCard label="Avg Daily Signups" value={loading ? "…" : (totals?.avg_daily_signups ?? "—")} subtitle={`Over ${range}`} accent="purple" />
            </div>

            {/* Trend chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Daily Signups</h2>
                        {selectedDate && (
                            <p className="mt-1 text-xs text-amber-300">Showing table rows from {selectedDate}</p>
                        )}
                    </div>
                    {selectedDate && (
                        <button
                            onClick={() => router.replace(`${pathname}?range=${range}`, { scroll: false })}
                            className="text-xs text-gray-500 transition-colors hover:text-gray-300"
                        >
                            Clear day filter
                        </button>
                    )}
                </div>
                {data?.trend ? (
                    <TrendChart
                        data={data.trend}
                        series={[{ key: "count", label: "Signups", color: "#f59e0b" }]}
                        type="area"
                        height={220}
                        onClickBar={(entry) => {
                            if (entry.date) {
                                router.push(`${pathname}?range=${range}&date=${entry.date}`);
                            }
                        }}
                    />
                ) : (
                    <div className="h-52 bg-gray-800 animate-pulse rounded-lg" />
                )}
            </div>

            {/* Recent signups table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                    Recent Signups
                </h2>
                <DrillDownTable<SignupRow>
                    columns={COLUMNS}
                    data={data?.recent ?? []}
                    searchable
                    emptyMessage="No signups in this period"
                />
                {/* Pagination */}
                {data && data.pagination.total > 50 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                        <span className="text-sm text-gray-400">
                            Page {page + 1} of {Math.ceil(data.pagination.total / 50)}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 rounded bg-gray-800 text-sm text-gray-300
                                           hover:bg-gray-700 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={(page + 1) * 50 >= data.pagination.total}
                                className="px-3 py-1 rounded bg-gray-800 text-sm text-gray-300
                                           hover:bg-gray-700 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
