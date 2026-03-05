// Directory — searchable paginated directory of all users across orgs.

"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import DrillDownTable from "@/components/god-mode/DrillDownTable";
import SlideOutPanel from "@/components/god-mode/SlideOutPanel";
import type { TableColumn } from "@/components/god-mode/DrillDownTable";

interface DirectoryUser {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    avatar_url: string | null;
    org_id: string | null;
    org_name: string | null;
    org_slug: string | null;
    org_tier: string | null;
    created_at: string | null;
}

interface UserDetail {
    profile: {
        id: string; full_name: string | null; email: string | null; phone: string | null;
        role: string | null; avatar_url: string | null; created_at: string | null;
    };
    organization: {
        id: string; name: string; slug: string; tier: string; created_at: string;
    } | null;
    activity: { trips: number; proposals: number };
    support_tickets: { id: string; title: string; status: string; priority: string; created_at: string }[];
}

interface DirectoryResponse {
    users: DirectoryUser[];
    total: number;
    page: number;
    pages: number;
}

const TIER_BADGE: Record<string, string> = {
    free: "bg-gray-700 text-gray-300",
    pro: "bg-blue-900/60 text-blue-300",
    enterprise: "bg-amber-900/60 text-amber-300",
};

const ROLE_BADGE: Record<string, string> = {
    super_admin: "bg-red-900/60 text-red-300",
    admin: "bg-emerald-900/60 text-emerald-300",
    client: "bg-blue-900/60 text-blue-300",
    driver: "bg-purple-900/60 text-purple-300",
};

const COLUMNS: TableColumn<DirectoryUser>[] = [
    {
        key: "full_name",
        label: "Name",
        sortable: true,
        render: (v) => <span className="font-medium text-white">{v ?? "—"}</span>,
    },
    { key: "email", label: "Email", render: (v) => <span className="text-gray-300 text-sm">{v ?? "—"}</span> },
    { key: "phone", label: "Phone", render: (v) => <span className="text-gray-400 text-sm">{v ?? "—"}</span> },
    {
        key: "role",
        label: "Role",
        sortable: true,
        render: (v) => (
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${ROLE_BADGE[v as string] ?? "bg-gray-700 text-gray-300"}`}>
                {v ?? "—"}
            </span>
        ),
    },
    { key: "org_name", label: "Org", render: (v) => <span className="text-gray-300">{v ?? "—"}</span> },
    {
        key: "org_tier",
        label: "Tier",
        sortable: true,
        render: (v) => (
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${TIER_BADGE[v as string] ?? "bg-gray-700 text-gray-300"}`}>
                {v ?? "free"}
            </span>
        ),
    },
    {
        key: "created_at",
        label: "Joined",
        sortable: true,
        render: (v) => (
            <span className="text-gray-400 text-sm">
                {v ? new Date(v as string).toLocaleDateString() : "—"}
            </span>
        ),
    },
];

export default function DirectoryPage() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [role, setRole] = useState("all");
    const [tier, setTier] = useState("all");
    const [page, setPage] = useState(0);
    const [data, setData] = useState<DirectoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: debouncedSearch,
                role,
                tier,
                page: String(page),
                limit: "50",
            });
            const res = await fetch(`/api/superadmin/users/directory?${params}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, role, tier, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function openUserDetail(user: DirectoryUser) {
        setPanelOpen(true);
        setDetailLoading(true);
        setSelectedUser(null);
        try {
            const res = await fetch(`/api/superadmin/users/${user.id}`);
            if (res.ok) setSelectedUser(await res.json());
        } finally {
            setDetailLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">All Contacts</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {data ? `${data.total.toLocaleString()} users across all organizations` : "Loading…"}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                               hover:text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone…"
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700
                                   text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    />
                </div>
                <select
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setPage(0); }}
                    className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300
                               focus:outline-none focus:border-amber-500/50"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                    <option value="driver">Driver</option>
                    <option value="super_admin">Super Admin</option>
                </select>
                <select
                    value={tier}
                    onChange={(e) => { setTier(e.target.value); setPage(0); }}
                    className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300
                               focus:outline-none focus:border-amber-500/50"
                >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <DrillDownTable<DirectoryUser>
                    columns={COLUMNS}
                    data={data?.users ?? []}
                    onRowClick={openUserDetail}
                    emptyMessage="No users found"
                />
                {data && data.pages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                        <span className="text-sm text-gray-400">
                            Page {page + 1} of {data.pages} ({data.total.toLocaleString()} total)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 rounded bg-gray-800 text-sm text-gray-300
                                           hover:bg-gray-700 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page + 1 >= (data.pages)}
                                className="px-3 py-1 rounded bg-gray-800 text-sm text-gray-300
                                           hover:bg-gray-700 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail panel */}
            <SlideOutPanel
                open={panelOpen}
                onClose={() => { setPanelOpen(false); setSelectedUser(null); }}
                title="User Profile"
            >
                {detailLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-10 bg-gray-800 animate-pulse rounded" />
                        ))}
                    </div>
                ) : selectedUser ? (
                    <div className="space-y-6">
                        {/* Profile */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Name</span>
                                    <span className="text-white font-medium">{selectedUser.profile.full_name ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Email</span>
                                    <span className="text-gray-300">{selectedUser.profile.email ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Phone</span>
                                    <span className="text-gray-300">{selectedUser.profile.phone ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Role</span>
                                    <span className={`text-xs font-semibold uppercase ${ROLE_BADGE[selectedUser.profile.role ?? ""] ?? ""}`}>
                                        {selectedUser.profile.role ?? "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Joined</span>
                                    <span className="text-gray-300">
                                        {selectedUser.profile.created_at
                                            ? new Date(selectedUser.profile.created_at).toLocaleDateString()
                                            : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Org */}
                        {selectedUser.organization && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Name</span>
                                        <span className="text-white font-medium">{selectedUser.organization.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Slug</span>
                                        <span className="text-gray-300">{selectedUser.organization.slug}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Tier</span>
                                        <span className={`text-xs font-semibold uppercase ${TIER_BADGE[selectedUser.organization.tier] ?? ""}`}>
                                            {selectedUser.organization.tier}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Activity */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-amber-400">{selectedUser.activity.trips}</p>
                                    <p className="text-xs text-gray-400">Trips</p>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-blue-400">{selectedUser.activity.proposals}</p>
                                    <p className="text-xs text-gray-400">Proposals</p>
                                </div>
                            </div>
                        </div>

                        {/* Support tickets */}
                        {selectedUser.support_tickets.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Support Tickets ({selectedUser.support_tickets.length})
                                </h3>
                                <div className="space-y-2">
                                    {selectedUser.support_tickets.map((t) => (
                                        <div key={t.id} className="bg-gray-800 rounded p-2 text-sm">
                                            <p className="text-white font-medium truncate">{t.title}</p>
                                            <p className="text-gray-400 text-xs">{t.status} · {t.priority}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </SlideOutPanel>
        </div>
    );
}
