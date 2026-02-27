"use client";

import { useState } from "react";
import { Sparkles, Loader2, Send, Wand2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass/GlassCard";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Props {
    onGenerated: (data: any) => void;
}

export const MagicPrompter = ({ onGenerated }: Props) => {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const res = await fetch("/api/social/ai-poster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            if (!res.ok) throw new Error("Failed to generate");

            const data = await res.json();
            onGenerated(data);
            toast.success("AI generated content and suggested images!");
        } catch (error) {
            toast.error("AI generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "A luxury 5-day tour to Bali for couples with private dinner",
        "Budget-friendly family package to Manali during snowfall",
        "Adventure trip to Spiti Valley with bike rentals and camping",
        "Diwali special group tour to Dubai with desert safari"
    ];

    return (
        <div className="max-w-4xl mx-auto py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
            >
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl rotate-3">
                        <Wand2 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">AI Poster Pro</h2>
                        <p className="text-slate-500 text-lg font-medium mt-2">Describe your trip, and let AI build the perfect marketing poster.</p>
                    </div>
                </div>

                <GlassCard className="p-8 border-2 border-indigo-100 dark:border-indigo-900 shadow-2xl">
                    <div className="space-y-6">
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="E.g. I need a luxury package for Maldives 4 nights for honeymoon couples with $3000 price..."
                                className="w-full h-40 p-6 text-xl font-medium bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all resize-none shadow-inner"
                            />
                            <div className="absolute bottom-4 right-4">
                                <Button
                                    size="lg"
                                    disabled={!prompt || loading}
                                    onClick={handleGenerate}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold h-14 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/25"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" /> Build My Poster</>}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
                                <Lightbulb className="w-4 h-4 text-amber-500" /> Need Inspiration?
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(s)}
                                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    {[
                        { title: "Smart Headlines", desc: "AI writes copy that converts" },
                        { title: "Dynamic Images", desc: "Suggested Unsplash themes" },
                        { title: "Instant Branding", desc: "Your logo & colors applied" }
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                            <h5 className="font-bold text-slate-800 dark:text-slate-200">{item.title}</h5>
                            <p className="text-xs text-slate-500 font-medium mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
