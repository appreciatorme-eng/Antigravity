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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Client {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string | null;
    preferred_destination?: string | null;
    travelers_count?: number | null;
    budget_min?: number | null;
    budget_max?: number | null;
    travel_style?: string | null;
    interests?: string[] | null;
    home_airport?: string | null;
    notes?: string | null;
    lead_status?: string | null;
    lifecycle_stage?: string | null;
    marketing_opt_in?: boolean | null;
    referral_source?: string | null;
    source_channel?: string | null;
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
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        preferredDestination: "",
        travelersCount: "",
        budgetMin: "",
        budgetMax: "",
        travelStyle: "",
        interests: "",
        homeAirport: "",
        notes: "",
        leadStatus: "new",
        lifecycleStage: "lead",
        marketingOptIn: false,
        referralSource: "",
        sourceChannel: "",
    });
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            if (useMockAdmin) {
                setClients(mockClients);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }
            const response = await fetch("/api/admin/clients", { headers });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to fetch clients");
            }

            const payload = await response.json();
            setClients(payload.clients || []);
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

    const resetForm = () => {
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            preferredDestination: "",
            travelersCount: "",
            budgetMin: "",
            budgetMax: "",
            travelStyle: "",
            interests: "",
            homeAirport: "",
            notes: "",
            leadStatus: "new",
            lifecycleStage: "lead",
            marketingOptIn: false,
            referralSource: "",
            sourceChannel: "",
        });
        setFormError(null);
    };

    const handleCreateClient = async () => {
        if (!formData.full_name.trim() || !formData.email.trim()) {
            setFormError("Name and email are required.");
            return;
        }

        setSaving(true);
        setFormError(null);

        try {
            if (useMockAdmin) {
                const newClient: Client = {
                    id: `mock-client-${Date.now()}`,
                    full_name: formData.full_name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim() || null,
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    preferred_destination: formData.preferredDestination || null,
                    travelers_count: formData.travelersCount ? Number(formData.travelersCount) : null,
                    budget_min: formData.budgetMin ? Number(formData.budgetMin) : null,
                    budget_max: formData.budgetMax ? Number(formData.budgetMax) : null,
                    travel_style: formData.travelStyle || null,
                    interests: formData.interests
                        ? formData.interests.split(",").map((item) => item.trim()).filter(Boolean)
                        : null,
                    home_airport: formData.homeAirport || null,
                    notes: formData.notes || null,
                    lead_status: formData.leadStatus || "new",
                    lifecycle_stage: formData.lifecycleStage || "lead",
                    marketing_opt_in: formData.marketingOptIn,
                    referral_source: formData.referralSource || null,
                    source_channel: formData.sourceChannel || null,
                    trips_count: 0,
                };
                setClients((prev) => [newClient, ...prev]);
                setModalOpen(false);
                resetForm();
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/clients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create client");
            }

            await fetchClients();
            setModalOpen(false);
            resetForm();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to create client");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClient = async (clientId: string) => {
        if (!confirm("Delete this client? This will remove their user account.")) {
            return;
        }

        try {
            if (useMockAdmin) {
                setClients((prev) => prev.filter((client) => client.id !== clientId));
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/admin/clients?id=${clientId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete client");
            }

            setClients((prev) => prev.filter((client) => client.id !== clientId));
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete client");
        }
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
                    <Dialog open={modalOpen} onOpenChange={(open) => {
                        setModalOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all shadow-sm font-medium">
                                <Plus className="w-4 h-4" />
                                Add Client
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px]">
                            <DialogHeader>
                                <DialogTitle>Add Client</DialogTitle>
                                <DialogDescription>
                                    Create a new client profile for trip planning and notifications.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                                        placeholder="Ava Chen"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                        placeholder="ava.chen@example.com"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Phone (optional)</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+1 415 555 0192"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Preferred Destination (optional)</label>
                                    <Input
                                        value={formData.preferredDestination}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, preferredDestination: e.target.value }))}
                                        placeholder="Tokyo, Japan"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Travelers (optional)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.travelersCount}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, travelersCount: e.target.value }))}
                                        placeholder="2"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Budget Min (optional)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.budgetMin}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, budgetMin: e.target.value }))}
                                            placeholder="1500"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Budget Max (optional)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.budgetMax}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: e.target.value }))}
                                            placeholder="3500"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Travel Style (optional)</label>
                                    <Input
                                        value={formData.travelStyle}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, travelStyle: e.target.value }))}
                                        placeholder="Luxury, adventure, family..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Interests (optional)</label>
                                    <Input
                                        value={formData.interests}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, interests: e.target.value }))}
                                        placeholder="Food, culture, hiking (comma separated)"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Home Airport (optional)</label>
                                    <Input
                                        value={formData.homeAirport}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, homeAirport: e.target.value }))}
                                        placeholder="SFO"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Notes (optional)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Allergies, accessibility needs, loyalty numbers..."
                                        className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Lead Status</label>
                                        <select
                                            value={formData.leadStatus}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, leadStatus: e.target.value }))}
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Lifecycle Stage</label>
                                        <select
                                            value={formData.lifecycleStage}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, lifecycleStage: e.target.value }))}
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                        >
                                            <option value="lead">Lead</option>
                                            <option value="prospect">Prospect</option>
                                            <option value="active">Active</option>
                                            <option value="past">Past</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Referral Source (optional)</label>
                                    <Input
                                        value={formData.referralSource}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, referralSource: e.target.value }))}
                                        placeholder="Instagram, Partner, Word of mouth"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Acquisition Channel (optional)</label>
                                    <Input
                                        value={formData.sourceChannel}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, sourceChannel: e.target.value }))}
                                        placeholder="Organic, Paid ads, Referral"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.marketingOptIn}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, marketingOptIn: e.target.checked }))}
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    Marketing opt-in
                                </label>
                                {formError && (
                                    <p className="text-sm text-rose-600">{formError}</p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleCreateClient}
                                    disabled={saving}
                                >
                                    {saving ? "Creating..." : "Create Client"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                                {(client.preferred_destination || client.budget_min || client.budget_max || client.travelers_count || client.travel_style) && (
                                    <div className="text-xs text-slate-500 space-y-1">
                                        {client.preferred_destination && (
                                            <div>Destination: {client.preferred_destination}</div>
                                        )}
                                        {(client.budget_min || client.budget_max) && (
                                            <div>
                                                Budget: {client.budget_min ?? "—"} to {client.budget_max ?? "—"}
                                            </div>
                                        )}
                                        {client.travelers_count && (
                                            <div>Travelers: {client.travelers_count}</div>
                                        )}
                                        {client.travel_style && (
                                            <div>Style: {client.travel_style}</div>
                                        )}
                                    </div>
                                )}
                                {(client.interests?.length || client.home_airport || client.lead_status || client.lifecycle_stage) && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {client.lead_status && (
                                            <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-slate-100 text-slate-600">
                                                {client.lead_status}
                                            </span>
                                        )}
                                        {client.lifecycle_stage && (
                                            <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary">
                                                {client.lifecycle_stage}
                                            </span>
                                        )}
                                        {client.home_airport && (
                                            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700">
                                                {client.home_airport}
                                            </span>
                                        )}
                                        {(client.interests || []).slice(0, 3).map((interest) => (
                                            <span
                                                key={`${client.id}-${interest}`}
                                                className="px-2 py-1 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                )}
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
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/clients/${client.id}`}
                                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-3 py-2 rounded-full"
                                    >
                                        View Profile
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-2 rounded-full"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
