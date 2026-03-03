"use client";

import { useMemo } from "react";
import {
    Search, Eye, Send, MessageCircle, CheckCircle, Briefcase,
    Clock, TrendingUp, Zap, FolderOpen, X,
    type LucideIcon,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

export type ItineraryStage =
    | "all" | "draft" | "shared" | "viewed" | "feedback" | "approved" | "converted"
    | "active_leads" | "won";

/** Compound stages that map to multiple individual stages */
const COMPOUND_STAGES: Record<string, string[]> = {
    active_leads: ["shared", "viewed", "feedback"],
    won: ["approved", "converted"],
};

/** Labels for compound stages shown in the filter banner */
const COMPOUND_LABELS: Record<string, string> = {
    active_leads: "Active Leads",
    won: "Approved & Converted",
};

interface StageConfig {
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    borderColor: string;
    darkColor: string;
    darkBg: string;
}

export const STAGE_CONFIG: Record<string, StageConfig> = {
    draft: {
        label: "Draft",
        icon: Clock,
        color: "text-gray-600",
        bg: "bg-gray-50",
        borderColor: "border-gray-200",
        darkColor: "dark:text-gray-400",
        darkBg: "dark:bg-gray-800/30",
    },
    shared: {
        label: "Shared",
        icon: Send,
        color: "text-violet-600",
        bg: "bg-violet-50",
        borderColor: "border-violet-200",
        darkColor: "dark:text-violet-400",
        darkBg: "dark:bg-violet-900/20",
    },
    viewed: {
        label: "Viewed",
        icon: Eye,
        color: "text-blue-600",
        bg: "bg-blue-50",
        borderColor: "border-blue-200",
        darkColor: "dark:text-blue-400",
        darkBg: "dark:bg-blue-900/20",
    },
    feedback: {
        label: "Feedback",
        icon: MessageCircle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        borderColor: "border-amber-200",
        darkColor: "dark:text-amber-400",
        darkBg: "dark:bg-amber-900/20",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        borderColor: "border-emerald-200",
        darkColor: "dark:text-emerald-400",
        darkBg: "dark:bg-emerald-900/20",
    },
    converted: {
        label: "Trip Created",
        icon: Briefcase,
        color: "text-primary",
        bg: "bg-primary/10",
        borderColor: "border-primary/20",
        darkColor: "dark:text-emerald-300",
        darkBg: "dark:bg-primary/10",
    },
};

const FILTER_TABS: { value: ItineraryStage; label: string }[] = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "shared", label: "Shared" },
    { value: "viewed", label: "Viewed" },
    { value: "feedback", label: "Feedback" },
    { value: "approved", label: "Approved" },
    { value: "converted", label: "Trips" },
];

export function deriveStage(itinerary: {
    share_code?: string | null;
    share_status?: string | null;
    trip_id?: string | null;
}): string {
    if (itinerary.trip_id) return "converted";
    if (itinerary.share_status === "approved") return "approved";
    if (itinerary.share_status === "commented") return "feedback";
    if (itinerary.share_status === "viewed") return "viewed";
    if (itinerary.share_code) return "shared";
    return "draft";
}

/** Check if an itinerary matches a filter (supports compound stages) */
export function matchesFilter(itinerary: any, filter: ItineraryStage): boolean {
    if (filter === "all") return true;
    const stage = deriveStage(itinerary);
    const compoundSet = COMPOUND_STAGES[filter];
    if (compoundSet) return compoundSet.includes(stage);
    return stage === filter;
}

/** Get display label for a filter stage (including compound) */
export function getFilterLabel(filter: ItineraryStage): string {
    if (filter === "all") return "All";
    const compoundLabel = COMPOUND_LABELS[filter];
    if (compoundLabel) return compoundLabel;
    return STAGE_CONFIG[filter]?.label ?? filter;
}

interface ItineraryFilterBarProps {
    itineraries: any[];
    filterStage: ItineraryStage;
    onFilterChange: (stage: ItineraryStage) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filteredCount: number;
}

interface StatDrill {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    bg: string;
    filterTarget: ItineraryStage;
}

