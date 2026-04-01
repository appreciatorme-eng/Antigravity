"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import {
    ArrowRight,
    Sparkles,
    Star,
    ImageIcon,
    RefreshCw,
    Upload,
    Filter,
    Globe,
    MessageSquareQuote,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authedFetch } from "@/lib/api/authed-fetch";
import type { ReputationPlatform } from "@/lib/reputation/types";

/* ---------- Types ---------- */

type ReviewSource = "social" | "reputation";

interface Review {
    id: string;
    name: string;
    trip: string;
    text: string;
    rating: number;
    platform: ReputationPlatform | "marketplace" | "manual";
    source: ReviewSource;
}

interface Props {
    onReviewSelected: (review: Review) => void;
}

/* ---------- Platform badge config ---------- */

const PLATFORM_BADGE_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; border: string }
> = {
    google: {
        label: "Google",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
    },
    tripadvisor: {
        label: "TripAdvisor",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        border: "border-emerald-200 dark:border-emerald-800",
    },
    facebook: {
        label: "Facebook",
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-blue-50 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
    },
    makemytrip: {
        label: "MakeMyTrip",
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/30",
        border: "border-red-200 dark:border-red-800",
    },
    internal: {
        label: "Direct",
        color: "text-violet-600 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/30",
        border: "border-violet-200 dark:border-violet-800",
    },
    marketplace: {
        label: "Marketplace",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/30",
        border: "border-amber-200 dark:border-amber-800",
    },
    manual: {
        label: "Manual",
        color: "text-slate-600 dark:text-slate-400",
        bg: "bg-slate-50 dark:bg-slate-800/50",
        border: "border-slate-200 dark:border-slate-700",
    },
};

/* ---------- Helper: Platform Badge ---------- */

