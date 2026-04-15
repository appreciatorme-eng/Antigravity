// Directory — searchable paginated directory of all users across orgs.
// Now includes full CRUD: change role, suspend/unsuspend, move org, delete user,
// org tier management, create org, and CSV export.

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, RefreshCw, UserPlus, Building2, Shield, Ban, Trash2, ArrowRightLeft, Loader2, LogIn } from "lucide-react";
import DrillDownTable from "@/components/god-mode/DrillDownTable";
import SlideOutPanel from "@/components/god-mode/SlideOutPanel";
import InlineEditField from "@/components/god-mode/InlineEditField";
import ConfirmDangerModal from "@/components/god-mode/ConfirmDangerModal";
import ExportButton from "@/components/god-mode/ExportButton";
import ActionToast, { useActionToast } from "@/components/god-mode/ActionToast";
import { authedFetch } from "@/lib/api/authed-fetch";
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
    [key: string]: unknown;
}

interface UserDetail {
    profile: {
        id: string; full_name: string | null; email: string | null; phone: string | null;
        role: string | null; avatar_url: string | null; created_at: string | null;
        organization_id: string | null; suspended?: boolean;
    };
    organization: {
        id: string; name: string; slug: string; tier: string; created_at: string;
    } | null;
    activity: { trips: number; proposals: number };
    support_tickets: { id: string; title: string; status: string; priority: string; created_at: string }[];
}

interface OrgOption { id: string; name: string; tier: string }

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
    team_member: "bg-gray-600/60 text-gray-200",
    client: "bg-blue-900/60 text-blue-300",
    driver: "bg-purple-900/60 text-purple-300",
};

const ROLE_OPTIONS = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "team_member", label: "Team Member" },
    { value: "client", label: "Client" },
    { value: "driver", label: "Driver" },
];

const TIER_OPTIONS = [
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
    { value: "enterprise", label: "Enterprise" },
];

