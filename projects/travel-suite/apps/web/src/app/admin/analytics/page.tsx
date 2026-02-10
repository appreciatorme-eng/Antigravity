"use client";

import { BarChart3, TrendingUp, Users, MapPin, DollarSign } from "lucide-react";

// TODO: Replace mock analytics with real data source.
/*
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
*/

export default function AdminAnalyticsPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-500">Analytics will appear here once data pipelines are connected.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-sm text-gray-600">Analytics data is currently disabled.</p>
                <p className="text-xs text-gray-400 mt-1">Connect metrics sources to unlock dashboards.</p>
            </div>
        </div>
    );
}
