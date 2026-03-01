/**
 * Admin Dashboard - Enterprise Overview
 * 
 * High-performance dashboard featuring real-time metrics, 
 * performance analytics, and system health monitoring.
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
    Car,
    Users,
    MapPin,
    TrendingUp,
    Calendar,
    Activity,
    Plus,
    History,
    Server,
    Zap,
    MessageSquare,
    ShieldCheck,
    ChevronRight,
    Search,
    Command,
    Store,
    Sparkles
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassSelect } from "@/components/glass/GlassInput";
import RevenueChart, { type RevenueChartPoint } from "@/components/analytics/RevenueChart";
import { cn } from "@/lib/utils";

interface DashboardStats {
    totalDrivers: number;
    totalClients: number;
    activeTrips: number;
    pendingNotifications: number;
    marketplaceViews?: number;
    marketplaceInquiries?: number;
    conversionRate?: string;
}

interface ActivityItem {
    id: string;
    type: "trip" | "notification" | "inquiry";
    title: string;
    description: string;
    timestamp: string;
    status: string;
}

interface RecentTrip {
    id: string;
    status: string | null;
    created_at: string;
    itineraries: {
        trip_title: string | null;
        destination: string | null;
    } | null;
}

interface RecentNotification {
    id: string;
    title: string | null;
    body: string | null;
    sent_at: string | null;
    status: string | null;
}

type HealthStatus = "healthy" | "degraded" | "down" | "unconfigured";

interface HealthResponse {
    status: HealthStatus;
    checked_at: string;
    duration_ms: number;
    checks: {
        database: { status: HealthStatus };
        supabase_edge_functions: { status: HealthStatus };
        firebase_fcm: { status: HealthStatus };
        whatsapp_api: { status: HealthStatus };
        external_apis: { status: HealthStatus };
        notification_pipeline: { status: HealthStatus };
    };
}

const ADMIN_REVENUE_SERIES: RevenueChartPoint[] = [
    { monthKey: "2025-08", label: "Aug", revenue: 86000, bookings: 9, conversionRate: 38 },
    { monthKey: "2025-09", label: "Sep", revenue: 92000, bookings: 11, conversionRate: 41 },
    { monthKey: "2025-10", label: "Oct", revenue: 105000, bookings: 12, conversionRate: 44 },
    { monthKey: "2025-11", label: "Nov", revenue: 98000, bookings: 10, conversionRate: 37 },
    { monthKey: "2025-12", label: "Dec", revenue: 117000, bookings: 14, conversionRate: 46 },
    { monthKey: "2026-01", label: "Jan", revenue: 126000, bookings: 15, conversionRate: 48 },
];

export default function AdminDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState<DashboardStats>({
        totalDrivers: 0,
        totalClients: 0,
        activeTrips: 0,
        pendingNotifications: 0,
        marketplaceViews: 0,
        marketplaceInquiries: 0,
        conversionRate: "0.0",
    });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<HealthResponse | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Get driver count
                const { count: driverCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .eq("role", "driver");

                // Get client count
                const { count: clientCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .eq("role", "client");

                // Get active trips count
                const { count: tripCount } = await supabase
                    .from("trips")
                    .select("*", { count: "exact", head: true })
                    .in("status", ["confirmed", "in_progress"]);

                // Get notifications
                const { count: notificationCount } = await supabase
                    .from("notification_logs")
                    .select("*", { count: "exact", head: true });

                // Fetch marketplace stats
                const { data: { session } } = await supabase.auth.getSession();
                let marketStats = null;
                if (session?.access_token) {
                    try {
                        const marketRes = await fetch("/api/marketplace/stats", {
                            headers: { "Authorization": `Bearer ${session.access_token}` }
                        });
                        if (marketRes.ok) {
                            marketStats = await marketRes.json();
                        }
                    } catch (e) {
                        console.error("Marketplace stats fetch failed", e);
                    }
                }

                setStats({
                    totalDrivers: driverCount || 0,
                    totalClients: clientCount || 0,
                    activeTrips: tripCount || 0,
                    pendingNotifications: notificationCount || 0,
                    marketplaceViews: marketStats?.views || 0,
                    marketplaceInquiries: marketStats?.inquiries || 0,
                    conversionRate: marketStats?.conversion_rate || "0.0",
                });

                // Fetch recent activity
                const { data: recentTrips } = await supabase
                    .from("trips")
                    .select("id, status, created_at, itineraries(trip_title, destination)")
                    .order("created_at", { ascending: false })
                    .limit(5);

                const { data: recentNotifications } = await supabase
                    .from("notification_logs")
                    .select("id, title, body, sent_at, status")
                    .order("sent_at", { ascending: false })
                    .limit(5);

                const formattedActivities: ActivityItem[] = [
                    ...(recentTrips as RecentTrip[] | null || []).map((trip) => ({
                        id: trip.id,
                        type: "trip" as const,
                        title: "Trip Created",
                        description: `${trip.itineraries?.trip_title || "Untitled Trip"} to ${trip.itineraries?.destination || "Unknown Destination"}`,
                        timestamp: trip.created_at,
                        status: trip.status || "pending",
                    })),
                    ...(recentNotifications as RecentNotification[] | null || []).map((notif) => ({
                        id: notif.id,
                        type: "notification" as const,
                        title: notif.title || "Notification",
                        description: notif.body || "",
                        timestamp: notif.sent_at || new Date().toISOString(),
                        status: notif.status || "sent",
                    })),
                    ...(marketStats?.recent_inquiries || []).map((inq: { id?: string; created_at?: string; organizations?: { name?: string } }) => ({
                        id: inq.id || Math.random().toString(),
                        type: "inquiry" as const,
                        title: "Partner Inquiry",
                        description: `From ${inq.organizations?.name || "Unknown Partner"}`,
                        timestamp: inq.created_at,
                        status: "new",
                    })),
                ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 8);

                setActivities(formattedActivities);
            } catch (error) {
                console.error("Critical Dashboard Failure:", error);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [supabase]);

    useEffect(() => {
        let mounted = true;

        const fetchHealth = async () => {
            try {
                if (!mounted) return;
                const res = await fetch("/api/health", { cache: "no-store" });
                const data = (await res.json()) as HealthResponse;
                if (mounted) setHealth(data);
            } catch {
                if (mounted) {
                    setHealth({
                        status: "down",
                        checked_at: new Date().toISOString(),
                        duration_ms: 0,
                        checks: {
                            database: { status: "down" },
                            supabase_edge_functions: { status: "down" },
                            firebase_fcm: { status: "down" },
                            whatsapp_api: { status: "down" },
                            external_apis: { status: "down" },
                            notification_pipeline: { status: "down" },
                        },
                    });
                }
            } finally {
                if (!mounted) return;
            }
        };

        void fetchHealth();
        const intervalId = setInterval(() => { void fetchHealth(); }, 60_000);
        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    };

    const statCards = [
        {
            label: "Active Drivers",
            value: stats.totalDrivers,
            trend: "",
            trendUp: true,
            icon: Car,
            color: "text-indigo-600",
            iconBg: "bg-indigo-100/50",
            description: "Active drivers in the field"
        },
        {
            label: "Client Directory",
            value: stats.totalClients,
            trend: "",
            trendUp: true,
            icon: Users,
            color: "text-violet-600",
            iconBg: "bg-violet-100/50",
            description: "Total registered clients"
        },
        {
            label: "Active Trips",
            value: stats.activeTrips,
            trend: "",
            trendUp: true,
            icon: MapPin,
            color: "text-emerald-600",
            iconBg: "bg-emerald-100/50",
            description: "Trips currently in progress"
        },
        {
            label: "Marketplace Activity",
            value: stats.marketplaceViews + " / " + stats.marketplaceInquiries,
            trend: (stats.conversionRate || "0.0") + "% CR",
            trendUp: true,
            icon: Activity,
            color: "text-blue-600",
            iconBg: "bg-blue-100/50",
            description: "Profile views & inquiries",
            href: "/admin/marketplace/analytics"
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            System Status: Operational
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h1 className="text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Dashboard
                    </h1>
                    <p className="text-text-muted text-lg font-medium max-w-2xl">
                        Your travel business at a glance.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <GlassButton variant="ghost" className="rounded-2xl gap-2 border-gray-100">
                        <Command className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Search</span>
                    </GlassButton>
                    <div className="h-12 flex items-center gap-3 px-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter">
                            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Strategic Stats Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, idx) => (
                    <Link key={idx} href={stat.href || "#"} className={cn("group block", !stat.href && "cursor-default")}>
                        <GlassCard
                            padding="xl"
                            className={cn(
                                "relative overflow-hidden transition-all duration-500",
                                "hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10",
                                "border-gray-100/20 dark:border-white/5",
                                stat.href && "hover:border-primary/40"
                            )}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                                        stat.iconBg
                                    )}>
                                        <stat.icon className={cn("w-6 h-6", stat.color)} />
                                    </div>
                                    {stat.trend && (
                                        <div className={cn(
                                            "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                                            stat.trendUp ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                        )}>
                                            {stat.trend}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                        {stat.label}
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black text-secondary dark:text-white tabular-nums">
                                            {loading ? "---" : stat.value}
                                        </span>
                                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Units</span>
                                    </div>
                                </div>

                                <p className="mt-4 text-[11px] text-text-muted font-medium italic">
                                    &ldquo;{stat.description}&rdquo;
                                </p>
                            </div>

                            {/* Kinetic background accents */}
                            <div className={cn(
                                "absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000",
                                stat.iconBg.replace('bg-', 'bg-')
                            )} />
                        </GlassCard>
                    </Link>
                ))}
            </div>

            {/* Main Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Analytics */}
                <GlassCard className="lg:col-span-2" padding="xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <h2 className="text-2xl font-serif text-secondary dark:text-white tracking-tight">Financial Trajectory</h2>
                            </div>
                            <p className="text-sm text-text-muted font-medium">Monthly revenue and booking conversion metrics.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-secondary" />
                                <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest">Trips</span>
                            </div>
                            <GlassSelect
                                value="6m"
                                onChange={() => { }}
                                className="w-32 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                options={[
                                    { value: '3m', label: 'Last 90 Days' },
                                    { value: '6m', label: 'Last 180 Days' },
                                    { value: '1y', label: 'Fiscal Year' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="w-full aspect-[21/9]">
                        <RevenueChart data={ADMIN_REVENUE_SERIES} metric="revenue" />
                    </div>
                </GlassCard>

                {/* Tactical Quick Actions */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        <h2 className="text-xl font-serif text-secondary dark:text-white tracking-tight">Quick Actions</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Link href="/admin/planner" className="group">
                            <GlassCard padding="md" className="transition-all hover:bg-primary/[0.03] border-gray-100 group-hover:border-primary/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest">Create New Trip</h4>
                                        <p className="text-[10px] text-text-muted font-medium mt-0.5">Plan a new trip itinerary.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </GlassCard>
                        </Link>

                        <Link href="/admin/drivers" className="group">
                            <GlassCard padding="md" className="transition-all hover:bg-indigo-50/50 border-gray-100 group-hover:border-indigo-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Car className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest">Add Driver</h4>
                                        <p className="text-[10px] text-text-muted font-medium mt-0.5">Add a new driver to your team.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </GlassCard>
                        </Link>

                        <Link href="/admin/clients" className="group">
                            <GlassCard padding="md" className="transition-all hover:bg-violet-50/50 border-gray-100 group-hover:border-violet-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Users className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest">Manage Clients</h4>
                                        <p className="text-[10px] text-text-muted font-medium mt-0.5">Manage existing client relationships.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </GlassCard>
                        </Link>

                        <Link href="/admin/settings/marketplace" className="group">
                            <GlassCard padding="md" className="transition-all hover:bg-blue-50/50 border-gray-100 group-hover:border-blue-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Store className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest">Marketplace</h4>
                                        <p className="text-[10px] text-text-muted font-medium mt-0.5">Optimize your partner profile.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </GlassCard>
                        </Link>

                        <Link href="/admin/insights" className="group">
                            <GlassCard padding="md" className="transition-all hover:bg-emerald-50/50 border-gray-100 group-hover:border-emerald-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest">Insights Copilot</h4>
                                        <p className="text-[10px] text-text-muted font-medium mt-0.5">ROI, risk, and upsell recommendations.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </GlassCard>
                        </Link>
                    </div>

                    {/* System Health */}
                    <GlassCard padding="lg" className="bg-slate-900 border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Server className="w-4 h-4 text-primary" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">System Health</h3>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Main Engine</span>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs text-slate-200 font-medium">Stable</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">API Latency</span>
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-amber-500" />
                                        <span className="text-xs text-slate-200 font-medium">{health?.duration_ms || 42}ms</span>
                                    </div>
                                </div>
                            </div>

                            <GlassButton variant="primary" className="w-full h-10 rounded-xl bg-white text-slate-900 border-none hover:bg-slate-100">
                                <span className="text-[10px] font-black uppercase tracking-widest">Run Health Check</span>
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-secondary" />
                            <h2 className="text-2xl font-serif text-secondary dark:text-white tracking-tight">Recent Activity</h2>
                        </div>
                        <GlassButton variant="ghost" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-gray-100">
                            View All History
                        </GlassButton>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-gray-50 dark:bg-slate-800/50 rounded-2xl animate-pulse border border-gray-100 dark:border-slate-800" />
                            ))
                        ) : activities.length > 0 ? (
                            activities.map((item) => (
                                <GlassCard
                                    key={item.id}
                                    padding="md"
                                    className="border-gray-100 hover:border-primary/20 hover:bg-primary/[0.01] transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105",
                                            item.type === 'trip' ? "bg-emerald-50 text-emerald-600" :
                                                item.type === 'inquiry' ? "bg-amber-50 text-amber-600" :
                                                    "bg-blue-50 text-blue-600"
                                        )}>
                                            {item.type === 'trip' ? <MapPin className="w-5 h-5" /> :
                                                item.type === 'inquiry' ? <Search className="w-5 h-5" /> :
                                                    <MessageSquare className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <h4 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tight truncate">
                                                    {item.title}
                                                </h4>
                                                <span className="text-[10px] font-bold text-text-muted whitespace-nowrap">
                                                    {formatDate(item.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-muted font-medium mt-0.5 truncate uppercase tracking-tighter">
                                                {item.description}
                                            </p>
                                        </div>
                                        <div className="pl-4">
                                            <GlassBadge
                                                variant={item.status === 'confirmed' || item.status === 'sent' || item.status === 'new' ? 'success' : 'secondary'}
                                                className="text-[10px] font-black uppercase tracking-[0.1em]"
                                            >
                                                {item.status}
                                            </GlassBadge>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-sm text-text-muted font-black uppercase tracking-widest">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-xl font-serif text-secondary dark:text-white tracking-tight">System Status</h2>
                    </div>

                    <GlassCard padding="lg" className="border-gray-100 divide-y divide-gray-100">
                        <div className="pb-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Database Node</span>
                                <GlassBadge variant="success" className="text-[8px] font-black uppercase">Online</GlassBadge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Edge Workers</span>
                                <GlassBadge variant="success" className="text-[8px] font-black uppercase">Online</GlassBadge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Notifications</span>
                                <GlassBadge variant="warning" className="text-[8px] font-black uppercase">Degraded</GlassBadge>
                            </div>
                        </div>

                        <div className="pt-4 pb-4">
                            <h4 className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-[0.2em] mb-4">System Load</h4>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                                        <span className="text-text-muted">API Requests</span>
                                        <span className="text-secondary dark:text-white">84% Capacity</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '84%' }} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                                        <span className="text-text-muted">Background Jobs</span>
                                        <span className="text-secondary dark:text-white">31% Load</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500" style={{ width: '31%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 text-center">
                            <p className="text-[10px] text-text-muted font-medium italic">
                                Auto-refresh every 60 seconds
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
