/**
 * ClientKanbanBoard — Kanban pipeline view with synchronized dual scrollbars
 */

"use client";

import { useRef } from "react";
import Link from "next/link";
import {
    Search,
    ExternalLink,
    Edit2,
    IndianRupee,
    ChevronLeft,
    ChevronRight,
    Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    type Client,
    type LifecycleStage,
    type StageConfig,
    LIFECYCLE_STAGES,
    STAGE_CONFIG,
    formatINR,
    getInitials,
    getNextStage,
    getPrevStage,
} from "../types";

interface StageGroup {
    stage: (typeof LIFECYCLE_STAGES)[number];
    config: StageConfig;
    clients: Client[];
}

interface ClientKanbanBoardProps {
    clientsByStage: StageGroup[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    stageUpdatingId: string | null;
    onLifecycleStageChange: (clientId: string, stage: string) => Promise<void>;
    onEditClient: (client: Client) => void;
}

export function ClientKanbanBoard({
    clientsByStage,
    searchTerm,
    onSearchChange,
    stageUpdatingId,
    onLifecycleStageChange,
    onEditClient,
}: ClientKanbanBoardProps) {
    const kanbanRef = useRef<HTMLDivElement>(null);
    const topScrollRef = useRef<HTMLDivElement>(null);
    const isSyncing = useRef(false);

    return (
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
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Top scrollbar mirror — desktop only */}
            <div
                ref={topScrollRef}
                className="hidden md:block overflow-x-auto overflow-y-hidden h-4 mb-1"
                onScroll={(e) => {
                    if (isSyncing.current) return;
                    isSyncing.current = true;
                    if (kanbanRef.current) kanbanRef.current.scrollLeft = e.currentTarget.scrollLeft;
                    setTimeout(() => { isSyncing.current = false; }, 50);
                }}
            >
                {/* spacer matching kanban total width: 8 cols x 280px + 7 gaps x 16px = 2352px */}
                <div style={{ width: "2352px", height: "1px" }} />
            </div>

            {/* Kanban Board */}
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
                                        Move clients using &larr; &rarr;
                                    </p>
                                </div>
                            ) : (
                                stageClients.map((client) => (
                                    <ClientCard
                                        key={`${stage}-${client.id}`}
                                        client={client}
                                        config={config}
                                        isUpdating={stageUpdatingId === client.id}
                                        onEdit={onEditClient}
                                        onStageChange={onLifecycleStageChange}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Client Card (co-located, used only here) ── */

interface ClientCardProps {
    client: Client;
    config: StageConfig;
    isUpdating: boolean;
    onEdit: (client: Client) => void;
    onStageChange: (clientId: string, stage: string) => Promise<void>;
}

function ClientCard({ client, config, isUpdating, onEdit, onStageChange }: ClientCardProps) {
    const prevStage = getPrevStage(client.lifecycle_stage);
    const nextStage = getNextStage(client.lifecycle_stage);
    const initials = getInitials(client.full_name);

    return (
        <div
            className={cn(
                "group bg-white dark:bg-slate-900/80 rounded-2xl border shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300",
                config.cardBorder,
                isUpdating && "opacity-60 pointer-events-none"
            )}
        >
            <div className="p-4">
                {/* Row 1: Avatar + Name + Actions */}
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-black shadow-sm",
                        `bg-gradient-to-br ${config.avatarGradient}`
                    )}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-secondary dark:text-white truncate leading-tight">
                            {client.full_name || "Unknown"}
                        </h3>
                        <p className="text-[10px] font-medium text-text-muted truncate mt-0.5">
                            {client.email || "No email"}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(client); }}
                            className="p-1.5 text-text-muted hover:text-primary transition-colors bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-primary/30"
                            aria-label={`Edit ${client.full_name || 'client'}`}
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <Link
                            href={`/clients/${client.id}`}
                            className="p-1.5 text-text-muted hover:text-blue-600 transition-colors bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300"
                            aria-label={`View ${client.full_name || 'client'} profile`}
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
                            {client.client_tag === "vip" ? "\u2B50 VIP" : client.client_tag}
                        </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                        <IndianRupee className="w-2 h-2" />
                        {formatINR((client.trips_count || 1) * (client.budget_max || 85000))}
                    </span>
                    {client.preferred_destination && (
                        <span className="text-[9px] font-medium text-text-muted truncate max-w-[100px]">
                            {"\uD83D\uDCCD"} {client.preferred_destination}
                        </span>
                    )}
                </div>

                {/* Row 3: Move arrows + trip count */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={() => prevStage && void onStageChange(client.id, prevStage)}
                            disabled={!prevStage || isUpdating}
                            className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label={prevStage ? `Move ${client.full_name || 'client'} to ${STAGE_CONFIG[prevStage as LifecycleStage]?.label}` : "No previous stage"}
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => nextStage && void onStageChange(client.id, nextStage)}
                            disabled={!nextStage || isUpdating}
                            className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label={nextStage ? `Move ${client.full_name || 'client'} to ${STAGE_CONFIG[nextStage as LifecycleStage]?.label}` : "No next stage"}
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
}
