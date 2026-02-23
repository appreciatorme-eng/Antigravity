"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, Users, MapPin, DollarSign, RefreshCw, FileCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";

interface ProposalRow {
    status: string | null;
    total_price: number | null;
    created_at: string | null;
    viewed_at: string | null;
}

interface InvoiceRow {
    status: string | null;
    total_amount: number | null;
    created_at: string | null;
}

interface TripRow {
    status: string | null;
    created_at: string | null;
    itineraries: { destination: string | null } | { destination: string | null }[] | null;
}

interface MonthSeriesPoint {
    month: string;
    revenue: number;
    proposals: number;
}

interface DestinationRank {
    name: string;
    trips: number;
}

interface AnalyticsSnapshot {
    monthlyRevenueTotal: number;
    proposalsTotal: number;
    proposalConversionRate: number;
    activeTrips: number;
    activeClients: number;
    viewedProposalRate: number;
    series: MonthSeriesPoint[];
    destinationRank: DestinationRank[];
    proposalStatusBreakdown: Array<{ status: string; count: number }>;
}

const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
    monthlyRevenueTotal: 0,
    proposalsTotal: 0,
    proposalConversionRate: 0,
    activeTrips: 0,
    activeClients: 0,
    viewedProposalRate: 0,
    series: [],
    destinationRank: [],
    proposalStatusBreakdown: [],
};

function normalizeAmount(value: number | null | undefined): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return 0;
}

function monthKeyFromDate(dateValue: string | null): string | null {
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildLastMonthKeys(count: number): string[] {
    const keys: string[] = [];
    const now = new Date();
    for (let offset = count - 1; offset >= 0; offset -= 1) {
        const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
        keys.push(`${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`);
    }
    return keys;
}

function monthLabel(monthKey: string): string {
    const [year, month] = monthKey.split("-").map((part) => Number(part));
    const date = new Date(Date.UTC(year, month - 1, 1));
    return date.toLocaleDateString("en-US", { month: "short" });
}

function extractDestination(value: TripRow["itineraries"]): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0]?.destination ?? null;
    return value.destination ?? null;
}

