// Support Tickets — view and respond to support tickets from all organizations.

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, RefreshCw, Clock } from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import SlideOutPanel from "@/components/god-mode/SlideOutPanel";
import StatCard from "@/components/god-mode/StatCard";

interface TicketSummary {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    priority: string | null;
    status: string;
    created_at: string | null;
    user_name: string | null;
    user_email: string | null;
    org_name: string | null;
    has_response: boolean;
    responded_at: string | null;
    owner_id: string | null;
    owner_name: string | null;
    escalation_level: "normal" | "elevated" | "critical";
    sla_due_at: string | null;
    ops_note: string | null;
    is_sla_breached: boolean;
}

interface TicketDetail {
    ticket: {
        id: string; title: string; description: string | null;
        category: string | null; priority: string | null; status: string;
        admin_response: string | null; responded_at: string | null; created_at: string | null;
    };
    user: { id: string; full_name: string | null; email: string | null; phone: string | null; role: string | null };
    organization: { id: string; name: string; slug: string; tier: string } | null;
    management: {
        owner_id: string | null;
        escalation_level: "normal" | "elevated" | "critical";
        sla_due_at: string | null;
        ops_note: string | null;
        updated_at: string | null;
        owner: { id: string; name: string; email: string | null } | null;
    };
}

interface TicketsResponse {
    tickets: TicketSummary[];
    total: number;
    open_count: number;
    in_progress_count: number;
    claimed_count: number;
    elevated_count: number;
    sla_breach_count: number;
    meta?: {
        integrity_warnings?: Array<{ message: string }>;
    };
}

const PRIORITY_BADGE: Record<string, string> = {
    low: "bg-gray-700 text-gray-300",
    medium: "bg-blue-900/60 text-blue-300",
    high: "bg-amber-900/60 text-amber-300",
    urgent: "bg-red-900/60 text-red-300",
};

const STATUS_BADGE: Record<string, string> = {
    open: "bg-red-900/60 text-red-300",
    in_progress: "bg-amber-900/60 text-amber-300",
    resolved: "bg-emerald-900/60 text-emerald-300",
    closed: "bg-gray-800 text-gray-400",
};

const STATUS_TABS = ["all", "open", "in_progress", "resolved", "closed"] as const;
const ESCALATION_BADGE: Record<string, string> = {
    normal: "bg-gray-800 text-gray-400",
    elevated: "bg-amber-900/60 text-amber-300",
    critical: "bg-red-900/60 text-red-300",
};

function timeAgo(iso: string | null): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
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

function toLocalDateTimeInput(iso: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const localMs = date.getTime() - (date.getTimezoneOffset() * 60_000);
    return new Date(localMs).toISOString().slice(0, 16);
}

