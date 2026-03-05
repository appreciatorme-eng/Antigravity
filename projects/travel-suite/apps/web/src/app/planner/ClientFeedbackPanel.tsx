"use client";

import { useState } from "react";
import {
    MessageCircle, Heart, Settings2, ChevronDown, ChevronUp,
    Wallet, Gauge, BedDouble, Star, XCircle, StickyNote,
    Check, CheckCircle, Reply, Send, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeedbackAction } from "@/lib/queries/itineraries";
import type { ClientComment, ClientPreferences } from "@/types/feedback";

interface ClientFeedbackPanelProps {
    itineraryId: string;
    comments: ClientComment[];
    preferences: ClientPreferences | null;
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
    itineraryId,
    comments,
    preferences,
    wishlistItems,
}: ClientFeedbackPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const feedbackAction = useFeedbackAction();

    const hasComments = comments.length > 0;
    const hasPrefs = preferences && Object.keys(preferences).length > 0;
    const hasWishlist = wishlistItems.length > 0;
    const hasAnyFeedback = hasComments || hasPrefs || hasWishlist;

    if (!hasAnyFeedback) return null;

    const unresolvedCount = comments.filter((c) => !c.resolved_at).length;
    const allResolved = hasComments && unresolvedCount === 0;

    // Count activity types for the toggle label
    const activityParts: string[] = [];
    if (hasComments) {
        activityParts.push(
            unresolvedCount > 0
                ? `${unresolvedCount} unresolved`
                : `${comments.length} resolved ✓`
        );
    }
    if (hasPrefs) activityParts.push("preferences");
    if (hasWishlist) activityParts.push(`${wishlistItems.length} wish${wishlistItems.length > 1 ? "es" : ""}`);

    const handleResolve = (commentId: string) => {
        feedbackAction.mutate({ itineraryId, action: "resolve_comment", comment_id: commentId });
    };

    const handleUnresolve = (commentId: string) => {
        feedbackAction.mutate({ itineraryId, action: "unresolve_comment", comment_id: commentId });
    };

    const handleReply = (commentId: string) => {
        if (!replyText.trim()) return;
        feedbackAction.mutate(
            { itineraryId, action: "reply_comment", comment_id: commentId, reply: replyText.trim() },
            { onSuccess: () => { setReplyingTo(null); setReplyText(""); } }
        );
    };

    const handleResolveAll = () => {
        feedbackAction.mutate({ itineraryId, action: "resolve_all" });
    };

    return (
        <div className="mt-3">
            {/* Toggle button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200 border",
                    allResolved
                        ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40"
                        : isExpanded
                            ? "bg-violet-50 dark:bg-violet-900/15 border-violet-200 dark:border-violet-800/40"
                            : "bg-gradient-to-r from-violet-50/60 to-pink-50/40 dark:from-violet-900/10 dark:to-pink-900/10 border-violet-100 dark:border-violet-800/30 hover:border-violet-200 dark:hover:border-violet-700"
                )}
            >
                <div className="relative">
                    {allResolved ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                        <>
                            <MessageCircle className="w-3.5 h-3.5 text-violet-500" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        </>
                    )}
                </div>
                <span className={cn(
                    "text-[11px] font-bold flex-1",
                    allResolved ? "text-emerald-700 dark:text-emerald-300" : "text-violet-700 dark:text-violet-300"
                )}>
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
                    {/* Resolve All button */}
                    {hasComments && unresolvedCount > 0 && (
                        <div className="flex justify-end px-1">
                            <button
                                onClick={handleResolveAll}
                                disabled={feedbackAction.isPending}
                                className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                            >
                                {feedbackAction.isPending ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-2.5 h-2.5" />
                                )}
                                Resolve All
                            </button>
                        </div>
                    )}

                    {/* Comments */}
                    {hasComments && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-violet-500 dark:text-violet-400 flex items-center gap-1 px-1">
                                <MessageCircle className="w-2.5 h-2.5" /> Comments
                            </p>
                            {comments.map((c) => {
                                const isResolved = Boolean(c.resolved_at);
                                const isReplying = replyingTo === c.id;

                                return (
                                    <div
                                        key={c.id}
                                        className={cn(
                                            "rounded-lg border transition-all duration-200",
                                            isResolved
                                                ? "bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/30 opacity-60"
                                                : "bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/50"
                                        )}
                                    >
                                        <div className="px-3 py-2">
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-xs leading-relaxed",
                                                        isResolved
                                                            ? "text-slate-400 dark:text-slate-500 line-through"
                                                            : "text-slate-700 dark:text-slate-200"
                                                    )}>
                                                        &ldquo;{c.comment}&rdquo;
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">— {c.author}</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(c.created_at)}</span>
                                                        {isResolved && c.resolved_by && (
                                                            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                                                                <Check className="w-2 h-2" /> Resolved by {c.resolved_by}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!isResolved && !c.operator_reply && (
                                                        <button
                                                            onClick={() => setReplyingTo(isReplying ? null : c.id)}
                                                            className={cn(
                                                                "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                                                                isReplying
                                                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                                                    : "bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            )}
                                                            title="Reply"
                                                        >
                                                            <Reply className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => isResolved ? handleUnresolve(c.id) : handleResolve(c.id)}
                                                        disabled={feedbackAction.isPending}
                                                        className={cn(
                                                            "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                                                            isResolved
                                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                                                                : "bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                        )}
                                                        title={isResolved ? "Unresolve" : "Resolve"}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Operator reply display */}
                                        {c.operator_reply && (
                                            <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/15 border-l-2 border-emerald-400">
                                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Tour Operator</p>
                                                <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">{c.operator_reply}</p>
                                                {c.operator_reply_at && (
                                                    <span className="text-[10px] text-emerald-500/70 dark:text-emerald-400/50">{formatDate(c.operator_reply_at)}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Inline reply input */}
                                        {isReplying && (
                                            <div className="mx-3 mb-2 flex items-center gap-1.5">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") handleReply(c.id); }}
                                                    placeholder="Type your reply..."
                                                    className="flex-1 h-7 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-400"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleReply(c.id)}
                                                    disabled={!replyText.trim() || feedbackAction.isPending}
                                                    className="h-7 px-2.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {feedbackAction.isPending ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Send className="w-3 h-3" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
