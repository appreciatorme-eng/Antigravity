"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { ArrowRight, Sparkles, Star, ImageIcon, RefreshCw, Upload, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Review {
    id: string;
    name: string;
    trip: string;
    text: string;
    rating: number;
}

interface Props {
    onReviewSelected: (review: Review) => void;
}

export const ReviewsToInsta = ({ onReviewSelected }: Props) => {
    const [reviewGenerating, setReviewGenerating] = useState<string | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [minRating, setMinRating] = useState(4);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/social/reviews");
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews.map((r: any) => ({
                    id: r.id,
                    name: r.reviewer_name,
                    trip: r.trip_name || r.destination || "Custom Trip",
                    text: r.comment,
                    rating: r.rating,
                })));
            }
        } catch {
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        try {
            setImporting(true);
            const res = await fetch("/api/social/reviews/import", { method: "POST" });
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
    };

    useEffect(() => { fetchReviews(); }, []);

    const filtered = reviews.filter(r => r.rating >= minRating);
    const activeReview = reviews.find(r => r.name === reviewGenerating);

    const handleUseReview = (review: Review) => {
        onReviewSelected(review);
        toast.success(`Review loaded! Now pick a Review template in Marketing Studio.`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8 items-start max-w-6xl mx-auto">
            {/* Left: review list */}
            <div className="space-y-5 animate-fade-in-right">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Convert love into marketing.</h2>
                    <Button variant="outline" size="sm" onClick={handleImport} disabled={importing} className="gap-2 shrink-0">
                        {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Import
                    </Button>
                </div>

                <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    Turn 5-star reviews into auto-branded social posts with one click.
                </p>

                {/* Rating filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Min rating:</span>
                    {[3, 4, 5].map(r => (
                        <button
                            key={r}
                            onClick={() => setMinRating(r)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                minRating === r
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                        >
                            {r}+ <Star className="w-3 h-3 fill-current" />
                        </button>
                    ))}
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl">
                            {reviews.length === 0
                                ? "No reviews yet. Import from marketplace or wait for clients to submit."
                                : `No reviews with ${minRating}+ stars. Try lowering the filter.`
                            }
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
                                        reviewGenerating === review.name
                                            ? "border-indigo-400 shadow-indigo-100 dark:shadow-indigo-900/20"
                                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                    }`}
                                    onClick={() => setReviewGenerating(review.name)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{review.name}</p>
                                            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5 uppercase">{review.trip}</p>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, s) => (
                                                <Star key={s} className={`w-4 h-4 ${s < review.rating ? "text-emerald-500 fill-emerald-500" : "text-slate-200"} drop-shadow-sm`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                                        &quot;{review.text}&quot;
                                    </p>
                                    {reviewGenerating === review.name && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                            <Button
                                                size="sm"
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold gap-2 shadow-md"
                                                onClick={e => { e.stopPropagation(); handleUseReview(review); }}
                                            >
                                                <Sparkles className="w-4 h-4" /> Use in Marketing Studio
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
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
                            <div className="flex justify-center mb-6 gap-1">
                                {Array.from({ length: 5 }).map((_, s) => (
                                    <Star key={s} className={`w-7 h-7 ${s < activeReview.rating ? "text-amber-400 fill-amber-400" : "text-white/20"} drop-shadow-md`} />
                                ))}
                            </div>
                            <h3 className="text-2xl text-white font-serif italic text-center leading-snug drop-shadow-sm line-clamp-6">
                                &quot;{activeReview.text}&quot;
                            </h3>
                            <div className="mt-10 text-center space-y-1">
                                <p className="text-white font-bold tracking-widest uppercase text-sm">{activeReview.name}</p>
                                <p className="text-white/60 text-xs font-medium">{activeReview.trip}</p>
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
                            <p className="font-medium">Select a review to preview it here.</p>
                            <p className="text-xs mt-1 opacity-60">Then click "Use in Marketing Studio" to create a branded post.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
