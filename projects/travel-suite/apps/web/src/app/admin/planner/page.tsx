"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Sparkles, MapPin, CalendarDays, ArrowRight, BrainCircuit, BriefcaseBusiness } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";

interface ItineraryRow {
    id: string;
    trip_title: string;
    destination: string;
    duration_days: number | null;
    budget: string | null;
    interests: string[] | null;
    updated_at: string | null;
}

interface TripRow {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string | null;
    itinerary_id: string | null;
    itineraries: { trip_title: string; destination: string; duration_days: number | null } | { trip_title: string; destination: string; duration_days: number | null }[] | null;
}

interface CacheRow {
    id: string;
    destination: string;
    duration_days: number;
    usage_count: number | null;
    last_used_at: string | null;
    created_at: string | null;
    generation_source: string | null;
    quality_score: number | null;
}

interface PlannerSnapshot {
    itineraries: ItineraryRow[];
    trips: TripRow[];
    cacheRows: CacheRow[];
    totalItineraries: number;
    activeTrips: number;
    avgCacheReuse: number;
}

const EMPTY_SNAPSHOT: PlannerSnapshot = {
    itineraries: [],
    trips: [],
    cacheRows: [],
    totalItineraries: 0,
    activeTrips: 0,
    avgCacheReuse: 0,
};

function formatDate(value: string | null): string {
    if (!value) return "Not scheduled";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not scheduled";
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function asTripItinerary(value: TripRow["itineraries"]): { trip_title: string; destination: string; duration_days: number | null } | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
}

function normalizeTripStatus(status: string | null): string {
    return (status || "planned").toLowerCase();
}

