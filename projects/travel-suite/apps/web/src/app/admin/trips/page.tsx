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
    Plus
} from "lucide-react";
import CreateTripModal from "@/components/CreateTripModal";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassSelect } from "@/components/glass/GlassInput";
import { GlassListSkeleton } from "@/components/glass/GlassSkeleton";

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
    { value: "all", label: "All Status" },
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
            console.error("Error fetching trips:", error);
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
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "draft":
                return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
            case "completed":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case "cancelled":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400";
        }
    };

    const stats = [
        {
            label: "Total Trips",
            value: trips.length,
            color: "text-secondary dark:text-white",
        },
        {
            label: "Confirmed",
            value: trips.filter((t) => t.status === "confirmed").length,
            color: "text-green-600 dark:text-green-400",
        },
        {
            label: "Pending",
            value: trips.filter((t) => t.status === "pending").length,
            color: "text-yellow-600 dark:text-yellow-400",
        },
        {
            label: "This Month",
            value: trips.filter((t) => {
                if (!t.start_date) return false;
                const tripDate = new Date(t.start_date);
                const now = new Date();
                return (
                    tripDate.getMonth() === now.getMonth() &&
                    tripDate.getFullYear() === now.getFullYear()
                );
            }).length,
            color: "text-secondary dark:text-white",
        },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-xs uppercase tracking-widest text-primary font-bold">Trips</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white mt-2">Trips</h1>
                    </div>
                </div>
                <GlassListSkeleton items={5} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Trips</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white mt-2">Trips</h1>
                    <p className="text-text-secondary mt-1">
                        Manage client trips and assign drivers.
                    </p>
                </div>
                <GlassButton
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                    New Trip
                </GlassButton>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <GlassInput
                    icon={Search}
                    type="text"
                    placeholder="Search by destination, client, or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-2 sm:w-64">
                    <Filter className="h-4 w-4 text-text-secondary shrink-0" />
                    <GlassSelect
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={STATUS_OPTIONS}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <GlassCard key={index} padding="lg" rounded="xl">
                        <p className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-2">
                            {stat.label}
                        </p>
                        <p className={`text-2xl font-serif ${stat.color}`}>
                            {stat.value}
                        </p>
                    </GlassCard>
                ))}
            </div>

            {/* Trips List */}
            <GlassCard padding="none" rounded="2xl">
                {trips.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <MapPin className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium text-secondary dark:text-white">No trips found</h3>
                        <p className="text-text-secondary mt-1 mb-6">
                            Get started by creating a new trip for your clients.
                        </p>
                        <GlassButton
                            variant="primary"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Create New Trip
                        </GlassButton>
                    </div>
                ) : (
                    <div className="divide-y divide-white/10">
                        {trips.map((trip) => (
                            <Link
                                key={trip.id}
                                href={`/admin/trips/${trip.id}`}
                                className="flex items-center justify-between p-4 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-secondary dark:text-white">
                                            {trip.itineraries?.trip_title || trip.destination || "Untitled Trip"}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {trip.profiles?.full_name || "Unknown"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(trip.start_date || "")}
                                            </span>
                                            {trip.itineraries?.duration_days && (
                                                <span>
                                                    {trip.itineraries.duration_days} days
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            trip.status || ""
                                        )}`}
                                    >
                                        {trip.status}
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-text-secondary" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </GlassCard>

            <CreateTripModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => {
                    fetchTrips();
                }}
            />
        </div>
    );
}
