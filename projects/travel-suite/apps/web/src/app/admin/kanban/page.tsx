"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Columns3, RefreshCcw, ArrowRight, ArrowLeft, Clock3, Search, Phone, Upload, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { useToast } from "@/components/ui/toast";

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
    phase_notifications_enabled?: boolean | null;
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

interface ContactItem {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    source: string | null;
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

function getStageLabel(value: string | null | undefined): string {
    if (!value) return "Unknown";
    if (value === "pre_lead") return "Pre-Lead";
    return STAGE_LABELS[value as LifecycleStage] || value;
}

export default function AdminKanbanPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [clients, setClients] = useState<ClientCard[]>([]);
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [events, setEvents] = useState<StageEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [movingClientId, setMovingClientId] = useState<string | null>(null);
    const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [contactSearch, setContactSearch] = useState("");
    const [importingContacts, setImportingContacts] = useState(false);
    const [promotingContactId, setPromotingContactId] = useState<string | null>(null);
    const [contactsError, setContactsError] = useState<string | null>(null);
    const csvInputRef = useRef<HTMLInputElement | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }

            const [clientsResult, contactsResult, eventsResult] = await Promise.allSettled([
                fetch("/api/admin/clients", { headers }),
                fetch("/api/admin/contacts", { headers }),
                fetch("/api/admin/workflow/events?limit=40", { headers }),
            ]);

            if (clientsResult.status !== "fulfilled") {
                throw new Error("Failed to fetch clients");
            }

            const clientsRes = clientsResult.value;
            const clientsPayload = await clientsRes.json();
            if (!clientsRes.ok) {
                throw new Error(clientsPayload?.error || "Failed to fetch clients");
            }
            setClients((clientsPayload.clients || []) as ClientCard[]);

            if (eventsResult.status === "fulfilled") {
                const eventsRes = eventsResult.value;
                const eventsPayload = await eventsRes.json();
                if (eventsRes.ok) {
                    setEvents((eventsPayload.events || []) as StageEvent[]);
                }
            }

            if (contactsResult.status === "fulfilled") {
                const contactsRes = contactsResult.value;
                const contactsPayload = await contactsRes.json();
                if (contactsRes.ok) {
                    setContacts((contactsPayload.contacts || []) as ContactItem[]);
                    setContactsError(null);
                } else {
                    setContacts([]);
                    setContactsError(contactsPayload?.error || "Contacts unavailable");
                }
            } else {
                setContacts([]);
                setContactsError("Contacts unavailable");
            }
        } catch (error) {
            console.error("Kanban data fetch failed:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

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

    const filteredContacts = useMemo(() => {
        const q = contactSearch.trim().toLowerCase();
        if (!q) return contacts;
        return contacts.filter((item) => (
            item.full_name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q) ||
            item.phone?.toLowerCase().includes(q)
        ));
    }, [contacts, contactSearch]);

    const totalVisibleClients = filteredClients.length;
    const totalPreLeadContacts = filteredContacts.length;

    const stageIndex = (stage?: string | null) => {
        const idx = LIFECYCLE_STAGES.indexOf((stage || "lead") as LifecycleStage);
        return idx < 0 ? 0 : idx;
    };

    const moveToStage = async (client: ClientCard, stage: LifecycleStage) => {
        if ((client.lifecycle_stage || "lead") === stage) return;
        setMovingClientId(client.id);
        const previousStage = client.lifecycle_stage;

        // Optimistic update
        setClients((prev) => prev.map((row) => (row.id === client.id ? { ...row, lifecycle_stage: stage } : row)));

        try {
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

            await fetchData();
        } catch (error) {
            // Revert on failure
            setClients((prev) => prev.map((row) => (row.id === client.id ? { ...row, lifecycle_stage: previousStage } : row)));
            console.error("Stage move failed:", error);
            toast({
                title: "Failed to move stage",
                description: error instanceof Error ? error.message : "Failed to move stage",
                variant: "error",
            });
        } finally {
            setMovingClientId(null);
        }
    };

    const toggleClientPhaseNotifications = async (client: ClientCard, enabled: boolean) => {
        setMovingClientId(client.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({ id: client.id, phase_notifications_enabled: enabled }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to update client notification toggle");
            }

            setClients((prev) => prev.map((row) => (
                row.id === client.id ? { ...row, phase_notifications_enabled: enabled } : row
            )));
        } catch (error) {
            console.error("Toggle phase notifications failed:", error);
            toast({
                title: "Failed to update notifications",
                description: error instanceof Error ? error.message : "Failed to update client notification toggle",
                variant: "error",
            });
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

    const promoteContactToLead = async (contact: ContactItem) => {
        setPromotingContactId(contact.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/admin/contacts/${contact.id}/promote`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to promote contact");
            }
            await fetchData();
        } catch (error) {
            toast({
                title: "Failed to promote contact",
                description: error instanceof Error ? error.message : "Failed to move contact to lead",
                variant: "error",
            });
        } finally {
            setPromotingContactId(null);
        }
    };

    const importFromPhone = async () => {
        const contactsApi = (navigator as Navigator & {
            contacts?: {
                select: (
                    properties: string[],
                    options?: { multiple?: boolean }
                ) => Promise<Array<{ name?: string[]; email?: string[]; tel?: string[] }>>;
            };
        }).contacts;

        if (!contactsApi?.select) {
            toast({
                title: "Phone contact picker unavailable",
                description: "This browser does not support phone contact picker. Use CSV import.",
                variant: "warning",
            });
            return;
        }

        try {
            setImportingContacts(true);
            const picked = await contactsApi.select(["name", "email", "tel"], { multiple: true });
            if (!picked || picked.length === 0) return;

            const payloadContacts = picked.map((item) => ({
                full_name: item.name?.[0] || "",
                email: item.email?.[0] || "",
                phone: item.tel?.[0] || "",
            }));

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/contacts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({
                    source: "phone_import",
                    contacts: payloadContacts,
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to import contacts");
            await fetchData();
        } catch (error) {
            toast({
                title: "Failed to import phone contacts",
                description: error instanceof Error ? error.message : "Failed to import phone contacts",
                variant: "error",
            });
        } finally {
            setImportingContacts(false);
        }
    };

    const importCsvContacts = async (file: File) => {
        try {
            setImportingContacts(true);
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) {
                toast({
                    title: "Invalid CSV",
                    description: "CSV needs headers and at least one contact row.",
                    variant: "warning",
                });
                return;
            }

            const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
            const nameIdx = headers.findIndex((h) => ["name", "full_name", "fullname"].includes(h));
            const emailIdx = headers.findIndex((h) => h === "email");
            const phoneIdx = headers.findIndex((h) => ["phone", "mobile", "tel", "telephone"].includes(h));

            const contactsPayload = lines.slice(1).map((line) => {
                const cols = line.split(",").map((c) => c.trim());
                return {
                    full_name: nameIdx >= 0 ? cols[nameIdx] || "" : "",
                    email: emailIdx >= 0 ? cols[emailIdx] || "" : "",
                    phone: phoneIdx >= 0 ? cols[phoneIdx] || "" : "",
                };
            }).filter((item) => item.full_name || item.email || item.phone);

            if (contactsPayload.length === 0) {
                toast({
                    title: "No valid rows",
                    description: "No valid contact rows found in CSV.",
                    variant: "warning",
                });
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/contacts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({
                    source: "csv_import",
                    contacts: contactsPayload,
                }),
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error || "Failed to import CSV contacts");
            await fetchData();
        } catch (error) {
            toast({
                title: "Failed to import CSV contacts",
                description: error instanceof Error ? error.message : "Failed to import CSV contacts",
                variant: "error",
            });
        } finally {
            setImportingContacts(false);
            if (csvInputRef.current) {
                csvInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Columns3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs uppercase tracking-widest text-primary font-bold">Operations</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Lifecycle Kanban</h1>
                        <p className="text-text-secondary mt-1">Drag or move clients between stages. Notifications run on configured transitions.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GlassInput
                        icon={Search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search client..."
                        className="w-[220px]"
                    />
                    <GlassButton
                        onClick={() => void fetchData()}
                        variant="ghost"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </GlassButton>
                </div>
            </div>

            {/* Snapshot */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-primary">Operational Snapshot</span>
                <GlassBadge variant="default" size="sm">
                    Visible Clients: <span className="font-semibold">{totalVisibleClients}</span>
                </GlassBadge>
                <GlassBadge variant="default" size="sm">
                    Pre-Lead Contacts: <span className="font-semibold">{totalPreLeadContacts}</span>
                </GlassBadge>
            </div>

            {/* Pre-Lead Contacts */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <div>
                        <p className="text-sm font-semibold text-secondary dark:text-white">Pre-Lead Contacts</p>
                        <p className="text-xs text-text-secondary">Search/import contacts and promote them to Lead when ready.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <GlassInput
                            icon={Search}
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-[220px]"
                        />
                        <GlassButton
                            onClick={() => void importFromPhone()}
                            disabled={importingContacts}
                            variant="ghost"
                            size="sm"
                        >
                            <Phone className={`w-4 h-4 ${importingContacts ? "animate-spin" : ""}`} />
                            Import Phone
                        </GlassButton>
                        <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void importCsvContacts(file);
                            }}
                        />
                        <GlassButton
                            onClick={() => csvInputRef.current?.click()}
                            disabled={importingContacts}
                            variant="ghost"
                            size="sm"
                        >
                            <Upload className={`w-4 h-4 ${importingContacts ? "animate-spin" : ""}`} />
                            Import CSV
                        </GlassButton>
                    </div>
                </div>
                {contactsError ? (
                    <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
                        Contacts inbox unavailable: {contactsError}
                    </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {filteredContacts.length === 0 ? (
                        <p className="text-xs text-text-secondary">No pre-lead contacts found.</p>
                    ) : (
                        filteredContacts.map((contact) => (
                            <div key={contact.id} className="rounded-xl border border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm px-3 py-3">
                                <p className="text-sm font-semibold text-secondary dark:text-white truncate">{contact.full_name || "Unnamed Contact"}</p>
                                <p className="text-xs text-text-secondary truncate">{contact.email || "No email"}</p>
                                <p className="text-xs text-text-secondary truncate">{contact.phone || "No phone"}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <GlassBadge variant="info" size="sm">
                                        {contact.source || "manual"}
                                    </GlassBadge>
                                    <button
                                        onClick={() => void promoteContactToLead(contact)}
                                        disabled={promotingContactId === contact.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-white/20 bg-white/40 dark:bg-white/5 text-[11px] font-semibold text-primary hover:bg-white/60 dark:hover:bg-white/10 transition-colors disabled:opacity-60"
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        {promotingContactId === contact.id ? "Moving..." : "Move to Lead"}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-2 items-start">
                {clientsByStage.map((column) => (
                    <div
                        key={column.stage}
                        className="min-w-[290px] max-w-[290px] rounded-2xl border border-white/20 bg-gradient-to-b from-white/80 to-white/60 dark:from-white/10 dark:to-white/5 backdrop-blur-xl p-3 shadow-[0_10px_24px_rgba(0,208,132,0.08)] self-start"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => void handleDrop(column.stage)}
                    >
                        <div className="flex items-center justify-between mb-3 sticky top-0 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-lg px-2 py-1.5 border border-white/20">
                            <p className="text-xs uppercase tracking-wide font-semibold text-primary">{column.label}</p>
                            <GlassBadge variant="default" size="sm">{column.clients.length}</GlassBadge>
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
                                        className="rounded-xl border border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-[0_12px_18px_rgba(0,208,132,0.12)] transition-shadow"
                                    >
                                        <p className="text-sm font-semibold text-secondary dark:text-white truncate">{client.full_name || "Unnamed Client"}</p>
                                        <p className="text-xs text-text-secondary truncate">{client.email || "No email"}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <GlassBadge variant="info" size="sm">
                                                {client.lead_status || "new"}
                                            </GlassBadge>
                                            <span className="text-xs text-text-secondary">•</span>
                                            <p className="text-xs text-text-secondary truncate">{client.phone || "No phone"}</p>
                                        </div>
                                        <div className="mt-2">
                                            <select
                                                value={(client.lifecycle_stage || "lead")}
                                                onChange={(e) => void moveToStage(client, e.target.value as LifecycleStage)}
                                                disabled={movingClientId === client.id}
                                                className="w-full rounded-lg border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-xl px-2 py-1.5 text-xs font-semibold text-secondary dark:text-white"
                                            >
                                                {LIFECYCLE_STAGES.map((stage) => (
                                                    <option key={`${client.id}-${stage}`} value={stage}>
                                                        {STAGE_LABELS[stage]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm px-2 py-1.5">
                                            <span className="text-[10px] uppercase tracking-wide text-text-secondary">Phase Notify</span>
                                            <button
                                                onClick={() => void toggleClientPhaseNotifications(client, !(client.phase_notifications_enabled ?? true))}
                                                disabled={movingClientId === client.id}
                                                className={`w-10 h-5 rounded-full relative transition-colors ${(client.phase_notifications_enabled ?? true) ? "bg-emerald-500" : "bg-slate-300"} disabled:opacity-60`}
                                                type="button"
                                            >
                                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${(client.phase_notifications_enabled ?? true) ? "right-0.5" : "left-0.5"}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => prev && void moveToStage(client, prev)}
                                                disabled={!prev || movingClientId === client.id}
                                                className="text-[11px] px-2 py-1 rounded-md border border-white/20 bg-white/40 dark:bg-white/5 text-primary disabled:opacity-40 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <ArrowLeft className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => next && void moveToStage(client, next)}
                                                disabled={!next || movingClientId === client.id}
                                                className="text-[11px] px-2 py-1 rounded-md border border-white/20 bg-white/40 dark:bg-white/5 text-primary disabled:opacity-40 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                            {movingClientId === client.id ? (
                                                <span className="text-[10px] text-primary">Saving…</span>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                            {!loading && column.clients.length === 0 ? (
                                <p className="text-xs text-text-secondary">No clients</p>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Stage Transitions */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex items-center gap-2 mb-4">
                    <Clock3 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-serif text-secondary dark:text-white">Recent Stage Transitions</h2>
                </div>
                <div className="space-y-2">
                    {events.length === 0 ? (
                        <p className="text-sm text-text-secondary">No transitions yet.</p>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="rounded-lg border border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm px-3 py-2">
                                <p className="text-sm text-secondary dark:text-white">
                                    <span className="font-semibold">{event.profile?.full_name || event.profile?.email || "Client"}</span>
                                    {" moved "}
                                    <span className="font-semibold">{getStageLabel(event.from_stage)}</span>
                                    {" → "}
                                    <span className="font-semibold">{getStageLabel(event.to_stage)}</span>
                                </p>
                                <p className="text-xs text-text-secondary">
                                    {new Date(event.created_at).toLocaleString()} by {event.changed_by_profile?.full_name || event.changed_by_profile?.email || "Admin"}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
