"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Columns3, RefreshCcw, ArrowRight, ArrowLeft, Clock3, Search } from "lucide-react";

type LifecycleStage =
    | "lead"
    | "prospect"
    | "proposal"
    | "payment_pending"
    | "payment_confirmed"
    | "active"
    | "review"
    | "past";

interface ClientCard {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    lifecycle_stage: LifecycleStage | null;
    lead_status: string | null;
}

interface StageEvent {
    id: string;
    profile_id: string;
    from_stage: string;
    to_stage: string;
    created_at: string;
    profile: {
        full_name: string | null;
        email: string | null;
    } | null;
    changed_by_profile: {
        full_name: string | null;
        email: string | null;
    } | null;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
    "lead",
    "prospect",
    "proposal",
    "payment_pending",
    "payment_confirmed",
    "active",
    "review",
    "past",
];

const STAGE_LABELS: Record<LifecycleStage, string> = {
    lead: "Lead",
    prospect: "Prospect",
    proposal: "Proposal",
    payment_pending: "Payment Pending",
    payment_confirmed: "Payment Confirmed",
    active: "Active Trip",
    review: "Review",
    past: "Closed",
};

const mockClients: ClientCard[] = [
    { id: "c1", full_name: "Ava Chen", email: "ava@example.com", phone: "+1 415 555 1010", lifecycle_stage: "lead", lead_status: "new" },
    { id: "c2", full_name: "Liam Walker", email: "liam@example.com", phone: "+44 20 7000 1000", lifecycle_stage: "payment_pending", lead_status: "qualified" },
    { id: "c3", full_name: "Sofia Ramirez", email: "sofia@example.com", phone: "+34 91 123 4567", lifecycle_stage: "review", lead_status: "contacted" },
];

const mockEvents: StageEvent[] = [
    {
        id: "e1",
        profile_id: "c2",
        from_stage: "proposal",
        to_stage: "payment_pending",
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        profile: { full_name: "Liam Walker", email: "liam@example.com" },
        changed_by_profile: { full_name: "Admin User", email: "admin@example.com" },
    },
];