const COLUMNS: TableColumn<DirectoryUser>[] = [
    {
        key: "full_name",
        label: "Name",
        sortable: true,
        render: (v) => <span className="font-medium text-white">{String(v ?? "—")}</span>,
    },
    { key: "email", label: "Email", render: (v) => <span className="text-gray-300 text-sm">{String(v ?? "—")}</span> },
    { key: "phone", label: "Phone", render: (v) => <span className="text-gray-400 text-sm">{String(v ?? "—")}</span> },
    {
        key: "role",
        label: "Role",
        sortable: true,
        render: (v) => (
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${ROLE_BADGE[v as string] ?? "bg-gray-700 text-gray-300"}`}>
                {String(v ?? "—")}
            </span>
        ),
    },
    { key: "org_name", label: "Org", render: (v) => <span className="text-gray-300">{String(v ?? "—")}</span> },
    {
        key: "org_tier",
        label: "Tier",
        sortable: true,
        render: (v) => (
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${TIER_BADGE[v as string] ?? "bg-gray-700 text-gray-300"}`}>
                {String(v ?? "free")}
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
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") ?? "");
    const [role, setRole] = useState(searchParams.get("role") ?? "all");
    const [tier, setTier] = useState(searchParams.get("tier") ?? "all");
    const [page, setPage] = useState(Math.max(0, Number(searchParams.get("page") || 0)));
    const [data, setData] = useState<DirectoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [panelOpen, setPanelOpen] = useState(Boolean(searchParams.get("userId")));
    const userId = searchParams.get("userId");

    // Action state
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "user" | "org" } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgTier, setNewOrgTier] = useState("free");
    const [creatingOrg, setCreatingOrg] = useState(false);
    const [orgList, setOrgList] = useState<OrgOption[]>([]);
    const [showMoveOrg, setShowMoveOrg] = useState(false);
    const [targetOrgId, setTargetOrgId] = useState("");
    const [movingOrg, setMovingOrg] = useState(false);
    const [showImpersonateConfirm, setShowImpersonateConfirm] = useState(false);
    const [impersonating, setImpersonating] = useState(false);

    const { toast, showSuccess, showError, dismiss } = useActionToast();

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

    const openUserDetail = useCallback(async (user: Pick<DirectoryUser, "id">) => {
        setPanelOpen(true);
        setDetailLoading(true);
        setSelectedUser(null);
        try {
            const res = await fetch(`/api/superadmin/users/${user.id}`);
            if (res.ok) setSelectedUser(await res.json());
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const refreshUserDetail = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/superadmin/users/${id}`);
            if (res.ok) setSelectedUser(await res.json());
        } catch { /* silent */ }
    }, []);

    // Fetch org list for move-org and create-org features
    const fetchOrgs = useCallback(async () => {
        try {
            const res = await fetch("/api/superadmin/orgs?limit=200");
            if (res.ok) {
                const json = await res.json();
                setOrgList(json.organizations ?? []);
            }
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (search.trim()) params.set("search", search.trim());
        else params.delete("search");
        if (role !== "all") params.set("role", role);
        else params.delete("role");
        if (tier !== "all") params.set("tier", tier);
        else params.delete("tier");
        if (page > 0) params.set("page", String(page));
        else params.delete("page");
        const activeUserId = selectedUser?.profile.id ?? (panelOpen ? userId : null);
        if (activeUserId) params.set("userId", activeUserId);
        else params.delete("userId");

        const next = params.toString();
        if (next !== searchParams.toString()) {
            router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
        }
    }, [page, panelOpen, pathname, role, router, search, searchParams, selectedUser?.profile.id, tier, userId]);

    useEffect(() => {
        if (!userId) return;
        if (selectedUser?.profile.id === userId && panelOpen) return;
        void openUserDetail({ id: userId });
    }, [openUserDetail, panelOpen, selectedUser?.profile.id, userId]);

    // --- MUTATION HANDLERS ---

    async function handleChangeRole(newRole: string) {
        if (!selectedUser) return;
        const res = await authedFetch(`/api/superadmin/users/${selectedUser.profile.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
        });
        if (res.ok) {
            showSuccess(`Role changed to ${newRole}`);
            await refreshUserDetail(selectedUser.profile.id);
            await fetchData();
        } else {
            showError("Failed to change role");
        }
    }

    async function handleImpersonate() {
        if (!selectedUser) return;
        setImpersonating(true);
        try {
            const res = await authedFetch(`/api/superadmin/users/${selectedUser.profile.id}/impersonate`, {
                method: "POST"
            });
            if (res.ok) {
                const data = await res.json();
                if (data.magic_link) {
                    window.location.href = data.magic_link;
                } else {
                    showError("Invalid impersonation response");
                    setShowImpersonateConfirm(false);
                }
            } else {
                const json = await res.json();
                showError(json.error ?? "Failed to initiate impersonation");
                setShowImpersonateConfirm(false);
            }
        } catch {
            showError("Network error attempting to impersonate");
            setShowImpersonateConfirm(false);
        } finally {
            setImpersonating(false);
        }
    }

    async function handleChangeTier(newTier: string) {
        if (!selectedUser?.organization) return;
        const res = await authedFetch(`/api/superadmin/orgs/${selectedUser.organization.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription_tier: newTier }),
        });
        if (res.ok) {
            showSuccess(`Org tier changed to ${newTier}`);
            await refreshUserDetail(selectedUser.profile.id);
            await fetchData();
        } else {
            showError("Failed to change tier");
        }
    }

    async function handleSuspendToggle() {
        if (!selectedUser) return;
        const newSuspended = !selectedUser.profile.suspended;
        const res = await authedFetch(`/api/superadmin/users/${selectedUser.profile.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ suspended: newSuspended }),
        });
        if (res.ok) {
            showSuccess(newSuspended ? "User suspended" : "User unsuspended");
            await refreshUserDetail(selectedUser.profile.id);
            await fetchData();
        } else {
            showError("Failed to update suspension status");
        }
    }

    async function handleDeleteConfirm() {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const url = deleteTarget.type === "user"
                ? `/api/superadmin/users/${deleteTarget.id}`
                : `/api/superadmin/orgs/${deleteTarget.id}`;
            const res = await authedFetch(url, { method: "DELETE" });
            if (res.ok) {
                showSuccess(`${deleteTarget.type === "user" ? "User" : "Organization"} deleted successfully`);
                setPanelOpen(false);
                setSelectedUser(null);
                await fetchData();
            } else {
                showError(`Failed to delete ${deleteTarget.type}`);
            }
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    }

    async function handleCreateOrg() {
        if (!newOrgName.trim()) return;
        setCreatingOrg(true);
        try {
            const res = await authedFetch("/api/superadmin/orgs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newOrgName.trim(), subscription_tier: newOrgTier }),
            });
            if (res.ok) {
                showSuccess(`Organization "${newOrgName.trim()}" created`);
                setShowCreateOrg(false);
                setNewOrgName("");
                setNewOrgTier("free");
                await fetchData();
            } else {
                const json = await res.json();
                showError(json.error ?? "Failed to create organization");
            }
        } finally {
            setCreatingOrg(false);
        }
    }

    async function handleMoveOrg() {
        if (!selectedUser || !targetOrgId) return;
        setMovingOrg(true);
        try {
            const res = await authedFetch(`/api/superadmin/users/${selectedUser.profile.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ organization_id: targetOrgId || null }),
            });
            if (res.ok) {
                showSuccess("User moved to new organization");
                setShowMoveOrg(false);
                setTargetOrgId("");
                await refreshUserDetail(selectedUser.profile.id);
                await fetchData();
            } else {
                showError("Failed to move user");
            }
        } finally {
            setMovingOrg(false);
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
                <div className="flex items-center gap-2">
                    <ExportButton
                        data={(data?.users ?? []) as Record<string, unknown>[]}
                        filename="god-mode-directory"
                        columns={[
                            { key: "full_name", label: "Name" },
                            { key: "email", label: "Email" },
                            { key: "phone", label: "Phone" },
                            { key: "role", label: "Role" },
                            { key: "org_name", label: "Organization" },
                            { key: "org_tier", label: "Tier" },
                            { key: "created_at", label: "Joined" },
                        ]}
                    />
                    <button
                        onClick={() => { setShowCreateOrg(true); fetchOrgs(); }}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2
                                   text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                    >
                        <Building2 className="h-4 w-4" />
                        New Org
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                                   hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Create Org Modal */}
            {showCreateOrg && (
                <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Create Organization
                    </h2>
                    <input
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Organization name…"
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                   text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    />
                    <select
                        value={newOrgTier}
                        onChange={(e) => setNewOrgTier(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                   text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                    >
                        {TIER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleCreateOrg}
                            disabled={creatingOrg || !newOrgName.trim()}
                            className="flex-1 py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm
                                       hover:bg-amber-400 transition-colors disabled:opacity-50"
                        >
                            {creatingOrg ? "Creating…" : "Create Organization"}
                        </button>
                        <button
                            onClick={() => { setShowCreateOrg(false); setNewOrgName(""); }}
                            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

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
                    <option value="team_member">Team Member</option>
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
                onClose={() => { setPanelOpen(false); setSelectedUser(null); setShowMoveOrg(false); }}
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
                        {/* Suspended banner */}
                        {selectedUser.profile.suspended && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2">
                                <Ban className="h-4 w-4 text-red-400" />
                                <span className="text-sm text-red-300 font-medium">This user is suspended</span>
                            </div>
                        )}

                        {/* Profile with editable fields */}
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
                                <InlineEditField
                                    value={selectedUser.profile.role ?? ""}
                                    displayValue={selectedUser.profile.role?.replace("_", " ") ?? "—"}
                                    label="Role"
                                    fieldType="select"
                                    options={ROLE_OPTIONS}
                                    onSave={handleChangeRole}
                                    badgeClassName={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${ROLE_BADGE[selectedUser.profile.role ?? ""] ?? ""}`}
                                />
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

                        {/* Org with editable tier */}
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
                                    <InlineEditField
                                        value={selectedUser.organization.tier}
                                        displayValue={selectedUser.organization.tier}
                                        label="Tier"
                                        fieldType="select"
                                        options={TIER_OPTIONS}
                                        onSave={handleChangeTier}
                                        badgeClassName={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${TIER_BADGE[selectedUser.organization.tier] ?? ""}`}
                                    />
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

                        {/* Move to Org */}
                        {showMoveOrg && (
                            <div className="space-y-3 rounded-lg border border-blue-800/40 bg-blue-950/20 p-3">
                                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    Move to Organization
                                </p>
                                <select
                                    value={targetOrgId}
                                    onChange={(e) => setTargetOrgId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                               text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
                                >
                                    <option value="">Remove from org</option>
                                    {orgList.map((org) => (
                                        <option key={org.id} value={org.id}>{org.name} ({org.tier})</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleMoveOrg}
                                        disabled={movingOrg}
                                        className="flex-1 py-2 rounded-lg bg-blue-600/80 text-white font-medium text-sm
                                                   hover:bg-blue-600 transition-colors disabled:opacity-50"
                                    >
                                        {movingOrg ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Move"}
                                    </button>
                                    <button
                                        onClick={() => setShowMoveOrg(false)}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</h3>
                            <div className="grid gap-2">
                                <button
                                    onClick={() => setShowImpersonateConfirm(true)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-800/60 bg-indigo-950/30 px-3 py-2.5
                                               text-sm text-indigo-300 font-medium transition-colors hover:border-indigo-700 hover:bg-indigo-950/50"
                                >
                                    <LogIn className="h-4 w-4" />
                                    Login As User (Impersonate)
                                </button>

                                <button
                                    onClick={() => { setShowMoveOrg(true); fetchOrgs(); }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5
                                               text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                                >
                                    <ArrowRightLeft className="h-4 w-4" />
                                    Move to Another Org
                                </button>

                                <button
                                    onClick={handleSuspendToggle}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                                        selectedUser.profile.suspended
                                            ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:border-emerald-700"
                                            : "border-amber-800/60 bg-amber-950/30 text-amber-300 hover:border-amber-700"
                                    }`}
                                >
                                    {selectedUser.profile.suspended ? (
                                        <><Shield className="h-4 w-4" /> Unsuspend User</>
                                    ) : (
                                        <><Ban className="h-4 w-4" /> Suspend User</>
                                    )}
                                </button>

                                <button
                                    onClick={() => setDeleteTarget({
                                        id: selectedUser.profile.id,
                                        name: selectedUser.profile.email ?? selectedUser.profile.full_name ?? "this user",
                                        type: "user",
                                    })}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2.5
                                               text-sm text-red-300 font-medium transition-colors hover:border-red-700 hover:bg-red-950/50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete User
                                </button>

                                {selectedUser.organization && (
                                    <button
                                        onClick={() => setDeleteTarget({
                                            id: selectedUser.organization!.id,
                                            name: selectedUser.organization!.name,
                                            type: "org",
                                        })}
                                        className="inline-flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2.5
                                                   text-sm text-red-300 font-medium transition-colors hover:border-red-700 hover:bg-red-950/50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Organization
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </SlideOutPanel>

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <ConfirmDangerModal
                    open={true}
                    title={`Delete ${deleteTarget.type === "user" ? "User" : "Organization"}`}
                    message={`Are you sure you want to permanently delete ${deleteTarget.name}? This action cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleteLoading}
                />
            )}

            {/* Impersonate confirmation modal */}
            {showImpersonateConfirm && selectedUser && (
                <ConfirmDangerModal
                    open={true}
                    title={`Impersonate ${selectedUser.profile.email}?`}
                    message={`This will overwrite your existing Superadmin session in this browser window. You will need to log out and sign back in to regain Superadmin privileges.`}
                    onConfirm={handleImpersonate}
                    onCancel={() => setShowImpersonateConfirm(false)}
                    loading={impersonating}
                />
            )}

            {/* Toast notifications */}
            <ActionToast {...toast} onDismiss={dismiss} />
        </div>
    );
}
