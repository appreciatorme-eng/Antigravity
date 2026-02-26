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

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

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

    const kpis = [
        {
            label: "Total Revenue",
            value: toCurrency(snapshot.monthlyRevenueTotal),
            sub: "Last 6 months",
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Proposals",
            value: `${snapshot.proposalsTotal}`,
            sub: "Total created",
            icon: FileCheck2,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Conversion",
            value: `${snapshot.proposalConversionRate.toFixed(1)}%`,
            sub: "Proposal to Trip",
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Engagement",
            value: `${snapshot.viewedProposalRate.toFixed(1)}%`,
            sub: "Proposal view rate",
            icon: Users,
            color: "text-orange-600",
            bg: "bg-orange-50",
        },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif text-secondary tracking-tight">Business Insights</h1>
                    <p className="mt-2 text-lg text-text-secondary">Comprehensive performance analysis and market insights.</p>
                </div>

                <GlassButton
                    variant="outline"
                    className="rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
                    loading={refreshing}
                    onClick={() => void loadAnalytics(true)}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Data
                </GlassButton>
            </div>

            {error ? (
                <GlassCard padding="lg" className="border-rose-100 bg-rose-50/50">
                    <p className="text-sm text-rose-600 font-medium">Analytics Engine Error: {error}</p>
                </GlassCard>
            ) : null}

            {/* KPI Section */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map((item) => (
                    <GlassCard key={item.label} padding="lg" className="group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <item.icon className={`h-6 w-6 ${item.color}`} />
                            </div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.sub}</span>
                        </div>
                        <div className="text-3xl font-bold text-secondary tabular-nums">
                            {loading ? "..." : item.value}
                        </div>
                        <p className="mt-1 text-sm font-medium text-text-secondary">{item.label}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Revenue Trend Chart */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <GlassCard padding="lg" className="xl:col-span-2">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-serif text-secondary">Revenue Accumulation</h2>
                            <p className="text-xs text-text-muted mt-1 uppercase tracking-tighter">Gross revenue from paid invoices (Monthly)</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Paid Invoices</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {loading ? (
                            <div className="w-full h-full bg-gray-50/50 animate-pulse rounded-2xl" />
                        ) : snapshot.series.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-text-muted text-sm">
                                Insufficient historical data for projection.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={snapshot.series}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.4} />
                                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.8)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </GlassCard>

                {/* Top Destinations */}
                <GlassCard padding="lg">
                    <div className="mb-6">
                        <h2 className="text-xl font-serif text-secondary">Top Regions</h2>
                        <p className="text-xs text-text-muted mt-1">High-demand travel destinations</p>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-xl" />)}
                        </div>
                    ) : snapshot.destinationRank.length === 0 ? (
                        <div className="py-12 text-center">
                            <MapPin className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm text-text-muted">No destination data yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {snapshot.destinationRank.map((dest, idx) => (
                                <div key={dest.name} className="flex items-center justify-between p-3 bg-white/50 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all hover:translate-x-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-text-muted w-4">{idx + 1}</span>
                                        <span className="text-sm font-bold text-secondary">{dest.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp className="h-3 w-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary">{dest.trips}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Bottom Row: Pipeline & Health */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <GlassCard padding="lg">
                    <h2 className="text-xl font-serif text-secondary mb-8">Proposal Pipeline</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={snapshot.proposalStatusBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {snapshot.proposalStatusBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                            {snapshot.proposalStatusBreakdown.map((item, idx) => (
                                <div key={item.status} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="capitalize text-text-secondary font-medium">{item.status.replace('_', ' ')}</span>
                                    </div>
                                    <span className="font-bold text-secondary">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard padding="lg">
                    <h2 className="text-xl font-serif text-secondary mb-8">Operations Status</h2>
                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-white/50 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Active Client Load</span>
                                <span className="text-xs font-bold text-primary">{snapshot.activeClients} Operators</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (snapshot.activeClients / 20) * 100)}%` }} />
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/50 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Ongoing Expeditions</span>
                                <span className="text-xs font-bold text-secondary">{snapshot.activeTrips} Live</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (snapshot.activeTrips / 10) * 100)}%` }} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex-1 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                <h4 className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Health</h4>
                                <p className="text-lg font-bold text-emerald-700">Optimal</p>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                <h4 className="text-[10px] font-bold text-blue-600 uppercase mb-1">Latency</h4>
                                <p className="text-lg font-bold text-blue-700">&lt; 140ms</p>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
