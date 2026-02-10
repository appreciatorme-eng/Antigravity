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

interface TripRecord {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
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

const mockTrips: Trip[] = [
    {
        id: "mock-trip-001",
        status: "confirmed",
        start_date: "2026-03-12",
        end_date: "2026-03-17",
        destination: "Kyoto, Japan",
        created_at: "2026-02-01T10:00:00Z",
        profiles: {
            full_name: "Ava Chen",
            email: "ava.chen@example.com",
        },
        itineraries: {
            trip_title: "Kyoto Blossom Trail",
            duration_days: 5,
            destination: "Kyoto, Japan",
        },
    },
    {
        id: "mock-trip-002",
        status: "in_progress",
        start_date: "2026-02-20",
        end_date: "2026-02-27",
        destination: "Reykjavik, Iceland",
        created_at: "2026-01-15T14:30:00Z",
        profiles: {
            full_name: "Liam Walker",
            email: "liam.walker@example.com",
        },
        itineraries: {
            trip_title: "Northern Lights Escape",
            duration_days: 7,
            destination: "Reykjavik, Iceland",
        },
    },
];

export default function AdminTripsPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const supabase = createClient();
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";

    const fetchTrips = useCallback(async () => {
        setLoading(true); // Set loading to true when fetching starts
        if (useMockAdmin) {
            setTrips(mockTrips);
            setLoading(false);
            return;
        }

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
    }, [supabase, statusFilter, searchQuery, useMockAdmin]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
                return "bg-green-100 text-green-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "draft":
                return "bg-gray-100 text-gray-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
                    <p className="text-gray-600 mt-1">
                        Manage client trips and assign drivers
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Trip
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by destination, client, or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">Confirmed</p>
                    <p className="text-2xl font-bold text-green-600">
                        {trips.filter((t) => t.status === "confirmed").length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {trips.filter((t) => t.status === "pending").length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-primary">
                        {
                            trips.filter((t) => {
                                const tripDate = new Date(t.start_date);
                                const now = new Date();
                                return (
                                    tripDate.getMonth() === now.getMonth() &&
                                    tripDate.getFullYear() === now.getFullYear()
                                );
                            }).length
                        }
                    </p>
                </div>
            </div>

            {/* Trips List */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {trips.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No trips found</h3>
                        <p className="text-gray-500 mt-1 mb-6">Get started by creating a new trip for your clients.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Trip
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {trips.map((trip) => (
                            <Link
                                key={trip.id}
                                href={`/admin/trips/${trip.id}`}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <MapPin className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {trip.itineraries?.trip_title || trip.destination || "Untitled Trip"}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {trip.profiles?.full_name || "Unknown"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(trip.start_date)}
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
                                            trip.status
                                        )}`}
                                    >
                                        {trip.status}
                                    </span>
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

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