export default function AdminKanbanPage() {
    const supabase = createClient();
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";
    const [clients, setClients] = useState<ClientCard[]>([]);
    const [events, setEvents] = useState<StageEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [movingClientId, setMovingClientId] = useState<string | null>(null);
    const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (useMockAdmin) {
                setClients(mockClients);
                setEvents(mockEvents);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }

            const [clientsRes, eventsRes] = await Promise.all([
                fetch("/api/admin/clients", { headers }),
                fetch("/api/admin/workflow/events?limit=40", { headers }),
            ]);

            const clientsPayload = await clientsRes.json();
            const eventsPayload = await eventsRes.json();

            if (!clientsRes.ok) {
                throw new Error(clientsPayload?.error || "Failed to fetch clients");
            }
            if (!eventsRes.ok) {
                throw new Error(eventsPayload?.error || "Failed to fetch stage events");
            }

            setClients((clientsPayload.clients || []) as ClientCard[]);
            setEvents((eventsPayload.events || []) as StageEvent[]);
        } catch (error) {
            console.error("Kanban data fetch failed:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, useMockAdmin]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const filteredClients = useMemo(
        () =>
            clients.filter((client) => {
                const q = searchTerm.trim().toLowerCase();
                if (!q) return true;
                return (
                    client.full_name?.toLowerCase().includes(q) ||
                    client.email?.toLowerCase().includes(q) ||
                    client.phone?.toLowerCase().includes(q)
                );
            }),
        [clients, searchTerm]
    );

    const clientsByStage = useMemo(
        () =>
            LIFECYCLE_STAGES.map((stage) => ({
                stage,
                label: STAGE_LABELS[stage],
                clients: filteredClients.filter((client) => (client.lifecycle_stage || "lead") === stage),
            })),
        [filteredClients]
    );

    const stageIndex = (stage?: string | null) => {
        const idx = LIFECYCLE_STAGES.indexOf((stage || "lead") as LifecycleStage);
        return idx < 0 ? 0 : idx;
    };

    const moveToStage = async (client: ClientCard, stage: LifecycleStage) => {
        if ((client.lifecycle_stage || "lead") === stage) return;
        setMovingClientId(client.id);
        try {
            if (useMockAdmin) {
                setClients((prev) => prev.map((row) => (row.id === client.id ? { ...row, lifecycle_stage: stage } : row)));
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({ id: client.id, lifecycle_stage: stage }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to update stage");
            }

            setClients((prev) => prev.map((row) => (row.id === client.id ? { ...row, lifecycle_stage: stage } : row)));
            await fetchData();
        } catch (error) {
            console.error("Stage move failed:", error);
            alert(error instanceof Error ? error.message : "Failed to move stage");
        } finally {
            setMovingClientId(null);
        }
    };

    const handleDrop = async (stage: LifecycleStage) => {
        if (!draggingClientId) return;
        const client = clients.find((row) => row.id === draggingClientId);
        setDraggingClientId(null);
        if (!client) return;
        await moveToStage(client, stage);
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs uppercase tracking-[0.3em] text-[#bda87f]">Operations</span>
                    <h1 className="text-3xl font-[var(--font-display)] text-[#1b140a] mt-2 flex items-center gap-3">
                        <Columns3 className="w-8 h-8 text-[#c4a870]" />
                        Lifecycle Kanban
                    </h1>
                    <p className="text-[#6f5b3e] mt-1">Drag or move clients between stages. Notifications run on configured transitions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#b09a74]" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search client..."
                            className="pl-9 pr-3 py-2 rounded-lg border border-[#eadfcd] bg-white text-sm text-[#1b140a] w-[220px]"
                        />
                    </div>
                    <button
                        onClick={() => void fetchData()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#eadfcd] rounded-lg text-[#6f5b3e] hover:bg-[#f8f1e6] transition-colors shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 items-start">
                {clientsByStage.map((column) => (
                    <div
                        key={column.stage}
                        className="min-w-[290px] max-w-[290px] rounded-2xl border border-[#eadfcd] bg-gradient-to-b from-[#fffaf2] to-[#f8efe0] p-3 shadow-[0_10px_24px_rgba(20,16,12,0.06)] self-start"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => void handleDrop(column.stage)}
                    >
                        <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#fff8ec]/90 backdrop-blur rounded-lg px-2 py-1 border border-[#f1e4cf]">
                            <p className="text-xs uppercase tracking-wide font-semibold text-[#9c7c46]">{column.label}</p>
                            <span className="text-xs font-semibold text-[#6f5b3e] bg-white px-2 py-0.5 rounded-full border border-[#eadfcd]">{column.clients.length}</span>
                        </div>
                        <div className="space-y-2 min-h-[120px]">
                            {column.clients.map((client) => {
                                const idx = stageIndex(client.lifecycle_stage);
                                const prev = idx > 0 ? LIFECYCLE_STAGES[idx - 1] : null;
                                const next = idx < LIFECYCLE_STAGES.length - 1 ? LIFECYCLE_STAGES[idx + 1] : null;
                                return (
                                    <div
                                        key={client.id}
                                        draggable
                                        onDragStart={() => setDraggingClientId(client.id)}
                                        onDragEnd={() => setDraggingClientId(null)}
                                        className="rounded-xl border border-[#eadfcd] bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-[0_12px_18px_rgba(20,16,12,0.08)] transition-shadow"
                                    >
                                        <p className="text-sm font-semibold text-[#1b140a] truncate">{client.full_name || "Unnamed Client"}</p>
                                        <p className="text-xs text-[#8d7650] truncate">{client.email || "No email"}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <p className="text-[10px] text-[#b09a74] uppercase tracking-wide">{client.lead_status || "new"}</p>
                                            <span className="text-[10px] text-[#8d7650]">•</span>
                                            <p className="text-[10px] text-[#8d7650]">{client.phone || "No phone"}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => prev && void moveToStage(client, prev)}
                                                disabled={!prev || movingClientId === client.id}
                                                className="text-[11px] px-2 py-1 rounded-md border border-[#eadfcd] text-[#6f5b3e] disabled:opacity-40"
                                            >
                                                <ArrowLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => next && void moveToStage(client, next)}
                                                disabled={!next || movingClientId === client.id}
                                                className="text-[11px] px-2 py-1 rounded-md border border-[#eadfcd] text-[#6f5b3e] disabled:opacity-40"
                                            >
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                            {movingClientId === client.id ? (
                                                <span className="text-[10px] text-[#9c7c46]">Saving…</span>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                            {!loading && column.clients.length === 0 ? (
                                <p className="text-xs text-[#b09a74]">No clients</p>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-[#eadfcd] bg-white/90 p-5 shadow-[0_12px_30px_rgba(20,16,12,0.06)]">
                <div className="flex items-center gap-2 mb-3">
                    <Clock3 className="w-5 h-5 text-[#9c7c46]" />
                    <h2 className="text-lg font-[var(--font-display)] text-[#1b140a]">Recent Stage Transitions</h2>
                </div>
                <div className="space-y-2">
                    {events.length === 0 ? (
                        <p className="text-sm text-[#8d7650]">No transitions yet.</p>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="rounded-lg border border-[#eadfcd] bg-[#fcf8f1] px-3 py-2">
                                <p className="text-sm text-[#1b140a]">
                                    <span className="font-semibold">{event.profile?.full_name || event.profile?.email || "Client"}</span>
                                    {" moved "}
                                    <span className="font-semibold">{STAGE_LABELS[(event.from_stage as LifecycleStage)] || event.from_stage}</span>
                                    {" → "}
                                    <span className="font-semibold">{STAGE_LABELS[(event.to_stage as LifecycleStage)] || event.to_stage}</span>
                                </p>
                                <p className="text-xs text-[#8d7650]">
                                    {new Date(event.created_at).toLocaleString()} by {event.changed_by_profile?.full_name || event.changed_by_profile?.email || "Admin"}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
