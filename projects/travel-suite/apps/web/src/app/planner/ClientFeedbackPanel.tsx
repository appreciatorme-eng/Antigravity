"use client";

import { useState } from "react";
import {
    MessageCircle, Heart, Settings2, ChevronDown, ChevronUp,
    Wallet, Gauge, BedDouble, Star, XCircle, StickyNote,
    Phone, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
    id: string;
    author: string;
    comment: string;
    created_at: string;
}

interface Preferences {
    budget_preference?: string;
    pace?: string;
    room_preference?: string;
    must_have?: string[];
    avoid?: string[];
    notes?: string;
}

interface ClientFeedbackPanelProps {
    comments: Comment[];
    preferences: Preferences | null;
    wishlistItems: string[];
    approvedBy: string | null;
    approvedAt: string | null;
    clientName?: string | null;
}

const PACE_LABELS: Record<string, string> = {
    relaxed: "🧘 Relaxed",
    balanced: "⚖️ Balanced",
    packed: "🏃 Packed",
};

const BUDGET_LABELS: Record<string, string> = {
    economy: "💰 Economy",
    standard: "⚖️ Standard",
    premium: "💎 Premium",
    luxury: "👑 Luxury",
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ClientFeedbackPanel({
    comments,
    preferences,
    wishlistItems,
    approvedBy,
    approvedAt,
    clientName,
}: ClientFeedbackPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasComments = comments.length > 0;
    const hasPrefs = preferences && Object.keys(preferences).length > 0;
    const hasWishlist = wishlistItems.length > 0;
    const hasAnyFeedback = hasComments || hasPrefs || hasWishlist;

    if (!hasAnyFeedback) return null;

    // Count total activity types for the toggle label
    const activityParts: string[] = [];
    if (hasComments) activityParts.push(`${comments.length} comment${comments.length > 1 ? "s" : ""}`);
    if (hasPrefs) activityParts.push("preferences");
    if (hasWishlist) activityParts.push(`${wishlistItems.length} wish${wishlistItems.length > 1 ? "es" : ""}`);

    return (
        <div className="mt-3">
            {/* Toggle button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200 border",
                    isExpanded
                        ? "bg-violet-50 dark:bg-violet-900/15 border-violet-200 dark:border-violet-800/40"
                        : "bg-gradient-to-r from-violet-50/60 to-pink-50/40 dark:from-violet-900/10 dark:to-pink-900/10 border-violet-100 dark:border-violet-800/30 hover:border-violet-200 dark:hover:border-violet-700"
                )}
            >
                <div className="relative">
                    <MessageCircle className="w-3.5 h-3.5 text-violet-500" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                </div>
                <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 flex-1">
                    Client Feedback: {activityParts.join(" · ")}
                </span>
                {isExpanded
                    ? <ChevronUp className="w-3.5 h-3.5 text-violet-400" />
                    : <ChevronDown className="w-3.5 h-3.5 text-violet-400" />
                }
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="mt-2 space-y-2.5 animate-fade-in-up">
                    {/* Comments */}
                    {hasComments && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-500 dark:text-violet-400 flex items-center gap-1 px-1">
                                <MessageCircle className="w-2.5 h-2.5" /> Comments
                            </p>
                            {comments.map((c) => (
                                <div key={c.id} className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                                        &ldquo;{c.comment}&rdquo;
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">— {c.author}</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(c.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Preferences */}
                    {hasPrefs && preferences && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-500 dark:text-blue-400 flex items-center gap-1 px-1">
                                <Settings2 className="w-2.5 h-2.5" /> Preferences
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {preferences.budget_preference && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                        <Wallet className="w-3 h-3 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Budget</p>
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{BUDGET_LABELS[preferences.budget_preference] || preferences.budget_preference}</p>
                                        </div>
                                    </div>
                                )}
                                {preferences.pace && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                        <Gauge className="w-3 h-3 text-blue-500 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Pace</p>
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{PACE_LABELS[preferences.pace] || preferences.pace}</p>
                                        </div>
                                    </div>
                                )}
                                {preferences.room_preference && (
                                    <div className="col-span-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                        <BedDouble className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Room</p>
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{preferences.room_preference}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {preferences.must_have && preferences.must_have.length > 0 && (
                                <div className="flex flex-wrap gap-1 px-1">
                                    <Star className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                    {preferences.must_have.map((item, i) => (
                                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {preferences.avoid && preferences.avoid.length > 0 && (
                                <div className="flex flex-wrap gap-1 px-1">
                                    <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                                    {preferences.avoid.map((item, i) => (
                                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/40 line-through">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {preferences.notes && (
                                <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                                    <StickyNote className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{preferences.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Wishlist */}
                    {hasWishlist && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-pink-500 dark:text-pink-400 flex items-center gap-1 px-1">
                                <Heart className="w-2.5 h-2.5" /> Wishlist
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {wishlistItems.map((item, i) => (
                                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40">
                                        ♥ {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
