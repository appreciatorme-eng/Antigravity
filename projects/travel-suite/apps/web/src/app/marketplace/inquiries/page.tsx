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
    ExternalLink
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import Link from "next/link";

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
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <MessageSquare className="text-blue-400" />
                        Marketplace Inbox
                    </h1>
                    <p className="text-slate-400">Manage your B2B partnership requests and connections.</p>
                </div>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab("received")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${activeTab === "received" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                        <ArrowDownLeft size={16} />
                        Received
                    </button>
                    <button
                        onClick={() => setActiveTab("sent")}
                        className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${activeTab === "sent" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                        <ArrowUpRight size={16} />
                        Sent
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <RefreshCcw className="animate-spin text-blue-500" size={32} />
                </div>
            ) : (
                <div className="space-y-4">
                    {inquiries[activeTab].length === 0 ? (
                        <GlassCard className="p-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto border border-slate-700">
                                <Inbox className="text-slate-500" size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-white font-medium">No {activeTab} inquiries yet</h3>
                                <p className="text-slate-500 text-sm">When you {activeTab === "received" ? "receive" : "send"} partnership requests, they will appear here.</p>
                            </div>
                        </GlassCard>
                    ) : (
                        inquiries[activeTab].map((inq) => {
                            const canMarkRead = !inq.read_at && activeTab === "received";
                            const targetName = activeTab === "received" ? inq.sender?.name : inq.receiver?.name;

                            return (
                                <GlassCard
                                    key={inq.id}
                                    className={`p-0 overflow-hidden border-l-4 transition-all hover:bg-white/[0.02] ${canMarkRead ? "border-l-blue-500 bg-blue-500/5" : "border-l-transparent"}`}
                                    onClick={() => canMarkRead && markAsRead(inq.id)}
                                    role={canMarkRead ? "button" : undefined}
                                    tabIndex={canMarkRead ? 0 : undefined}
                                    aria-label={canMarkRead ? `Mark inquiry from ${targetName || "partner"} as read` : undefined}
                                    onKeyDown={(event) => {
                                        if (!canMarkRead) return;
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            void markAsRead(inq.id);
                                        }
                                    }}
                                >
                                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden flex-shrink-0 relative">
                                            {activeTab === "received" ? (
                                                inq.sender?.logo_url ? (
                                                    <Image
                                                        src={inq.sender.logo_url}
                                                        alt={`${inq.sender?.name || "Sender"} logo`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : <Building2 size={24} className="text-slate-500" />
                                            ) : (
                                                inq.receiver?.logo_url ? (
                                                    <Image
                                                        src={inq.receiver.logo_url}
                                                        alt={`${inq.receiver?.name || "Receiver"} logo`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : <Building2 size={24} className="text-slate-500" />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-lg">
                                                    {activeTab === "received" ? inq.sender?.name : inq.receiver?.name}
                                                </span>
                                                {activeTab === "received" && !inq.read_at && (
                                                    <span className="bg-blue-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white tracking-wider">New</span>
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm line-clamp-1">{inq.message}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(inq.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1 capitalize">
                                                    <span className={`w-2 h-2 rounded-full ${inq.status === 'pending' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                                    {inq.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <Link href={`/marketplace/${activeTab === "received" ? inq.sender_org_id : inq.receiver_org_id}`} className="flex-1 md:flex-none">
                                                <GlassButton variant="secondary" className="w-full md:w-auto flex items-center gap-2 text-xs">
                                                    View Profile
                                                    <ExternalLink size={14} />
                                                </GlassButton>
                                            </Link>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
