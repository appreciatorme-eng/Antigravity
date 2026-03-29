/**
 * Client Directory — Redesigned
 *
 * Premium CRM-style pipeline view for managing client relationships.
 */

"use client";

import Link from "next/link";
import {
    Users,
    Plus,
    RefreshCcw,
    TrendingUp,
    IndianRupee,
    Sparkles,
    ArrowRight,
} from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import { formatINR } from "./types";
import { useClientPipeline } from "./hooks/useClientPipeline";
import { useClientForm } from "./hooks/useClientForm";
import { ClientKanbanBoard } from "./components/ClientKanbanBoard";
import { ClientFormModal } from "./components/ClientFormModal";
import { GuidedTour } from '@/components/tour/GuidedTour';

export default function ClientsPage() {
    const pipeline = useClientPipeline();
    const form = useClientForm({ onSaved: pipeline.fetchClients });

    const { clients, loading, stats } = pipeline;
    const { visibleClientLimit } = stats;

    const statsCards = [
        {
            label: "Total Clients",
            value: loading ? "\u2014" : clients.length,
            icon: Users,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "border-blue-100 dark:border-blue-900/30",
        },
        {
            label: "Active Pipeline",
            value: loading ? "\u2014" : stats.activeCount,
            icon: TrendingUp,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            border: "border-emerald-100 dark:border-emerald-900/30",
        },
        {
            label: "VIP Clients",
            value: loading ? "\u2014" : stats.vipCount,
            icon: Sparkles,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-100 dark:border-amber-900/30",
        },
        {
            label: "Est. Total LTV",
            value: loading ? "\u2014" : formatINR(stats.totalLTV),
            icon: IndianRupee,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-900/20",
            border: "border-violet-100 dark:border-violet-900/30",
            small: true,
        },
    ];

    return (
        <div className="space-y-8 pb-20">
            <GuidedTour />

            {/* Header */}
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
                    <h1 className="text-3xl md:text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Clients
                    </h1>
                    <p className="text-text-muted text-sm md:text-base font-medium">
                        Manage your pipeline and track every client relationship.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => void pipeline.fetchClients()}
                        className="h-11 w-11 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-colors bg-white dark:bg-slate-900 shadow-sm"
                        title="Refresh"
                        aria-label="Refresh client list"
                    >
                        <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    <GlassButton
                        onClick={() => form.setModalOpen(true)}
                        variant="primary"
                        className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 group"
                        data-tour="create-client-btn"
                    >
                        <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
                        <span className="text-xs font-black uppercase tracking-widest">Add Client</span>
                    </GlassButton>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="client-stats">
                {statsCards.map((stat) => (
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

            {/* Capacity Warning */}
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

            {/* Pipeline Kanban */}
            <div data-tour="client-kanban">
            <ClientKanbanBoard
                clientsByStage={pipeline.clientsByStage}
                searchTerm={pipeline.searchTerm}
                onSearchChange={pipeline.setSearchTerm}
                stageUpdatingId={pipeline.stageUpdatingId}
                onLifecycleStageChange={pipeline.handleLifecycleStageChange}
                onEditClient={form.handleEditClient}
            />
            </div>

            {/* Add/Edit Client Modal */}
            <ClientFormModal
                isOpen={form.modalOpen}
                onClose={() => { form.setModalOpen(false); form.resetForm(); }}
                formData={form.formData}
                onFormChange={form.setFormData}
                editingClientId={form.editingClientId}
                saving={form.saving}
                formError={form.formError}
                onSave={form.handleSaveClient}
            />
        </div>
    );
}
