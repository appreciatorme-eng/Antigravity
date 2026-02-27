"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Copy, Instagram, Linkedin, Hash, ArrowRight, Sparkles, Star, ImageIcon, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const ReviewsToInsta = ({ onReviewSelected }: { onReviewSelected: (review: any) => void }) => {
    const [reviewGenerating, setReviewGenerating] = useState<string | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/social/reviews');
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews.map((r: any) => ({
                    id: r.id,
                    name: r.reviewer_name,
                    trip: r.trip_name || r.destination || 'Custom Trip',
                    text: r.comment,
                    rating: r.rating
                })));
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        try {
            setImporting(true);
            const res = await fetch('/api/social/reviews/import', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Import complete");
                fetchReviews();
            } else {
                toast.error(data.error || "Failed to import");
            }
        } catch (e) {
            toast.error("Network error during import");
        } finally {
            setImporting(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8 items-center max-w-6xl mx-auto">
            <div className="space-y-6 animate-fade-in-right">
                <div className="flex justify-between items-center pr-12">
                    <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Convert love into marketing.</h2>
                    <Button variant="outline" size="sm" onClick={handleImport} disabled={importing} className="gap-2">
                        {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Import
                    </Button>
                </div>
                <p className="text-lg text-slate-500 dark:text-slate-400 pr-12 leading-relaxed">
                    Turn your 5-star customer reviews into beautiful, brand-aligned social media posts with one click. Share them directly to Instagram or LinkedIn to build massive trust.
                </p>

                <div className="space-y-4 pt-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl">
                            No reviews found. Import from marketplace or wait for clients to submit.
                        </div>
                    ) : reviews.map((review, i) => (
                        <GlassCard key={i} className="p-5 cursor-pointer hover:border-primary/50 transition-colors dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 shadow-sm" onClick={() => setReviewGenerating(review.name)}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{review.name}</p>
                                    <p className="text-xs text-slate-500 font-medium tracking-wide mt-1 uppercase">{review.trip}</p>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-emerald-500 fill-emerald-500 drop-shadow-sm" />)}
                                </div>
                            </div>
                            <p className="text-sm italic text-slate-600 dark:text-slate-400 leading-relaxed">&quot;{review.text}&quot;</p>
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="text-primary gap-1 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                                    Create Post <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            <div className="relative aspect-[4/5] bg-gradient-to-br from-slate-900 to-black rounded-3xl p-8 flex flex-col justify-center items-center shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]"></div>

                <AnimatePresence mode="wait">
                    {reviewGenerating ? (
                        <motion.div
                            key="review-ui"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 w-full bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-2xl transition-transform"
                        >
                            <div className="flex justify-center mb-8 gap-1.5">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-md" />)}
                            </div>
                            <h3 className="text-3xl text-white font-serif italic text-center leading-snug drop-shadow-sm">
                                &quot;{reviews.find(r => r.name === reviewGenerating)?.text}&quot;
                            </h3>
                            <div className="mt-12 text-center space-y-2">
                                <p className="text-white font-bold tracking-widest uppercase letter-spacing-2">{reviewGenerating}</p>
                                <p className="text-white/60 text-sm font-medium">Happy Customer</p>
                            </div>

                            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-28 transition-all flex flex-col gap-3 w-full px-8">
                                <Button
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 border-none shadow-xl text-white hover:opacity-90 font-bold"
                                    onClick={() => {
                                        const r = reviews.find(x => x.name === reviewGenerating);
                                        if (r) onReviewSelected(r);
                                    }}
                                >
                                    <Sparkles className="w-5 h-5 mr-2" /> Design Professional Post
                                </Button>
                                <div className="flex gap-3 justify-center">
                                    <Button variant="outline" className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-colors">
                                        <Instagram className="w-4 h-4 mr-2" /> Direct Share
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty-ui"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-white/40 flex flex-col items-center p-8 border border-dashed border-white/20 rounded-2xl"
                        >
                            <ImageIcon className="w-16 h-16 mb-4 opacity-50 block" />
                            <p className="font-medium">Select a review from the left to preview.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
