"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import {
    Calendar,
    MapPin,
    User,
    ChevronRight,
    Search,
    Filter,
} from "lucide-react";

interface Trip {
    id: string;
    status: string;
    start_date: string;
    end_date: string;
    destination: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
    } | null;
    itineraries: {
        trip_title: string;
        duration_days: number;
    } | null;
}

export default function AdminTripsPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const supabase = createClientComponentClient();

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        const { data, error } = await supabase
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                destination,
                created_at,
                profiles!trips_user_id_fkey (
                    full_name,
                    email
                ),
                itineraries (
                    trip_title,
                    duration_days
                )
            `)
            .order("start_date", { ascending: false });

        if (error) {
            console.error("Error fetching trips:", error);
        } else {
            setTrips(data || []);
        }
        setLoading(false);
    };

    const filteredTrips = trips.filter((trip) => {
        const matchesSearch =
            trip.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.itineraries?.trip_title?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || trip.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

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
                {filteredTrips.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500">No trips found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredTrips.map((trip) => (
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
        </div>
    );
}
