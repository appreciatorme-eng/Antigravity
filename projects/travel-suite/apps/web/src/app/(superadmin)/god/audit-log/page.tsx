// Audit Log — paginated platform control action history with category filtering.

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, ScrollText, ChevronDown, ChevronRight } from "lucide-react";

interface AuditEntry {
    id: string;
    actor_id: string;
    action: string;
    category: string;
    target_type: string | null;
    target_id: string | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
    actor_name: string;
}

interface AuditData {
    entries: AuditEntry[];
    total: number;
    page: number;
    pages: number;
}

const CATEGORY_OPTIONS = [
    { value: "all", label: "All Categories" },
    { value: "kill_switch", label: "Kill Switch" },
    { value: "org_management", label: "Org Management" },
    { value: "announcement", label: "Announcements" },
    { value: "settings", label: "Settings" },
    { value: "support", label: "Support" },
    { value: "cost_override", label: "Cost Override" },
];

const CATEGORY_BADGE: Record<string, string> = {
    kill_switch: "bg-red-900/60 text-red-300 border border-red-800/40",
    org_management: "bg-orange-900/60 text-orange-300 border border-orange-800/40",
    announcement: "bg-blue-900/60 text-blue-300 border border-blue-800/40",
    settings: "bg-purple-900/60 text-purple-300 border border-purple-800/40",
    support: "bg-emerald-900/60 text-emerald-300 border border-emerald-800/40",
    cost_override: "bg-amber-900/60 text-amber-300 border border-amber-800/40",
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const PAGE_SIZE = 20;

export default function AuditLogPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [category, setCategory] = useState(searchParams.get("category") ?? "all");
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(Math.max(0, Number(searchParams.get("page") || 0)));
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
            if (category !== "all") params.set("category", category);
            const res = await fetch(`/api/superadmin/audit-log?${params}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [category, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (category !== "all") params.set("category", category);
        else params.delete("category");
        if (page > 0) params.set("page", String(page));
        else params.delete("page");
        const next = params.toString();
        if (next !== searchParams.toString()) {
            router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
        }
    }, [category, page, pathname, router, searchParams]);

    function handleCategoryChange(value: string) {
        setCategory(value);
        setPage(0);
    }

    const totalPages = data?.pages ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ScrollText className="w-6 h-6 text-gray-400" />
                        Audit Log
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        All platform control actions
                        {data && (
                            <span className="ml-2 text-gray-600">— {data.total} entries</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                   text-sm text-gray-300 focus:outline-none focus:border-gray-500"
                    >
                        {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
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

            {/* Log entries */}
            <div className="space-y-2">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                    ))
                ) : !data || data.entries.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">No audit entries found</div>
                ) : (
                    data.entries.map((entry) => {
                        const isExp = expanded === entry.id;
                        const hasDetails = Object.keys(entry.details ?? {}).length > 0;
                        return (
                            <div
                                key={entry.id}
                                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                            >
                                <div className="flex items-start gap-3 p-4">
                                    <button
                                        onClick={() => setExpanded(isExp ? null : entry.id)}
                                        disabled={!hasDetails}
                                        className="mt-0.5 text-gray-600 hover:text-gray-400 disabled:opacity-0
                                                   transition-colors flex-shrink-0"
                                    >
                                        {isExp
                                            ? <ChevronDown className="w-4 h-4" />
                                            : <ChevronRight className="w-4 h-4" />
                                        }
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-medium text-white leading-snug">
                                                {entry.action}
                                            </p>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_BADGE[entry.category] ?? "bg-gray-700 text-gray-400"}`}>
                                                    {entry.category.replace(/_/g, " ")}
                                                </span>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {timeAgo(entry.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                            <span>{entry.actor_name}</span>
                                            {entry.target_type && (
                                                <span className="text-gray-600">
                                                    {entry.target_type}
                                                    {entry.target_id && ` #${entry.target_id.slice(0, 8)}`}
                                                </span>
                                            )}
                                            {entry.ip_address && (
                                                <span className="text-gray-600 font-mono">{entry.ip_address}</span>
                                            )}
                                            <span className="text-gray-700">
                                                {new Date(entry.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isExp && hasDetails && (
                                    <div className="border-t border-gray-800 px-4 py-3 bg-gray-950">
                                        <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-words">
                                            {JSON.stringify(entry.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-400">
                        Page {page + 1} of {totalPages}
                        <span className="ml-2 text-gray-600">({data?.total ?? 0} total)</span>
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
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 rounded bg-gray-800 text-sm text-gray-300
                                       hover:bg-gray-700 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
