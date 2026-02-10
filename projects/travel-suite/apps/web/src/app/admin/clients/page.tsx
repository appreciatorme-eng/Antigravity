"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    Search,
    Mail,
    Phone,
    Calendar,
    Plus,
    MoreVertical,
    ExternalLink,
    RefreshCcw
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Client {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string | null;
    trips_count?: number;
}

const mockClients: Client[] = [
    {
        id: "mock-client-1",
        full_name: "Ava Chen",
        email: "ava.chen@example.com",
        phone: "+1 (415) 555-1122",
        avatar_url: null,
        created_at: "2024-11-08T12:00:00Z",
        trips_count: 3,
    },
    {
        id: "mock-client-2",
        full_name: "Liam Walker",
        email: "liam.walker@example.com",
        phone: "+44 20 7946 0901",
        avatar_url: null,
        created_at: "2025-02-19T09:30:00Z",
        trips_count: 2,
    },
    {
        id: "mock-client-3",
        full_name: "Sofia Ramirez",
        email: "sofia.ramirez@example.com",
        phone: "+34 91 123 4567",
        avatar_url: null,
        created_at: "2025-06-04T15:15:00Z",
        trips_count: 1,
    },
];

export default function ClientsPage() {
    const supabase = createClient();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            if (useMockAdmin) {
                setClients(mockClients);
                return;
            }

            // First get profiles with role 'client'
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, full_name, email, phone, avatar_url, created_at")
                .eq("role", "client")
                .order("created_at", { ascending: false });

            if (profilesError) throw profilesError;

            // Then for each client, get their trip count
            const clientsWithTrips = await Promise.all((profiles || []).map(async (client: Client) => {
                const { count } = await supabase
                    .from("trips")
                    .select("*", { count: 'exact', head: true })
                    .eq("client_id", client.id);

                return {
                    ...client,
                    trips_count: count || 0
                };
            }));

            setClients(clientsWithTrips);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, useMockAdmin]);

    useEffect(() => {
        void fetchClients();
    }, [fetchClients]);

    const filteredClients = clients.filter(client =>
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        Clients
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your tour customers and view their travel history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchClients}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {/* Add Client button - logic would go here */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all shadow-sm font-medium">
                        <Plus className="w-4 h-4" />
                        Add Client
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search clients by name, email or phone..."
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-slate-100 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                <div className="h-3 bg-slate-100 rounded w-full"></div>
                                <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-2xl">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No clients found</h3>
                        <p className="text-slate-500">Try adjusting your search or add a new client.</p>
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <div key={client.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-4">
                                {client.avatar_url ? (
                                    <Image
                                        src={client.avatar_url}
                                        alt={client.full_name || ''}
                                        width={56}
                                        height={56}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-50"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/5">
                                        {client.full_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                                        {client.full_name || 'Anonymous Client'}
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Since {formatDate(client.created_at)}
                                    </p>
                                </div>
                                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100/50">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm truncate" title={client.email || ''}>
                                        {client.email || 'No email provided'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm">
                                        {client.phone || 'No phone provided'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-slate-900 leading-tight">
                                        {client.trips_count}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                        Total Trips
                                    </span>
                                </div>
                                <Link
                                    href={`/admin/clients/${client.id}`}
                                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-3 py-2 rounded-full"
                                >
                                    View Profile
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