export default function PlannerPage() {
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<PlannerSnapshot>(EMPTY_SNAPSHOT);

    const loadPlannerData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [itinerariesRes, tripsRes, cacheRes] = await Promise.all([
                supabase
                    .from("itineraries")
                    .select("id,trip_title,destination,duration_days,budget,interests,updated_at")
                    .order("updated_at", { ascending: false })
                    .limit(12),
                supabase
                    .from("trips")
                    .select("id,status,start_date,end_date,created_at,itinerary_id,itineraries(trip_title,destination,duration_days)")
                    .order("created_at", { ascending: false })
                    .limit(12),
                supabase
                    .from("itinerary_cache")
                    .select("id,destination,duration_days,usage_count,last_used_at,created_at,generation_source,quality_score")
                    .order("created_at", { ascending: false })
                    .limit(12),
            ]);

            if (itinerariesRes.error) throw itinerariesRes.error;
            if (tripsRes.error) throw tripsRes.error;
            if (cacheRes.error) throw cacheRes.error;

            const itineraries = (itinerariesRes.data || []) as ItineraryRow[];
            const trips = (tripsRes.data || []) as TripRow[];
            const cacheRows = (cacheRes.data || []) as CacheRow[];

            const activeStatuses = new Set(["planned", "confirmed", "in_progress", "active"]);
            const activeTrips = trips.filter((trip) => activeStatuses.has(normalizeTripStatus(trip.status))).length;
            const totalUsage = cacheRows.reduce((sum, row) => sum + Number(row.usage_count || 0), 0);
            const avgCacheReuse = cacheRows.length > 0 ? totalUsage / cacheRows.length : 0;

            setSnapshot({
                itineraries,
                trips,
                cacheRows,
                totalItineraries: itineraries.length,
                activeTrips,
                avgCacheReuse,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load planner workspace";
            setError(message);
            setSnapshot(EMPTY_SNAPSHOT);
            toast({
                title: "Planner load failed",
                description: message,
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    useEffect(() => {
        void loadPlannerData();
    }, [loadPlannerData]);

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
                        <Compass className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Planner</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Planning Workspace</h1>
                        <p className="mt-1 text-text-secondary">Track recent itinerary drafts, active trips, and AI cache performance.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/planner">
                        <GlassButton size="sm">
                            <Sparkles className="h-4 w-4" />
                            Open AI Planner
                        </GlassButton>
                    </Link>
                    <GlassButton variant="outline" size="sm" onClick={() => void loadPlannerData()} loading={loading}>
                        Refresh
                    </GlassButton>
                </div>
            </div>

            {error ? (
                <GlassCard padding="lg" rounded="2xl" className="border border-rose-200/70 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-900/20">
                    <p className="text-sm text-rose-700 dark:text-rose-300">Unable to load planner data: {error}</p>
                </GlassCard>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Recent Itineraries</p>
                    <p className="mt-1 text-2xl font-serif text-secondary dark:text-white">
                        {loading ? "..." : snapshot.totalItineraries}
                    </p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Active Trips</p>
                    <p className="mt-1 text-2xl font-serif text-secondary dark:text-white">
                        {loading ? "..." : snapshot.activeTrips}
                    </p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Avg Cache Reuse</p>
                    <p className="mt-1 text-2xl font-serif text-secondary dark:text-white">
                        {loading ? "..." : snapshot.avgCacheReuse.toFixed(1)}x
                    </p>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <GlassCard padding="lg" rounded="2xl" className="xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-serif text-secondary dark:text-white">Recent Itinerary Drafts</h2>
                        <Link href="/admin/tour-templates" className="text-xs font-semibold text-primary hover:underline">
                            Manage templates
                        </Link>
                    </div>

                    {snapshot.itineraries.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/30 bg-white/30 p-6 text-center dark:bg-white/5">
                            <p className="text-sm font-medium text-secondary dark:text-white">No saved itineraries yet</p>
                            <p className="mt-1 text-xs text-text-secondary">Generate your first itinerary from the AI Planner.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {snapshot.itineraries.map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/20 bg-white/30 p-3 dark:bg-white/5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-secondary dark:text-white">{item.trip_title}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                                    {item.destination}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                                    {item.duration_days || 0} days
                                                </span>
                                            </div>
                                        </div>
                                        <Link href={`/trips/${item.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                                            Open
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                    <p className="mt-2 text-xs text-text-secondary">Updated {formatDate(item.updated_at)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                <GlassCard padding="lg" rounded="2xl">
                    <h2 className="mb-4 text-lg font-serif text-secondary dark:text-white">AI Cache Insights</h2>
                    {snapshot.cacheRows.length === 0 ? (
                        <p className="text-sm text-text-secondary">No AI cache records yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {snapshot.cacheRows.slice(0, 6).map((entry) => (
                                <div key={entry.id} className="rounded-xl border border-white/20 bg-white/30 px-3 py-2 dark:bg-white/5">
                                    <p className="text-sm font-medium text-secondary dark:text-white">
                                        {entry.destination} ({entry.duration_days}d)
                                    </p>
                                    <div className="mt-1 flex items-center justify-between text-xs text-text-secondary">
                                        <span className="inline-flex items-center gap-1">
                                            <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                                            {entry.generation_source || "ai"}
                                        </span>
                                        <span>{Number(entry.usage_count || 0)} reuses</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            <GlassCard padding="lg" rounded="2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-serif text-secondary dark:text-white">Trip Execution Queue</h2>
                    <Link href="/admin/trips" className="text-xs font-semibold text-primary hover:underline">
                        View all trips
                    </Link>
                </div>

                {snapshot.trips.length === 0 ? (
                    <p className="text-sm text-text-secondary">No trips are queued yet.</p>
                ) : (
                    <div className="space-y-3">
                        {snapshot.trips.map((trip) => {
                            const itinerary = asTripItinerary(trip.itineraries);
                            const status = normalizeTripStatus(trip.status).replaceAll("_", " ");

                            return (
                                <div key={trip.id} className="rounded-xl border border-white/20 bg-white/30 p-3 dark:bg-white/5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-secondary dark:text-white">
                                                {itinerary?.trip_title || "Trip"}
                                            </p>
                                            <p className="mt-1 text-xs text-text-secondary">
                                                {itinerary?.destination || "Destination not linked"} • {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
                                            <BriefcaseBusiness className="h-3.5 w-3.5" />
                                            {status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