export default function SupportPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") ?? "all");
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [data, setData] = useState<TicketsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
    const [panelOpen, setPanelOpen] = useState(Boolean(searchParams.get("ticketId")));
    const [responseText, setResponseText] = useState("");
    const [responseStatus, setResponseStatus] = useState("resolved");
    const [submitting, setSubmitting] = useState(false);
    const [opsEscalation, setOpsEscalation] = useState<"normal" | "elevated" | "critical">("normal");
    const [opsSlaDueAt, setOpsSlaDueAt] = useState("");
    const [opsNote, setOpsNote] = useState("");
    const [savingOps, setSavingOps] = useState(false);

    const ticketId = searchParams.get("ticketId");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ status: statusFilter, search, limit: "50" });
            const res = await fetch(`/api/superadmin/support/tickets?${params}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openTicket = useCallback(async (id: string) => {
        setPanelOpen(true);
        setSelectedTicket(null);
        setResponseText("");
        const res = await fetch(`/api/superadmin/support/tickets/${id}`);
        if (res.ok) {
            const detail = await res.json();
            setSelectedTicket(detail);
            setResponseText(detail.ticket.admin_response ?? "");
            setOpsEscalation(detail.management?.escalation_level ?? "normal");
            setOpsSlaDueAt(toLocalDateTimeInput(detail.management?.sla_due_at ?? null));
            setOpsNote(detail.management?.ops_note ?? "");
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        else params.delete("status");
        if (search.trim()) params.set("search", search.trim());
        else params.delete("search");
        const activeTicketId = selectedTicket?.ticket.id ?? (panelOpen ? ticketId : null);
        if (activeTicketId) params.set("ticketId", activeTicketId);
        else params.delete("ticketId");

        const next = params.toString();
        if (next !== searchParams.toString()) {
            router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
        }
    }, [pathname, panelOpen, router, search, searchParams, selectedTicket?.ticket.id, statusFilter, ticketId]);

    useEffect(() => {
        if (!ticketId) return;
        if (selectedTicket?.ticket.id === ticketId && panelOpen) return;
        void openTicket(ticketId);
    }, [openTicket, panelOpen, selectedTicket?.ticket.id, ticketId]);

    const filteredTickets = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return data?.tickets ?? [];
        return (data?.tickets ?? []).filter((ticket) => {
            return [
                ticket.title,
                ticket.description,
                ticket.user_name,
                ticket.user_email,
                ticket.org_name,
            ].some((value) => value?.toLowerCase().includes(query));
        });
    }, [data?.tickets, search]);

    async function submitResponse() {
        if (!selectedTicket || !responseText.trim()) return;
        setSubmitting(true);
        try {
            const res = await authedFetch(`/api/superadmin/support/tickets/${selectedTicket.ticket.id}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: responseText.trim(), new_status: responseStatus }),
            });
            if (res.ok) {
                await fetchData();
                setPanelOpen(false);
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function updateOpsControls(patch: Record<string, unknown>) {
        if (!selectedTicket) return;
        setSavingOps(true);
        try {
            const response = await authedFetch(`/api/superadmin/support/tickets/${selectedTicket.ticket.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!response.ok) return;
            const payload = await response.json();
            setSelectedTicket((previous) => (
                previous
                    ? {
                        ...previous,
                        management: {
                            ...previous.management,
                            ...(payload.management ?? {}),
                        },
                    }
                    : previous
            ));
            await fetchData();
        } finally {
            setSavingOps(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Respond to user support requests</p>
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <StatCard label="Open Tickets" value={loading ? "…" : (data?.open_count ?? 0)} accent="red" />
                <StatCard label="In Progress" value={loading ? "…" : (data?.in_progress_count ?? 0)} accent="amber" />
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
                {STATUS_TABS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                            statusFilter === s
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                        {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title…"
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700
                               text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                />
            </div>

            {/* Ticket cards */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                    ))
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No tickets found</div>
                ) : (
                    filteredTickets.map((ticket) => (
                        <button
                            key={ticket.id}
                            onClick={() => openTicket(ticket.id)}
                            className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4
                                       hover:border-gray-700 transition-colors space-y-2"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className="font-medium text-white text-sm line-clamp-1">{ticket.title}</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_BADGE[ticket.priority ?? "medium"] ?? "bg-gray-700 text-gray-300"}`}>
                                        {ticket.priority ?? "medium"}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[ticket.status] ?? "bg-gray-700 text-gray-300"}`}>
                                        {ticket.status.replace("_", " ")}
                                    </span>
                                </div>
                            </div>
                            {ticket.description && (
                                <p className="text-xs text-gray-500 line-clamp-2">{ticket.description}</p>
                            )}
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>{ticket.user_name ?? ticket.user_email ?? "Unknown"}</span>
                                    {ticket.org_name && <span>· {ticket.org_name}</span>}
                                    {ticket.owner_name && <span>· Owner: {ticket.owner_name}</span>}
                                    <span className="flex items-center gap-1 ml-auto">
                                        <Clock className="w-3 h-3" />
                                        {timeAgo(ticket.created_at)}
                                    </span>
                                    {ticket.has_response && (
                                        <span className="text-emerald-500">✓ Responded</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className={`rounded px-2 py-0.5 ${ESCALATION_BADGE[ticket.escalation_level] ?? ESCALATION_BADGE.normal}`}>
                                        {ticket.escalation_level}
                                    </span>
                                    {ticket.sla_due_at && (
                                        <span className={`rounded px-2 py-0.5 ${
                                            ticket.is_sla_breached ? "bg-red-950/50 text-red-300" : "bg-gray-800 text-gray-300"
                                        }`}>
                                            SLA {ticket.is_sla_breached ? "breached" : `due ${dueLabel(ticket.sla_due_at)}`}
                                        </span>
                                    )}
                                </div>
                        </button>
                    ))
                )}
            </div>

            {/* Ticket detail panel */}
            <SlideOutPanel
                open={panelOpen}
                onClose={() => { setPanelOpen(false); setSelectedTicket(null); }}
                title="Ticket Detail"
            >
                {selectedTicket ? (
                    <div className="space-y-6">
                        {/* Ticket info */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_BADGE[selectedTicket.ticket.priority ?? "medium"] ?? ""}`}>
                                    {selectedTicket.ticket.priority ?? "medium"}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[selectedTicket.ticket.status] ?? ""}`}>
                                    {selectedTicket.ticket.status.replace("_", " ")}
                                </span>
                            </div>
                            <h3 className="text-white font-semibold">{selectedTicket.ticket.title}</h3>
                            {selectedTicket.ticket.description && (
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedTicket.ticket.description}</p>
                            )}
                        </div>

                        {/* User + org */}
                        <div className="space-y-1 text-sm">
                            <p className="text-gray-400">From: <span className="text-white">{selectedTicket.user.full_name ?? selectedTicket.user.email}</span></p>
                            {selectedTicket.user.email && <p className="text-gray-400">Email: <span className="text-gray-300">{selectedTicket.user.email}</span></p>}
                            {selectedTicket.organization && (
                                <p className="text-gray-400">Org: <span className="text-gray-300">{selectedTicket.organization.name} ({selectedTicket.organization.tier})</span></p>
                            )}
                        </div>

                        {/* Manager controls */}
                        <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Queue Controls</p>
                                <div className="flex items-center gap-2">
                                    {selectedTicket.management.owner ? (
                                        <span className="rounded bg-blue-950/40 px-2 py-0.5 text-xs text-blue-300">
                                            Owner: {selectedTicket.management.owner.name}
                                        </span>
                                    ) : (
                                        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                                            Unowned
                                        </span>
                                    )}
                                    <button
                                        onClick={() => updateOpsControls(selectedTicket.management.owner ? { release: true } : { claim: true })}
                                        disabled={savingOps}
                                        className="rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-50"
                                    >
                                        {selectedTicket.management.owner ? "Release" : "Claim"}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <select
                                    value={opsEscalation}
                                    onChange={(event) => setOpsEscalation(event.target.value as "normal" | "elevated" | "critical")}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50"
                                >
                                    <option value="normal">Escalation: Normal</option>
                                    <option value="elevated">Escalation: Elevated</option>
                                    <option value="critical">Escalation: Critical</option>
                                </select>
                                <input
                                    type="datetime-local"
                                    value={opsSlaDueAt}
                                    onChange={(event) => setOpsSlaDueAt(event.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50"
                                />
                            </div>
                            <textarea
                                rows={3}
                                value={opsNote}
                                onChange={(event) => setOpsNote(event.target.value)}
                                placeholder="Ops note for next responder…"
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500/50"
                            />
                            <button
                                onClick={() => updateOpsControls({
                                    escalation_level: opsEscalation,
                                    sla_due_at: opsSlaDueAt ? new Date(opsSlaDueAt).toISOString() : null,
                                    ops_note: opsNote.trim() || null,
                                })}
                                disabled={savingOps}
                                className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
                            >
                                {savingOps ? "Saving controls…" : "Save Queue Controls"}
                            </button>
                            {selectedTicket.management.sla_due_at && (
                                <p className={`text-xs ${new Date(selectedTicket.management.sla_due_at).getTime() < Date.now() ? "text-red-300" : "text-gray-400"}`}>
                                    SLA due {dueLabel(selectedTicket.management.sla_due_at)}
                                </p>
                            )}
                        </div>

                        {/* Existing response */}
                        {selectedTicket.ticket.admin_response && (
                            <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-3">
                                <p className="text-xs font-semibold text-emerald-400 mb-1">Previous Response</p>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedTicket.ticket.admin_response}</p>
                                <p className="text-xs text-gray-500 mt-1">{timeAgo(selectedTicket.ticket.responded_at)}</p>
                            </div>
                        )}

                        {/* Response form */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {selectedTicket.ticket.admin_response ? "Update Response" : "Add Response"}
                            </p>
                            <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                rows={5}
                                placeholder="Write your response…"
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                           text-sm text-gray-200 placeholder-gray-500 resize-none
                                           focus:outline-none focus:border-amber-500/50"
                            />
                            <select
                                value={responseStatus}
                                onChange={(e) => setResponseStatus(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                           text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                            >
                                <option value="in_progress">Mark In Progress</option>
                                <option value="resolved">Mark Resolved</option>
                                <option value="closed">Mark Closed</option>
                            </select>
                            <button
                                onClick={submitResponse}
                                disabled={submitting || !responseText.trim()}
                                className="w-full py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm
                                           hover:bg-amber-400 transition-colors disabled:opacity-50"
                            >
                                {submitting ? "Sending…" : "Send Response"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-10 bg-gray-800 animate-pulse rounded" />
                        ))}
                    </div>
                )}
            </SlideOutPanel>
        </div>
    );
}
