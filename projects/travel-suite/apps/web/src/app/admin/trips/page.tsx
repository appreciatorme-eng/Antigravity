/**
 * Trip Manager
 * 
 * High-performance interface for managing trips,
 * coordinating logistics, and managing trip logistics.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
    Calendar,
    MapPin,
    User,
    ChevronRight,
    Search,
    Filter,
    Plus,
    Clock,
    CheckCircle2,
    DraftingCompass,
    AlertCircle,
    ArrowUpRight,
    Briefcase,
    BadgeCheck,
    Globe,
    Plane,
    TrendingUp,
    MoreHorizontal,
    LayoutGrid,
    List as ListIcon
} from "lucide-react";
import CreateTripModal from "@/components/CreateTripModal";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassSelect } from "@/components/glass/GlassInput";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassListSkeleton } from "@/components/glass/GlassSkeleton";
import { cn } from "@/lib/utils";

interface Trip {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    destination: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
    } | null;
    itineraries: {
        trip_title: string;
        duration_days: number;
        destination?: string | null;
    } | null;
}

const STATUS_OPTIONS = [
    { value: "all", label: "All Trips" },
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

export default function AdminTripsPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const supabase = createClient();

    const fetchTrips = useCallback(async () => {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`/api/admin/trips?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchQuery)}`, {
            headers: {
                "Authorization": `Bearer ${session?.access_token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Critical Deployment Error:", error);
            setLoading(false);
            return;
        }

        const payload = await response.json();
        setTrips(payload.trips || []);
        setLoading(false);
    }, [supabase, statusFilter, searchQuery]);

    useEffect(() => {
        void fetchTrips();
    }, [fetchTrips]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "TBD";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case "confirmed":
                return {
                    color: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
                    icon: BadgeCheck,
                    label: "Confirmed"
                };
            case "pending":
                return {
                    color: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
                    icon: Clock,
                    label: "Pending"
                };
            case "draft":
                return {
                    color: "bg-gray-50 text-gray-500 border-gray-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800",
                    icon: DraftingCompass,
                    label: "Draft"
                };
            case "completed":
                return {
                    color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
                    icon: CheckCircle2,
                    label: "Completed"
                };
            case "cancelled":
                return {
                    color: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
                    icon: AlertCircle,
                    label: "Cancelled"
                };
            default:
                return {
                    color: "bg-slate-50 text-slate-500 border-slate-100",
                    icon: Briefcase,
                    label: "Standard Operation"
                };
        }
    };

    const stats = [
        {
            label: "Total Trips",
            value: trips.length,
            icon: Globe,
            color: "text-blue-600",
            bg: "bg-blue-100/50",
            trend: "+2 (24h)"
        },
        {
            label: "Active Trips",
            value: trips.filter((t) => ["confirmed", "in_progress"].includes(t.status || "")).length,
            icon: Plane,
            color: "text-emerald-600",
            bg: "bg-emerald-100/50",
            trend: "Optimal"
        },
        {
            label: "Pending Verification",
            value: trips.filter((t) => t.status === "pending").length,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-100/50",
            trend: "Requires Check"
        },
        {
            label: "Conversion Yield",
            value: "94.2%",
            icon: TrendingUp,
            color: "text-violet-600",
            bg: "bg-violet-100/50",
            trend: "+3.1%"
        },
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Trip Manager
                        </div>
                    </div>
                    <h1 className="text-5xl font-serif text-secondary dark:text-white tracking-tight leading-none">
                        Expeditions
                    </h1>
                    <p className="text-text-muted text-lg font-medium max-w-2xl">
                        End-to-end oversight of global client journeys and travel bookings.
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <GlassCard key={stat.label} padding="lg" className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                <p className="text-4xl font-black text-secondary dark:text-white tracking-tighter tabular-nums">
                                    {loading ? "---" : stat.value}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-tight", stat.color)}>{stat.trend}</span>
                                    <span className="text-[10px] text-text-muted font-medium uppercase opacity-50">Correction</span>
                                </div>
                            </div>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Command Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center">
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

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-5 h-14 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm min-w-[240px]">
                        <Filter className="w-4 h-4 text-primary" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-secondary dark:text-white flex-1 cursor-pointer"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2.5 rounded-lg transition-all",
                                viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-text-muted"
                            )}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2.5 rounded-lg transition-all",
                                viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-text-muted"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Trip List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    <GlassListSkeleton items={6} />
                </div>
            ) : trips.length === 0 ? (
                <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800 bg-gray-50/30">
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-slate-700 shadow-2xl shadow-gray-200/50">
                            <Plane className="w-10 h-10 text-gray-200 animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-serif text-secondary dark:text-white tracking-tight">No Trips Yet</h3>
                        <p className="text-text-muted mt-4 max-w-sm mx-auto font-medium">
                            No trips found. Create your first trip to get started.
                        </p>
                        <GlassButton
                            variant="primary"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-10 h-12 rounded-xl"
                        >
                            Get Started
                        </GlassButton>
                    </div>
                </GlassCard>
            ) : viewMode === 'list' ? (
                <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1">
                        {trips.map((trip) => {
                            const styles = getStatusStyles(trip.status || "");
                            const StatusIcon = styles.icon;

                            return (
                                <Link
                                    key={trip.id}
                                    href={`/admin/trips/${trip.id}`}
                                    className="group flex items-center justify-between px-8 py-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 border-b border-gray-50 dark:border-slate-800 last:border-none relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-8 relative z-10 w-full max-w-3xl">
                                        <div className="w-16 h-16 shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/5">
                                            <MapPin className="h-8 w-8 text-primary group-hover:rotate-12 transition-transform" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h3 className="text-xl font-bold text-secondary dark:text-white truncate tracking-tight">
                                                    {trip.itineraries?.trip_title || trip.destination || "Untitled Trip"}
                                                </h3>
                                                <GlassBadge variant="secondary" className="text-[8px] font-black uppercase tracking-widest h-5 px-1.5 border-gray-100 opacity-50">
                                                    #{trip.id.slice(0, 8)}
                                                </GlassBadge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                                                <div className="flex items-center gap-2 text-text-muted">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                                        <User className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{trip.profiles?.full_name || "Guest"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-text-muted">
                                                    <Calendar className="h-4 w-4" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{formatDate(trip.start_date || "")}</span>
                                                </div>
                                                {trip.itineraries?.duration_days && (
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <Clock className="h-4 w-4" />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">{trip.itineraries.duration_days} Days</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className={cn(
                                            "flex items-center gap-2 px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                                            styles.color
                                        )}>
                                            <StatusIcon className="w-4 h-4" />
                                            <span>{styles.label}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-all group-hover:bg-secondary group-hover:text-white">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hover interaction strip */}
                                    <div className="absolute left-0 top-0 w-1.5 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                                </Link>
                            );
                        })}
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map((trip) => {
                        const styles = getStatusStyles(trip.status || "");
                        return (
                            <Link key={trip.id} href={`/admin/trips/${trip.id}`} className="group">
                                <GlassCard padding="lg" className="h-full flex flex-col border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group-hover:-translate-y-2">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <MapPin className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest",
                                            styles.color
                                        )}>
                                            {styles.label}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-secondary dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                                            {trip.itineraries?.trip_title || trip.destination || "Untitled Trip"}
                                        </h3>
                                        <div className="space-y-3 mt-6">
                                            <div className="flex items-center gap-3 text-text-muted">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(trip.start_date || "")}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-text-muted">
                                                <User className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest truncate">{trip.profiles?.full_name || "Guest"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-50">Ref</span>
                                            <span className="text-[9px] font-black text-secondary dark:text-white uppercase tracking-widest">#{trip.id.slice(0, 8)}</span>
                                        </div>
                                        <div className="text-primary group-hover:translate-x-1 transition-transform">
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </GlassCard>
                            </Link>
                        );
                    })}
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
