"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    Search,
    Mail,
    Phone,
    Calendar,
    Plus,
    MoreVertical,
    ExternalLink,
    RefreshCcw,
    Edit2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";

interface Client {
    id: string;
    role?: "client" | "driver" | "admin" | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string | null;
    preferred_destination?: string | null;
    travelers_count?: number | null;
    budget_min?: number | null;
    budget_max?: number | null;
    travel_style?: string | null;
    interests?: string[] | null;
    home_airport?: string | null;
    notes?: string | null;
    lead_status?: string | null;
    client_tag?: string | null;
    phase_notifications_enabled?: boolean | null;
    lifecycle_stage?: string | null;
    marketing_opt_in?: boolean | null;
    referral_source?: string | null;
    source_channel?: string | null;
    trips_count?: number;
}

const mockClients: Client[] = [
    {
        id: "mock-client-1",
        role: "client",
        full_name: "Ava Chen",
        email: "ava.chen@example.com",
        phone: "+1 (415) 555-1122",
        avatar_url: null,
        created_at: "2024-11-08T12:00:00Z",
        trips_count: 3,
    },
    {
        id: "mock-client-2",
        role: "client",
        full_name: "Liam Walker",
        email: "liam.walker@example.com",
        phone: "+44 20 7946 0901",
        avatar_url: null,
        created_at: "2025-02-19T09:30:00Z",
        trips_count: 2,
    },
    {
        id: "mock-client-3",
        role: "client",
        full_name: "Sofia Ramirez",
        email: "sofia.ramirez@example.com",
        phone: "+34 91 123 4567",
        avatar_url: null,
        created_at: "2025-06-04T15:15:00Z",
        trips_count: 1,
    },
];

const LIFECYCLE_STAGES = [
    "lead",
    "prospect",
    "proposal",
    "payment_pending",
    "payment_confirmed",
    "active",
    "review",
    "past",
] as const;

const LIFECYCLE_STAGE_LABELS: Record<(typeof LIFECYCLE_STAGES)[number], string> = {
    lead: "Lead",
    prospect: "Prospect",
    proposal: "Proposal",
    payment_pending: "Payment Pending",
    payment_confirmed: "Payment Confirmed",
    active: "Active Trip",
    review: "Review",
    past: "Closed",
};

