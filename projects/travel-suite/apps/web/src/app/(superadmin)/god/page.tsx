// Command Center — business operating view for god mode.

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Activity,
    ArrowRight,
    Bookmark,
    Building2,
    LifeBuoy,
    Megaphone,
    Power,
    RefreshCw,
    ShieldAlert,
    TriangleAlert,
    Wallet,
    Zap,
    TrendingDown,
    TrendingUp,
    Minus,
    ScrollText,
} from "lucide-react";
import TrendChart from "@/components/god-mode/TrendChart";
import StatusDot from "@/components/god-mode/StatusDot";
import type { HealthStatus } from "@/components/god-mode/StatusDot";
import { cn } from "@/lib/utils";

type Severity = "critical" | "high" | "medium";
type Tone = "neutral" | "warning" | "danger";
type SavedView = "all" | "revenue" | "customer-risk" | "incidents" | "growth";

interface OverviewData {
    generated_at: string;
    header: { title: string; subtitle: string };
    summary_kpis: Array<{
        id: string;
        label: string;
        value: string;
        detail: string;
        trend_pct?: number | null;
        href?: string;
        sparkline?: number[];
        tone: Tone;
    }>;
    delta_strip: Array<{
        id: string;
        label: string;
        value: number;
        comparison: string;
        href?: string;
    }>;
    priority_inbox: Array<{
        id: string;
        kind: string;
        severity: Severity;
        title: string;
        detail: string;
        age_label: string;
        action_label: string;
        href: string;
    }>;
    revenue_risk: {
        overdue_amount: string;
        overdue_count: number;
        due_this_week_amount: string;
        due_this_week_count: number;
        expiring_proposals_amount: string;
        expiring_proposals_count: number;
        open_support_count: number;
        top_overdue_invoices: Array<{
            id: string;
            invoice_number: string | null;
            due_date: string | null;
            amount: string;
            org_name: string;
        }>;
        expiring_proposals: Array<{
            id: string;
            title: string;
            expires_at: string | null;
            value: string;
            org_name: string;
        }>;
    };
    growth: {
        signup_trend_30d: Array<{ date: string; signups: number }>;
        signups_last_30d: number;
        avg_daily_signups: number;
        new_orgs_last_30d: number;
        proposal_conversion_pct: number | null;
    };
    watchlists: {
        customer_risk_orgs: Array<{
            org_id: string;
            name: string;
            tier: string;
            overdue_amount: number;
            overdue_invoices: number;
            open_tickets: number;
            urgent_tickets: number;
            oldest_ticket_at: string | null;
            expiring_proposals: number;
            expiring_value: number;
            ai_spend_usd: number;
            risk_flags: string[];
            href: string;
        }>;
        ai_spend_orgs: Array<{
            org_id: string;
            name: string;
            tier: string;
            spend_usd: number;
            requests: number;
            href: string;
        }>;
        support_load_orgs: Array<{
            org_id: string;
            name: string;
            open: number;
            urgent: number;
            oldest_at: string | null;
            href: string;
        }>;
        newest_orgs: Array<{
            org_id: string;
            name: string;
            tier: string;
            created_at: string | null;
            href: string;
        }>;
    };
    ops_health: {
        services: Array<{
            id: string;
            label: string;
            status: HealthStatus;
            detail: string;
            configured: boolean;
        }>;
        queues: {
            notifications_pending: number;
            notifications_failed: number;
            dead_letters: number;
            social_pending: number;
            pdf_pending: number;
            oldest_pending_minutes: number;
        };
        incidents: {
            open_errors: number;
            open_fatal_errors: number;
            resolved_this_week: number;
        };
    };
    decision_log: Array<{
        id: string;
        action: string;
        category: string;
        created_at: string | null;
        actor_name: string;
        target_type: string | null;
        target_id: string | null;
        href: string;
    }>;
    quick_actions: Array<{
        label: string;
        href: string;
        tone?: "danger";
    }>;
}

