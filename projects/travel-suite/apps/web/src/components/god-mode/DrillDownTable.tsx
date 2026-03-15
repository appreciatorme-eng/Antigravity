// DrillDownTable — sortable, searchable, paginated table for god-mode drill-through views.

"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
    className?: string;
}

export interface DrillDownTableProps<T extends Record<string, unknown>> {
    columns: TableColumn<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    searchable?: boolean;
    searchKeys?: (keyof T)[];
    pageSize?: number;
    className?: string;
    emptyMessage?: string;
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
    return key.split(".").reduce((acc: unknown, k) => {
        if (acc && typeof acc === "object") {
            return (acc as Record<string, unknown>)[k];
        }
        return undefined;
    }, obj);
}

export default function DrillDownTable<T extends Record<string, unknown>>({
    columns,
    data,
    onRowClick,
    searchable = false,
    searchKeys = [],
    pageSize = 20,
    className,
    emptyMessage = "No data found",
}: DrillDownTableProps<T>) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        if (!searchable || !search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter((row) =>
            searchKeys.some((k) => {
                const val = getNestedValue(row as Record<string, unknown>, k as string);
                return String(val ?? "").toLowerCase().includes(q);
            })
        );
    }, [data, search, searchable, searchKeys]);

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const av = getNestedValue(a as Record<string, unknown>, sortKey);
            const bv = getNestedValue(b as Record<string, unknown>, sortKey);
            const aStr = String(av ?? "");
            const bStr = String(bv ?? "");
            const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.ceil(sorted.length / pageSize);
    const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setPage(0);
    };

    return (
        <div className={cn("space-y-3", className)}>
            {searchable && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    />
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-800">
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    onClick={() => col.sortable && handleSort(String(col.key))}
                                    className={cn(
                                        "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                        col.sortable && "cursor-pointer hover:text-gray-300 select-none",
                                        col.className
                                    )}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable && sortKey === String(col.key) && (
                                            sortDir === "asc"
                                                ? <ChevronUp className="w-3 h-3 text-amber-400" />
                                                : <ChevronDown className="w-3 h-3 text-amber-400" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 text-sm">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paged.map((row, i) => (
                                <tr
                                    key={i}
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        "border-b border-gray-800/60 last:border-0",
                                        onRowClick && "cursor-pointer hover:bg-gray-800/50 transition-colors"
                                    )}
                                >
                                    {columns.map((col) => {
                                        const val = getNestedValue(row as Record<string, unknown>, String(col.key));
                                        return (
                                            <td key={String(col.key)} className={cn("px-4 py-3 text-gray-300", col.className)}>
                                                {col.render ? col.render(val, row) : String(val ?? "—")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{sorted.length} results</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >
                            Prev
                        </button>
                        <span className="text-gray-400">{page + 1} / {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1.5 rounded-lg bg-gray-800 disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
