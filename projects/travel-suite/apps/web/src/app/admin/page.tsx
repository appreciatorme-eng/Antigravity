"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Car, Users, MapPin, Bell, TrendingUp, Calendar } from "lucide-react";

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
                    ...(recentTrips || []).map((trip: any) => ({
                        id: trip.id,
                        type: "trip" as const,
                        title: "New Trip Created",
                        description: `${trip.itineraries?.trip_title || "Untitled Trip"} to ${trip.itineraries?.destination || "Unknown"}`,
                        timestamp: trip.created_at,
                        status: trip.status || "pending",
                    })),
                    ...(recentNotifications || []).map((notif: any) => ({
                        id: notif.id,
                        type: "notification" as const,
                        title: notif.title,
                        description: notif.body,
                        timestamp: notif.sent_at,
                        status: notif.status,
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

    const statCards = [
        {
            label: "Active Drivers",
            value: stats.totalDrivers,
            icon: Car,
            color: "bg-blue-500",
            bgColor: "bg-blue-50",
        },
        {
            label: "Total Clients",
            value: stats.totalClients,
            icon: Users,
            color: "bg-green-500",
            bgColor: "bg-green-50",
        },
        {
            label: "Active Trips",
            value: stats.activeTrips,
            icon: MapPin,
            color: "bg-purple-500",
            bgColor: "bg-purple-50",
        },
        {
            label: "Pending Notifications",
            value: stats.pendingNotifications,
            icon: Bell,
            color: "bg-orange-500",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-serif text-gray-900 mb-1">Dashboard</h1>
                <p className="text-gray-600">
                    Welcome to your tour operator admin panel
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                                <p className="text-3xl font-semibold text-gray-900">
                                    {loading ? "-" : stat.value}
                                </p>
                            </div>
                            <div
                                className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                            >
                                <stat.icon className={`w-6 h-6 text-${stat.color.replace("bg-", "")}`} style={{ color: stat.color.includes("blue") ? "#3b82f6" : stat.color.includes("green") ? "#22c55e" : stat.color.includes("purple") ? "#a855f7" : "#f97316" }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/drivers"
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Add New Driver</p>
                            <p className="text-sm text-gray-500">Register a partner driver</p>
                        </div>
                    </a>
                    <a
                        href="/admin/trips"
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Manage Trips</p>
                            <p className="text-sm text-gray-500">Assign drivers to trips</p>
                        </div>
                    </a>
                    <a
                        href="/admin/notifications"
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Bell className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Send Notifications</p>
                            <p className="text-sm text-gray-500">Notify clients & drivers</p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Recent Activity
                    </h2>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>

                {loading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : activities.length > 0 ? (
                    <div className="space-y-6">
                        {activities.map((activity, idx) => (
                            <div key={activity.id} className="relative flex items-start gap-4">
                                {idx !== activities.length - 1 && (
                                    <div className="absolute left-[1.125rem] top-8 bottom-[-1.5rem] w-px bg-gray-100" />
                                )}
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${activity.type === "trip" ? "bg-blue-100" : "bg-orange-100"
                                    }`}>
                                    {activity.type === "trip" ? (
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <Bell className="w-4 h-4 text-orange-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {activity.title}
                                        </p>
                                        <time className="text-xs text-gray-400 shrink-0">
                                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </time>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${activity.status === "sent" || activity.status === "confirmed" || activity.status === "in_progress"
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
                    <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-gray-300" />
                        </div>
                        <p>No recent activity found.</p>
                        <p className="text-sm">Activity feed will appear here as the system is used.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
