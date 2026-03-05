"use client";

import { useMemo, useState } from "react";
import {
    Bell, MessageCircle, Heart, Settings2, Clock, ChevronDown,
    ChevronUp, AlertTriangle, CheckCircle,
    Sparkles, Eye, Check, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deriveStage } from "./ItineraryFilterBar";
import { useFeedbackAction } from "@/lib/queries/itineraries";
import type { ClientComment, ClientPreferences } from "@/types/feedback";

/** Minimal itinerary shape used by hasClientActivity and deriveStage */
export interface ItineraryLike {
    id: string;
    share_code?: string | null;
    share_status?: string | null;
    trip_id?: string | null;
    client_comments?: ClientComment[];
    client_preferences?: ClientPreferences | null;
    wishlist_items?: string[];
    self_service_status?: string | null;
}

export interface AttentionItem {
    id: string;
    trip_title: string;
    destination: string;
    client_comments: ClientComment[];
    client_preferences: ClientPreferences | null;
    wishlist_items: string[];
    self_service_status: string | null;
    share_status: string | null;
    viewed_at: string | null;
    approved_at: string | null;
    approved_by: string | null;
    client?: { full_name: string } | null;
}

type UrgencyLevel = "critical" | "high" | "medium";

interface EnrichedAttentionItem extends AttentionItem {
    urgency: UrgencyLevel;
    latestActivityAt: Date;
    activitySummary: string[];
    timeAgo: string;
}

/** Check if an itinerary has unresolved client activity requiring operator attention */
export function hasClientActivity(itinerary: ItineraryLike): boolean {
    const comments: ClientComment[] = itinerary.client_comments ?? [];
    const prefs = itinerary.client_preferences;
    const wishlist = itinerary.wishlist_items ?? [];
    const selfService = itinerary.self_service_status;
    const stage = deriveStage(itinerary);

    // Only unresolved comments need attention
    const unresolvedComments = comments.filter((c) => !c.resolved_at);
    if (unresolvedComments.length > 0 && stage !== "converted") return true;
    // Has preference updates
    if (prefs && Object.keys(prefs).length > 0 && stage !== "converted") return true;
    // Has wishlist items
    if (wishlist.length > 0 && stage !== "converted") return true;
    // Self-service has been updated (but 'resolved' no longer triggers)
    if (selfService === "updated") return true;

    return false;
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
}

