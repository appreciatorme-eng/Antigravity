"use client";

import { useMemo } from "react";
import {
    Search, Eye, Send, MessageCircle, CheckCircle, Briefcase,
    Clock, TrendingUp, Zap, FolderOpen, X, Filter, Bell,
    type LucideIcon,
} from "lucide-react";
import { hasClientActivity, type ItineraryLike } from "./NeedsAttentionQueue";
import { cn } from "@/lib/utils";

export type ItineraryStage =
    | "all" | "draft" | "shared" | "viewed" | "feedback" | "approved" | "converted"
    | "active_leads" | "won" | "needs_attention";

/** Compound stages that map to multiple individual stages */
const COMPOUND_STAGES: Record<string, string[]> = {
    active_leads: ["shared", "viewed", "feedback"],
    won: ["approved", "converted"],
};

/** Labels for compound stages shown in the filter banner */
const COMPOUND_LABELS: Record<string, string> = {
    active_leads: "Active Leads",
    won: "Approved & Converted",
    needs_attention: "Needs Attention",
};

interface StageConfig {
    label: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    borderColor: string;
    darkColor: string;
    darkBg: string;
    gradient: string;
}

export const STAGE_CONFIG: Record<string, StageConfig> = {
    draft: {
        label: "Draft",
        icon: Clock,
        color: "text-slate-500",
        bg: "bg-slate-50",
        borderColor: "border-slate-200",
        darkColor: "dark:text-slate-400",
        darkBg: "dark:bg-slate-800/30",
        gradient: "from-slate-400 to-slate-500",
    },
    shared: {
        label: "Shared",
        icon: Send,
        color: "text-violet-600",
        bg: "bg-violet-50",
        borderColor: "border-violet-200",
        darkColor: "dark:text-violet-400",
        darkBg: "dark:bg-violet-900/20",
        gradient: "from-violet-500 to-purple-500",
    },
    viewed: {
        label: "Viewed",
        icon: Eye,
        color: "text-blue-600",
        bg: "bg-blue-50",
        borderColor: "border-blue-200",
        darkColor: "dark:text-blue-400",
        darkBg: "dark:bg-blue-900/20",
        gradient: "from-blue-500 to-cyan-500",
    },
    feedback: {
        label: "Feedback",
        icon: MessageCircle,
        color: "text-amber-600",
        bg: "bg-amber-50",
        borderColor: "border-amber-200",
        darkColor: "dark:text-amber-400",
        darkBg: "dark:bg-amber-900/20",
        gradient: "from-amber-500 to-orange-500",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        borderColor: "border-emerald-200",
        darkColor: "dark:text-emerald-400",
        darkBg: "dark:bg-emerald-900/20",
        gradient: "from-emerald-500 to-green-500",
    },
    converted: {
        label: "Trip Created",
        icon: Briefcase,
        color: "text-primary",
        bg: "bg-primary/10",
        borderColor: "border-primary/20",
        darkColor: "dark:text-emerald-300",
        darkBg: "dark:bg-primary/10",
        gradient: "from-emerald-400 to-teal-500",
    },
};

const FILTER_TABS: { value: ItineraryStage; label: string; icon?: LucideIcon }[] = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft", icon: Clock },
    { value: "shared", label: "Shared", icon: Send },
    { value: "viewed", label: "Viewed", icon: Eye },
    { value: "feedback", label: "Feedback", icon: MessageCircle },
    { value: "approved", label: "Approved", icon: CheckCircle },
    { value: "converted", label: "Trips", icon: Briefcase },
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

