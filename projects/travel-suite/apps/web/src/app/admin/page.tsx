/**
 * Admin Dashboard - Enterprise Overview
 * 
 * High-performance dashboard featuring real-time metrics, 
 * performance analytics, and system health monitoring.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDemoFetch } from "@/lib/demo/use-demo-fetch";
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
import RevenueChart, { type RevenueChartPoint } from "@/components/analytics/RevenueChart";
import { DateRangePicker } from "@/features/admin/dashboard/DateRangePicker";
import { FunnelWidget } from "@/features/admin/dashboard/FunnelWidget";
import { TopCustomersWidget } from "@/features/admin/dashboard/TopCustomersWidget";
import { TopDestinationsWidget } from "@/features/admin/dashboard/TopDestinationsWidget";
import type {
    AdminDestinationMetric,
    AdminFunnelStage,
    AdminLtvCustomer,
} from "@/features/admin/dashboard/types";
import {
    createPresetRange,
    type AdminDateRangeSelection,
} from "@/lib/admin/date-range";
import { cn } from "@/lib/utils";

interface DashboardStats {
    activeOperators: number;
    totalClients: number;
    totalBookings: number;
    pendingProposals: number;
    recoveredRevenue: number;
    paidLinks: number;
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

interface RevenueSnapshot {
    series: RevenueChartPoint[];
    totals: {
        recoveredRevenue: number;
        paidLinks: number;
        activeOperators: number;
        totalBookings: number;
        pendingProposals: number;
    };
}

export default function AdminDashboard() {
    const supabase = createClient();
    const demoFetch = useDemoFetch();
    const [stats, setStats] = useState<DashboardStats>({
        activeOperators: 0,
        totalClients: 0,
        totalBookings: 0,
        pendingProposals: 0,
        recoveredRevenue: 0,
        paidLinks: 0,
        pendingNotifications: 0,
        marketplaceViews: 0,
        marketplaceInquiries: 0,
        conversionRate: "0.0",
    });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [revenueSeries, setRevenueSeries] = useState<RevenueChartPoint[]>([]);
    const [dateRange, setDateRange] = useState<AdminDateRangeSelection>(() => createPresetRange("30d"));
    const [funnelStages, setFunnelStages] = useState<AdminFunnelStage[]>([]);
    const [topCustomers, setTopCustomers] = useState<AdminLtvCustomer[]>([]);
    const [topDestinations, setTopDestinations] = useState<AdminDestinationMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const rangeQuery = useMemo(() => {
        const searchParams = new URLSearchParams({
            preset: dateRange.preset,
            from: dateRange.from,
            to: dateRange.to,
        });
        return searchParams.toString();
    }, [dateRange]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const authHeaders: Record<string, string> = {};
                if (session?.access_token) {
                    authHeaders.Authorization = `Bearer ${session.access_token}`;
                }

                // Fetch dashboard stats via API (supports demo mode)
                const [statsRes, revenueRes, marketRes, funnelRes, ltvRes, destinationsRes] = await Promise.allSettled([
                    demoFetch("/api/admin/dashboard/stats", {
                        headers: authHeaders,
                    }),
                    demoFetch(`/api/admin/revenue?${rangeQuery}`, {
                        headers: authHeaders,
                    }),
                    session?.access_token
                        ? fetch("/api/marketplace/stats", {
                            headers: { Authorization: `Bearer ${session.access_token}` },
                        })
                        : Promise.resolve(null),
                    demoFetch(`/api/admin/funnel?${rangeQuery}`, {
                        headers: authHeaders,
                    }),
                    demoFetch(`/api/admin/ltv?${rangeQuery}`, {
                        headers: authHeaders,
                    }),
                    demoFetch(`/api/admin/destinations?${rangeQuery}`, {
                        headers: authHeaders,
                    }),
                ]);

                let dashStats = { totalClients: 0, pendingNotifications: 0 };
                if (statsRes.status === "fulfilled" && statsRes.value.ok) {
                    dashStats = await statsRes.value.json();
                }

                let revenueSnapshot: RevenueSnapshot = {
                    series: [],
                    totals: {
                        recoveredRevenue: 0,
                        paidLinks: 0,
                        activeOperators: 0,
                        totalBookings: 0,
                        pendingProposals: 0,
                    },
                };
                if (revenueRes.status === "fulfilled" && revenueRes.value.ok) {
                    const payload = await revenueRes.value.json();
                    revenueSnapshot = payload?.data ?? payload;
                }

                let marketStats = null;
                if (marketRes.status === "fulfilled" && marketRes.value?.ok) {
                    marketStats = await marketRes.value.json();
                } else if (marketRes.status === "rejected") {
                    console.error("Marketplace stats fetch failed", marketRes.reason);
                }

                setRevenueSeries(revenueSnapshot.series || []);
                if (funnelRes.status === "fulfilled" && funnelRes.value.ok) {
                    const payload = await funnelRes.value.json();
                    const funnelPayload = payload?.data ?? payload;
                    setFunnelStages(funnelPayload?.stages || []);
                } else {
                    setFunnelStages([]);
                }

                if (ltvRes.status === "fulfilled" && ltvRes.value.ok) {
                    const payload = await ltvRes.value.json();
                    const ltvPayload = payload?.data ?? payload;
                    setTopCustomers(ltvPayload?.customers || []);
                } else {
                    setTopCustomers([]);
                }

                if (destinationsRes.status === "fulfilled" && destinationsRes.value.ok) {
                    const payload = await destinationsRes.value.json();
                    const destinationsPayload = payload?.data ?? payload;
                    setTopDestinations(destinationsPayload?.destinations || []);
                } else {
                    setTopDestinations([]);
                }

                setStats({
                    activeOperators: revenueSnapshot.totals.activeOperators || 0,
                    totalClients: dashStats.totalClients || 0,
                    totalBookings: revenueSnapshot.totals.totalBookings || 0,
                    pendingProposals: revenueSnapshot.totals.pendingProposals || 0,
                    recoveredRevenue: revenueSnapshot.totals.recoveredRevenue || 0,
                    paidLinks: revenueSnapshot.totals.paidLinks || 0,
                    pendingNotifications: dashStats.pendingNotifications || 0,
                    marketplaceViews: marketStats?.views || 0,
                    marketplaceInquiries: marketStats?.inquiries || 0,
                    conversionRate: marketStats?.conversion_rate || "0.0",
                });

                // Fetch recent activity via API
                const [tripsRes, notifsRes] = await Promise.allSettled([
                    demoFetch("/api/admin/trips?status=all&limit=5", { headers: authHeaders }),
                    demoFetch("/api/admin/notifications/delivery?limit=5", { headers: authHeaders }),
                ]);

                const recentTrips: RecentTrip[] = [];
                if (tripsRes.status === "fulfilled" && tripsRes.value.ok) {
                    const payload = await tripsRes.value.json();
                    recentTrips.push(...(payload.trips || []).slice(0, 5));
                }

                const recentNotifications: RecentNotification[] = [];
                if (notifsRes.status === "fulfilled" && notifsRes.value.ok) {
                    const payload = await notifsRes.value.json();
                    recentNotifications.push(...(payload.notifications || payload.logs || []).slice(0, 5));
                }

                const formattedActivities: ActivityItem[] = [
                    ...recentTrips.map((trip) => ({
                        id: trip.id,
                        type: "trip" as const,
                        title: "Trip Created",
                        description: `${trip.itineraries?.trip_title || "Untitled Trip"} to ${trip.itineraries?.destination || "Unknown Destination"}`,
                        timestamp: trip.created_at,
                        status: trip.status || "pending",
                    })),
                    ...recentNotifications.map((notif) => ({
                        id: notif.id,
                        type: "notification" as const,
                        title: notif.title || "Notification",
                        description: notif.body || "",
                        timestamp: notif.sent_at || new Date().toISOString(),
                        status: notif.status || "sent",
                    })),
                    ...(marketStats?.recent_inquiries || []).map((inq: { id?: string; created_at?: string; organizations?: { name?: string } }, index: number) => ({
                        id: inq.id || `inq-${inq.created_at || "unknown"}-${inq.organizations?.name || "partner"}-${index}`,
                        type: "inquiry" as const,
                        title: "Partner Inquiry",
                        description: `From ${inq.organizations?.name || "Unknown Partner"}`,
                        timestamp: inq.created_at || new Date().toISOString(),
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
    }, [demoFetch, rangeQuery, supabase]);

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

    const formatCompactCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(value);

    const statCards = [
        {
            label: "Recovered Revenue",
            value: loading ? "---" : formatCompactCurrency(stats.recoveredRevenue),
            trend: stats.paidLinks > 0 ? `${stats.paidLinks} paid links` : "",
            trendUp: true,
            icon: TrendingUp,
            color: "text-emerald-600",
            iconBg: "bg-emerald-100/50",
            description: "Revenue recovered from verified payment links",
            href: "/admin/invoices",
        },
        {
            label: "Active Operators",
            value: stats.activeOperators,
            trend: "",
            trendUp: true,
            icon: Activity,
            color: "text-indigo-600",
            iconBg: "bg-indigo-100/50",
            description: "Internal team members currently scoped to this org",
            href: "/settings/team",
        },
        {
            label: "Client Directory",
            value: stats.totalClients,
            trend: "",
            trendUp: true,
            icon: Users,
            color: "text-violet-600",
            iconBg: "bg-violet-100/50",
            description: "Total registered clients",
            href: "/admin/clients",
        },
        {
            label: "Total Bookings",
            value: stats.totalBookings,
            trend: "",
            trendUp: true,
            icon: MapPin,
            color: "text-blue-600",
            iconBg: "bg-blue-100/50",
            description: "Trips that reached a booking state in the last 12 months",
            href: "/trips"
        },
        {
            label: "Pending Proposals",
            value: stats.pendingProposals,
            trend: stats.pendingNotifications > 0 ? `${stats.pendingNotifications} alerts pending` : "",
            trendUp: true,
            icon: MessageSquare,
            color: "text-amber-600",
            iconBg: "bg-amber-100/60",
            description: "Open proposals still awaiting a client decision",
            href: "/proposals"
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
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
                                            {stat.value}
                                        </span>
                                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                                            {typeof stat.value === "number" ? "Units" : "INR"}
                                        </span>
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
                            <p className="text-sm text-text-muted font-medium">Revenue, approvals, and booking movement across the selected date range.</p>
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
                        </div>
                    </div>

                    <DateRangePicker value={dateRange} onChange={setDateRange} />

                    <div className="w-full aspect-[21/9]">
                        <RevenueChart data={revenueSeries} metric="revenue" loading={loading} />
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

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.25fr_0.9fr_0.85fr]">
                <FunnelWidget stages={funnelStages} loading={loading} />
                <TopCustomersWidget customers={topCustomers} loading={loading} />
                <TopDestinationsWidget destinations={topDestinations} loading={loading} />
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
