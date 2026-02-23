/**
 * Admin Dashboard
 *
 * Updated to match GoBuddy Adventures design system
 * Features glassmorphism, unified colors, modern UI
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Car, Users, MapPin, Bell, TrendingUp, Calendar, Activity } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";

interface DashboardStats {
    totalDrivers: number;
    totalClients: number;
    activeTrips: number;
    pendingNotifications: number;
}

interface ActivityItem {
    id: string;
    type: "trip" | "notification";
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

export default function AdminDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState<DashboardStats>({
        totalDrivers: 0,
        totalClients: 0,
        activeTrips: 0,
        pendingNotifications: 0,
    });
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [healthLoading, setHealthLoading] = useState(true);

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

                setStats({
                    totalDrivers: driverCount || 0,
                    totalClients: clientCount || 0,
                    activeTrips: tripCount || 0,
                    pendingNotifications: notificationCount || 0,
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
                        title: "New Trip Created",
                        description: `${trip.itineraries?.trip_title || "Untitled Trip"} to ${trip.itineraries?.destination || "Unknown"}`,
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
                ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 8);

                setActivities(formattedActivities);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase]);

    useEffect(() => {
        let mounted = true;

        const fetchHealth = async () => {
            try {
                if (!mounted) return;
                setHealthLoading(true);
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
                if (mounted) setHealthLoading(false);
            }
        };

        fetchHealth();
        const intervalId = setInterval(fetchHealth, 60_000);
        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const statusClass: Record<HealthStatus, string> = {
        healthy: "bg-green-100 text-green-700",
        degraded: "bg-amber-100 text-amber-700",
        down: "bg-red-100 text-red-700",
        unconfigured: "bg-gray-100 text-gray-600",
    };

    const statCards = [
        {
            label: "Active Drivers",
            value: stats.totalDrivers,
            icon: Car,
            bg: "bg-blue-50",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
        },
        {
            label: "Total Clients",
            value: stats.totalClients,
            icon: Users,
            bg: "bg-purple-50",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
        },
        {
            label: "Active Trips",
            value: stats.activeTrips,
            icon: MapPin,
            bg: "bg-green-50",
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
        },
        {
            label: "Notifications",
            value: stats.pendingNotifications,
            icon: Bell,
            bg: "bg-orange-50",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Overview</p>
                    <h1 className="text-3xl font-serif text-secondary">Dashboard</h1>
                    <p className="text-text-secondary mt-1">
                        Welcome to your admin control center
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Calendar className="w-4 h-4" />
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <GlassCard key={stat.label} padding="lg" rounded="xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold tracking-wider text-text-secondary uppercase mb-2">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-bold text-secondary">
                                    {loading ? "-" : stat.value}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Quick Actions */}
            <GlassCard padding="lg" rounded="xl">
                <h2 className="text-lg font-serif text-secondary mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/admin/drivers"
                        className="group flex items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-smooth border border-white/60"
                    >
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-button">
                            <Car className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-secondary">Add New Driver</p>
                            <p className="text-sm text-text-secondary">Register a partner driver</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/trips"
                        className="group flex items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-smooth border border-white/60"
                    >
                        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-secondary">Manage Trips</p>
                            <p className="text-sm text-text-secondary">Assign drivers to trips</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/notifications"
                        className="group flex items-center gap-3 p-4 rounded-xl bg-white/40 hover:bg-white/60 transition-smooth border border-white/60"
                    >
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-secondary">Send Notifications</p>
                            <p className="text-sm text-text-secondary">Notify clients & drivers</p>
                        </div>
                    </Link>
                </div>
            </GlassCard>

            {/* System Health */}
            <GlassCard padding="lg" rounded="xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif text-secondary">System Health</h2>
                    <Activity className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${health ? statusClass[health.status] : "bg-gray-100 text-gray-600"}`}>
                        {healthLoading ? "checking" : (health?.status ?? "unknown")}
                    </span>
                    <span className="text-xs text-text-secondary">
                        {health?.checked_at ? `Last check ${new Date(health.checked_at).toLocaleTimeString()}` : ""}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    {[
                        { label: "Database", value: health?.checks.database.status },
                        { label: "Edge Functions", value: health?.checks.supabase_edge_functions.status },
                        { label: "Firebase FCM", value: health?.checks.firebase_fcm.status },
                        { label: "WhatsApp API", value: health?.checks.whatsapp_api.status },
                        { label: "Weather/Currency", value: health?.checks.external_apis.status },
                        { label: "Notify Pipeline", value: health?.checks.notification_pipeline.status },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-white/40 bg-white/30 px-3 py-3">
                            <p className="text-xs uppercase tracking-wider text-text-secondary mb-2 font-semibold">{item.label}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${item.value ? statusClass[item.value] : "bg-gray-100 text-gray-600"}`}>
                                {healthLoading ? "..." : (item.value ?? "unknown")}
                            </span>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Recent Activity Feed */}
            <GlassCard padding="lg" rounded="xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-serif text-secondary">Recent Activity</h2>
                    <TrendingUp className="w-5 h-5 text-text-secondary" />
                </div>

                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-white/30 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map((activity, idx) => (
                            <div key={activity.id} className="relative flex items-start gap-4 p-4 rounded-xl bg-white/30 hover:bg-white/40 transition-smooth">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    activity.type === "trip" ? "bg-green-100" : "bg-blue-100"
                                }`}>
                                    {activity.type === "trip" ? (
                                        <MapPin className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Bell className="w-5 h-5 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-secondary truncate">
                                            {activity.title}
                                        </p>
                                        <time className="text-xs text-text-secondary shrink-0">
                                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </time>
                                    </div>
                                    <p className="text-sm text-text-secondary mt-1 truncate">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                                            activity.status === "sent" || activity.status === "confirmed" || activity.status === "in_progress"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-600"
                                        }`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-text-secondary" />
                        </div>
                        <p className="text-secondary font-medium">No recent activity found.</p>
                        <p className="text-sm text-text-secondary mt-1">Activity feed will appear here as the system is used.</p>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
