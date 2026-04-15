// Error Events Dashboard — view and triage Sentry errors captured by the webhook.

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import StatCard from "@/components/god-mode/StatCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ErrorStatus = "open" | "investigating" | "resolved" | "wont_fix";

interface ErrorEvent {
    id: string;
    sentry_issue_id: string;
    sentry_issue_url: string | null;
    title: string;
    level: string;
    culprit: string | null;
    event_count: number;
    user_count: number;
    first_seen_at: string;
    status: ErrorStatus;
    resolution_notes: string | null;
    resolved_at: string | null;
    created_at: string;
    owner_id: string | null;
    owner_name: string | null;
    escalation_level: "normal" | "elevated" | "critical";
    sla_due_at: string | null;
    ops_note: string | null;
    is_sla_breached: boolean;
}

interface ErrorsResponse {
    events: ErrorEvent[];
    total: number;
    open_count: number;
    fatal_count: number;
    resolved_this_week: number;
    claimed_count: number;
    elevated_count: number;
    sla_breach_count: number;
    page: number;
    pages: number;
    meta?: {
        integrity_warnings?: Array<{ message: string }>;
    };
}

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------

const STATUS_TABS: Array<{ value: string; label: string }> = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "investigating", label: "Investigating" },
    { value: "resolved", label: "Resolved" },
    { value: "wont_fix", label: "Won't Fix" },
];

const LEVEL_BADGE: Record<string, string> = {
    fatal: "bg-red-950 text-red-300 border border-red-800",
    error: "bg-orange-950/60 text-orange-300 border border-orange-800/50",
    warning: "bg-yellow-950/60 text-yellow-300 border border-yellow-800/50",
    info: "bg-blue-950/60 text-blue-300 border border-blue-800/50",
    debug: "bg-gray-800 text-gray-400 border border-gray-700",
};

const LEVEL_EMOJI: Record<string, string> = {
    fatal: "💀",
    error: "🔴",
    warning: "🟡",
    info: "🔵",
    debug: "⚪",
};

const STATUS_BADGE: Record<string, string> = {
    open: "bg-red-900/60 text-red-300",
    investigating: "bg-amber-900/60 text-amber-300",
    resolved: "bg-emerald-900/60 text-emerald-300",
    wont_fix: "bg-gray-800 text-gray-400",
};

const ESCALATION_BADGE: Record<string, string> = {
    normal: "bg-gray-800 text-gray-400",
    elevated: "bg-amber-900/60 text-amber-300",
    critical: "bg-red-900/60 text-red-300",
};

const STATUS_OPTIONS: Array<{ value: ErrorStatus; label: string }> = [
    { value: "open", label: "Open" },
    { value: "investigating", label: "Investigating" },
    { value: "resolved", label: "Resolved" },
    { value: "wont_fix", label: "Won't Fix" },
];

