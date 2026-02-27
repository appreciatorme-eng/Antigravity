"use client";

import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { Copy, Instagram, Linkedin, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CaptionEngine = ({ captions }: { captions: any }) => {
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    if (!captions) return null;

    return (
        <div className="grid grid-cols-1 gap-6">
            <GlassCard className="p-6 space-y-4 shadow-sm border-slate-200">
                <div className="flex items-center gap-2 text-pink-500 font-bold mb-2 text-sm">
                    <Instagram className="w-5 h-5" /> Instagram Card
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {captions.instagram}
                </div>
                <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-primary transition-colors hover:bg-slate-50" onClick={() => handleCopy(captions.instagram, 'ig')}>
                    <Copy className="w-4 h-4 mr-2" /> {copied === 'ig' ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
            </GlassCard>

            <GlassCard className="p-6 space-y-4 shadow-sm border-slate-200">
                <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-sm">
                    <Linkedin className="w-5 h-5" /> LinkedIn Post
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {captions.linkedin}
                </div>
                <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-primary transition-colors hover:bg-slate-50" onClick={() => handleCopy(captions.linkedin, 'li')}>
                    <Copy className="w-4 h-4 mr-2" /> {copied === 'li' ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
            </GlassCard>

            <GlassCard className="p-6">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><Hash className="w-5 h-5 text-indigo-500" /> Recommended Hashtags</p>
                <div className="flex flex-wrap gap-2">
                    {captions.hashtags?.map((tag: string) => (
                        <span key={tag} className="px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-900 bg-indigo-50 text-indigo-700 tracking-tight dark:bg-indigo-950 dark:text-indigo-300 transition-colors">#{tag}</span>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};