export function ItineraryFilterBar({
    itineraries,
    filterStage,
    onFilterChange,
    searchQuery,
    onSearchChange,
    filteredCount,
}: ItineraryFilterBarProps) {
    const stageCounts = useMemo(() => {
        const counts: Record<string, number> = { all: 0, draft: 0, shared: 0, viewed: 0, feedback: 0, approved: 0, converted: 0 };
        for (const itin of itineraries) {
            const stage = deriveStage(itin);
            counts[stage] = (counts[stage] || 0) + 1;
            counts.all += 1;
        }
        return counts;
    }, [itineraries]);

    const summaryStats: StatDrill[] = useMemo(() => {
        const total = itineraries.length;
        const approved = stageCounts.approved;
        const converted = stageCounts.converted;
        const activeLeads = stageCounts.shared + stageCounts.viewed + stageCounts.feedback;
        const conversionRate = total > 0 ? Math.round(((approved + converted) / total) * 100) : 0;

        return [
            { label: "Total Plans", value: total, icon: FolderOpen, color: "text-primary", bg: "bg-primary/10", filterTarget: "all" },
            { label: "Active Leads", value: activeLeads, icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", filterTarget: "active_leads" },
            { label: "Approved", value: approved, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", filterTarget: "approved" },
            { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", filterTarget: "won" },
        ];
    }, [itineraries, stageCounts]);

    const handleStatClick = (stat: StatDrill) => {
        // Toggle: click again to deselect
        if (filterStage === stat.filterTarget) {
            onFilterChange("all");
        } else {
            onFilterChange(stat.filterTarget);
        }
    };

    /** Check if a chip tab should appear active — compound filters highlight matching individual chips */
    const isChipActive = (tabValue: ItineraryStage): boolean => {
        if (filterStage === tabValue) return true;
        // If a compound filter is active, highlight "All" only when "all"
        return false;
    };

    /** Check if the current filter is a compound KPI drill */
    const isCompoundActive = filterStage in COMPOUND_STAGES;

    return (
        <div className="space-y-4">
            {/* Summary stats row — clickable drill-throughs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {summaryStats.map((stat) => {
                    const isActive = filterStage === stat.filterTarget;
                    return (
                        <button
                            key={stat.label}
                            onClick={() => handleStatClick(stat)}
                            className="text-left focus:outline-none"
                        >
                            <GlassCard
                                padding="sm"
                                className={cn(
                                    "group border transition-all duration-200 cursor-pointer",
                                    isActive
                                        ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10"
                                        : "border-gray-100 dark:border-slate-800 hover:border-primary/40 hover:shadow-md"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                        stat.bg
                                    )}>
                                        <stat.icon className={cn("w-4.5 h-4.5", stat.color)} />
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest transition-colors",
                                            isActive ? "text-primary" : "text-text-muted"
                                        )}>
                                            {stat.label}
                                        </p>
                                        <p className="text-lg font-black text-secondary dark:text-white tracking-tight tabular-nums leading-tight">
                                            {stat.value}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        </button>
                    );
                })}
            </div>

            {/* Search + Filter chips row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <GlassCard padding="none" className="flex-1 overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center px-3.5 py-2">
                        <Search className="w-4 h-4 text-text-muted mr-2.5 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search by title, destination, or client..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-secondary dark:text-white placeholder:text-text-muted/60 text-sm h-8"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange("")}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-text-muted transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </GlassCard>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                    {FILTER_TABS.map((tab) => {
                        const count = stageCounts[tab.value] ?? 0;
                        const chipActive = isChipActive(tab.value);
                        return (
                            <button
                                key={tab.value}
                                onClick={() => onFilterChange(tab.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                                    chipActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-text-secondary hover:bg-gray-100 dark:hover:bg-slate-800"
                                )}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={cn(
                                        "text-[9px] font-black tabular-nums px-1.5 py-0.5 rounded-full",
                                        chipActive
                                            ? "bg-white/25 text-white"
                                            : "bg-gray-100 dark:bg-slate-800 text-text-muted"
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active filter banner */}
            {(filterStage !== "all" || searchQuery) && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
                    <span className="text-xs font-bold text-primary">
                        Showing {filteredCount} {filteredCount === 1 ? "itinerary" : "itineraries"}
                        {filterStage !== "all" && (
                            <> in <span className="uppercase">{getFilterLabel(filterStage)}</span></>
                        )}
                        {searchQuery && <> matching &ldquo;{searchQuery}&rdquo;</>}
                    </span>
                    <button
                        onClick={() => { onFilterChange("all"); onSearchChange(""); }}
                        className="ml-auto text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
}
