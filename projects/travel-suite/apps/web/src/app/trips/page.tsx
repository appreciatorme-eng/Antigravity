"use client";

import { useCallback, useRef, useState, useMemo } from "react";
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
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [sortKey, setSortKey] = useState<TripSortKey>("departure");
    const [quickFilters, setQuickFilters] = useState<Set<QuickFilter>>(new Set());
    const [activeDrill, setActiveDrill] = useState<TripKPIDrillAction | null>(null);

    const departingSoonRef = useRef<HTMLDivElement>(null);

    const { data: rawTrips, isLoading: loading, refetch: fetchTrips } = useTrips(statusFilter, searchQuery);
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

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Trip Manager
                        </div>
                    </div>
                    <h1 className="text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Trips
                    </h1>
                    <p className="text-text-muted text-lg font-medium max-w-2xl">
                        Comprehensive monitoring of client journeys and travel bookings.
                    </p>
                </div>

                <GlassButton
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 group"
                >
                    <Plus className="w-5 h-5 mr-3 transition-transform group-hover:rotate-90" />
                    <span className="text-xs font-black uppercase tracking-widest">Create New Trip</span>
                </GlassButton>
            </div>

            {/* KPI Stats */}
            <TripKPIStats trips={trips} loading={loading} onDrillThrough={handleDrillThrough} />

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
            <div className="flex flex-col lg:flex-row gap-4 items-center">
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

                <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 h-14 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm min-w-[200px]">
                        <Filter className="w-4 h-4 text-primary shrink-0" />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setActiveDrill(null); }}
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 h-14 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm min-w-[200px]">
                        <ArrowDownUp className="w-4 h-4 text-primary shrink-0" />
                        <select
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as TripSortKey)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
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
                        <h3 className="text-3xl font-serif text-secondary dark:text-white tracking-tight">
                            {quickFilters.size > 0 || activeDrill ? "No Matching Trips" : "No Trips Yet"}
                        </h3>
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
                <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1">
                        {processedTrips.map((trip) => (
                            <TripListRow key={trip.id} trip={trip} />
                        ))}
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {processedTrips.map((trip) => (
                        <TripGridCard key={trip.id} trip={trip} />
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
