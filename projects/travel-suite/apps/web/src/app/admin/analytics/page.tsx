"use client";

import { BarChart3, TrendingUp, Users, MapPin, DollarSign } from "lucide-react";

const kpis = [
    { label: "Monthly Revenue", value: "$48,320", delta: "+12.4%", icon: DollarSign, tone: "text-emerald-600" },
    { label: "Bookings", value: "126", delta: "+8.1%", icon: MapPin, tone: "text-blue-600" },
    { label: "Active Clients", value: "48", delta: "+4.2%", icon: Users, tone: "text-indigo-600" },
    { label: "Conversion Rate", value: "6.8%", delta: "+0.6%", icon: TrendingUp, tone: "text-orange-600" },
];

const revenueSeries = [
    { label: "Jan", value: 32 },
    { label: "Feb", value: 38 },
    { label: "Mar", value: 41 },
    { label: "Apr", value: 36 },
    { label: "May", value: 44 },
    { label: "Jun", value: 48 },
];

const topDestinations = [
    { name: "Kyoto, Japan", bookings: 18, revenue: "$14.2k" },
    { name: "Reykjavik, Iceland", bookings: 12, revenue: "$9.1k" },
    { name: "Cape Town, SA", bookings: 9, revenue: "$7.6k" },
    { name: "Lisbon, Portugal", bookings: 8, revenue: "$5.9k" },
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
                    <p className="text-sm text-gray-500">Mock performance overview for the last 6 months.</p>
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
                            <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
                            <span className="text-xs font-medium text-emerald-600">{kpi.delta}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                        <span className="text-xs text-gray-400">Mock data</span>
                    </div>
                    <div className="flex items-end gap-4 h-40">
                        {revenueSeries.map((point) => (
                            <div key={point.label} className="flex flex-col items-center gap-2 flex-1">
                                <div
                                    className="w-full rounded-lg bg-primary/15"
                                    style={{ height: `${point.value * 2}px` }}
                                />
                                <span className="text-xs text-gray-400">{point.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Destinations</h2>
                    <div className="space-y-3">
                        {topDestinations.map((dest) => (
                            <div key={dest.name} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{dest.name}</p>
                                    <p className="text-xs text-gray-500">{dest.bookings} bookings</p>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{dest.revenue}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
