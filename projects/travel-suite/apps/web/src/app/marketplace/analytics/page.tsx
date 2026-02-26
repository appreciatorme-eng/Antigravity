
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
    ArrowUpRight
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import Link from "next/link";

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
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCcw className="animate-spin text-blue-400" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-blue-400" /> Marketplace Analytics
                    </h1>
                    <p className="text-slate-400">Track your profile performance and partner engagement.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/settings/marketplace">
                        <GlassButton variant="secondary">Manage Profile</GlassButton>
                    </Link>
                    <GlassButton onClick={fetchStats} className="flex items-center gap-2">
                        <RefreshCcw size={16} /> Refresh
                    </GlassButton>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Eye size={18} className="text-blue-400" />
                            <span className="text-sm font-medium uppercase tracking-wider">Total Views</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats.views}</div>
                        <div className="text-xs text-slate-500 mt-2">Unique profile visits</div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <MessageSquare size={18} className="text-purple-400" />
                            <span className="text-sm font-medium uppercase tracking-wider">Inquiries</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats.inquiries}</div>
                        <div className="text-xs text-slate-500 mt-2">Partners interested in collaborating</div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 relative overflow-hidden group hover:border-green-500/50 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:bg-green-500/20 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <TrendingUp size={18} className="text-green-400" />
                            <span className="text-sm font-medium uppercase tracking-wider">Conversion Rate</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats.conversion_rate}%</div>
                        <div className="text-xs text-slate-500 mt-2">Visits leading to inquiries</div>
                    </div>
                </GlassCard>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Views */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Eye className="text-blue-400" size={20} /> Who viewed your profile
                    </h2>
                    <GlassCard className="p-0 overflow-hidden min-h-[300px]">
                        {stats.recent_views.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                                <Eye size={32} className="text-slate-700" />
                                <p className="text-slate-500">No recent views recorded.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {stats.recent_views.map((view, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700 relative">
                                                {view.organizations?.logo_url ? (
                                                    <Image
                                                        src={view.organizations.logo_url}
                                                        alt={`${view.organizations?.name || "Organization"} logo`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <Building2 size={18} className="text-slate-600" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">
                                                    {view.organizations?.name || "Anonymous User"}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {view.viewed_at && timeAgo(view.viewed_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/marketplace/${view.viewer_org_id}`}>
                                            <GlassButton variant="secondary" className="px-3 py-1.5 text-xs">View</GlassButton>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Recent Inquiries */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="text-purple-400" size={20} /> Recent Inquiries
                    </h2>
                    <GlassCard className="p-0 overflow-hidden min-h-[300px]">
                        {stats.recent_inquiries.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                                <MessageSquare size={32} className="text-slate-700" />
                                <p className="text-slate-500">No inquiries yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {stats.recent_inquiries.map((inquiry, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-800/50 transition-colors space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700 relative">
                                                    {inquiry.organizations?.logo_url ? (
                                                        <Image
                                                            src={inquiry.organizations.logo_url}
                                                            alt={`${inquiry.organizations?.name || "Organization"} logo`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <Building2 size={14} className="text-slate-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">
                                                        {inquiry.organizations?.name || "Unknown Sender"}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {inquiry.created_at && timeAgo(inquiry.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <GlassButton variant="secondary" className="px-3 py-1.5 text-xs flex items-center gap-1">
                                                Reply <ArrowUpRight size={12} />
                                            </GlassButton>
                                        </div>
                                        <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                                            &ldquo;{inquiry.message}&rdquo;
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
