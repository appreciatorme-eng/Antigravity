"use client";

import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTrips } from "@/lib/queries/trips";
import {
    Search,
    Filter,
    Plus,
    Plane,
    ArrowDownUp,
    List as ListIcon,
    LayoutGrid,
    X,
} from "lucide-react";
import CreateTripModal from "@/components/CreateTripModal";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassListSkeleton } from "@/components/glass/GlassSkeleton";
import { cn } from "@/lib/utils";
import type { EnrichedTrip, TripSortKey, QuickFilter, TripKPIDrillAction } from "./types";
import { STATUS_OPTIONS, DRILL_LABELS } from "./types";
import { sortTrips, applyQuickFilters } from "./utils";
import { TripKPIStats } from "./TripKPIStats";
import { DepartingSoonSection } from "./DepartingSoonSection";
import { TripListRow } from "./TripListRow";
import { TripGridCard } from "./TripGridCard";
import { SetupGuide } from "@/components/dashboard/SetupGuide";
import { GuidedTour } from "@/components/tour/GuidedTour";
import { useToast } from "@/components/ui/toast";
import { authedFetch } from "@/lib/api/authed-fetch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SORT_OPTIONS: { value: TripSortKey; label: string }[] = [
    { value: "departure", label: "Departure Date" },
    { value: "created", label: "Created Date" },
    { value: "value", label: "Trip Value" },
    { value: "client", label: "Client Name" },
];

const QUICK_FILTER_OPTIONS: { value: QuickFilter; label: string }[] = [
    { value: "departing_this_week", label: "Departing This Week" },
    { value: "missing_driver", label: "Missing Driver" },
    { value: "payment_due", label: "Payment Due" },
];