function PlatformBadge({ platform }: { platform: string }) {
    const config = PLATFORM_BADGE_CONFIG[platform] ?? PLATFORM_BADGE_CONFIG.manual;

    return (
        <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color} ${config.bg} ${config.border}`}
        >
            <Globe className="w-3 h-3" />
            {config.label}
        </span>
    );
}

/* ---------- Helper: Star Rating ---------- */

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
    const sizeClass = size === "lg" ? "w-7 h-7" : size === "md" ? "w-5 h-5" : "w-4 h-4";
    const filledColor =
        size === "lg"
            ? "text-amber-400 fill-amber-400"
            : "text-emerald-500 fill-emerald-500";
    const emptyColor = size === "lg" ? "text-white/20" : "text-slate-200 dark:text-slate-700";

    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, s) => (
                <Star
                    key={s}
                    className={`${sizeClass} ${
                        s < rating ? filledColor : emptyColor
                    } drop-shadow-sm`}
                />
            ))}
        </div>
    );
}

/* ---------- Main Component ---------- */

export const ReviewsToInsta = ({ onReviewSelected }: Props) => {
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [minRating, setMinRating] = useState(4);
    const [bestOnly, setBestOnly] = useState(false);

    /* ---- Fetch reviews from both Social and Reputation sources ---- */

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);

            const [socialRes, reputationRes] = await Promise.allSettled([
                fetch("/api/social/reviews"),
                fetch("/api/reputation/reviews?limit=100&sortBy=rating&sortOrder=desc"),
            ]);

            const merged: Review[] = [];
            const seenIds = new Set<string>();

            // Parse social reviews
            if (socialRes.status === "fulfilled" && socialRes.value.ok) {
                const socialData = await socialRes.value.json();
                if (Array.isArray(socialData.reviews)) {
                    for (const r of socialData.reviews) {
                        if (!r.comment) continue;
                        const id = `social-${r.id}`;
                        seenIds.add(id);
                        merged.push({
                            id,
                            name: r.reviewer_name || "Anonymous",
                            trip: r.trip_name || r.destination || "Custom Trip",
                            text: r.comment,
                            rating: r.rating ?? 5,
                            platform: r.source === "marketplace" ? "marketplace" : "manual",
                            source: "social" as const,
                        });
                    }
                }
            }

            // Parse reputation reviews
            if (reputationRes.status === "fulfilled" && reputationRes.value.ok) {
                const repData = await reputationRes.value.json();
                if (Array.isArray(repData.reviews)) {
                    for (const r of repData.reviews) {
                        if (!r.comment) continue;
                        const id = `rep-${r.id}`;
                        if (seenIds.has(id)) continue;
                        seenIds.add(id);
                        merged.push({
                            id,
                            name: r.reviewer_name || "Anonymous",
                            trip: r.destination || r.trip_type || "Custom Trip",
                            text: r.comment,
                            rating: r.rating ?? 5,
                            platform: (r.platform as ReputationPlatform) || "internal",
                            source: "reputation" as const,
                        });
                    }
                }
            }

            // Sort by rating descending, then alphabetically by name
            const sorted = [...merged].sort((a, b) => {
                if (b.rating !== a.rating) return b.rating - a.rating;
                return a.name.localeCompare(b.name);
            });

            setReviews(sorted);

            if (merged.length === 0) {
                // Both sources failed or had no data
                if (
                    socialRes.status === "rejected" &&
                    reputationRes.status === "rejected"
                ) {
                    toast.error("Failed to load reviews from any source");
                }
            }
        } catch {
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleImport = useCallback(async () => {
        try {
            setImporting(true);
            const res = await authedFetch("/api/social/reviews/import", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Import complete");
                fetchReviews();
            } else {
                toast.error(data.error || "Failed to import");
            }
        } catch {
            toast.error("Network error during import");
        } finally {
            setImporting(false);
        }
    }, [fetchReviews]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    /* ---- Filtering ---- */

    const effectiveMinRating = bestOnly ? 5 : minRating;
    const filtered = reviews.filter((r) => r.rating >= effectiveMinRating);
    const activeReview = reviews.find((r) => r.id === selectedReviewId) ?? null;

    /* ---- Actions ---- */

    const handleUseReview = useCallback(
        (review: Review) => {
            onReviewSelected(review);
            toast.success("Review loaded! Now pick a Review template in Marketing Studio.");
        },
        [onReviewSelected]
    );

    const handleBestOnlyToggle = useCallback(() => {
        setBestOnly((prev) => !prev);
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8 items-start max-w-6xl mx-auto">
            {/* Left: review list */}
            <div className="space-y-5 animate-fade-in-right">
                <div className="flex justify-between items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Convert love into marketing.
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleImport}
                        disabled={importing}
                        className="gap-2 shrink-0"
                    >
                        {importing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        Import
                    </Button>
                </div>

                <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    Turn 5-star reviews into auto-branded social posts with one click.
                    Reviews are sourced from your Reputation Manager and Social Studio.
                </p>

                {/* Filters row */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Min rating:
                    </span>
                    {[3, 4, 5].map((r) => (
                        <button
                            key={r}
                            onClick={() => {
                                setMinRating(r);
                                if (bestOnly && r !== 5) setBestOnly(false);
                            }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                !bestOnly && minRating === r
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                        >
                            {r}+ <Star className="w-3 h-3 fill-current" />
                        </button>
                    ))}

                    {/* Best Reviews quick toggle */}
                    <button
                        onClick={handleBestOnlyToggle}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                            bestOnly
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        }`}
                    >
                        <Star className="w-3 h-3 fill-current" />
                        Best Reviews
                    </button>
                </div>

                {/* Review count summary */}
                {!loading && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Showing {filtered.length} of {reviews.length} reviews
                        {bestOnly ? " (5-star only)" : minRating > 1 ? ` (${minRating}+ stars)` : ""}
                    </p>
                )}

                {/* Review list */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl">
                            {reviews.length === 0
                                ? "No reviews yet. Import from marketplace or check your Reputation Manager."
                                : `No reviews with ${effectiveMinRating}+ stars. Try lowering the filter.`}
                        </div>
                    ) : (
                        filtered.map((review, i) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <GlassCard
                                    className={`p-5 cursor-pointer transition-all border dark:bg-slate-900/40 shadow-sm ${
                                        selectedReviewId === review.id
                                            ? "border-indigo-400 shadow-indigo-100 dark:shadow-indigo-900/20"
                                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                                    onClick={() => setSelectedReviewId(review.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-100">
                                                {review.name}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5 uppercase">
                                                {review.trip}
                                            </p>
                                            <PlatformBadge platform={review.platform} />
                                        </div>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                                        &quot;{review.text}&quot;
                                    </p>

                                    {/* Expanded actions when selected */}
                                    {selectedReviewId === review.id && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                            {/* Template suggestion hint */}
                                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40">
                                                <MessageSquareQuote className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                                    Tip: Use a &quot;Review&quot; category template for best results.
                                                    These templates are designed to showcase customer testimonials.
                                                </p>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold gap-2 shadow-md"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUseReview(review);
                                                    }}
                                                >
                                                    <Sparkles className="w-4 h-4" /> Use in Marketing
                                                    Studio
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: live preview card */}
            <div className="relative aspect-[4/5] bg-gradient-to-br from-slate-900 to-black rounded-3xl p-8 flex flex-col justify-center items-center shadow-2xl overflow-hidden group sticky top-4">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

                <AnimatePresence mode="wait">
                    {activeReview ? (
                        <motion.div
                            key="review-preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 w-full bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl"
                        >
                            {/* Platform source in preview */}
                            <div className="flex justify-center mb-4">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border border-white/20 ${
                                        activeReview.source === "reputation"
                                            ? "bg-violet-500/20 text-violet-200"
                                            : "bg-white/10 text-white/70"
                                    }`}
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    {PLATFORM_BADGE_CONFIG[activeReview.platform]?.label ??
                                        "Review"}
                                </span>
                            </div>

                            <div className="flex justify-center mb-6 gap-1">
                                <StarRating
                                    rating={activeReview.rating}
                                    size="lg"
                                />
                            </div>
                            <h3 className="text-2xl text-white font-serif italic text-center leading-snug drop-shadow-sm line-clamp-6">
                                &quot;{activeReview.text}&quot;
                            </h3>
                            <div className="mt-10 text-center space-y-1">
                                <p className="text-white font-bold tracking-widest uppercase text-sm">
                                    {activeReview.name}
                                </p>
                                <p className="text-white/60 text-xs font-medium">
                                    {activeReview.trip}
                                </p>
                            </div>
                            <div className="mt-6 flex justify-center">
                                <Button
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 border-none shadow-xl text-white font-bold gap-2"
                                    onClick={() => handleUseReview(activeReview)}
                                >
                                    <Sparkles className="w-4 h-4" /> Use in Marketing Studio
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty-preview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-white/40 flex flex-col items-center p-8 border border-dashed border-white/20 rounded-2xl"
                        >
                            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p className="font-medium">
                                Select a review to preview it here.
                            </p>
                            <p className="text-xs mt-1 opacity-60">
                                Then click &quot;Use in Marketing Studio&quot; to create a
                                branded post.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
