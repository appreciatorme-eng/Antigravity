"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
    BarChart3,
    RefreshCcw,
    Eye,
    MessageSquare,
    TrendingUp,
    Building2,
    Calendar,
    ArrowUpRight,
    Sparkles
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

interface RecentActivity {
    viewed_at?: string;
    created_at?: string;
    viewer_org_id?: string;
    sender_org_id?: string;
    organizations: {
        name: string;
        logo_url: string | null;
    } | null;
    message?: string;
}

export default function MarketplaceAnalyticsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        views: 0,
        inquiries: 0,
        conversion_rate: "0.0",
        recent_views: [] as RecentActivity[],
        recent_inquiries: [] as RecentActivity[]
    });

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch("/api/marketplace/stats", {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void fetchStats();
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    <BarChart3 className="w-8 h-8 text-blue-500 absolute" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse tracking-tight">Gathering Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative font-sans selection:bg-blue-500/30 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[800px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 p-6 lg:p-10 space-y-10 max-w-[1400px] mx-auto pt-12">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="space-y-3">
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
                             <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                             <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-400">Marketplace Intelligence</span>
                        </motion.div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tighter">
                            Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Analytics</span>
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Quantify your reach and optimize your partner conversion funnel.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/settings/marketplace">
                            <GlassButton variant="secondary" className="px-6 font-bold shadow-sm">Manage Profile</GlassButton>
                        </Link>
                        <GlassButton onClick={fetchStats} className="px-6 font-bold flex items-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 transition-transform">
                            <RefreshCcw size={16} /> Refresh
                        </GlassButton>
                    </div>
                </motion.div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Total Views", val: stats.views, icon: Eye, color: "blue", sub: "Profile visibility" },
                        { title: "Inquiries", val: stats.inquiries, icon: MessageSquare, color: "purple", sub: "Partnership leads" },
                        { title: "Conversion Rate", val: `${stats.conversion_rate}%`, icon: TrendingUp, color: "emerald", sub: "Engagement yield" }
                    ].map((m, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <GlassCard className={`p-8 relative overflow-hidden group hover:ring-2 ring-${m.color}-500/30 transition-all bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${m.color}-500/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700`}></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl bg-${m.color}-500/10 text-${m.color}-600 dark:text-${m.color}-400 border border-${m.color}-500/20`}>
                                            <m.icon size={22} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{m.title}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{m.val}</div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{m.sub}</div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* Detailed Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Recent Views */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <Eye className="text-blue-600 dark:text-blue-400" size={20} />
                                </div>
                                Recent Visitors
                            </h2>
                        </div>
                        <GlassCard className="p-0 overflow-hidden min-h-[400px] bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50">
                            {stats.recent_views.length === 0 ? (
                                <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4">
                                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <Eye size={32} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold">No profile visits yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                    {stats.recent_views.map((view, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 + idx * 0.05 }}
                                            key={idx} 
                                            className="p-5 flex items-center justify-between hover:bg-white dark:hover:bg-white/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative shadow-sm group-hover:scale-105 transition-transform">
                                                    {view.organizations?.logo_url ? (
                                                        <Image
                                                            src={view.organizations.logo_url}
                                                            alt={`${view.organizations?.name || "Organization"} logo`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 size={22} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                                        {view.organizations?.name || "Guest Operator"}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        {view.viewed_at && timeAgo(view.viewed_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href={`/marketplace/${view.viewer_org_id}`}>
                                                <GlassButton variant="secondary" className="px-4 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800">Review Partner</GlassButton>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>

                    {/* Recent Inquiries */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <MessageSquare className="text-purple-600 dark:text-purple-400" size={20} />
                            </div>
                            Latest Conversations
                        </h2>
                        <GlassCard className="p-0 overflow-hidden min-h-[400px] bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50">
                            {stats.recent_inquiries.length === 0 ? (
                                <div className="h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4">
                                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <MessageSquare size={32} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold">No inquiries received.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                                    {stats.recent_inquiries.map((inquiry, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 + idx * 0.05 }}
                                            key={idx} 
                                            className="p-6 hover:bg-white dark:hover:bg-white/5 transition-all space-y-4 group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative shadow-sm">
                                                        {inquiry.organizations?.logo_url ? (
                                                            <Image
                                                                src={inquiry.organizations.logo_url}
                                                                alt={`${inquiry.organizations?.name || "Organization"} logo`}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 size={18} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                                            {inquiry.organizations?.name || "Anonymous Partner"}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                            {inquiry.created_at && timeAgo(inquiry.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href="/marketplace/inquiries">
                                                    <GlassButton variant="secondary" className="px-3 py-1.5 text-[11px] font-black flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white border-blue-500/20 transition-all">
                                                        REPLY <ArrowUpRight size={14} />
                                                    </GlassButton>
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500/30 rounded-full" />
                                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-white/[0.03] p-4 rounded-r-2xl border-y border-r border-slate-200/50 dark:border-slate-800/50 italic font-medium leading-relaxed ml-0.5">
                                                    &ldquo;{inquiry.message}&rdquo;
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
