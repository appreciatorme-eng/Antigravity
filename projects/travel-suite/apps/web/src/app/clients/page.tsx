/**
 * Client Directory
 *
 * Central hub for managing client relationships and operational pipelines.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useClients } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    Search,
    Mail,
    Phone,
    Calendar,
    Plus,
    ExternalLink,
    RefreshCcw,
    Edit2,
    Briefcase,
    Globe,
    Database,
    Tag,
    ChevronRight,
    TrendingUp,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassListSkeleton } from "@/components/glass/GlassSkeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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

interface FeatureLimitSnapshot {
    allowed: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    tier: string;
    resetAt: string | null;
}

function formatFeatureLimitError(payload: any, fallback: string) {
    if (payload?.code !== "FEATURE_LIMIT_EXCEEDED") {
        return fallback;
    }

    const limit = Number(payload?.limit || 0);
    const used = Number(payload?.used || 0);
    const feature = String(payload?.feature || "usage");
    if (limit > 0) {
        return `Limit reached for ${feature}: ${used}/${limit}. Upgrade in Billing to continue.`;
    }
    return payload?.error || fallback;
}

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
    const { toast } = useToast();

    // Replace standalone fetch with TanStack Query hook
    const { data: rawClients, isLoading: loading, refetch: fetchClients } = useClients();
    const clients: Client[] = rawClients || [];

    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null);
    const [clientLimit, setClientLimit] = useState<FeatureLimitSnapshot | null>(null);

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

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const headers: Record<string, string> = {};
                if (session?.access_token) {
                    headers.Authorization = `Bearer ${session.access_token}`;
                }
                const limitsResponse = await fetch("/api/subscriptions/limits", { headers, cache: "no-store" });
                if (!limitsResponse.ok) return;
                const payload = await limitsResponse.json();
                const limit = payload?.limits?.clients;
                if (!limit) return;
                setClientLimit({
                    allowed: Boolean(limit.allowed),
                    used: Number(limit.used || 0),
                    limit: limit.limit === null ? null : Number(limit.limit || 0),
                    remaining: limit.remaining === null ? null : Number(limit.remaining || 0),
                    tier: String(limit.tier || "free"),
                    resetAt: limit.resetAt || null,
                });
            } catch {
                // best-effort only
            }
        };
        fetchLimits();
    }, [supabase]);

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
                const payload = await response.json();
                throw new Error(
                    formatFeatureLimitError(
                        payload,
                        payload.error || `Failed to ${editingClientId ? "update" : "create"} identity record`
                    )
                );
            }

            await fetchClients();
            setModalOpen(false);
            resetForm();
            toast({
                title: "Asset Updated",
                description: `Identity profile ${editingClientId ? "updated" : "onboarded"} successfully.`,
                variant: "default",
            });
        } catch (error) {
            setFormError(error instanceof Error ? error.message : `System failure during profiling`);
        } finally {
            setSaving(false);
        }
    };

    const handleLifecycleStageChange = async (clientId: string, lifecycleStage: string) => {
        setStageUpdatingId(clientId);
        try {
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

            // Invalidate/refetch query instead of manual state mutation
            await fetchClients();
        } catch (error) {
            toast({
                title: "Lifecycle Overwrite Failed",
                description: error instanceof Error ? error.message : "System failure during lifecycle adjustment",
                variant: "error",
            });
        } finally {
            setStageUpdatingId(null);
        }
    };

    const visibleClientLimit = clientLimit && clientLimit.limit !== null ? clientLimit : null;

    const stats = [
        {
            label: "Total Entities",
            value: clients.length,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-100/50",
            trend: "+3 (7d)"
        },
        {
            label: "Active Prospects",
            value: clients.filter((c) => ["lead", "prospect", "proposal"].includes(c.lifecycle_stage || "lead")).length,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-100/50",
            trend: "+12%"
        },
        {
            label: "VIP Signatures",
            value: clients.filter((c) => c.client_tag === "vip").length,
            icon: Tag,
            color: "text-amber-600",
            bg: "bg-amber-100/50",
            trend: "Optimal"
        },
        {
            label: "Closed",
            value: clients.filter((c) => ["past", "review"].includes(c.lifecycle_stage || "")).length,
            icon: CheckCircle2,
            color: "text-violet-600",
            bg: "bg-violet-100/50",
            trend: "High Yield"
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                            Client Directory
                        </div>
                    </div>
                    <h1 className="text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Clients
                    </h1>
                    <p className="text-text-muted text-lg font-medium max-w-2xl">
                        Overview of your client relationships.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <GlassButton
                        onClick={fetchClients}
                        variant="ghost"
                        className="rounded-xl border-gray-100 h-14 w-14 p-0 shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </GlassButton>
                    <GlassButton
                        onClick={() => setModalOpen(true)}
                        variant="primary"
                        className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 group"
                    >
                        <Plus className="w-5 h-5 mr-3 transition-transform group-hover:rotate-90" />
                        <span className="text-xs font-black uppercase tracking-widest">Add Client</span>
                    </GlassButton>
                </div>
            </div>

            {visibleClientLimit && (
                <div className={cn(
                    "rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all hover:shadow-md",
                    visibleClientLimit.allowed
                        ? "bg-emerald-50/50 border-emerald-100"
                        : "bg-amber-50/50 border-amber-100"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            visibleClientLimit.allowed ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        )}>
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className={cn(
                                "text-sm font-bold",
                                visibleClientLimit.allowed ? "text-emerald-900" : "text-amber-900"
                            )}>
                                Capacity Utilization: {visibleClientLimit.used} / {visibleClientLimit.limit || '∞'}
                            </p>
                            <p className={cn(
                                "text-xs mt-0.5 font-medium",
                                visibleClientLimit.allowed ? "text-emerald-700" : "text-amber-700"
                            )}>
                                {visibleClientLimit.allowed
                                    ? `Optimized for ${visibleClientLimit.tier} operations. ${visibleClientLimit.remaining ?? 0} slots available.`
                                    : "Operational capacity reached. Scale your plan to onboard additional clientele."}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/settings?tab=billing"
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                            visibleClientLimit.allowed
                                ? "text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "text-amber-700 border-amber-200 hover:bg-amber-100"
                        )}
                    >
                        Scale Operations
                    </Link>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <GlassCard key={stat.label} padding="lg" className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-gray-100 dark:border-slate-800">
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                <p className="text-4xl font-black text-secondary dark:text-white tracking-tighter tabular-nums">
                                    {loading ? "---" : stat.value}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-tight", stat.color)}>{stat.trend}</span>
                                    <span className="text-[10px] text-text-muted font-medium uppercase opacity-50">Performance</span>
                                </div>
                            </div>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Command Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
                <GlassCard padding="none" className="flex-1 w-full overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center px-6 py-1">
                        <Search className="w-5 h-5 text-text-muted mr-4" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-secondary dark:text-white placeholder:text-text-muted/50 text-sm h-12 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </GlassCard>
            </div>

            {/* Lifecycle Pipeline */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif text-secondary dark:text-white tracking-tight">Client List</h2>
                        <p className="text-xs text-text-muted mt-1 font-medium">Strategic lifecycle management across client segments.</p>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
                    {clientsByLifecycleStage.map((column) => (
                        <div
                            key={column.stage}
                            className="min-w-[300px] w-[300px] flex flex-col gap-4 snap-start"
                        >
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary dark:text-text-muted">
                                    {column.label}
                                </span>
                                <span className="text-[10px] font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-slate-700 text-secondary dark:text-text-muted shadow-sm">
                                    {column.clients.length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-4 p-4 rounded-[2rem] bg-gray-50/50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-800/80 min-h-[400px]">
                                {column.clients.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-10">
                                        <Users className="w-8 h-8 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Vacant Zone</p>
                                    </div>
                                ) : (
                                    column.clients.map((client) => {
                                        const prevStage = getPrevStage(client.lifecycle_stage);
                                        const nextStage = getNextStage(client.lifecycle_stage);
                                        return (
                                            <GlassCard
                                                key={`${column.stage}-${client.id}`}
                                                padding="md"
                                                className="group border-gray-200 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-default"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-bold text-secondary dark:text-white truncate">
                                                            {client.full_name || "Guest"}
                                                        </h3>
                                                        <p className="text-[10px] font-medium text-text-muted truncate mt-0.5">
                                                            {client.email || "Confidential Vector"}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); handleEditClient(client); }}
                                                            className="p-1.5 text-text-muted hover:text-primary transition-colors bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                        </button>
                                                        <Link href={`/clients/${client.id}`} className="p-1.5 text-text-muted hover:text-primary transition-colors bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-col gap-2">
                                                    {client.client_tag && client.client_tag !== 'standard' && (
                                                        <span className={cn(
                                                            "w-fit text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest",
                                                            client.client_tag === 'vip' ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-500" :
                                                                "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-500"
                                                        )}>
                                                            {client.client_tag}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800/80">
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            onClick={() => prevStage && void handleLifecycleStageChange(client.id, prevStage)}
                                                            disabled={!prevStage || stageUpdatingId === client.id}
                                                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary disabled:opacity-20 disabled:cursor-not-allowed transition-all text-[10px]"
                                                        >
                                                            ←
                                                        </button>
                                                        <button
                                                            onClick={() => nextStage && void handleLifecycleStageChange(client.id, nextStage)}
                                                            disabled={!nextStage || stageUpdatingId === client.id}
                                                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary disabled:opacity-20 disabled:cursor-not-allowed transition-all text-[10px]"
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                    {client.trips_count ? (
                                                        <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded border border-primary/20 uppercase tracking-widest">
                                                            {client.trips_count} Trips
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </GlassCard>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Client Modal */}
            <GlassModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    resetForm();
                }}
                title={editingClientId ? "Update Client" : "Add Client"}
            >
                <p className="text-sm font-medium text-text-secondary mb-6">
                    Establish a new client tracking profile to monitor logistical footprints and deployment status.
                </p>
                <div className="grid gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-4">
                    <GlassInput
                        label="Designation / Full Name"
                        value={formData.full_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Ava Chen"
                    />
                    <GlassInput
                        label="Primary Vector (Email)"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="ava.chen@example.com"
                    />
                    <GlassInput
                        label="Secondary Vector (Phone)"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 415 555 0192"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Lead Status</label>
                            <select
                                value={formData.leadStatus}
                                onChange={(e) => setFormData((prev) => ({ ...prev, leadStatus: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                            >
                                <option value="new">Unverified (New)</option>
                                <option value="contacted">Pinged</option>
                                <option value="qualified">Authorized (Qualified)</option>
                                <option value="inactive">Dormant</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Client Tag</label>
                            <select
                                value={formData.clientTag}
                                onChange={(e) => setFormData((prev) => ({ ...prev, clientTag: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                            >
                                <option value="standard">Standard Operation</option>
                                <option value="vip">VIP Target</option>
                                <option value="repeat">Repeat Asset</option>
                                <option value="corporate">Corporate Contract</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Client Insights</h4>
                        <div className="grid gap-4">
                            <GlassInput
                                label="Target Destination"
                                value={formData.preferredDestination}
                                onChange={(e) => setFormData((prev) => ({ ...prev, preferredDestination: e.target.value }))}
                                placeholder="Tokyo, Japan"
                            />
                            <div className="grid grid-cols-3 gap-3">
                                <GlassInput
                                    label="Unit Size"
                                    type="number"
                                    value={formData.travelersCount}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, travelersCount: e.target.value }))}
                                    placeholder="2"
                                />
                                <GlassInput
                                    label="Min Budget"
                                    type="number"
                                    value={formData.budgetMin}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, budgetMin: e.target.value }))}
                                    placeholder="1500"
                                />
                                <GlassInput
                                    label="Max Budget"
                                    type="number"
                                    value={formData.budgetMax}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: e.target.value }))}
                                    placeholder="3500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder="Allergies, accessibility needs, clearance codes..."
                                className="min-h-[100px] w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-secondary dark:text-white placeholder:text-text-muted/60 focus:border-primary/50 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {formError && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                            <p className="text-xs font-bold text-rose-600 tracking-tight">{formError}</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                    <GlassButton
                        onClick={() => {
                            setModalOpen(false);
                            resetForm();
                        }}
                        variant="ghost"
                        className="font-bold text-xs uppercase tracking-widest text-text-muted"
                    >
                        Abort
                    </GlassButton>
                    <GlassButton
                        onClick={handleSaveClient}
                        disabled={saving}
                        variant="primary"
                        className="font-bold text-xs uppercase tracking-widest"
                    >
                        {saving ? "Saving..." : (editingClientId ? "Update Client" : "Save Client")}
                    </GlassButton>
                </div>
            </GlassModal>

        </div>
    );
}
