"use client";

import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTrips, useBackfillTripProposals } from "@/lib/queries/trips";
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
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [sortKey, setSortKey] = useState<TripSortKey>("departure");
    const [quickFilters, setQuickFilters] = useState<Set<QuickFilter>>(new Set());
    const [activeDrill, setActiveDrill] = useState<TripKPIDrillAction | null>(null);
    const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

    const departingSoonRef = useRef<HTMLDivElement>(null);

    const { data: rawTrips, isPending: loading, refetch: fetchTrips } = useTrips(statusFilter, searchQuery);
    const backfillMutation = useBackfillTripProposals();
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

    const handleDeleteTrip = useCallback(async (tripId: string) => {
        if (deletingTripId) return;
        if (!confirm("Delete this trip? All trip data will be permanently removed.")) return;

        setDeletingTripId(tripId);
        try {
            const response = await authedFetch(`/api/trips/${tripId}`, { method: "DELETE" });
            if (!response.ok) {
                throw new Error("Failed to delete trip");
            }
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
    }, [deletingTripId, fetchTrips, toast]);

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
                        variant="outline"
                        onClick={() => {
                            backfillMutation.mutate(undefined, {
                                onSuccess: (payload) => {
                                    const data = payload as { created?: number; skipped?: number; failed?: number };
                                    void fetchTrips();
                                    toast({
                                        title: "Proposal backfill finished",
                                        description: `${data.created ?? 0} linked, ${data.skipped ?? 0} skipped, ${data.failed ?? 0} failed.`,
                                        variant: data.failed ? "warning" : "success",
                                      });
                                },
                                onError: (error) => {
                                    toast({
                                        title: "Backfill failed",
                                        description: error instanceof Error ? error.message : "Unable to backfill linked proposals.",
                                        variant: "error",
                                    });
                                },
                            });
                        }}
                        className="h-11 md:h-14 px-5 md:px-8 rounded-xl md:rounded-2xl"
                        disabled={backfillMutation.isPending}
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                            {backfillMutation.isPending ? "Linking..." : "Backfill Proposals"}
                        </span>
                    </GlassButton>

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

            {/* Departing Soon */}
            <div ref={departingSoonRef}>
                {!loading && <DepartingSoonSection trips={trips} />}
            </div>

            {/* Command Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center" data-tour="trip-search">
                <GlassCard padding="none" className="flex-1 w-full overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center px-6 py-1">
                        <Search className="w-5 h-5 text-text-muted mr-4" />
                        <input
                            type="text"
                            placeholder="Search by destination, client, or reference..."
                            className="flex-1 bg-transparent border-none focus:ring-0 text-secondary dark:text-white placeholder:text-text-muted/50 text-sm h-12 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </GlassCard>

                <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto flex-wrap">
                    <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-slate-900 px-3 md:px-5 h-11 md:h-14 rounded-xl md:rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex-1 md:flex-initial md:min-w-[200px]">
                        <Filter className="w-4 h-4 text-primary shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setActiveDrill(null); }}
                            className="bg-transparent border-none focus:ring-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-slate-900 px-3 md:px-5 h-11 md:h-14 rounded-xl md:rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex-1 md:flex-initial md:min-w-[200px]">
                        <ArrowDownUp className="w-4 h-4 text-primary shrink-0" />
                        <select
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as TripSortKey)}
                            className="bg-transparent border-none focus:ring-0 text-[10px] md:text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-2.5 rounded-lg transition-all",
                                viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-text-muted"
                            )}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-2.5 rounded-lg transition-all",
                                viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-text-muted"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
                {QUICK_FILTER_OPTIONS.map((opt) => {
                    const isActive = quickFilters.has(opt.value);
                    return (
                        <button
                            key={opt.value}
                            onClick={() => { toggleQuickFilter(opt.value); setActiveDrill(null); }}
                            className={cn(
                                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                                isActive
                                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                    : "bg-white dark:bg-slate-900 text-text-muted border-gray-200 dark:border-slate-700 hover:border-primary/50 hover:text-primary"
                            )}
                        >
                            {opt.label}
                        </button>
                    );
                })}
                {quickFilters.size > 0 && (
                    <button
                        onClick={() => { setQuickFilters(new Set()); setActiveDrill(null); }}
                        className="px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-rose-500 transition-colors"
                    >
                        Clear filters
                    </button>
                )}
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
                                    onDelete={handleDeleteTrip}
                                    deleting={deletingTripId === trip.id}
                                />
                            </div>
                        ))}
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {processedTrips.map((trip) => (
                        <TripGridCard
                            key={trip.id}
                            trip={trip}
                            onDelete={handleDeleteTrip}
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
        </div>
    );
}