function timeAgo(iso: string | null): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function dueLabel(iso: string | null): string {
    if (!iso) return "No SLA";
    const diffMs = new Date(iso).getTime() - Date.now();
    const mins = Math.floor(Math.abs(diffMs) / 60_000);
    if (mins < 60) return diffMs >= 0 ? `in ${mins}m` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return diffMs >= 0 ? `in ${hours}h` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return diffMs >= 0 ? `in ${days}d` : `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Expandable row component
// ---------------------------------------------------------------------------

interface ErrorRowProps {
    event: ErrorEvent;
    onSaved: () => void;
    autoExpand?: boolean;
}

function ErrorRow({ event, onSaved, autoExpand = false }: ErrorRowProps) {
    const [expanded, setExpanded] = useState(false);
    const [notes, setNotes] = useState(event.resolution_notes ?? "");
    const [newStatus, setNewStatus] = useState<ErrorStatus>(event.status);
    const [opsEscalation, setOpsEscalation] = useState<"normal" | "elevated" | "critical">(event.escalation_level ?? "normal");
    const [opsSlaDueAt, setOpsSlaDueAt] = useState(event.sla_due_at ? new Date(new Date(event.sla_due_at).getTime() - (new Date().getTimezoneOffset() * 60_000)).toISOString().slice(0, 16) : "");
    const [opsNote, setOpsNote] = useState(event.ops_note ?? "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (autoExpand) setExpanded(true);
    }, [autoExpand]);

    useEffect(() => {
        setNotes(event.resolution_notes ?? "");
        setNewStatus(event.status);
        setOpsEscalation(event.escalation_level ?? "normal");
        setOpsSlaDueAt(event.sla_due_at ? new Date(new Date(event.sla_due_at).getTime() - (new Date().getTimezoneOffset() * 60_000)).toISOString().slice(0, 16) : "");
        setOpsNote(event.ops_note ?? "");
    }, [event.escalation_level, event.ops_note, event.resolution_notes, event.sla_due_at, event.status]);

    async function handleSave() {
        setSaving(true);
        try {
            const res = await authedFetch(`/api/superadmin/errors/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    resolution_notes: notes,
                    escalation_level: opsEscalation,
                    sla_due_at: opsSlaDueAt ? new Date(opsSlaDueAt).toISOString() : null,
                    ops_note: opsNote.trim() || null,
                }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                onSaved();
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleClaimToggle() {
        setSaving(true);
        try {
            const res = await authedFetch(`/api/superadmin/errors/${event.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event.owner_id ? { release: true } : { claim: true }),
            });
            if (res.ok) onSaved();
        } finally {
            setSaving(false);
        }
    }

    const levelEmoji = LEVEL_EMOJI[event.level] ?? "🔴";

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Row header */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full text-left p-4 hover:bg-gray-800/40 transition-colors"
            >
                <div className="flex items-start gap-3">
                    {/* Level badge */}
                    <span className={`mt-0.5 flex-shrink-0 px-2 py-0.5 rounded text-xs font-mono font-semibold ${LEVEL_BADGE[event.level] ?? LEVEL_BADGE.error}`}>
                        {levelEmoji} {event.level}
                    </span>

                    {/* Title + culprit */}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm leading-snug line-clamp-2">{event.title}</p>
                        {event.culprit && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{event.culprit}</p>
                        )}
                    </div>

                    {/* Meta + expand icon */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400">{event.event_count} event{event.event_count !== 1 ? "s" : ""}</p>
                            {event.user_count > 0 && (
                                <p className="text-xs text-gray-500">{event.user_count} user{event.user_count !== 1 ? "s" : ""}</p>
                            )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[event.status] ?? "bg-gray-800 text-gray-400"}`}>
                            {event.status.replace("_", " ")}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ESCALATION_BADGE[event.escalation_level] ?? ESCALATION_BADGE.normal}`}>
                            {event.escalation_level}
                        </span>
                        <span className="text-xs text-gray-500 hidden md:block">{timeAgo(event.first_seen_at)}</span>
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                    </div>
                </div>
            </button>

            {/* Expanded panel */}
            {expanded && (
                <div className="border-t border-gray-800 p-4 space-y-4 bg-gray-950/40">
                    {/* Links + meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        {event.sentry_issue_url && (
                            <a
                                href={event.sentry_issue_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View in Sentry
                            </a>
                        )}
                        <span>First seen: {timeAgo(event.first_seen_at)}</span>
                        <span className="sm:hidden">
                            {event.event_count} event{event.event_count !== 1 ? "s" : ""}
                            {event.user_count > 0 ? `, ${event.user_count} user${event.user_count !== 1 ? "s" : ""}` : ""}
                        </span>
                        {event.resolved_at && (
                            <span>Resolved: {timeAgo(event.resolved_at)}</span>
                        )}
                    </div>

                    {/* Triage form */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Triage</p>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {event.owner_name ? (
                                    <span className="rounded bg-blue-950/40 px-2 py-0.5 text-xs text-blue-300">Owner: {event.owner_name}</span>
                                ) : (
                                    <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">Unowned</span>
                                )}
                                {event.sla_due_at && (
                                    <span className={`rounded px-2 py-0.5 text-xs ${event.is_sla_breached ? "bg-red-950/40 text-red-300" : "bg-gray-800 text-gray-300"}`}>
                                        SLA {event.is_sla_breached ? "breached" : dueLabel(event.sla_due_at)}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleClaimToggle}
                                disabled={saving}
                                className="rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-50"
                            >
                                {event.owner_id ? "Release" : "Claim"}
                            </button>
                        </div>

                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as ErrorStatus)}
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                       text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                        >
                            {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <select
                                value={opsEscalation}
                                onChange={(e) => setOpsEscalation(e.target.value as "normal" | "elevated" | "critical")}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                            >
                                <option value="normal">Escalation: Normal</option>
                                <option value="elevated">Escalation: Elevated</option>
                                <option value="critical">Escalation: Critical</option>
                            </select>
                            <input
                                type="datetime-local"
                                value={opsSlaDueAt}
                                onChange={(e) => setOpsSlaDueAt(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                            />
                        </div>

                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Resolution notes (optional)…"
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                       text-sm text-gray-200 placeholder-gray-500 resize-none
                                       focus:outline-none focus:border-amber-500/50"
                        />
                        <textarea
                            value={opsNote}
                            onChange={(e) => setOpsNote(e.target.value)}
                            rows={2}
                            placeholder="Ops note for handoffs (optional)…"
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500/50"
                        />

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm
                                       hover:bg-amber-400 transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ErrorsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "open");
    const [data, setData] = useState<ErrorsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const eventId = searchParams.get("eventId");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ status: statusFilter, limit: "50" });
            const res = await fetch(`/api/superadmin/errors?${params}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        else params.delete("status");

        const next = params.toString();
        if (next !== searchParams.toString()) {
            router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
        }
    }, [pathname, router, searchParams, statusFilter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Error Events</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Sentry issues synced automatically</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                               hover:text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard label="Open" value={loading ? "…" : (data?.open_count ?? 0)} accent="red" />
                <StatCard label="Fatals" value={loading ? "…" : (data?.fatal_count ?? 0)} accent="red" />
                <StatCard label="Resolved This Week" value={loading ? "…" : (data?.resolved_this_week ?? 0)} accent="emerald" />
                <StatCard label="Owned" value={loading ? "…" : (data?.claimed_count ?? 0)} accent="blue" />
                <StatCard label="Escalated" value={loading ? "…" : (data?.elevated_count ?? 0)} accent="amber" />
                <StatCard label="SLA Breached" value={loading ? "…" : (data?.sla_breach_count ?? 0)} accent="red" />
            </div>

            {(data?.meta?.integrity_warnings?.length ?? 0) > 0 && (
                <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-xs text-amber-200">
                    {data?.meta?.integrity_warnings?.[0]?.message}
                </div>
            )}

            {/* Status tabs */}
            <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                            statusFilter === tab.value
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Events list */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                    ))
                ) : (data?.events ?? []).length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <p className="text-4xl mb-3">✅</p>
                        <p>No errors in this category</p>
                    </div>
                ) : (
                    (data?.events ?? []).map((event) => (
                        <ErrorRow
                            key={event.id}
                            event={event}
                            onSaved={fetchData}
                            autoExpand={eventId === event.id}
                        />
                    ))
                )}
            </div>

            {/* Pagination info */}
            {data && data.pages > 1 && (
                <p className="text-center text-xs text-gray-500">
                    Showing page {(data.page ?? 0) + 1} of {data.pages} ({data.total} total)
                </p>
            )}
        </div>
    );
}