export default function ClientsPage() {
    const supabase = createClient();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
    const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null);
    const [tagUpdatingId, setTagUpdatingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        preferredDestination: "",
        travelersCount: "",
        budgetMin: "",
        budgetMax: "",
        travelStyle: "",
        interests: "",
        homeAirport: "",
        notes: "",
        leadStatus: "new",
        clientTag: "standard",
        phaseNotificationsEnabled: true,
        lifecycleStage: "lead",
        marketingOptIn: false,
        referralSource: "",
        sourceChannel: "",
    });
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            if (useMockAdmin) {
                setClients(mockClients);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch("/api/admin/clients", { headers });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to fetch clients");
            }

            const payload = await response.json();
            setClients(payload.clients || []);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, useMockAdmin]);

    useEffect(() => {
        void fetchClients();
    }, [fetchClients]);

    const filteredClients = clients.filter(client =>
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getNextStage = (stage?: string | null) => {
        const current = LIFECYCLE_STAGES.indexOf((stage || "lead") as (typeof LIFECYCLE_STAGES)[number]);
        if (current < 0 || current >= LIFECYCLE_STAGES.length - 1) return null;
        return LIFECYCLE_STAGES[current + 1];
    };

    const getPrevStage = (stage?: string | null) => {
        const current = LIFECYCLE_STAGES.indexOf((stage || "lead") as (typeof LIFECYCLE_STAGES)[number]);
        if (current <= 0) return null;
        return LIFECYCLE_STAGES[current - 1];
    };

    const clientsByLifecycleStage = LIFECYCLE_STAGES.map((stage) => ({
        stage,
        label: LIFECYCLE_STAGE_LABELS[stage],
        clients: filteredClients.filter((client) => (client.lifecycle_stage || "lead") === stage),
    }));

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const resetForm = () => {
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            preferredDestination: "",
            travelersCount: "",
            budgetMin: "",
            budgetMax: "",
            travelStyle: "",
            interests: "",
            homeAirport: "",
            notes: "",
            leadStatus: "new",
            clientTag: "standard",
            phaseNotificationsEnabled: true,
            lifecycleStage: "lead",
            marketingOptIn: false,
            referralSource: "",
            sourceChannel: "",
        });
        setFormError(null);
        setEditingClientId(null);
    };

    const handleEditClient = (client: Client) => {
        setEditingClientId(client.id);
        setFormData({
            full_name: client.full_name || "",
            email: client.email || "",
            phone: client.phone || "",
            preferredDestination: client.preferred_destination || "",
            travelersCount: client.travelers_count?.toString() || "",
            budgetMin: client.budget_min?.toString() || "",
            budgetMax: client.budget_max?.toString() || "",
            travelStyle: client.travel_style || "",
            interests: client.interests?.join(", ") || "",
            homeAirport: client.home_airport || "",
            notes: client.notes || "",
            leadStatus: client.lead_status || "new",
            clientTag: client.client_tag || "standard",
            phaseNotificationsEnabled: client.phase_notifications_enabled ?? true,
            lifecycleStage: client.lifecycle_stage || "lead",
            marketingOptIn: client.marketing_opt_in || false,
            referralSource: client.referral_source || "",
            sourceChannel: client.source_channel || "",
        });
        setModalOpen(true);
    };

    const handleSaveClient = async () => {
        if (!formData.full_name.trim() || !formData.email.trim()) {
            setFormError("Name and email are required.");
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            if (useMockAdmin) {
                if (editingClientId) {
                    setClients((prev) => prev.map((c) => c.id === editingClientId ? {
                        ...c,
                        full_name: formData.full_name.trim(),
                        email: formData.email.trim(),
                        phone: formData.phone.trim() || null,
                        preferred_destination: formData.preferredDestination || null,
                        travelers_count: formData.travelersCount ? Number(formData.travelersCount) : null,
                        budget_min: formData.budgetMin ? Number(formData.budgetMin) : null,
                        budget_max: formData.budgetMax ? Number(formData.budgetMax) : null,
                        travel_style: formData.travelStyle || null,
                        interests: formData.interests
                            ? formData.interests.split(",").map((item) => item.trim()).filter(Boolean)
                            : null,
                        home_airport: formData.homeAirport || null,
                        notes: formData.notes || null,
                        lead_status: formData.leadStatus || "new",
                        client_tag: formData.clientTag || "standard",
                        phase_notifications_enabled: formData.phaseNotificationsEnabled,
                        lifecycle_stage: formData.lifecycleStage || "lead",
                        marketing_opt_in: formData.marketingOptIn,
                        referral_source: formData.referralSource || null,
                        source_channel: formData.sourceChannel || null,
                    } : c));
                } else {
                    const newClient: Client = {
                        id: `mock-client-${Date.now()}`,
                        full_name: formData.full_name.trim(),
                        email: formData.email.trim(),
                        phone: formData.phone.trim() || null,
                        avatar_url: null,
                        created_at: new Date().toISOString(),
                        preferred_destination: formData.preferredDestination || null,
                        travelers_count: formData.travelersCount ? Number(formData.travelersCount) : null,
                        budget_min: formData.budgetMin ? Number(formData.budgetMin) : null,
                        budget_max: formData.budgetMax ? Number(formData.budgetMax) : null,
                        travel_style: formData.travelStyle || null,
                        interests: formData.interests
                            ? formData.interests.split(",").map((item) => item.trim()).filter(Boolean)
                            : null,
                        home_airport: formData.homeAirport || null,
                        notes: formData.notes || null,
                        lead_status: formData.leadStatus || "new",
                        client_tag: formData.clientTag || "standard",
                        phase_notifications_enabled: formData.phaseNotificationsEnabled,
                        lifecycle_stage: formData.lifecycleStage || "lead",
                        marketing_opt_in: formData.marketingOptIn,
                        referral_source: formData.referralSource || null,
                        source_channel: formData.sourceChannel || null,
                        trips_count: 0,
                    };
                    setClients((prev) => [newClient, ...prev]);
                }
                setModalOpen(false);
                resetForm();
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();

            const url = "/api/admin/clients";
            const method = editingClientId ? "PATCH" : "POST";
            const body = editingClientId ? { ...formData, id: editingClientId } : formData;

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `Failed to ${editingClientId ? 'update' : 'create'} client`);
            }

            await fetchClients();
            setModalOpen(false);
            resetForm();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : `Failed to ${editingClientId ? 'update' : 'create'} client`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClient = async (clientId: string) => {
        if (!confirm("Delete this client? This will remove their user account.")) {
            return;
        }

        try {
            if (useMockAdmin) {
                setClients((prev) => prev.filter((client) => client.id !== clientId));
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/admin/clients?id=${clientId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete client");
            }

            setClients((prev) => prev.filter((client) => client.id !== clientId));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete client");
        }
    };

    const handleRoleOverride = async (clientId: string, role: "client" | "driver") => {
        setRoleUpdatingId(clientId);
        try {
            if (useMockAdmin) {
                if (role === "driver") {
                    setClients((prev) => prev.filter((client) => client.id !== clientId));
                } else {
                    setClients((prev) => prev.map((client) => (
                        client.id === clientId ? { ...client, role } : client
                    )));
                }
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ id: clientId, role }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update role");
            }

            if (role === "driver") {
                setClients((prev) => prev.filter((client) => client.id !== clientId));
            } else {
                setClients((prev) => prev.map((client) => (
                    client.id === clientId ? { ...client, role } : client
                )));
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update role");
        } finally {
            setRoleUpdatingId(null);
        }
    };

    const handleLifecycleStageChange = async (clientId: string, lifecycleStage: string) => {
        setStageUpdatingId(clientId);
        try {
            if (useMockAdmin) {
                setClients((prev) => prev.map((client) => (
                    client.id === clientId ? { ...client, lifecycle_stage: lifecycleStage } : client
                )));
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ id: clientId, lifecycle_stage: lifecycleStage }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update lifecycle stage");
            }

            setClients((prev) => prev.map((client) => (
                client.id === clientId ? { ...client, lifecycle_stage: lifecycleStage } : client
            )));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update lifecycle stage");
        } finally {
            setStageUpdatingId(null);
        }
    };

    const handleClientTagChange = async (clientId: string, clientTag: string) => {
        setTagUpdatingId(clientId);
        try {
            if (useMockAdmin) {
                setClients((prev) => prev.map((client) => (
                    client.id === clientId ? { ...client, client_tag: clientTag } : client
                )));
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ id: clientId, client_tag: clientTag }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update client tag");
            }

            setClients((prev) => prev.map((client) => (
                client.id === clientId ? { ...client, client_tag: clientTag } : client
            )));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update client tag");
        } finally {
            setTagUpdatingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs uppercase tracking-widest text-primary font-bold">Clients</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Clients</h1>
                        <p className="text-text-secondary mt-1">Manage your tour customers and view their travel history.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <GlassButton
                        onClick={fetchClients}
                        variant="ghost"
                        size="sm"
                        title="Refresh"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </GlassButton>
                    <GlassButton
                        onClick={() => setModalOpen(true)}
                        variant="primary"
                    >
                        <Plus className="w-4 h-4" />
                        Add Client
                    </GlassButton>
                </div>
            </div>

            {/* Create Client Modal */}
            <GlassModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    resetForm();
                }}
                title={editingClientId ? "Edit Client" : "Add Client"}
            >
                <p className="text-sm text-text-secondary mb-4">
                    Create a new client profile for trip planning and notifications.
                </p>
                <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    <GlassInput
                        label="Full Name"
                        value={formData.full_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Ava Chen"
                    />
                    <GlassInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="ava.chen@example.com"
                    />
                    <GlassInput
                        label="Phone (optional)"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 415 555 0192"
                    />
                    <GlassInput
                        label="Preferred Destination (optional)"
                        value={formData.preferredDestination}
                        onChange={(e) => setFormData((prev) => ({ ...prev, preferredDestination: e.target.value }))}
                        placeholder="Tokyo, Japan"
                    />
                    <GlassInput
                        label="Travelers (optional)"
                        type="number"
                        value={formData.travelersCount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, travelersCount: e.target.value }))}
                        placeholder="2"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <GlassInput
                            label="Budget Min (optional)"
                            type="number"
                            value={formData.budgetMin}
                            onChange={(e) => setFormData((prev) => ({ ...prev, budgetMin: e.target.value }))}
                            placeholder="1500"
                        />
                        <GlassInput
                            label="Budget Max (optional)"
                            type="number"
                            value={formData.budgetMax}
                            onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: e.target.value }))}
                            placeholder="3500"
                        />
                    </div>
                    <GlassInput
                        label="Travel Style (optional)"
                        value={formData.travelStyle}
                        onChange={(e) => setFormData((prev) => ({ ...prev, travelStyle: e.target.value }))}
                        placeholder="Luxury, adventure, family..."
                    />
                    <GlassInput
                        label="Interests (optional)"
                        value={formData.interests}
                        onChange={(e) => setFormData((prev) => ({ ...prev, interests: e.target.value }))}
                        placeholder="Food, culture, hiking (comma separated)"
                    />
                    <GlassInput
                        label="Home Airport (optional)"
                        value={formData.homeAirport}
                        onChange={(e) => setFormData((prev) => ({ ...prev, homeAirport: e.target.value }))}
                        placeholder="SFO"
                    />
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-secondary dark:text-white">Notes (optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Allergies, accessibility needs, loyalty numbers..."
                            className="min-h-[90px] w-full rounded-xl border border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl px-4 py-3 text-sm text-secondary dark:text-white placeholder:text-text-secondary focus:border-primary/50 outline-none transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-secondary dark:text-white">Lead Status</label>
                            <select
                                value={formData.leadStatus}
                                onChange={(e) => setFormData((prev) => ({ ...prev, leadStatus: e.target.value }))}
                                className="w-full rounded-xl border border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:border-primary/50 outline-none"
                            >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-secondary dark:text-white">Lifecycle Stage</label>
                            <select
                                value={formData.lifecycleStage}
                                onChange={(e) => setFormData((prev) => ({ ...prev, lifecycleStage: e.target.value }))}
                                className="w-full rounded-xl border border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:border-primary/50 outline-none"
                            >
                                {LIFECYCLE_STAGES.map((stage) => (
                                    <option key={stage} value={stage}>{LIFECYCLE_STAGE_LABELS[stage]}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-secondary dark:text-white">Client Tag</label>
                        <select
                            value={formData.clientTag}
                            onChange={(e) => setFormData((prev) => ({ ...prev, clientTag: e.target.value }))}
                            className="w-full rounded-xl border border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:border-primary/50 outline-none"
                        >
                            <option value="standard">Standard</option>
                            <option value="vip">VIP</option>
                            <option value="repeat">Repeat</option>
                            <option value="corporate">Corporate</option>
                            <option value="family">Family</option>
                            <option value="honeymoon">Honeymoon</option>
                            <option value="high_priority">High Priority</option>
                        </select>
                    </div>
                    <GlassInput
                        label="Referral Source (optional)"
                        value={formData.referralSource}
                        onChange={(e) => setFormData((prev) => ({ ...prev, referralSource: e.target.value }))}
                        placeholder="Instagram, Partner, Word of mouth"
                    />
                    <GlassInput
                        label="Acquisition Channel (optional)"
                        value={formData.sourceChannel}
                        onChange={(e) => setFormData((prev) => ({ ...prev, sourceChannel: e.target.value }))}
                        placeholder="Organic, Paid ads, Referral"
                    />
                    <label className="flex items-center gap-2 text-sm text-secondary dark:text-white">
                        <input
                            type="checkbox"
                            checked={formData.marketingOptIn}
                            onChange={(e) => setFormData((prev) => ({ ...prev, marketingOptIn: e.target.checked }))}
                            className="h-4 w-4 rounded border-white/20 text-primary focus:ring-primary"
                        />
                        Marketing opt-in
                    </label>
                    {formError && (
                        <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <GlassButton
                        onClick={() => {
                            setModalOpen(false);
                            resetForm();
                        }}
                        variant="ghost"
                    >
                        Cancel
                    </GlassButton>
                    <GlassButton
                        onClick={handleSaveClient}
                        disabled={saving}
                        variant="primary"
                    >
                        {saving ? "Saving..." : (editingClientId ? "Save Changes" : "Create Client")}
                    </GlassButton>
                </div>
            </GlassModal>

            {/* Lifecycle Kanban */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif text-secondary dark:text-white">Lifecycle Kanban</h2>
                    <p className="text-xs text-text-secondary">Move clients from lead to review with one click.</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {clientsByLifecycleStage.map((column) => (
                        <div
                            key={column.stage}
                            className="min-w-[240px] max-w-[240px] rounded-xl border border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-3"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                    {column.label}
                                </p>
                                <GlassBadge variant="default" size="sm">{column.clients.length}</GlassBadge>
                            </div>
                            <div className="space-y-2">
                                {column.clients.length === 0 ? (
                                    <p className="text-xs text-text-secondary">No clients in this stage.</p>
                                ) : (
                                    column.clients.map((client) => {
                                        const prevStage = getPrevStage(client.lifecycle_stage);
                                        const nextStage = getNextStage(client.lifecycle_stage);
                                        return (
                                            <div key={`${column.stage}-${client.id}`} className="rounded-lg border border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-sm p-2">
                                                <p className="text-sm font-semibold text-secondary dark:text-white truncate">
                                                    {client.full_name || "Unnamed Client"}
                                                </p>
                                                <p className="text-xs text-text-secondary truncate">
                                                    {client.email || "No email"}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <button
                                                        onClick={() => prevStage && void handleLifecycleStageChange(client.id, prevStage)}
                                                        disabled={!prevStage || stageUpdatingId === client.id}
                                                        className="text-[11px] px-2 py-1 rounded-md border border-white/20 bg-white/40 dark:bg-white/5 text-primary disabled:opacity-40 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        ←
                                                    </button>
                                                    <button
                                                        onClick={() => nextStage && void handleLifecycleStageChange(client.id, nextStage)}
                                                        disabled={!nextStage || stageUpdatingId === client.id}
                                                        className="text-[11px] px-2 py-1 rounded-md border border-white/20 bg-white/40 dark:bg-white/5 text-primary disabled:opacity-40 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        →
                                                    </button>
                                                    {stageUpdatingId === client.id && (
                                                        <span className="text-[10px] text-primary">Saving…</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Search */}
            <GlassInput
                icon={Search}
                type="text"
                placeholder="Search clients by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <GlassCard key={i} padding="lg" rounded="2xl" className="animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-white/40 dark:bg-white/10 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-white/40 dark:bg-white/10 rounded w-3/4"></div>
                                    <div className="h-3 bg-white/40 dark:bg-white/10 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <div className="h-3 bg-white/40 dark:bg-white/10 rounded w-full"></div>
                                <div className="h-3 bg-white/40 dark:bg-white/10 rounded w-2/3"></div>
                            </div>
                        </GlassCard>
                    ))
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full">
                        <GlassCard padding="lg" rounded="2xl" className="text-center py-12">
                            <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-secondary dark:text-white">No clients found</h3>
                            <p className="text-text-secondary">Try adjusting your search or add a new client.</p>
                        </GlassCard>
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <GlassCard key={client.id} padding="lg" rounded="2xl" className="hover:shadow-[0_20px_40px_rgba(0,208,132,0.12)] transition-shadow group">
                            <div className="flex items-center gap-4 mb-4">
                                {client.avatar_url ? (
                                    <Image
                                        src={client.avatar_url}
                                        alt={client.full_name || ''}
                                        width={56}
                                        height={56}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-xl">
                                        {client.full_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-secondary dark:text-white truncate group-hover:text-primary transition-colors">
                                        {client.full_name || 'Anonymous Client'}
                                    </h3>
                                    <p className="text-sm text-text-secondary flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Since {formatDate(client.created_at)}
                                    </p>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEditClient(client)}
                                        className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                                        title="Edit client details"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-white/40 dark:hover:bg-white/10 transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-3 text-text-secondary">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <span className="text-sm truncate" title={client.email || ''}>
                                        {client.email || 'No email provided'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-text-secondary">
                                    <Phone className="w-4 h-4 text-primary" />
                                    <span className="text-sm">
                                        {client.phone || 'No phone provided'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">Role</span>
                                    <select
                                        value={(client.role === "driver" ? "driver" : "client")}
                                        onChange={(e) => void handleRoleOverride(client.id, e.target.value as "client" | "driver")}
                                        disabled={roleUpdatingId === client.id}
                                        className="rounded-lg border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-xl px-2 py-1 text-xs font-semibold text-secondary dark:text-white"
                                    >
                                        <option value="client">Client</option>
                                        <option value="driver">Driver</option>
                                    </select>
                                </div>
                                {roleUpdatingId === client.id && (
                                    <p className="text-[11px] text-primary">Updating role…</p>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">Stage</span>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={client.lifecycle_stage || "lead"}
                                            onChange={(e) => void handleLifecycleStageChange(client.id, e.target.value)}
                                            disabled={stageUpdatingId === client.id}
                                            className="rounded-lg border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-xl px-2 py-1 text-xs font-semibold text-secondary dark:text-white"
                                        >
                                            {LIFECYCLE_STAGES.map((stage) => (
                                                <option key={stage} value={stage}>{LIFECYCLE_STAGE_LABELS[stage]}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const next = getNextStage(client.lifecycle_stage);
                                                if (next) void handleLifecycleStageChange(client.id, next);
                                            }}
                                            disabled={stageUpdatingId === client.id || !getNextStage(client.lifecycle_stage)}
                                            className="rounded-lg border border-white/20 bg-white/40 dark:bg-white/5 px-2 py-1 text-[11px] font-semibold text-primary disabled:opacity-40 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                                {stageUpdatingId === client.id && (
                                    <p className="text-[11px] text-primary">Updating stage…</p>
                                )}
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">Tag</span>
                                    <select
                                        value={client.client_tag || "standard"}
                                        onChange={(e) => void handleClientTagChange(client.id, e.target.value)}
                                        disabled={tagUpdatingId === client.id}
                                        className="rounded-lg border border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-xl px-2 py-1 text-xs font-semibold text-secondary dark:text-white"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="vip">VIP</option>
                                        <option value="repeat">Repeat</option>
                                        <option value="corporate">Corporate</option>
                                        <option value="family">Family</option>
                                        <option value="honeymoon">Honeymoon</option>
                                        <option value="high_priority">High Priority</option>
                                    </select>
                                </div>
                                {tagUpdatingId === client.id && (
                                    <p className="text-[11px] text-primary">Updating tag…</p>
                                )}
                                {(client.preferred_destination || client.budget_min || client.budget_max || client.travelers_count || client.travel_style) && (
                                    <div className="text-xs text-text-secondary space-y-1 pt-2 border-t border-white/10">
                                        {client.preferred_destination && (
                                            <div>Destination: {client.preferred_destination}</div>
                                        )}
                                        {(client.budget_min || client.budget_max) && (
                                            <div>
                                                Budget: ${client.budget_min ?? "—"} to ${client.budget_max ?? "—"}
                                            </div>
                                        )}
                                        {client.travelers_count && (
                                            <div>Travelers: {client.travelers_count}</div>
                                        )}
                                        {client.travel_style && (
                                            <div>Style: {client.travel_style}</div>
                                        )}
                                    </div>
                                )}
                                {(client.interests?.length || client.home_airport || client.lead_status || client.lifecycle_stage) && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {client.client_tag && (
                                            <GlassBadge variant="default" size="sm">
                                                {client.client_tag.replace(/_/g, " ")}
                                            </GlassBadge>
                                        )}
                                        {client.lead_status && (
                                            <GlassBadge variant="info" size="sm">
                                                {client.lead_status}
                                            </GlassBadge>
                                        )}
                                        {client.lifecycle_stage && (
                                            <GlassBadge variant="success" size="sm">
                                                {client.lifecycle_stage}
                                            </GlassBadge>
                                        )}
                                        {client.home_airport && (
                                            <GlassBadge variant="warning" size="sm">
                                                {client.home_airport}
                                            </GlassBadge>
                                        )}
                                        {(client.interests || []).slice(0, 3).map((interest) => (
                                            <GlassBadge
                                                key={`${client.id}-${interest}`}
                                                variant="success"
                                                size="sm"
                                            >
                                                {interest}
                                            </GlassBadge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-secondary dark:text-white leading-tight">
                                        {client.trips_count}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary">
                                        Total Trips
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/clients/${client.id}`}
                                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary dark:hover:text-white transition-colors bg-primary/20 border border-primary/30 px-3 py-2 rounded-full"
                                    >
                                        View Profile
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-full transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div >
    );
}