function getUrgency(latestActivity: Date): UrgencyLevel {
    const hoursAgo = (Date.now() - latestActivity.getTime()) / (1000 * 60 * 60);
    if (hoursAgo > 48) return "critical";
    if (hoursAgo > 12) return "high";
    return "medium";
}

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; bg: string; border: string; dot: string; icon: typeof AlertTriangle }> = {
    critical: { label: "Overdue", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800/40", dot: "bg-red-500", icon: AlertTriangle },
    high: { label: "Waiting", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800/40", dot: "bg-amber-500", icon: Clock },
    medium: { label: "New", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/40", dot: "bg-emerald-500", icon: Sparkles },
};

function enrichItem(item: AttentionItem): EnrichedAttentionItem {
    const comments = item.client_comments ?? [];
    const prefs = item.client_preferences;
    const wishlist = item.wishlist_items ?? [];

    // Determine latest activity timestamp
    const timestamps: Date[] = [];
    for (const c of comments) {
        if (c.created_at) timestamps.push(new Date(c.created_at));
    }
    if (item.viewed_at) timestamps.push(new Date(item.viewed_at));
    if (item.approved_at) timestamps.push(new Date(item.approved_at));
    const latestActivityAt = timestamps.length > 0
        ? new Date(Math.max(...timestamps.map(t => t.getTime())))
        : new Date();

    // Build activity summary — show unresolved counts
    const unresolvedCount = comments.filter((c) => !c.resolved_at).length;
    const activitySummary: string[] = [];
    if (unresolvedCount > 0) activitySummary.push(`${unresolvedCount} unresolved comment${unresolvedCount > 1 ? "s" : ""}`);
    if (prefs && Object.keys(prefs).length > 0) activitySummary.push("preferences updated");
    if (wishlist.length > 0) activitySummary.push(`${wishlist.length} wishlist item${wishlist.length > 1 ? "s" : ""}`);
    if (item.approved_by) activitySummary.push(`approved by ${item.approved_by}`);

    return {
        ...item,
        urgency: getUrgency(latestActivityAt),
        latestActivityAt,
        activitySummary,
        timeAgo: getTimeAgo(latestActivityAt),
    };
}

interface NeedsAttentionQueueProps {
    itineraries: AttentionItem[];
    onOpenItinerary: (id: string) => void;
    openingItineraryId: string | null;
}

export function NeedsAttentionQueue({ itineraries, onOpenItinerary, openingItineraryId }: NeedsAttentionQueueProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const feedbackAction = useFeedbackAction();

    const attentionItems = useMemo(() => {
        const items = itineraries
            .filter(hasClientActivity)
            .map(enrichItem)
            .sort((a, b) => {
                // Sort: critical first, then high, then medium; within same urgency, newest first
                const urgencyOrder: Record<UrgencyLevel, number> = { critical: 0, high: 1, medium: 2 };
                const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                if (urgencyDiff !== 0) return urgencyDiff;
                return b.latestActivityAt.getTime() - a.latestActivityAt.getTime();
            });
        return items;
    }, [itineraries]);

    if (attentionItems.length === 0) return null;

    const criticalCount = attentionItems.filter(i => i.urgency === "critical").length;
    const highCount = attentionItems.filter(i => i.urgency === "high").length;

    return (
        <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-800/40 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-amber-50/80 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-amber-950/20 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-amber-100/40 dark:hover:bg-amber-900/10 transition-colors"
            >
                <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                        <Bell className="w-4 h-4 text-white" />
                    </div>
                    {/* Pulse indicator */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm animate-pulse">
                        {attentionItems.length}
                    </span>
                </div>

                <div className="flex-1 text-left">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Needs Your Attention
                    </h3>
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/60 font-medium">
                        {attentionItems.length} itinerar{attentionItems.length === 1 ? "y has" : "ies have"} client feedback
                        {criticalCount > 0 && <> · <span className="text-red-600 dark:text-red-400 font-bold">{criticalCount} overdue</span></>}
                        {highCount > 0 && <> · <span className="text-amber-700 dark:text-amber-300 font-bold">{highCount} waiting</span></>}
                    </p>
                </div>

                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all", isExpanded ? "bg-amber-200/60 dark:bg-amber-800/30" : "bg-transparent")}>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
            </button>

            {/* Items */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                    {attentionItems.map((item) => {
                        const config = URGENCY_CONFIG[item.urgency];
                        const UrgencyIcon = config.icon;
                        const latestComment = item.client_comments?.[0];
                        const isOpening = openingItineraryId === item.id;

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "group rounded-xl border-2 bg-white dark:bg-slate-900 p-3.5 transition-all duration-200 hover:shadow-md cursor-pointer",
                                    config.border,
                                    isOpening && "opacity-60 pointer-events-none"
                                )}
                                onClick={() => onOpenItinerary(item.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenItinerary(item.id); }}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Urgency indicator */}
                                    <div className="flex flex-col items-center gap-1 pt-0.5">
                                        <div className={cn("w-2.5 h-2.5 rounded-full", config.dot, item.urgency === "critical" && "animate-pulse")} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                                {item.trip_title || item.destination}
                                            </h4>
                                            <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0", config.color, config.bg)}>
                                                <UrgencyIcon className="w-2.5 h-2.5" />
                                                {config.label} · {item.timeAgo}
                                            </span>
                                        </div>

                                        {/* Activity summary chips */}
                                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                            {item.client_comments.length > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md">
                                                    <MessageCircle className="w-2.5 h-2.5" /> {item.client_comments.length} comment{item.client_comments.length > 1 ? "s" : ""}
                                                </span>
                                            )}
                                            {item.client_preferences && Object.keys(item.client_preferences).length > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                                    <Settings2 className="w-2.5 h-2.5" /> Preferences
                                                </span>
                                            )}
                                            {item.wishlist_items.length > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 px-2 py-0.5 rounded-md">
                                                    <Heart className="w-2.5 h-2.5" /> {item.wishlist_items.length} wishes
                                                </span>
                                            )}
                                            {item.approved_by && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                                                    <CheckCircle className="w-2.5 h-2.5" /> Approved
                                                </span>
                                            )}
                                            {item.client?.full_name && (
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    by {item.client.full_name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Latest comment preview */}
                                        {latestComment && (
                                            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                                                <MessageCircle className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                                        &ldquo;{latestComment.comment}&rdquo;
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                                        — {latestComment.author}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-1.5 shrink-0 mt-1">
                                        <button
                                            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 group-hover:text-emerald-600 text-slate-400 transition-all"
                                            onClick={(e) => { e.stopPropagation(); onOpenItinerary(item.id); }}
                                            title="Open itinerary"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                feedbackAction.isPending
                                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-400 cursor-wait"
                                                    : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                feedbackAction.mutate({ itineraryId: item.id, action: "resolve_all" });
                                            }}
                                            disabled={feedbackAction.isPending}
                                            title="Resolve all feedback"
                                        >
                                            {feedbackAction.isPending ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