function toCurrency(amount: number): string {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AdminAnalyticsPage() {
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>(EMPTY_SNAPSHOT);

    const loadAnalytics = useCallback(
        async (showRefreshToast = false) => {
            setError(null);
            if (showRefreshToast) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    throw new Error("Unauthorized access");
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("organization_id")
                    .eq("id", user.id)
                    .single();

                if (profileError || !profile?.organization_id) {
                    throw new Error("Unable to resolve organization");
                }

                const orgId = profile.organization_id;

                const [proposalsRes, tripsRes, invoicesRes, clientsRes] = await Promise.all([
                    supabase
                        .from("proposals")
                        .select("status,total_price,created_at,viewed_at")
                        .eq("organization_id", orgId),
                    supabase
                        .from("trips")
                        .select("status,created_at,itineraries(destination)")
                        .eq("organization_id", orgId),
                    supabase
                        .from("invoices")
                        .select("status,total_amount,created_at")
                        .eq("organization_id", orgId),
                    supabase
                        .from("clients")
                        .select("id", { count: "exact", head: true })
                        .eq("organization_id", orgId),
                ]);

                if (proposalsRes.error) throw proposalsRes.error;
                if (tripsRes.error) throw tripsRes.error;
                if (invoicesRes.error) throw invoicesRes.error;
                if (clientsRes.error) throw clientsRes.error;

                const proposals = (proposalsRes.data || []) as ProposalRow[];
                const trips = (tripsRes.data || []) as TripRow[];
                const invoices = (invoicesRes.data || []) as InvoiceRow[];

                const monthKeys = buildLastMonthKeys(6);
                const monthMap = new Map<string, MonthSeriesPoint>(
                    monthKeys.map((key) => [
                        key,
                        {
                            month: monthLabel(key),
                            revenue: 0,
                            proposals: 0,
                        },
                    ])
                );

                const approvedStatuses = new Set(["approved", "accepted", "confirmed"]);
                const activeTripStatuses = new Set(["planned", "confirmed", "in_progress", "active"]);

                let approvedCount = 0;
                let viewedCount = 0;
                const proposalStatusMap = new Map<string, number>();

                for (const proposal of proposals) {
                    const normalizedStatus = (proposal.status || "draft").toLowerCase();
                    proposalStatusMap.set(normalizedStatus, (proposalStatusMap.get(normalizedStatus) || 0) + 1);
                    if (approvedStatuses.has(normalizedStatus)) approvedCount += 1;
                    if (proposal.viewed_at) viewedCount += 1;

                    const monthKey = monthKeyFromDate(proposal.created_at);
                    if (monthKey && monthMap.has(monthKey)) {
                        const monthData = monthMap.get(monthKey);
                        if (monthData) monthData.proposals += 1;
                    }
                }

                for (const invoice of invoices) {
                    const isPaid = (invoice.status || "").toLowerCase() === "paid";
                    if (!isPaid) continue;
                    const monthKey = monthKeyFromDate(invoice.created_at);
                    if (monthKey && monthMap.has(monthKey)) {
                        const monthData = monthMap.get(monthKey);
                        if (monthData) {
                            monthData.revenue += normalizeAmount(invoice.total_amount);
                        }
                    }
                }

                const destinationMap = new Map<string, number>();
                let activeTrips = 0;
                for (const trip of trips) {
                    const status = (trip.status || "").toLowerCase();
                    if (activeTripStatuses.has(status)) activeTrips += 1;

                    const destination = extractDestination(trip.itineraries);
                    if (!destination) continue;
                    destinationMap.set(destination, (destinationMap.get(destination) || 0) + 1);
                }

                const series = monthKeys.map((key) => monthMap.get(key)!).filter(Boolean);
                const monthlyRevenueTotal = series.reduce((sum, point) => sum + point.revenue, 0);
                const proposalTotal = proposals.length;
                const conversionRate = proposalTotal > 0 ? (approvedCount / proposalTotal) * 100 : 0;
                const viewedRate = proposalTotal > 0 ? (viewedCount / proposalTotal) * 100 : 0;

                const destinationRank = Array.from(destinationMap.entries())
                    .map(([name, tripCount]) => ({ name, trips: tripCount }))
                    .sort((a, b) => b.trips - a.trips)
                    .slice(0, 6);

                const proposalStatusBreakdown = Array.from(proposalStatusMap.entries())
                    .map(([status, count]) => ({ status, count }))
                    .sort((a, b) => b.count - a.count);

                setSnapshot({
                    monthlyRevenueTotal,
                    proposalsTotal: proposalTotal,
                    proposalConversionRate: conversionRate,
                    activeTrips,
                    activeClients: Number(clientsRes.count || 0),
                    viewedProposalRate: viewedRate,
                    series,
                    destinationRank,
                    proposalStatusBreakdown,
                });

                if (showRefreshToast) {
                    toast({
                        title: "Analytics refreshed",
                        description: "Latest metrics have been loaded.",
                        variant: "success",
                    });
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load analytics";
                setError(message);
                setSnapshot(EMPTY_SNAPSHOT);
                toast({
                    title: "Analytics load failed",
                    description: message,
                    variant: "error",
                });
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [supabase, toast]
    );

    useEffect(() => {
        void loadAnalytics(false);
    }, [loadAnalytics]);

    const maxRevenue = Math.max(1, ...snapshot.series.map((point) => point.revenue));
    const kpis = [
        {
            label: "Revenue (Last 6 Months)",
            value: toCurrency(snapshot.monthlyRevenueTotal),
            icon: DollarSign,
            tone: "text-emerald-600 dark:text-emerald-400",
        },
        {
            label: "Proposals Created",
            value: `${snapshot.proposalsTotal}`,
            icon: FileCheck2,
            tone: "text-primary",
        },
        {
            label: "Active Clients",
            value: `${snapshot.activeClients}`,
            icon: Users,
            tone: "text-indigo-600 dark:text-indigo-400",
        },
        {
            label: "Proposal Conversion",
            value: `${snapshot.proposalConversionRate.toFixed(1)}%`,
            icon: TrendingUp,
            tone: "text-orange-600 dark:text-orange-400",
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
                        <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Analytics</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Business Analytics</h1>
                        <p className="mt-1 text-text-secondary">Live proposal, revenue, and destination performance metrics.</p>
                    </div>
                </div>

                <GlassButton
                    variant="outline"
                    size="sm"
                    loading={refreshing}
                    onClick={() => void loadAnalytics(true)}
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </GlassButton>
            </div>

            {error ? (
                <GlassCard padding="lg" rounded="2xl" className="border border-rose-200/70 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-900/20">
                    <p className="text-sm text-rose-700 dark:text-rose-300">Failed to load analytics: {error}</p>
                </GlassCard>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                    <GlassCard key={item.label} padding="lg" rounded="xl">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-text-secondary">{item.label}</p>
                            <item.icon className={`h-4 w-4 ${item.tone}`} />
                        </div>
                        <div className="mt-3 text-2xl font-serif text-secondary dark:text-white">
                            {loading ? "..." : item.value}
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <GlassCard padding="lg" rounded="2xl" className="xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-serif text-secondary dark:text-white">Revenue Trend</h2>
                        <span className="text-xs text-text-secondary">Paid invoices only</span>
                    </div>

                    {snapshot.series.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/30 bg-white/30 p-6 text-center text-sm text-text-secondary dark:bg-white/5">
                            No invoice history available yet.
                        </div>
                    ) : (
                        <div className="flex h-48 items-end gap-3">
                            {snapshot.series.map((point) => (
                                <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                                    <div
                                        className="w-full rounded-xl border border-primary/30 bg-primary/20"
                                        style={{ height: `${Math.max(16, (point.revenue / maxRevenue) * 140)}px` }}
                                        title={`${point.month}: ${toCurrency(point.revenue)}`}
                                    />
                                    <span className="text-xs text-text-secondary">{point.month}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                <GlassCard padding="lg" rounded="2xl">
                    <h2 className="mb-4 text-lg font-serif text-secondary dark:text-white">Top Destinations</h2>
                    {snapshot.destinationRank.length === 0 ? (
                        <p className="text-sm text-text-secondary">No trips linked to itineraries yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {snapshot.destinationRank.map((destination) => (
                                <div key={destination.name} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-secondary dark:text-white">{destination.name}</span>
                                    </div>
                                    <span className="text-xs text-text-secondary">{destination.trips} trips</span>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <GlassCard padding="lg" rounded="2xl">
                    <h2 className="mb-4 text-lg font-serif text-secondary dark:text-white">Proposal Pipeline</h2>
                    {snapshot.proposalStatusBreakdown.length === 0 ? (
                        <p className="text-sm text-text-secondary">No proposals yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {snapshot.proposalStatusBreakdown.map((item) => (
                                <div key={item.status} className="flex items-center justify-between rounded-xl border border-white/20 bg-white/30 px-3 py-2 dark:bg-white/5">
                                    <span className="text-sm capitalize text-secondary dark:text-white">
                                        {item.status.replaceAll("_", " ")}
                                    </span>
                                    <span className="text-sm font-semibold text-primary">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                <GlassCard padding="lg" rounded="2xl">
                    <h2 className="mb-4 text-lg font-serif text-secondary dark:text-white">Engagement Health</h2>
                    <div className="space-y-4">
                        <div className="rounded-xl border border-white/20 bg-white/30 px-4 py-3 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-wide text-text-secondary">Viewed Proposals</p>
                            <p className="mt-1 text-xl font-serif text-secondary dark:text-white">
                                {snapshot.viewedProposalRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/20 bg-white/30 px-4 py-3 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-wide text-text-secondary">Active Trips</p>
                            <p className="mt-1 text-xl font-serif text-secondary dark:text-white">{snapshot.activeTrips}</p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
