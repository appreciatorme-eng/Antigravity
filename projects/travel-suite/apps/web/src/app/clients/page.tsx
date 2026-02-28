/**
 * Client Directory — Redesigned
 *
 * Premium CRM-style pipeline view for managing client relationships.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useClients } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    Search,
    Plus,
    ExternalLink,
    RefreshCcw,
    Edit2,
    TrendingUp,
    IndianRupee,
    ChevronLeft,
    ChevronRight,
    Plane,
    Sparkles,
    ArrowRight,
    Languages,
} from "lucide-react";
import Link from "next/link";
import { GlassModal } from "@/components/glass/GlassModal";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
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
    if (payload?.code !== "FEATURE_LIMIT_EXCEEDED") return fallback;
    const limit = Number(payload?.limit || 0);
    const used = Number(payload?.used || 0);
    const feature = String(payload?.feature || "usage");
    if (limit > 0) return `Limit reached for ${feature}: ${used}/${limit}. Upgrade in Billing to continue.`;
    return payload?.error || fallback;
}

const formatINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

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

type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

const STAGE_CONFIG: Record<LifecycleStage, {
    label: string;
    emoji: string;
    color: string;
    headerGradient: string;
    columnBg: string;
    cardBorder: string;
    badgeBg: string;
    badgeText: string;
    avatarGradient: string;
}> = {
    lead: {
        label: "Lead",
        emoji: "🌱",
        color: "text-slate-600",
        headerGradient: "from-slate-400 to-slate-600",
        columnBg: "bg-slate-50/60 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-800",
        cardBorder: "border-slate-200 dark:border-slate-700",
        badgeBg: "bg-slate-100 dark:bg-slate-800",
        badgeText: "text-slate-600 dark:text-slate-300",
        avatarGradient: "from-slate-400 to-slate-600",
    },
    prospect: {
        label: "Prospect",
        emoji: "👀",
        color: "text-violet-600",
        headerGradient: "from-violet-400 to-violet-700",
        columnBg: "bg-violet-50/40 dark:bg-violet-950/20 border-violet-200/60 dark:border-violet-900/50",
        cardBorder: "border-violet-100 dark:border-violet-900/50",
        badgeBg: "bg-violet-100 dark:bg-violet-900/30",
        badgeText: "text-violet-700 dark:text-violet-300",
        avatarGradient: "from-violet-400 to-violet-700",
    },
    proposal: {
        label: "Proposal",
        emoji: "📋",
        color: "text-blue-600",
        headerGradient: "from-blue-400 to-blue-700",
        columnBg: "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/50",
        cardBorder: "border-blue-100 dark:border-blue-900/50",
        badgeBg: "bg-blue-100 dark:bg-blue-900/30",
        badgeText: "text-blue-700 dark:text-blue-300",
        avatarGradient: "from-blue-400 to-blue-700",
    },
    payment_pending: {
        label: "Payment Pending",
        emoji: "⏳",
        color: "text-amber-600",
        headerGradient: "from-amber-400 to-amber-600",
        columnBg: "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/50",
        cardBorder: "border-amber-100 dark:border-amber-900/50",
        badgeBg: "bg-amber-100 dark:bg-amber-900/30",
        badgeText: "text-amber-700 dark:text-amber-300",
        avatarGradient: "from-amber-400 to-amber-600",
    },
    payment_confirmed: {
        label: "Confirmed",
        emoji: "✅",
        color: "text-emerald-600",
        headerGradient: "from-emerald-400 to-emerald-700",
        columnBg: "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/50",
        cardBorder: "border-emerald-100 dark:border-emerald-900/50",
        badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
        badgeText: "text-emerald-700 dark:text-emerald-300",
        avatarGradient: "from-emerald-400 to-emerald-700",
    },
    active: {
        label: "Active Trip",
        emoji: "✈️",
        color: "text-green-600",
        headerGradient: "from-green-400 to-green-700",
        columnBg: "bg-green-50/40 dark:bg-green-950/20 border-green-200/60 dark:border-green-900/50",
        cardBorder: "border-green-100 dark:border-green-900/50",
        badgeBg: "bg-green-100 dark:bg-green-900/30",
        badgeText: "text-green-700 dark:text-green-300",
        avatarGradient: "from-green-400 to-green-700",
    },
    review: {
        label: "Review",
        emoji: "⭐",
        color: "text-orange-600",
        headerGradient: "from-orange-400 to-orange-600",
        columnBg: "bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-900/50",
        cardBorder: "border-orange-100 dark:border-orange-900/50",
        badgeBg: "bg-orange-100 dark:bg-orange-900/30",
        badgeText: "text-orange-700 dark:text-orange-300",
        avatarGradient: "from-orange-400 to-orange-600",
    },
    past: {
        label: "Closed",
        emoji: "🏁",
        color: "text-rose-600",
        headerGradient: "from-rose-400 to-rose-700",
        columnBg: "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/50",
        cardBorder: "border-rose-100 dark:border-rose-900/50",
        badgeBg: "bg-rose-100 dark:bg-rose-900/30",
        badgeText: "text-rose-700 dark:text-rose-300",
        avatarGradient: "from-rose-400 to-rose-700",
    },
};

const LANGUAGES = [
    "English", "हिंदी (Hindi)", "தமிழ் (Tamil)", "తెలుగు (Telugu)",
    "ಕನ್ನಡ (Kannada)", "മലയാളം (Malayalam)", "বাংলা (Bengali)",
    "मराठी (Marathi)", "ગુજરાતી (Gujarati)", "ਪੰਜਾਬੀ (Punjabi)",
    "ଓଡ଼ିଆ (Odia)", "اردو (Urdu)", "অসমীয়া (Assamese)",
];

function getInitials(name: string | null) {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export default function ClientsPage() {
    const supabase = createClient();
    const { toast } = useToast();

    const { data: rawClients, isLoading: loading, refetch: fetchClients } = useClients();
    const clients: Client[] = rawClients || [];

    // Dual scrollbar refs (top + bottom sync)
    const kanbanRef = useRef<HTMLDivElement>(null);
    const topScrollRef = useRef<HTMLDivElement>(null);
    const isSyncing = useRef(false);

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
        languagePreference: "English",
    });

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const headers: Record<string, string> = {};
                if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
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
            } catch { /* best-effort */ }
        };
        fetchLimits();
    }, [supabase]);

    const filteredClients = clients.filter(client =>
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getNextStage = (stage?: string | null) => {
        const current = LIFECYCLE_STAGES.indexOf((stage || "lead") as LifecycleStage);
        if (current < 0 || current >= LIFECYCLE_STAGES.length - 1) return null;
        return LIFECYCLE_STAGES[current + 1];
    };

    const getPrevStage = (stage?: string | null) => {
        const current = LIFECYCLE_STAGES.indexOf((stage || "lead") as LifecycleStage);
        if (current <= 0) return null;
        return LIFECYCLE_STAGES[current - 1];
    };

    const clientsByStage = LIFECYCLE_STAGES.map((stage) => ({
        stage,
        config: STAGE_CONFIG[stage],
        clients: filteredClients.filter((client) => (client.lifecycle_stage || "lead") === stage),
    }));

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
            languagePreference: "English",
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
            languagePreference: (client as any).language_preference || "English",
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
            const method = editingClientId ? "PATCH" : "POST";
            const body = editingClientId ? { ...formData, id: editingClientId } : formData;
            const response = await fetch("/api/admin/clients", {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const payload = await response.json();
                throw new Error(formatFeatureLimitError(payload, payload.error || `Failed to ${editingClientId ? "update" : "create"} client`));
            }
            await fetchClients();
            setModalOpen(false);
            resetForm();
            toast({
                title: editingClientId ? "Client Updated ✅" : "Client Added ✅",
                description: `${formData.full_name} has been ${editingClientId ? "updated" : "added"} successfully.`,
            });
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to save client");
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
                throw new Error(error.error || "Failed to update stage");
            }
            await fetchClients();
        } catch (error) {
            toast({
                title: "Failed to update stage",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "error",
            });
        } finally {
            setStageUpdatingId(null);
        }
    };

    // Stats
    const activeCount = clients.filter(c => ["lead", "prospect", "proposal"].includes(c.lifecycle_stage || "lead")).length;
    const vipCount = clients.filter(c => c.client_tag === "vip").length;
    const closedCount = clients.filter(c => ["past", "review"].includes(c.lifecycle_stage || "")).length;
    const totalLTV = clients.reduce((acc, c) => acc + ((c.trips_count || 1) * (c.budget_max || 85000)), 0);
    const visibleClientLimit = clientLimit && clientLimit.limit !== null ? clientLimit : null;

    return (
        <div className="space-y-8 pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Client Directory
                        </span>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                            {clients.length} clients
                        </span>
                    </div>
                    <h1 className="text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Clients
                    </h1>
                    <p className="text-text-muted text-base font-medium">
                        Manage your pipeline and track every client relationship.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => void fetchClients()}
                        className="h-11 w-11 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-colors bg-white dark:bg-slate-900 shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    <GlassButton
                        onClick={() => setModalOpen(true)}
                        variant="primary"
                        className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 group"
                    >
                        <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
                        <span className="text-xs font-black uppercase tracking-widest">Add Client</span>
                    </GlassButton>
                </div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Clients",
                        value: loading ? "—" : clients.length,
                        icon: Users,
                        color: "text-blue-600 dark:text-blue-400",
                        bg: "bg-blue-50 dark:bg-blue-900/20",
                        border: "border-blue-100 dark:border-blue-900/30",
                    },
                    {
                        label: "Active Pipeline",
                        value: loading ? "—" : activeCount,
                        icon: TrendingUp,
                        color: "text-emerald-600 dark:text-emerald-400",
                        bg: "bg-emerald-50 dark:bg-emerald-900/20",
                        border: "border-emerald-100 dark:border-emerald-900/30",
                    },
                    {
                        label: "VIP Clients",
                        value: loading ? "—" : vipCount,
                        icon: Sparkles,
                        color: "text-amber-600 dark:text-amber-400",
                        bg: "bg-amber-50 dark:bg-amber-900/20",
                        border: "border-amber-100 dark:border-amber-900/30",
                    },
                    {
                        label: "Est. Total LTV",
                        value: loading ? "—" : formatINR(totalLTV),
                        icon: IndianRupee,
                        color: "text-violet-600 dark:text-violet-400",
                        bg: "bg-violet-50 dark:bg-violet-900/20",
                        border: "border-violet-100 dark:border-violet-900/30",
                        small: true,
                    },
                ].map((stat) => (
                    <GlassCard key={stat.label} padding="lg" className={cn("group border transition-all duration-300 hover:shadow-lg", stat.border)}>
                        <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.18em] mb-2">{stat.label}</p>
                                <p className={cn(
                                    "font-black text-secondary dark:text-white tabular-nums tracking-tight",
                                    stat.small ? "text-2xl" : "text-4xl"
                                )}>
                                    {stat.value}
                                </p>
                            </div>
                            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* ── Capacity Warning ── */}
            {visibleClientLimit && !visibleClientLimit.allowed && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/50 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                                Client limit reached: {visibleClientLimit.used} / {visibleClientLimit.limit}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                Upgrade your plan to add more clients.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/settings?tab=billing"
                        className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        Upgrade <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* ── Pipeline Section ── */}
            <div className="space-y-5">
                {/* Header + Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                    <div>
                        <h2 className="text-lg font-serif text-secondary dark:text-white tracking-tight">Pipeline</h2>
                        <p className="text-xs text-text-muted mt-0.5 font-medium">
                            Drag clients through stages to track your sales pipeline.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:w-72 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-sm">
                            <Search className="w-4 h-4 text-text-muted shrink-0" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-secondary dark:text-white placeholder:text-text-muted/60 text-sm font-medium outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Kanban Board — with top scrollbar */}
                {/* Top scrollbar mirror */}
                <div
                    ref={topScrollRef}
                    className="overflow-x-auto overflow-y-hidden h-4 mb-1"
                    onScroll={(e) => {
                        if (isSyncing.current) return;
                        isSyncing.current = true;
                        if (kanbanRef.current) kanbanRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        setTimeout(() => { isSyncing.current = false; }, 50);
                    }}
                >
                    {/* spacer matching kanban total width: 8 cols × 280px + 7 gaps × 16px = 2352px */}
                    <div style={{ width: "2352px", height: "1px" }} />
                </div>
                <div
                    ref={kanbanRef}
                    className="flex gap-4 overflow-x-auto pb-4"
                    style={{ scrollSnapType: "x mandatory" }}
                    onScroll={(e) => {
                        if (isSyncing.current) return;
                        isSyncing.current = true;
                        if (topScrollRef.current) topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        setTimeout(() => { isSyncing.current = false; }, 50);
                    }}
                >
                    {clientsByStage.map(({ stage, config, clients: stageClients }) => (
                        <div
                            key={stage}
                            className="min-w-[280px] w-[280px] flex flex-col gap-3 shrink-0"
                            style={{ scrollSnapAlign: "start" }}
                        >
                            {/* Column Header */}
                            <div className={cn(
                                "rounded-2xl border px-4 py-3 flex items-center justify-between",
                                config.columnBg
                            )}>
                                <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm",
                                        `bg-gradient-to-br ${config.headerGradient}`
                                    )}>
                                        <span>{config.emoji}</span>
                                    </div>
                                    <span className="text-xs font-black text-secondary dark:text-white uppercase tracking-widest">
                                        {config.label}
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest",
                                    config.badgeBg, config.badgeText
                                )}>
                                    {stageClients.length}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div className={cn(
                                "flex-1 space-y-3 p-3 rounded-2xl border min-h-[300px] transition-colors",
                                config.columnBg
                            )}>
                                {stageClients.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-40">
                                        <div className="text-3xl mb-2">{config.emoji}</div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted text-center">
                                            No clients here
                                        </p>
                                        <p className="text-[9px] text-text-muted mt-1 text-center">
                                            Move clients using ← →
                                        </p>
                                    </div>
                                ) : (
                                    stageClients.map((client) => {
                                        const prevStage = getPrevStage(client.lifecycle_stage);
                                        const nextStage = getNextStage(client.lifecycle_stage);
                                        const initials = getInitials(client.full_name);
                                        const isUpdating = stageUpdatingId === client.id;

                                        return (
                                            <div
                                                key={`${stage}-${client.id}`}
                                                className={cn(
                                                    "group bg-white dark:bg-slate-900/80 rounded-2xl border shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300",
                                                    config.cardBorder,
                                                    isUpdating && "opacity-60 pointer-events-none"
                                                )}
                                            >
                                                <div className="p-4">
                                                    {/* Row 1: Avatar + Name + Actions */}
                                                    <div className="flex items-start gap-3">
                                                        {/* Avatar */}
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-black shadow-sm",
                                                            `bg-gradient-to-br ${config.avatarGradient}`
                                                        )}>
                                                            {initials}
                                                        </div>

                                                        {/* Name & Email */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-bold text-secondary dark:text-white truncate leading-tight">
                                                                {client.full_name || "Unknown"}
                                                            </h3>
                                                            <p className="text-[10px] font-medium text-text-muted truncate mt-0.5">
                                                                {client.email || "No email"}
                                                            </p>
                                                        </div>

                                                        {/* Action buttons — always visible */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClient(client); }}
                                                                className="p-1.5 text-text-muted hover:text-primary transition-colors bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-primary/30"
                                                                title="Edit client"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                            <Link
                                                                href={`/clients/${client.id}`}
                                                                className="p-1.5 text-text-muted hover:text-blue-600 transition-colors bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300"
                                                                title="View full profile"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Tags + LTV */}
                                                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                                        {client.client_tag && client.client_tag !== "standard" && (
                                                            <span className={cn(
                                                                "text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-widest",
                                                                client.client_tag === "vip"
                                                                    ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
                                                                    : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                                            )}>
                                                                {client.client_tag === "vip" ? "⭐ VIP" : client.client_tag}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                                                            <IndianRupee className="w-2 h-2" />
                                                            {formatINR((client.trips_count || 1) * (client.budget_max || 85000))}
                                                        </span>
                                                        {client.preferred_destination && (
                                                            <span className="text-[9px] font-medium text-text-muted truncate max-w-[100px]">
                                                                📍 {client.preferred_destination}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Row 3: Move arrows + trip count */}
                                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => prevStage && void handleLifecycleStageChange(client.id, prevStage)}
                                                                disabled={!prevStage || isUpdating}
                                                                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                                title={prevStage ? `Move to ${STAGE_CONFIG[prevStage as LifecycleStage]?.label}` : ""}
                                                            >
                                                                <ChevronLeft className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => nextStage && void handleLifecycleStageChange(client.id, nextStage)}
                                                                disabled={!nextStage || isUpdating}
                                                                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                                title={nextStage ? `Move to ${STAGE_CONFIG[nextStage as LifecycleStage]?.label}` : ""}
                                                            >
                                                                <ChevronRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        {client.trips_count ? (
                                                            <span className="flex items-center gap-1 text-[9px] font-black text-primary bg-primary/8 px-2 py-1 rounded-lg border border-primary/15 uppercase tracking-widest">
                                                                <Plane className="w-2.5 h-2.5" />
                                                                {client.trips_count} trip{client.trips_count > 1 ? "s" : ""}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] text-text-muted font-medium opacity-60">No trips yet</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Add / Edit Client Modal ── */}
            <GlassModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); resetForm(); }}
                title={editingClientId ? "Edit Client" : "Add New Client"}
            >
                <p className="text-sm font-medium text-text-muted mb-6">
                    {editingClientId
                        ? "Update the client details below."
                        : "Fill in the details to add a new client to your pipeline."}
                </p>
                <div className="grid gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-4">
                    <GlassInput
                        label="Full Name *"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Rahul Sharma"
                    />
                    <GlassInput
                        label="Email *"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="rahul@example.com"
                    />
                    <GlassInput
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-1">
                                <Languages className="w-2.5 h-2.5" /> Language
                            </label>
                            <select
                                value={formData.languagePreference}
                                onChange={(e) => setFormData(prev => ({ ...prev, languagePreference: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                            >
                                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Client Tag</label>
                            <select
                                value={formData.clientTag}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientTag: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                            >
                                <option value="standard">Standard</option>
                                <option value="vip">⭐ VIP</option>
                                <option value="repeat">🔄 Repeat</option>
                                <option value="corporate">🏢 Corporate</option>
                                <option value="family">👨‍👩‍👧 Family</option>
                                <option value="honeymoon">💑 Honeymoon</option>
                                <option value="high_priority">🔥 High Priority</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pipeline Stage</label>
                        <select
                            value={formData.lifecycleStage}
                            onChange={(e) => setFormData(prev => ({ ...prev, lifecycleStage: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-secondary dark:text-white focus:border-primary/50 outline-none transition-all shadow-sm"
                        >
                            {LIFECYCLE_STAGES.map(s => (
                                <option key={s} value={s}>{STAGE_CONFIG[s].emoji} {STAGE_CONFIG[s].label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Travel Preferences</h4>
                        <div className="grid gap-4">
                            <GlassInput
                                label="Preferred Destination"
                                value={formData.preferredDestination}
                                onChange={(e) => setFormData(prev => ({ ...prev, preferredDestination: e.target.value }))}
                                placeholder="Rajasthan, Kerala..."
                            />
                            <div className="grid grid-cols-3 gap-3">
                                <GlassInput
                                    label="Travelers"
                                    type="number"
                                    value={formData.travelersCount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, travelersCount: e.target.value }))}
                                    placeholder="2"
                                />
                                <GlassInput
                                    label="Min Budget ₹"
                                    type="number"
                                    value={formData.budgetMin}
                                    onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: e.target.value }))}
                                    placeholder="50000"
                                />
                                <GlassInput
                                    label="Max Budget ₹"
                                    type="number"
                                    value={formData.budgetMax}
                                    onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: e.target.value }))}
                                    placeholder="150000"
                                />
                            </div>
                            <GlassInput
                                label="Home Airport"
                                value={formData.homeAirport}
                                onChange={(e) => setFormData(prev => ({ ...prev, homeAirport: e.target.value }))}
                                placeholder="DEL, BOM, MAA..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Special requirements, dietary needs, preferences..."
                                className="min-h-[90px] w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-secondary dark:text-white placeholder:text-text-muted/60 focus:border-primary/50 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {formError && (
                        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formError}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                    <GlassButton
                        onClick={() => { setModalOpen(false); resetForm(); }}
                        variant="ghost"
                        className="font-bold text-xs uppercase tracking-widest text-text-muted"
                    >
                        Cancel
                    </GlassButton>
                    <GlassButton
                        onClick={handleSaveClient}
                        disabled={saving}
                        variant="primary"
                        className="font-bold text-xs uppercase tracking-widest"
                    >
                        {saving ? "Saving..." : (editingClientId ? "Update Client" : "Add Client")}
                    </GlassButton>
                </div>
            </GlassModal>
        </div>
    );
}
