"use client";

import { BarChart3, TrendingUp, Users, MapPin, DollarSign } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";

const kpis = [
    { label: "Monthly Revenue", icon: DollarSign, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Bookings", icon: MapPin, tone: "text-blue-600 dark:text-blue-400" },
    { label: "Active Clients", icon: Users, tone: "text-indigo-600 dark:text-indigo-400" },
    { label: "Conversion Rate", icon: TrendingUp, tone: "text-orange-600 dark:text-orange-400" },
];

const revenueSeries = [
    { label: "Jan" },
    { label: "Feb" },
    { label: "Mar" },
    { label: "Apr" },
    { label: "May" },
    { label: "Jun" },
];

const topDestinations = [
    { name: "—", bookings: "—", revenue: "—" },
    { name: "—", bookings: "—", revenue: "—" },
    { name: "—", bookings: "—", revenue: "—" },
    { name: "—", bookings: "—", revenue: "—" },
];

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Analytics</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Analytics</h1>
                    <p className="text-text-secondary mt-1">Connect data sources to populate metrics.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <GlassCard key={kpi.label} padding="lg" rounded="xl">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-text-secondary">{kpi.label}</p>
                            <kpi.icon className={`w-4 h-4 ${kpi.tone}`} />
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <p className="text-2xl font-serif text-text-secondary">—</p>
                            <span className="text-xs font-medium text-text-secondary">—</span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <GlassCard padding="lg" rounded="2xl" className="xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-serif text-secondary dark:text-white">Revenue Trend</h2>
                        <span className="text-xs text-text-secondary">Awaiting data</span>
                    </div>
                    <div className="flex items-end gap-4 h-40">
                        {revenueSeries.map((point) => (
                            <div key={point.label} className="flex flex-col items-center gap-2 flex-1">
                                <div
                                    className="w-full rounded-lg bg-primary/10 border border-primary/20"
                                    style={{ height: "24px" }}
                                />
                                <span className="text-xs text-text-secondary">{point.label}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Top Destinations */}
                <GlassCard padding="lg" rounded="2xl">
                    <h2 className="text-lg font-serif text-secondary dark:text-white mb-4">Top Destinations</h2>
                    <div className="space-y-3">
                        {topDestinations.map((dest, index) => (
                            <div key={`${dest.name}-${index}`} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">{dest.name}</p>
                                    <p className="text-xs text-text-secondary">{dest.bookings} bookings</p>
                                </div>
                                <span className="text-sm font-semibold text-text-secondary">{dest.revenue}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