/** Check if an itinerary matches a filter (supports compound stages + needs_attention) */
export function matchesFilter(itinerary: ItineraryLike, filter: ItineraryStage): boolean {
    if (filter === "all") return true;
    if (filter === "needs_attention") return hasClientActivity(itinerary);
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
    itineraries: ItineraryLike[];
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
    iconGradient: string;
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

    const attentionCount = useMemo(() => {
        return itineraries.filter(hasClientActivity).length;
    }, [itineraries]);

    const summaryStats: StatDrill[] = useMemo(() => {
        const total = itineraries.length;
        const approved = stageCounts.approved;
        const converted = stageCounts.converted;
        const activeLeads = stageCounts.shared + stageCounts.viewed + stageCounts.feedback;
        const conversionRate = total > 0 ? Math.round(((approved + converted) / total) * 100) : 0;

        return [
            { label: "Total Plans", value: total, icon: FolderOpen, color: "text-emerald-500", iconGradient: "from-emerald-500 to-teal-500", filterTarget: "all" },
            { label: "Needs Attention", value: attentionCount, icon: Bell, color: "text-red-500", iconGradient: "from-red-500 to-orange-500", filterTarget: "needs_attention" },
            { label: "Active Leads", value: activeLeads, icon: Zap, color: "text-amber-500", iconGradient: "from-amber-400 to-orange-500", filterTarget: "active_leads" },
            { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-indigo-500", iconGradient: "from-indigo-500 to-violet-500", filterTarget: "won" },
        ];
    }, [itineraries, stageCounts, attentionCount]);

    const handleStatClick = (stat: StatDrill) => {
        if (filterStage === stat.filterTarget) {
            onFilterChange("all");
        } else {
            onFilterChange(stat.filterTarget);
        }
    };

    const isChipActive = (tabValue: ItineraryStage): boolean => {
        return filterStage === tabValue;
    };

    return (
        <div className="space-y-4">
            {/* ── KPI Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {summaryStats.map((stat, idx) => {
                    const isActive = filterStage === stat.filterTarget;
                    return (
                        <button
                            key={stat.label}
                            onClick={() => handleStatClick(stat)}
                            className={cn(
                                "group text-left rounded-2xl p-4 border-2 transition-all duration-300 relative overflow-hidden",
                                isActive
                                    ? "bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                                    : "bg-white/80 dark:bg-slate-900/80 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
                            )}
                            style={{ animationDelay: `${idx * 80}ms` }}
                        >
                            {/* Active indicator line */}
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
                            )}
                            {/* Pulse badge for needs attention */}
                            {stat.filterTarget === "needs_attention" && attentionCount > 0 && !isActive && (
                                <div className="absolute top-2 right-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-gradient-to-br shadow-sm",
                                    stat.iconGradient,
                                    isActive ? "scale-110 shadow-md" : "group-hover:scale-105"
                                )}>
                                    <stat.icon className="w-4.5 h-4.5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.12em] transition-colors truncate",
                                        isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                                    )}>
                                        {stat.label}
                                    </p>
                                    <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight tabular-nums leading-tight">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Search + Filter Chips Row ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title, destination, or client..."
                        className="w-full h-10 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-9 text-sm text-slate-800 dark:text-white placeholder:text-slate-400/70 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                    {FILTER_TABS.map((tab) => {
                        const count = stageCounts[tab.value] ?? 0;
                        const chipActive = isChipActive(tab.value);
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => onFilterChange(tab.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5",
                                    chipActive
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 hover:shadow-sm"
                                )}
                            >
                                {TabIcon && <TabIcon className="w-3 h-3" />}
                                {tab.label}
                                {count > 0 && (
                                    <span className={cn(
                                        "text-[9px] font-black tabular-nums px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                                        chipActive
                                            ? "bg-white/20 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                                    )}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Active Filter Banner ── */}
            {(filterStage !== "all" || searchQuery) && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                    <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Showing {filteredCount} {filteredCount === 1 ? "itinerary" : "itineraries"}
                        {filterStage !== "all" && (
                            <> in <span className="uppercase tracking-wide">{getFilterLabel(filterStage)}</span></>
                        )}
                        {searchQuery && <> matching &ldquo;{searchQuery}&rdquo;</>}
                    </span>
                    <button
                        onClick={() => { onFilterChange("all"); onSearchChange(""); }}
                        className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                    >
                        <X className="w-3 h-3" />
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}