const SAVED_VIEWS: Array<{ id: SavedView; label: string }> = [
    { id: "all", label: "All" },
    { id: "revenue", label: "Revenue" },
    { id: "customer-risk", label: "Customer Risk" },
    { id: "incidents", label: "Incidents" },
    { id: "growth", label: "Growth" },
];

function toneBorder(tone: Tone): string {
    if (tone === "danger") return "border-red-900/70";
    if (tone === "warning") return "border-amber-900/70";
    return "border-gray-800";
}

function severityStyles(severity: Severity): string {
    if (severity === "critical") return "border-red-900/70 bg-red-950/20 text-red-200";
    if (severity === "high") return "border-amber-900/70 bg-amber-950/20 text-amber-200";
    return "border-gray-800 bg-gray-950/50 text-gray-200";
}

function formatLastUpdated(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatShortDate(iso: string | null): string {
    if (!iso) return "No date";
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function formatRelative(iso: string | null): string {
    if (!iso) return "No activity";
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60_000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function TrendIndicator({ value }: { value?: number | null }) {
    if (value === null || value === undefined) {
        return <span className="text-xs text-gray-500">No prior baseline</span>;
    }
    if (value === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Minus className="w-3 h-3" />
                Flat
            </span>
        );
    }
    const positive = value > 0;
    return (
        <span className={cn(
            "inline-flex items-center gap-1 text-xs",
            positive ? "text-emerald-300" : "text-red-300",
        )}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {positive ? "+" : ""}{value}%
        </span>
    );
}

function MetricCard({ metric }: { metric: OverviewData["summary_kpis"][number] }) {
    const content = (
        <div className={cn(
            "rounded-lg border bg-gray-900 px-4 py-4 transition-colors",
            toneBorder(metric.tone),
            metric.href && "hover:border-gray-700",
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                </div>
                <TrendIndicator value={metric.trend_pct} />
            </div>
            <p className="mt-3 text-sm text-gray-500">{metric.detail}</p>
        </div>
    );

    if (!metric.href) return content;
    return <Link href={metric.href}>{content}</Link>;
}

function DeltaCard({ item }: { item: OverviewData["delta_strip"][number] }) {
    const content = (
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 transition-colors hover:border-gray-700">
            <p className="text-xs text-gray-500">{item.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
                <span className="text-xl font-semibold text-white">{item.value}</span>
                <span className="text-xs text-gray-500">{item.comparison}</span>
            </div>
        </div>
    );

    if (!item.href) return content;
    return <Link href={item.href}>{content}</Link>;
}

function CurrentPosturePanel({
    data,
    showIncidents,
    showRevenue,
    showCustomerRisk,
    showGrowth,
    className,
}: {
    data: OverviewData;
    showIncidents: boolean;
    showRevenue: boolean;
    showCustomerRisk: boolean;
    showGrowth: boolean;
    className?: string;
}) {
    return (
        <section className={cn("overflow-hidden rounded-lg border border-gray-800 bg-gray-900", className)}>
            <div className="border-b border-gray-800 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-medium text-white">Current posture</h2>
                </div>
            </div>
            <div className="space-y-3 p-4 text-sm">
                {showIncidents && (
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 w-4 h-4 text-red-300" />
                        <p className="text-gray-300">
                            {data.ops_health.incidents.open_fatal_errors} fatal issues and {data.ops_health.incidents.open_errors} total open errors are live right now.
                        </p>
                    </div>
                )}
                {showRevenue && (
                    <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 w-4 h-4 text-amber-300" />
                        <p className="text-gray-300">
                            {data.revenue_risk.overdue_count} overdue invoices and {data.revenue_risk.expiring_proposals_count} proposals are the main revenue risks in the next 72 hours.
                        </p>
                    </div>
                )}
                {showCustomerRisk && (
                    <div className="flex items-start gap-3">
                        <Zap className="mt-0.5 w-4 h-4 text-blue-300" />
                        <p className="text-gray-300">
                            {data.watchlists.ai_spend_orgs[0]
                                ? `${data.watchlists.ai_spend_orgs[0].name} is the highest AI spend org this month at $${data.watchlists.ai_spend_orgs[0].spend_usd.toFixed(2)}.`
                                : "AI spend is not reporting yet."}
                        </p>
                    </div>
                )}
                {showGrowth && (
                    <div className="flex items-start gap-3">
                        <TrendingUp className="mt-0.5 w-4 h-4 text-emerald-300" />
                        <p className="text-gray-300">
                            {data.growth.signups_last_30d} signups and {data.growth.new_orgs_last_30d} new orgs landed in the last 30 days.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default function GodCommandCenter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const currentView = (searchParams.get("view") as SavedView | null) ?? "all";

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/superadmin/overview");
            if (!response.ok) return;
            setData(await response.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const setView = useCallback((view: SavedView) => {
        const params = new URLSearchParams(searchParams.toString());
        if (view === "all") params.delete("view");
        else params.set("view", view);
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);

    const showRevenue = currentView === "all" || currentView === "revenue";
    const showGrowth = currentView === "all" || currentView === "growth";
    const showCustomerRisk = currentView === "all" || currentView === "customer-risk";
    const showIncidents = currentView === "all" || currentView === "incidents";

    if (!data && loading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="space-y-4">
                        <div className="h-40 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="h-64 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="h-48 rounded-lg bg-gray-900 animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <div className="h-36 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="h-56 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="h-96 rounded-lg bg-gray-900 animate-pulse" />
                            <div className="h-80 rounded-lg bg-gray-900 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-lg border border-red-900/70 bg-red-950/20 p-6 text-sm text-red-200">
                God mode could not load the live overview payload.
            </div>
        );
    }

    return (
        <div className="space-y-4 min-w-0">
            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                <CurrentPosturePanel
                    data={data}
                    showIncidents={showIncidents}
                    showRevenue={showRevenue}
                    showCustomerRisk={showCustomerRisk}
                    showGrowth={showGrowth}
                />
                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-white">{data.header.title}</h1>
                        <p className="mt-1 text-sm text-gray-400">{data.header.subtitle}</p>
                        <p className="mt-2 text-xs text-gray-500">Last updated {formatLastUpdated(data.generated_at)}</p>
                    </div>

                    <div className="flex w-full flex-col gap-2 2xl:w-auto 2xl:items-end">
                        <div className="overflow-x-auto pb-1">
                            <div className="flex w-max items-center gap-1 rounded-md border border-gray-800 bg-gray-900 p-1">
                                {SAVED_VIEWS.map((view) => (
                                    <button
                                        key={view.id}
                                        onClick={() => setView(view.id)}
                                        className={cn(
                                            "rounded px-2.5 py-1.5 text-xs transition-colors",
                                            currentView === view.id
                                                ? "bg-gray-800 text-white"
                                                : "text-gray-400 hover:text-gray-200",
                                        )}
                                    >
                                        {view.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/god/support?status=open"
                                className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                            >
                                Support queue
                            </Link>
                            <Link
                                href="/god/errors?status=open"
                                className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                            >
                                Incidents
                            </Link>
                            <Link
                                href="/god/costs"
                                className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                            >
                                Costs
                            </Link>
                            <button
                                onClick={fetchOverview}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white disabled:opacity-50"
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                <div className="min-w-0 space-y-4">
                    <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                        <div className="border-b border-gray-800 px-4 py-3">
                            <h2 className="text-sm font-medium text-white">Priority inbox</h2>
                            <p className="mt-1 text-xs text-gray-500">What needs action next.</p>
                        </div>
                        <div className="p-3">
                            {data.priority_inbox.length === 0 ? (
                                <div className="rounded-md border border-emerald-900/50 bg-emerald-950/20 px-3 py-4 text-sm text-emerald-200">
                                    No urgent work is stacked right now.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {data.priority_inbox.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={cn(
                                                "block rounded-md border px-3 py-3 transition-colors hover:border-gray-700",
                                                severityStyles(item.severity),
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white">{item.title}</p>
                                                    <p className="mt-1 text-xs text-gray-400">{item.detail}</p>
                                                </div>
                                                <span className="text-[11px] text-gray-500">{item.age_label}</span>
                                            </div>
                                            <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-300">
                                                {item.action_label}
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                        <div className="border-b border-gray-800 px-4 py-3">
                            <h2 className="text-sm font-medium text-white">Newest orgs</h2>
                        </div>
                        <div className="p-3">
                            <div className="space-y-2">
                                {data.watchlists.newest_orgs.map((org) => (
                                    <Link
                                        key={org.org_id}
                                        href={org.href}
                                        className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-gray-950"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-white">{org.name}</p>
                                            <p className="text-xs text-gray-500">{org.tier} · {formatShortDate(org.created_at)}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="min-w-0 space-y-4">
                    <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="min-w-0 space-y-4">
                            <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                                {data.summary_kpis.map((metric) => (
                                    <MetricCard key={metric.id} metric={metric} />
                                ))}
                            </section>

                            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                                {data.delta_strip.map((item) => (
                                    <DeltaCard key={item.id} item={item} />
                                ))}
                            </section>

                            {(showGrowth || showRevenue) && (
                                <section className={cn(
                                    "grid min-w-0 gap-4",
                                    showGrowth && showRevenue
                                        ? "2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
                                        : "grid-cols-1",
                                )}>
                                    {showGrowth && (
                                        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                            <div className="border-b border-gray-800 px-4 py-3">
                                                <h2 className="text-sm font-medium text-white">Growth</h2>
                                                <p className="mt-1 text-xs text-gray-500">Signups across the last 30 days.</p>
                                            </div>
                                            <div className="px-4 pb-4 pt-3">
                                                <div className="grid gap-3 md:grid-cols-3">
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-500">Signups, 30d</p>
                                                        <p className="mt-1 text-xl font-semibold text-white">{data.growth.signups_last_30d}</p>
                                                    </div>
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-500">Average per day</p>
                                                        <p className="mt-1 text-xl font-semibold text-white">{data.growth.avg_daily_signups}</p>
                                                    </div>
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-500">New orgs, 30d</p>
                                                        <p className="mt-1 text-xl font-semibold text-white">{data.growth.new_orgs_last_30d}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <TrendChart
                                                        data={data.growth.signup_trend_30d}
                                                        series={[{ key: "signups", label: "Signups", color: "#f59e0b" }]}
                                                        type="area"
                                                        height={220}
                                                        onClickBar={(entry) => {
                                                            if (entry.date) {
                                                                router.push(`/god/signups?range=30d&date=${entry.date}`);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {showRevenue && (
                                        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                            <div className="border-b border-gray-800 px-4 py-3">
                                                <h2 className="text-sm font-medium text-white">Revenue leakage</h2>
                                                <p className="mt-1 text-xs text-gray-500">Outstanding money and expiring deal flow.</p>
                                            </div>
                                            <div className="space-y-4 p-4">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-3">
                                                        <p className="text-xs text-gray-400">Overdue invoices</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.overdue_amount}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{data.revenue_risk.overdue_count} invoices</p>
                                                    </div>
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-400">Due this week</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.due_this_week_amount}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{data.revenue_risk.due_this_week_count} invoices</p>
                                                    </div>
                                                    <div className="rounded-md border border-amber-900/60 bg-amber-950/20 px-3 py-3">
                                                        <p className="text-xs text-gray-400">Expiring proposals</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.expiring_proposals_amount}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{data.revenue_risk.expiring_proposals_count} proposals in 72h</p>
                                                    </div>
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-400">Open support</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.open_support_count}</p>
                                                        <p className="mt-1 text-xs text-gray-500">Support load affecting customer trust</p>
                                                    </div>
                                                </div>

                                                <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-500">Oldest overdue invoices</p>
                                                        <div className="mt-2 space-y-2">
                                                            {data.revenue_risk.top_overdue_invoices.length === 0 ? (
                                                                <p className="text-sm text-gray-500">No overdue invoices.</p>
                                                            ) : (
                                                                data.revenue_risk.top_overdue_invoices.map((invoice) => (
                                                                    <div key={invoice.id} className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <p className="text-sm text-white">#{invoice.invoice_number ?? "—"} · {invoice.org_name}</p>
                                                                                <p className="mt-1 text-xs text-gray-500">Due {formatShortDate(invoice.due_date)}</p>
                                                                            </div>
                                                                            <span className="text-sm text-red-200">{invoice.amount}</span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-500">Proposals expiring next</p>
                                                        <div className="mt-2 space-y-2">
                                                            {data.revenue_risk.expiring_proposals.length === 0 ? (
                                                                <p className="text-sm text-gray-500">No proposals expiring in the next 72 hours.</p>
                                                            ) : (
                                                                data.revenue_risk.expiring_proposals.map((proposal) => (
                                                                    <div key={proposal.id} className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm text-white">{proposal.title}</p>
                                                                                <p className="mt-1 text-xs text-gray-500">{proposal.org_name} · expires {formatShortDate(proposal.expires_at)}</p>
                                                                            </div>
                                                                            <span className="text-sm text-amber-200">{proposal.value}</span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {showCustomerRisk && (
                                <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                    <div className="border-b border-gray-800 px-4 py-3">
                                        <h2 className="text-sm font-medium text-white">Customer risk watchlist</h2>
                                        <p className="mt-1 text-xs text-gray-500">Explicit risk signals by organization, not synthetic scoring.</p>
                                    </div>
                                    <div className="grid min-w-0 gap-3 p-4 2xl:grid-cols-2">
                                        {data.watchlists.customer_risk_orgs.length === 0 ? (
                                            <p className="text-sm text-gray-500">No orgs currently meet the risk thresholds.</p>
                                        ) : (
                                            data.watchlists.customer_risk_orgs.map((org) => (
                                                <Link
                                                    key={org.org_id}
                                                    href={org.href}
                                                    className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 transition-colors hover:border-gray-700"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm text-white">{org.name}</p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {org.tier} · {org.open_tickets} open tickets · oldest {formatRelative(org.oldest_ticket_at)}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-gray-500">{org.urgent_tickets} urgent</span>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {org.overdue_amount > 0 && (
                                                            <span className="rounded bg-red-950/30 px-2 py-1 text-xs text-red-200">
                                                                ₹{org.overdue_amount.toLocaleString("en-IN")} overdue
                                                            </span>
                                                        )}
                                                        {org.expiring_value > 0 && (
                                                            <span className="rounded bg-amber-950/30 px-2 py-1 text-xs text-amber-200">
                                                                ₹{org.expiring_value.toLocaleString("en-IN")} expiring
                                                            </span>
                                                        )}
                                                        {org.ai_spend_usd > 0 && (
                                                            <span className="rounded bg-blue-950/30 px-2 py-1 text-xs text-blue-200">
                                                                ${org.ai_spend_usd.toFixed(2)} AI spend
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-3 text-xs text-gray-400">{org.risk_flags.join(" · ")}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </section>
                            )}

                            {(currentView === "all" || currentView === "customer-risk" || currentView === "revenue") && (
                                <section className="grid gap-4 xl:grid-cols-2">
                                    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                        <div className="border-b border-gray-800 px-4 py-3">
                                            <h2 className="text-sm font-medium text-white">AI spend watchlist</h2>
                                        </div>
                                        <div className="p-3">
                                            <div className="space-y-2">
                                                {data.watchlists.ai_spend_orgs.length === 0 ? (
                                                    <p className="px-1 py-2 text-sm text-gray-500">No AI spend data yet.</p>
                                                ) : (
                                                    data.watchlists.ai_spend_orgs.map((org) => (
                                                        <Link
                                                            key={org.org_id}
                                                            href={org.href}
                                                            className="flex items-start justify-between rounded-md border border-gray-800 px-3 py-3 transition-colors hover:border-gray-700"
                                                        >
                                                            <div>
                                                                <p className="text-sm text-white">{org.name}</p>
                                                                <p className="mt-1 text-xs text-gray-500">{org.requests.toLocaleString()} requests · {org.tier}</p>
                                                            </div>
                                                            <span className="text-sm text-white">${org.spend_usd.toFixed(2)}</span>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                        <div className="border-b border-gray-800 px-4 py-3">
                                            <h2 className="text-sm font-medium text-white">Support pressure by org</h2>
                                        </div>
                                        <div className="p-3">
                                            <div className="space-y-2">
                                                {data.watchlists.support_load_orgs.length === 0 ? (
                                                    <p className="px-1 py-2 text-sm text-gray-500">No active support backlog.</p>
                                                ) : (
                                                    data.watchlists.support_load_orgs.map((org) => (
                                                        <Link
                                                            key={org.org_id}
                                                            href={org.href}
                                                            className="flex items-start justify-between rounded-md border border-gray-800 px-3 py-3 transition-colors hover:border-gray-700"
                                                        >
                                                            <div>
                                                                <p className="text-sm text-white">{org.name}</p>
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    {org.open} open · {org.urgent} urgent/high · oldest {formatRelative(org.oldest_at)}
                                                                </p>
                                                            </div>
                                                            <ArrowRight className="mt-0.5 w-4 h-4 text-gray-600" />
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className="min-w-0 space-y-4">
                            <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                <div className="border-b border-gray-800 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Ops health</h2>
                                    <p className="mt-1 text-xs text-gray-500">Only live service and queue signals.</p>
                                </div>
                                <div className="space-y-4 p-4">
                                    <div className="space-y-2">
                                        {data.ops_health.services.map((service) => (
                                            <div
                                                key={service.id}
                                                className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-950/50 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm text-white">{service.label}</p>
                                                    <p className="text-xs text-gray-500">{service.detail}</p>
                                                </div>
                                                <StatusDot status={service.status} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Notifications pending</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.queues.notifications_pending}</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Dead letters</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.queues.dead_letters}</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Oldest pending</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.queues.oldest_pending_minutes}m</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Resolved this week</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.incidents.resolved_this_week}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href="/god/monitoring?focus=queues"
                                        className="inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white"
                                    >
                                        Open health monitor
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                <div className="border-b border-gray-800 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Quick actions</h2>
                                </div>
                                <div className="grid gap-2 p-3">
                                    {data.quick_actions.map((action) => {
                                        const icon = action.label === "Error events"
                                            ? TriangleAlert
                                            : action.label === "Support queue"
                                                ? LifeBuoy
                                                : action.label === "Health monitor"
                                                    ? Activity
                                                    : action.label === "Cost dashboard"
                                                        ? Wallet
                                                        : action.label === "Send announcement"
                                                            ? Megaphone
                                                            : Power;
                                        const Icon = icon;
                                        return (
                                            <Link
                                                key={action.href}
                                                href={action.href}
                                                className={cn(
                                                    "inline-flex items-center justify-between rounded-md border px-3 py-3 text-sm transition-colors",
                                                    action.tone === "danger"
                                                        ? "border-red-900/70 bg-red-950/20 text-red-200 hover:border-red-800"
                                                        : "border-gray-800 bg-gray-950/50 text-gray-300 hover:border-gray-700 hover:text-white",
                                                )}
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <Icon className="w-4 h-4" />
                                                    {action.label}
                                                </span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                <div className="border-b border-gray-800 px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-medium text-white">Decision log</h2>
                                            <p className="mt-1 text-xs text-gray-500">Recent superadmin actions and interventions.</p>
                                        </div>
                                        <Link href="/god/audit-log" className="text-xs text-gray-400 transition-colors hover:text-white">
                                            Open audit log
                                        </Link>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3">
                                    {data.decision_log.length === 0 ? (
                                        <p className="px-1 py-2 text-sm text-gray-500">No recent platform actions logged yet.</p>
                                    ) : (
                                        data.decision_log.map((entry) => (
                                            <Link
                                                key={entry.id}
                                                href={entry.href}
                                                className="block rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 transition-colors hover:border-gray-700"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <ScrollText className="mt-0.5 w-4 h-4 text-gray-500" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white">{entry.action}</p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {entry.actor_name} · {entry.category.replace(/_/g, " ")} · {formatRelative(entry.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
