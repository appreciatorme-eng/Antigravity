"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
    Inbox,
    MessageSquare,
    Clock,
    Building2,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCcw,
    ExternalLink,
    Search,
    Filter
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Inquiry {
    id: string;
    sender_org_id: string;
    receiver_org_id: string;
    message: string;
    status: string;
    created_at: string;
    read_at: string | null;
    sender?: { name: string; logo_url: string };
    receiver?: { name: string; logo_url: string };
}

export default function MarketplaceInquiriesPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
    const [inquiries, setInquiries] = useState<{ received: Inquiry[], sent: Inquiry[] }>({ received: [], sent: [] });

    const fetchInquiries = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/marketplace/inquiries", {
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            setInquiries(data);
        } catch (error) {
            console.error("Error fetching inquiries:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void fetchInquiries();
    }, [fetchInquiries]);

    const markAsRead = async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch("/api/marketplace/inquiries", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id, mark_read: true })
            });
            void fetchInquiries();
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative font-sans selection:bg-blue-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 p-6 lg:p-10 space-y-8 max-w-[1200px] mx-auto pt-8">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                >
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                                <MessageSquare className="text-blue-600 dark:text-blue-400" size={28} />
                            </div>
                            Marketplace Inbox
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">Manage your B2B partnership requests and dynamic connections.</p>
                    </div>

                    <div className="flex bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shadow-sm">
                        <button
                            onClick={() => setActiveTab("received")}
                            className={`px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 font-bold relative ${activeTab === "received" ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                        >
                            {activeTab === "received" && (
                                <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50" />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <ArrowDownLeft size={16} />
                                Received
                                {inquiries.received.filter(i => !i.read_at).length > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                                        {inquiries.received.filter(i => !i.read_at).length}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("sent")}
                            className={`px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 font-bold relative ${activeTab === "sent" ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}
                        >
                            {activeTab === "sent" && (
                                <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50" />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <ArrowUpRight size={16} />
                                Sent
                            </span>
                        </button>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center items-center h-[400px]">
                        <RefreshCcw className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <div className="space-y-4 relative min-h-[400px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {inquiries[activeTab].length === 0 ? (
                                    <GlassCard className="p-16 text-center space-y-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-dashed border-2">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700 shadow-inner">
                                            <Inbox className="text-slate-400 dark:text-slate-500" size={32} />
                                        </div>
                                        <div className="space-y-2 max-w-sm mx-auto">
                                            <h3 className="text-xl text-slate-900 dark:text-white font-bold tracking-tight">No {activeTab} inquiries yet</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">When you {activeTab === "received" ? "receive" : "send"} partnership requests from other operators, they will elegantly appear right here.</p>
                                        </div>
                                        {activeTab === "sent" && (
                                            <Link href="/marketplace" className="inline-block pt-4">
                                                <GlassButton className="px-6 py-2.5 font-bold shadow-md">Browse Directory</GlassButton>
                                            </Link>
                                        )}
                                    </GlassCard>
                                ) : (
                                    <div className="grid gap-4">
                                        {inquiries[activeTab].map((inq, idx) => {
                                            const canMarkRead = !inq.read_at && activeTab === "received";
                                            const targetName = activeTab === "received" ? inq.sender?.name : inq.receiver?.name;
                                            
                                            // Extract status styles
                                            const isPending = inq.status === 'pending';
                                            const statusColorClasses = isPending 
                                                ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" 
                                                : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
                                                
                                            const badgeDotClass = isPending ? "bg-amber-500" : "bg-emerald-500";

                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={inq.id}
                                                >
                                                    <GlassCard
                                                        className={`p-0 overflow-hidden transition-all hover:shadow-lg group bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ${canMarkRead ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-l-4 border-l-transparent dark:border-slate-800/50"}`}
                                                        onClick={() => canMarkRead && markAsRead(inq.id)}
                                                        role={canMarkRead ? "button" : undefined}
                                                        tabIndex={canMarkRead ? 0 : undefined}
                                                        aria-label={canMarkRead ? `Mark inquiry from ${targetName || "partner"} as read` : undefined}
                                                    >
                                                        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                                                            {/* Logo */}
                                                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 shadow-sm relative group-hover:scale-105 transition-transform duration-300">
                                                                {activeTab === "received" ? (
                                                                    inq.sender?.logo_url ? (
                                                                        <Image
                                                                            src={inq.sender.logo_url}
                                                                            alt={`${inq.sender?.name || "Sender"} logo`}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : <Building2 size={28} className="text-slate-400" />
                                                                ) : (
                                                                    inq.receiver?.logo_url ? (
                                                                        <Image
                                                                            src={inq.receiver.logo_url}
                                                                            alt={`${inq.receiver?.name || "Receiver"} logo`}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : <Building2 size={28} className="text-slate-400" />
                                                                )}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 space-y-2 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <span className="font-bold text-slate-900 dark:text-white text-xl tracking-tight truncate">
                                                                        {targetName}
                                                                    </span>
                                                                    {canMarkRead && (
                                                                        <span className="bg-red-500 text-[10px] uppercase font-black px-2 py-0.5 rounded-full text-white tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse">New Request</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-slate-600 dark:text-slate-300 text-[15px] line-clamp-2 md:line-clamp-1 leading-relaxed max-w-3xl">
                                                                    {inq.message}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
                                                                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/50">
                                                                        <Clock size={14} />
                                                                        {new Date(inq.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                    <span className={`flex items-center gap-1.5 capitalize px-2.5 py-1 rounded-md border ${statusColorClasses}`}>
                                                                        <span className={`w-2 h-2 rounded-full ${badgeDotClass} shadow-sm`} />
                                                                        {inq.status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Action CTA */}
                                                            <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                                                                <Link href={`/marketplace/${activeTab === "received" ? inq.sender_org_id : inq.receiver_org_id}`} className="flex-1 md:flex-none">
                                                                    <GlassButton variant="secondary" className="w-full md:w-auto flex items-center justify-center gap-2 text-[13px] font-bold py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700">
                                                                        View Profile
                                                                        <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                                    </GlassButton>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </GlassCard>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
