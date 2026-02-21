"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Check, ChevronDown, UserPlus, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Client {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
}

interface ClientAssignmentBlockProps {
    itineraryId: string;
    initialClientId?: string | null;
}

export default function ClientAssignmentBlock({ itineraryId, initialClientId }: ClientAssignmentBlockProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
    const [loading, setLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Quick Create Client State
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientName, setNewClientName] = useState("");
    const [newClientEmail, setNewClientEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load clients when component mounts
        loadClients();

        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function loadClients() {
        setLoading(true);
        try {
            const supabase = createClient();

            // Try admin API first
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }

            let loadedClients: Client[] = [];

            const res = await fetch('/api/admin/clients', { headers });
            if (res.ok) {
                const payload = await res.json();
                loadedClients = (payload?.clients || []).map((c: any) => ({
                    id: c.id,
                    full_name: c.full_name || 'Unknown',
                    email: c.email || '',
                    phone: c.phone || '',
                }));
            } else {
                // Fallback to direct supabase query if not admin
                const { data } = await supabase
                    .from('clients')
                    .select('id, profiles!inner(id, full_name, email)');

                if (data) {
                    loadedClients = data.map((c: any) => ({
                        id: c.id,
                        full_name: c.profiles?.full_name || 'Unknown',
                        email: c.profiles?.email || '',
                        phone: '',
                    }));
                }
            }

            const sorted = loadedClients.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            setClients(sorted);
        } catch (error) {
            console.error("Failed to load clients", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAssignClient(clientId: string | null) {
        setSelectedClientId(clientId);
        setIsOpen(false);

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('itineraries')
                .update({ client_id: clientId })
                .eq('id', itineraryId);

            if (error) {
                console.error("Failed to assign client", error);
                // Optionally show toast error
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleCreateClient(e: React.FormEvent) {
        e.preventDefault();
        if (!newClientName || !newClientEmail) return;

        setIsSubmitting(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

            // We must use the API to create the profile and client records securely
            const resp = await fetch('/api/admin/clients', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    full_name: newClientName,
                    email: newClientEmail,
                    lifecycleStage: 'lead'
                }),
            });

            if (!resp.ok) {
                throw new Error("Failed to create client");
            }

            const payload = await resp.json();
            const newClientId = payload.userId; // API returns userId which is the client id

            if (newClientId) {
                // Reload clients list to include the new one
                await loadClients();
                // Assign new client
                await handleAssignClient(newClientId);
                // Reset form
                setIsCreatingClient(false);
                setNewClientName("");
                setNewClientEmail("");
            }
        } catch (error) {
            console.error("Failed to create new client", error);
            alert("Failed to create client. You may need Administrator permissions.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const selectedClient = clients.find(c => c.id === selectedClientId);

    // Filter logic
    const filteredClients = clients.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
    }).slice(0, 10);

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                className="gap-2 bg-white/80 backdrop-blur-sm shadow-sm border-emerald-100 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 transition-all font-medium"
                onClick={() => setIsOpen(!isOpen)}
            >
                <User className="w-4 h-4" />
                {selectedClient ? selectedClient.full_name : "Assign Client"}
                <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute top-12 left-0 md:right-0 md:left-auto w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                    {isCreatingClient ? (
                        <div className="p-4 bg-emerald-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-emerald-900 text-sm">Create New Client</h4>
                                <button onClick={() => setIsCreatingClient(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateClient} className="space-y-3">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        className="w-full text-sm px-3 py-2 border border-emerald-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={newClientEmail}
                                        onChange={(e) => setNewClientEmail(e.target.value)}
                                        className="w-full text-sm px-3 py-2 border border-emerald-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                                <div className="pt-1 flex gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-xs text-gray-500 hover:bg-white"
                                        onClick={() => setIsCreatingClient(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                        disabled={isSubmitting || !newClientName || !newClientEmail}
                                    >
                                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
                                        Create
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="p-2">
                            <div className="relative mb-2 px-2 pt-2">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 mt-1 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-emerald-200 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                />
                            </div>

                            <div className="max-h-[220px] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-gray-200">
                                {loading && clients.length === 0 ? (
                                    <div className="flex items-center justify-center p-4 text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                ) : filteredClients.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredClients.map(client => (
                                            <button
                                                key={client.id}
                                                onClick={() => handleAssignClient(client.id)}
                                                className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedClientId === client.id ? 'bg-emerald-50 text-emerald-900 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <div className="truncate pr-2">
                                                    <div>{client.full_name}</div>
                                                    <div className="text-xs text-gray-400 font-normal truncate">{client.email}</div>
                                                </div>
                                                {selectedClientId === client.id && (
                                                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 text-sm text-gray-500">
                                        No clients found.
                                    </div>
                                )}
                            </div>

                            <div className="p-2 pt-3 border-t border-gray-100 mt-1">
                                <button
                                    onClick={() => setIsCreatingClient(true)}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-2 rounded-lg transition-colors border border-dashed border-emerald-200"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Create New Client
                                </button>
                                {selectedClientId && (
                                    <button
                                        onClick={() => handleAssignClient(null)}
                                        className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2 py-1"
                                    >
                                        Unassign Client
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