export default function TripsPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Auto-open create modal when navigated with ?create=true (from FAB)
    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setIsCreateModalOpen(true);
        }
    }, [searchParams]);
    const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
    const [sortKey, setSortKey] = useState<TripSortKey>("departure");
    const [quickFilters, setQuickFilters] = useState<Set<QuickFilter>>(new Set());
    const [activeDrill, setActiveDrill] = useState<TripKPIDrillAction | null>(null);
    const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
    const [tripPendingDelete, setTripPendingDelete] = useState<EnrichedTrip | null>(null);

    const departingSoonRef = useRef<HTMLDivElement>(null);

    const { data: rawTrips, isPending: loading, refetch: fetchTrips } = useTrips(statusFilter, searchQuery);
    const trips: EnrichedTrip[] = useMemo(() => rawTrips || [], [rawTrips]);

    const processedTrips = useMemo(() => {
        const filtered = applyQuickFilters(trips, quickFilters);
        return sortTrips(filtered, sortKey);
    }, [trips, quickFilters, sortKey]);

    const toggleQuickFilter = (filter: QuickFilter) => {
        setQuickFilters((prev) => {
            const next = new Set(prev);
            if (next.has(filter)) {
                next.delete(filter);
            } else {
                next.add(filter);
            }
            return next;
        });
    };

    const handleDrillThrough = useCallback((action: TripKPIDrillAction) => {
        setActiveDrill(action);
        switch (action) {
            case "revenue":
                setStatusFilter("confirmed");
                setSortKey("value");
                setQuickFilters(new Set());
                break;
            case "active":
                setStatusFilter("confirmed");
                setQuickFilters(new Set());
                break;
            case "departing_soon":
                setStatusFilter("all");
                setQuickFilters(new Set(["departing_this_week"]));
                setTimeout(() => {
                    departingSoonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
                break;
            case "collection_pending":
                setStatusFilter("all");
                setQuickFilters(new Set(["payment_due"]));
                break;
        }
    }, []);

    const clearDrill = useCallback(() => {
        setActiveDrill(null);
        setStatusFilter("all");
        setSortKey("departure");
        setQuickFilters(new Set());
    }, []);

    const requestDeleteTrip = useCallback((tripId: string) => {
        const trip = trips.find((item) => item.id === tripId) || null;
        if (!trip || deletingTripId) return;
        setTripPendingDelete(trip);
    }, [deletingTripId, trips]);

    const handleDeleteTrip = useCallback(async () => {
        if (!tripPendingDelete || deletingTripId) return;
        const tripId = tripPendingDelete.id;
        if (deletingTripId) return;

        setDeletingTripId(tripId);
        try {
            const response = await authedFetch(`/api/trips/${tripId}`, { method: "DELETE" });
            if (!response.ok) {
                throw new Error("Failed to delete trip");
            }
            setTripPendingDelete(null);
            toast({
                title: "Trip deleted",
                description: "The trip has been removed.",
                variant: "success",
            });
            void fetchTrips();
        } catch (error) {
            toast({
                title: "Delete failed",
                description: error instanceof Error ? error.message : "Unable to delete this trip right now.",
                variant: "error",
            });
        } finally {
            setDeletingTripId(null);
        }
    }, [deletingTripId, fetchTrips, toast, tripPendingDelete]);

    return (
        <div className="space-y-8 pb-20">
            <GuidedTour />
            <SetupGuide />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Trip Manager
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Trips
                    </h1>
                    <p className="text-text-muted text-sm md:text-lg font-medium max-w-2xl">
                        Comprehensive monitoring of client journeys and travel bookings.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <GlassButton
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-11 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl shadow-xl shadow-primary/20 group"
                        data-tour="create-trip-btn"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 transition-transform group-hover:rotate-90" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Create Trip</span>
                    </GlassButton>
                </div>
            </div>

            {/* KPI Stats */}
            <div data-tour="trip-kpi-stats">
                <TripKPIStats trips={trips} loading={loading} onDrillThrough={handleDrillThrough} />
            </div>

            {/* Drill-Through Banner */}
            {activeDrill && (
                <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-primary/5 border border-primary/20">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                        Filtered by {DRILL_LABELS[activeDrill]}
                    </span>
                    <button
                        onClick={clearDrill}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/70 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear
                    </button>
                </div>
            )}

            {/* Workspace Toolbar */}
            <GlassCard
                padding="none"
                className="overflow-hidden border-gray-100 dark:border-slate-800 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)]"
                data-tour="trip-search"
            >
                <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/70 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Trips Workspace</p>
                            <h2 className="text-xl font-semibold tracking-tight text-secondary dark:text-white">
                                Browse operations with commercial context built in
                            </h2>
                        </div>

                        <div className="flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                                    viewMode === "grid"
                                        ? "bg-secondary text-white shadow-md dark:bg-white dark:text-slate-900"
                                        : "text-text-muted hover:text-primary"
                                )}
                            >
                                <LayoutGrid className="h-4 w-4" />
                                Tiles
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                                    viewMode === "list"
                                        ? "bg-secondary text-white shadow-md dark:bg-white dark:text-slate-900"
                                        : "text-text-muted hover:text-primary"
                                )}
                            >
                                <ListIcon className="h-4 w-4" />
                                List
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                        <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-gray-100 bg-white px-5 py-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <Search className="mr-4 h-5 w-5 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search by destination, client, or reference..."
                                className="h-12 flex-1 border-none bg-transparent text-sm font-medium text-secondary placeholder:text-text-muted/50 focus:ring-0 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex min-w-[200px] items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <Filter className="h-4 w-4 shrink-0 text-primary" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setActiveDrill(null); }}
                                    className="flex-1 cursor-pointer border-none bg-transparent text-[10px] font-black uppercase tracking-widest text-secondary focus:ring-0 dark:text-white"
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex min-w-[200px] items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <ArrowDownUp className="h-4 w-4 shrink-0 text-primary" />
                                <select
                                    value={sortKey}
                                    onChange={(e) => setSortKey(e.target.value as TripSortKey)}
                                    className="flex-1 cursor-pointer border-none bg-transparent text-[10px] font-black uppercase tracking-widest text-secondary focus:ring-0 dark:text-white"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {QUICK_FILTER_OPTIONS.map((opt) => {
                            const isActive = quickFilters.has(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => { toggleQuickFilter(opt.value); setActiveDrill(null); }}
                                    className={cn(
                                        "rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                        isActive
                                            ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                                            : "border-gray-200 bg-white text-text-muted hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-900"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                        {quickFilters.size > 0 ? (
                            <button
                                onClick={() => { setQuickFilters(new Set()); setActiveDrill(null); }}
                                className="rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted transition-colors hover:text-rose-500"
                            >
                                Clear filters
                            </button>
                        ) : null}
                    </div>
                </div>
            </GlassCard>

            {/* Departing Soon */}
            <div ref={departingSoonRef}>
                {!loading && <DepartingSoonSection trips={trips} />}
            </div>

            {/* Trip List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    <GlassListSkeleton items={6} />
                </div>
            ) : processedTrips.length === 0 ? (
                <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800 bg-gray-50/30">
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-slate-700 shadow-2xl shadow-gray-200/50">
                            <Plane className="w-10 h-10 text-gray-200 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-serif text-secondary dark:text-white tracking-tight">
                            {quickFilters.size > 0 || activeDrill ? "No Matching Trips" : "No Trips Yet"}
                        </h2>
                        <p className="text-text-muted mt-4 max-w-sm mx-auto font-medium">
                            {quickFilters.size > 0 || activeDrill
                                ? "No trips match the active filters. Try adjusting your criteria."
                                : "No trips found. Create your first trip to get started."
                            }
                        </p>
                        {quickFilters.size > 0 || activeDrill ? (
                            <button
                                onClick={clearDrill}
                                className="mt-8 text-sm font-bold text-primary hover:underline"
                            >
                                Clear all filters
                            </button>
                        ) : (
                            <GlassButton
                                variant="primary"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-10 h-12 rounded-xl"
                            >
                                Get Started
                            </GlassButton>
                        )}
                    </div>
                </GlassCard>
            ) : viewMode === "list" ? (
                <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm" data-tour="trip-list">
                    <div className="grid grid-cols-1">
                        {processedTrips.map((trip, idx) => (
                            <div key={trip.id} {...(idx === 0 ? { 'data-tour': 'trip-row-first' } : {})}>
                                <TripListRow
                                    trip={trip}
                                    onDelete={requestDeleteTrip}
                                    deleting={deletingTripId === trip.id}
                                />
                            </div>
                        ))}
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                    {processedTrips.map((trip) => (
                        <TripGridCard
                            key={trip.id}
                            trip={trip}
                            onDelete={requestDeleteTrip}
                            deleting={deletingTripId === trip.id}
                        />
                    ))}
                </div>
            )}

            <CreateTripModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => {
                    void fetchTrips();
                }}
            />

            <Dialog open={Boolean(tripPendingDelete)} onOpenChange={(open) => { if (!open && !deletingTripId) setTripPendingDelete(null); }}>
                <DialogContent className="max-w-md overflow-hidden border border-rose-200/60 bg-white/95 p-0 shadow-[0_30px_80px_-40px_rgba(244,63,94,0.45)] backdrop-blur-xl dark:border-rose-900/40 dark:bg-slate-950/95">
                    <div className="bg-gradient-to-br from-rose-500/10 via-white to-orange-500/10 px-6 py-6 dark:from-rose-500/15 dark:via-slate-950 dark:to-orange-500/10">
                        <DialogHeader className="space-y-3 text-left">
                            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                                <X className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-2xl font-semibold tracking-tight text-secondary dark:text-white">
                                Delete Trip
                            </DialogTitle>
                            <DialogDescription className="max-w-sm text-sm leading-6 text-text-muted dark:text-slate-300">
                                This will permanently remove the trip, its operations context, and linked trip-side records that depend on it.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-text-muted">Trip</div>
                            <div className="mt-2 text-lg font-semibold text-secondary dark:text-white">
                                {tripPendingDelete?.itineraries?.trip_title || tripPendingDelete?.destination || "Untitled trip"}
                            </div>
                            <div className="mt-1 text-sm text-text-muted dark:text-slate-400">
                                {tripPendingDelete?.profiles?.full_name || "Walk-in client"}
                                {tripPendingDelete?.start_date ? ` · ${new Date(tripPendingDelete.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                            </div>
                        </div>

                        <p className="text-sm text-text-muted dark:text-slate-400">
                            This action cannot be undone.
                        </p>
                    </div>

                    <DialogFooter className="border-t border-slate-200/70 px-6 py-4 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setTripPendingDelete(null)}
                            disabled={Boolean(deletingTripId)}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-secondary transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteTrip}
                            disabled={Boolean(deletingTripId)}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-500 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {deletingTripId ? "Deleting..." : "Delete trip"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
