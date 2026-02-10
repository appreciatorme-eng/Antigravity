"use client";

import { BarChart3, TrendingUp, Users, MapPin, DollarSign } from "lucide-react";

const kpis = [
    { label: "Monthly Revenue", icon: DollarSign, tone: "text-emerald-600" },
    { label: "Bookings", icon: MapPin, tone: "text-blue-600" },
    { label: "Active Clients", icon: Users, tone: "text-indigo-600" },
    { label: "Conversion Rate", icon: TrendingUp, tone: "text-orange-600" },
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
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-500">Connect data sources to populate metrics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{kpi.label}</p>
                            <kpi.icon className={`w-4 h-4 ${kpi.tone}`} />
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <p className="text-2xl font-semibold text-gray-300">—</p>
                            <span className="text-xs font-medium text-gray-300">—</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                        <span className="text-xs text-gray-400">Awaiting data</span>
                    </div>
                    <div className="flex items-end gap-4 h-40">
                        {revenueSeries.map((point) => (
                            <div key={point.label} className="flex flex-col items-center gap-2 flex-1">
                                <div
                                    className="w-full rounded-lg bg-gray-100"
                                    style={{ height: "24px" }}
                                />
                                <span className="text-xs text-gray-300">{point.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Destinations</h2>
                    <div className="space-y-3">
                        {topDestinations.map((dest, index) => (
                            <div key={`${dest.name}-${index}`} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">{dest.name}</p>
                                    <p className="text-xs text-gray-300">{dest.bookings} bookings</p>
                                </div>
                                <span className="text-sm font-semibold text-gray-300">{dest.revenue}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
