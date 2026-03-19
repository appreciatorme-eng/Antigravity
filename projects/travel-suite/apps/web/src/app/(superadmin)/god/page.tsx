// Command Center — the main god-mode dashboard at /god.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Building2, Map, DollarSign, Zap, LifeBuoy,
    Power, Megaphone, Activity, RefreshCw,
} from "lucide-react";
import KpiGrid from "@/components/god-mode/KpiGrid";
import TrendChart from "@/components/god-mode/TrendChart";
import StatusDot from "@/components/god-mode/StatusDot";
import type { KpiCardProps } from "@/components/god-mode/KpiCard";
import type { HealthStatus } from "@/components/god-mode/StatusDot";

interface OverviewData {
    kpis: {
        total_users: number;
        total_users_change_pct?: number;
        total_orgs: number;
        total_orgs_change_pct?: number;
        trips_this_month: number;
        trips_this_month_change_pct?: number;
        mrr_inr?: number;
        mrr_estimate?: number;
        mrr_change_pct?: number;
        api_spend_today_usd?: number;
        spend_change_pct?: number;
        open_tickets: number;
        open_tickets_change_pct?: number;
    };
    signup_trend_30d: { date: string; signups: number }[];
    signup_sparkline_7d: number[];
    hrefs: {
        total_users: string;
        total_orgs: string;
        trips_this_month: string;
        mrr_inr?: string;
        mrr_estimate?: string;
        api_spend_today_usd?: string;
        open_tickets: string;
    };
}

function fmt(n: number, prefix = ""): string {
    if (n >= 1000) return `${prefix}${(n / 1000).toFixed(1)}k`;
    return `${prefix}${n}`;
}

function fmtUsd(n: number): string {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(2)}`;
}

export default function GodCommandCenter() {
    const router = useRouter();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/superadmin/overview");
            if (!res.ok) return;
            setData(await res.json());
            setLastRefresh(new Date());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOverview(); }, [fetchOverview]);

    const mrr = data?.kpis.mrr_inr ?? data?.kpis.mrr_estimate ?? 0;

    const kpis: KpiCardProps[] = data ? [
        {
            label: "Total Users",
            value: fmt(data.kpis.total_users),
            trend: data.kpis.total_users_change_pct ?? 0,
            icon: Users,
            color: "blue",
            href: data.hrefs.total_users,
            sparklineData: data.signup_sparkline_7d,
        },
        {
            label: "Active Orgs",
            value: fmt(data.kpis.total_orgs),
            trend: data.kpis.total_orgs_change_pct ?? 0,
            icon: Building2,
            color: "emerald",
            href: data.hrefs.total_orgs,
        },
        {
            label: "Trips This Month",
            value: fmt(data.kpis.trips_this_month),
            trend: data.kpis.trips_this_month_change_pct ?? 0,
            icon: Map,
            color: "purple",
            href: data.hrefs.trips_this_month,
        },
        {
            label: "MRR (INR)",
            value: fmt(mrr, "\u20B9"),
            trend: data.kpis.mrr_change_pct ?? 0,
            icon: DollarSign,
            color: "amber",
            href: data.hrefs.mrr_inr ?? data.hrefs.mrr_estimate ?? "/god/costs",
        },
        {
            label: "API Spend Today",
            value: fmtUsd(data.kpis.api_spend_today_usd ?? 0),
            trend: data.kpis.spend_change_pct ?? 0,
            icon: Zap,
            color: "red",
            href: data.hrefs.api_spend_today_usd ?? "/god/costs",
        },
        {
            label: "Open Tickets",
            value: String(data.kpis.open_tickets),
            trend: data.kpis.open_tickets_change_pct ?? 0,
            icon: LifeBuoy,
            color: "purple",
            href: data.hrefs.open_tickets,
        },
    ] : [];

    const systemServices: { label: string; status: HealthStatus }[] = [
        { label: "Database", status: "healthy" },
        { label: "FCM", status: "healthy" },
        { label: "WhatsApp", status: "healthy" },
        { label: "Notifications", status: "healthy" },
        { label: "Queues", status: "healthy" },
    ];

    const quickActions = [
        { label: "Kill Switch", icon: Power, href: "/god/kill-switch", danger: true },
        { label: "Send Announcement", icon: Megaphone, href: "/god/announcements" },
        { label: "View Support", icon: LifeBuoy, href: "/god/support" },
        { label: "Health Monitor", icon: Activity, href: "/god/monitoring" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Command Center</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Platform overview — last updated {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={fetchOverview}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                               text-sm text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* KPI Grid */}
            {loading && !data ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-gray-800 animate-pulse" />
                    ))}
                </div>
            ) : (
                <KpiGrid cards={kpis} />
            )}

            {/* Middle section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Signup trend — 3/5 width */}
                <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                        Signup Trend — Last 30 Days
                    </h2>
                    {data?.signup_trend_30d ? (
                        <TrendChart
                            data={data.signup_trend_30d}
                            series={[{ key: "signups", label: "Signups", color: "#f59e0b" }]}
                            type="area"
                            height={200}
                            onClickBar={(entry) => {
                                if (entry?.date) router.push(`/god/signups?date=${entry.date}`);
                            }}
                        />
                    ) : (
                        <div className="h-48 bg-gray-800 animate-pulse rounded-lg" />
                    )}
                </div>

                {/* Right column — 2/5 width */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* System status */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                System Status
                            </h2>
                            <button
                                onClick={() => router.push("/god/monitoring")}
                                className="text-xs text-amber-400 hover:text-amber-300"
                            >
                                Details →
                            </button>
                        </div>
                        <div className="space-y-2">
                            {systemServices.map((s) => (
                                <div key={s.label} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">{s.label}</span>
                                    <StatusDot status={s.status} label="" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                            Quick Actions
                        </h2>
                        <div className="space-y-2">
                            {quickActions.map((a) => {
                                const Icon = a.icon;
                                return (
                                    <button
                                        key={a.label}
                                        onClick={() => router.push(a.href)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                                                    transition-colors ${a.danger
                                                ? "bg-red-950/40 border border-red-900/50 text-red-300 hover:bg-red-950/60"
                                                : "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {a.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
