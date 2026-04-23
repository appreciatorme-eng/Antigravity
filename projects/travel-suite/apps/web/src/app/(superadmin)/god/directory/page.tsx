// Directory — searchable paginated directory of all users across orgs.
// Now includes full CRUD: change role, suspend/unsuspend, move org, delete user,
// org tier management, create org, and CSV export.

"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, RefreshCw, Building2, Shield, Trash2, ArrowRightLeft, Loader2, LogIn, ChevronRight, Users, MapPin, FileText, Receipt, BrainCircuit, Clock, Activity, ExternalLink, Sparkles } from "lucide-react";
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
        organization_id: string | null;
    };
    organization: {
        id: string; name: string; slug: string; tier: string; created_at: string;
    } | null;
    activity: { trips: number; proposals: number };
    support_tickets: { id: string; title: string; status: string; priority: string; created_at: string }[];
}

interface OrgOption { id: string; name: string; tier: string }

interface OrgDetailMember {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    avatar_url: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
}

interface OrgDetail {
    organization: {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        primary_color: string | null;
        tier: string;
        created_at: string;
        updated_at: string | null;
        owner: { id: string; full_name: string | null; email: string | null } | null;
    };
    last_org_activity: string | null;
    members: OrgDetailMember[];
    member_count: number;
    stats: {
        trips_total: number;
        trips_last_30d: number;
        trips_by_status: Record<string, number>;
        proposals_total: number;
        proposals_last_30d: number;
        proposals_won: number;
        proposal_total_value: number;
        proposal_total_value_label: string;
        proposal_won_value: number;
        proposal_won_value_label: string;
        invoices_total: number;
        invoices_overdue: number;
        total_billed: number;
        total_billed_label: string;
        total_outstanding: number;
        total_outstanding_label: string;
        overdue_amount: number;
        overdue_amount_label: string;
        total_collected: number;
        total_collected_label: string;
        support_tickets_open: number;
        support_tickets_resolved: number;
        ai_spend_mtd_usd: number;
        ai_requests_mtd: number;
    };
    features_used: string[];
    settings: Record<string, unknown> | null;
    account_state?: {
        owner_id: string | null;
        lifecycle_stage: string;
        health_band: string;
        renewal_at: string | null;
        next_action: string | null;
    };
    open_work_items?: Array<{
        id: string;
        title: string;
        status: string;
        severity: string;
        due_at: string | null;
        owner_name?: string | null;
    }>;
    business_impact?: {
        outstanding_balance_label: string;
        overdue_balance_label: string;
        overdue_invoice_count: number;
        expiring_proposal_count: number;
        open_support_count: number;
        urgent_support_count: number;
        fatal_error_count: number;
        risk_flags: string[];
    } | null;
    recent_invoices?: Array<{
        id: string;
        invoice_number: string | null;
        due_date: string | null;
        balance_amount_label: string;
        status: string | null;
    }>;
    expiring_proposals?: Array<{
        id: string;
        title: string | null;
        expires_at: string | null;
        value_label: string;
        status: string | null;
    }>;
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

const getColumns = (
    openOrgDetail: (orgId: string) => void
): TableColumn<DirectoryUser>[] => [
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
    { 
        key: "org_name", 
        label: "Org", 
        render: (v, row) => (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (row.org_id) openOrgDetail(row.org_id);
                }}
                className="text-amber-400 hover:text-amber-300 font-medium text-left transition-colors truncate max-w-[150px]"
                title={String(v ?? "")}
            >
                {String(v ?? "—")}
            </button>
        ) 
    },
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
    const [impersonationLink, setImpersonationLink] = useState<string | null>(null);

    // Org detail state
    const [orgDetail, setOrgDetail] = useState<OrgDetail | null>(null);
    const [orgDetailLoading, setOrgDetailLoading] = useState(false);
    const [orgPanelOpen, setOrgPanelOpen] = useState(false);

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
            if (res.ok) {
                setSelectedUser(await res.json());
            } else {
                let errText = "Unknown error";
                try {
                    const errData = await res.json();
                    errText = errData.error || res.statusText;
                } catch {
                    errText = res.statusText;
                }
                showError(`Failed to load user: ${errText}`);
                setPanelOpen(false);
            }
        } catch (err) {
            showError(`Network error: ${err instanceof Error ? err.message : "Failed to load user"}`);
            setPanelOpen(false);
        } finally {
            setDetailLoading(false);
        }
    }, [showError]);

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

    // --- ORG DETAIL ---

    const openOrgDetail = useCallback(async (orgId: string) => {
        setOrgPanelOpen(true);
        setOrgDetailLoading(true);
        setOrgDetail(null);
        try {
            const res = await fetch(`/api/superadmin/orgs/org-detail?orgId=${orgId}`);
            if (res.ok) {
                setOrgDetail(await res.json());
            } else {
                showError("Failed to load organization details");
                setOrgPanelOpen(false);
            }
        } catch {
            showError("Network error loading organization");
            setOrgPanelOpen(false);
        } finally {
            setOrgDetailLoading(false);
        }
    }, [showError]);

    function formatTimeAgo(iso: string | null): string {
        if (!iso) return "Never";
        const diffMs = Date.now() - new Date(iso).getTime();
        const minutes = Math.max(0, Math.floor(diffMs / 60_000));
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(iso).toLocaleDateString();
    }

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
                    setImpersonationLink(data.magic_link);
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
                    <h1 className="text-2xl font-bold text-white">Accounts</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {data ? `${data.total.toLocaleString()} users and org operators across the business` : "Loading…"}
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
                    columns={getColumns(openOrgDetail)}
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
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Name</span>
                                        <button
                                            onClick={() => openOrgDetail(selectedUser.organization!.id)}
                                            className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors group"
                                        >
                                            {selectedUser.organization.name}
                                            <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </button>
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

            {/* Org Detail Panel */}
            <SlideOutPanel
                open={orgPanelOpen}
                onClose={() => { setOrgPanelOpen(false); setOrgDetail(null); }}
                title="Account Command Center"
                width="xl"
            >
                {orgDetailLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-12 bg-gray-800 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : orgDetail ? (
                    <div className="space-y-6">
                        {/* Org Header */}
                        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-amber-400" />
                                        {orgDetail.organization.name}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        <span className="text-gray-500">slug:</span> {orgDetail.organization.slug}
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                    TIER_BADGE[orgDetail.organization.tier] ?? "bg-gray-700 text-gray-300"
                                }`}>
                                    {orgDetail.organization.tier}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                <div>
                                    <span className="text-gray-500 text-xs">Created</span>
                                    <p className="text-gray-300">
                                        {new Date(orgDetail.organization.created_at).toLocaleDateString(undefined, {
                                            month: "long", day: "numeric", year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">Owner</span>
                                    <p className="text-gray-300">
                                        {orgDetail.organization.owner?.full_name ?? orgDetail.organization.owner?.email ?? "No owner"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">Members</span>
                                    <p className="text-white font-semibold">{orgDetail.member_count}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">Last Activity</span>
                                    <p className="text-white font-semibold flex items-center gap-1.5">
                                        <Activity className="h-3.5 w-3.5 text-emerald-400" />
                                        {formatTimeAgo(orgDetail.last_org_activity)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {(orgDetail.account_state || orgDetail.business_impact) && (
                            <div className="grid gap-3 xl:grid-cols-2">
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Operating State</h3>
                                    <div className="mt-3 space-y-2 text-sm text-gray-300">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Health</span>
                                            <span className="capitalize text-white">{orgDetail.account_state?.health_band ?? "healthy"}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Lifecycle</span>
                                            <span className="capitalize text-white">{orgDetail.account_state?.lifecycle_stage ?? "active"}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Renewal</span>
                                            <span className="text-white">{orgDetail.account_state?.renewal_at ? new Date(orgDetail.account_state.renewal_at).toLocaleDateString() : "Not set"}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Next action</span>
                                            <span className="text-right text-white">{orgDetail.account_state?.next_action ?? "None set"}</span>
                                        </div>
                                    </div>
                                    {(orgDetail.open_work_items?.length ?? 0) > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {orgDetail.open_work_items?.slice(0, 3).map((item) => (
                                                <div key={item.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-sm">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-medium text-white">{item.title}</p>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {item.owner_name ?? "Unowned"} · {item.status.replace("_", " ")}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-gray-500">{item.due_at ? formatTimeAgo(item.due_at) : "No due date"}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Impact</h3>
                                    <div className="mt-3 space-y-2 text-sm text-gray-300">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Outstanding</span>
                                            <span className="text-white">{orgDetail.business_impact?.outstanding_balance_label ?? "₹0"}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Overdue</span>
                                            <span className="text-white">{orgDetail.business_impact?.overdue_balance_label ?? "₹0"}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Support pressure</span>
                                            <span className="text-white">{orgDetail.business_impact?.urgent_support_count ?? 0} urgent / {orgDetail.business_impact?.open_support_count ?? 0} open</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-500">Fatal incidents</span>
                                            <span className="text-white">{orgDetail.business_impact?.fatal_error_count ?? 0}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {orgDetail.business_impact?.risk_flags?.map((flag) => (
                                            <span key={flag} className="rounded bg-amber-950/30 px-2 py-1 text-[11px] text-amber-200">
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Features Used */}
                        {orgDetail.features_used.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Features Used
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {orgDetail.features_used.map((feature) => (
                                        <span
                                            key={feature}
                                            className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs font-medium text-gray-300"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Usage Stats Grid */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Usage Overview</h3>
                                <span className="text-xs text-gray-600 italic">all-time · last 30d matches KPI cards</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="h-3.5 w-3.5 text-amber-400" />
                                        <span className="text-xs text-gray-400">Trips</span>
                                    </div>
                                    <p className="text-xl font-bold text-white">{orgDetail.stats.trips_total}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        <span className="text-amber-400 font-medium">{orgDetail.stats.trips_last_30d}</span> last 30d
                                    </p>
                                </div>
                                <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-3.5 w-3.5 text-blue-400" />
                                        <span className="text-xs text-gray-400">Proposals</span>
                                    </div>
                                    <p className="text-xl font-bold text-white">
                                        {orgDetail.stats.proposals_total}
                                        {orgDetail.stats.proposals_won > 0 && (
                                            <span className="text-xs text-emerald-400 ml-1.5 font-medium">
                                                {orgDetail.stats.proposals_won} won
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        <span className="text-blue-400 font-medium">{orgDetail.stats.proposals_last_30d}</span> last 30d
                                    </p>
                                </div>
                                <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                                        <span className="text-xs text-gray-400">Invoices</span>
                                    </div>
                                    <p className="text-xl font-bold text-white">
                                        {orgDetail.stats.invoices_total}
                                    </p>
                                    {orgDetail.stats.invoices_overdue > 0 ? (
                                        <p className="text-xs text-red-400 mt-0.5 font-medium">
                                            {orgDetail.stats.invoices_overdue} overdue
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-0.5">all-time</p>
                                    )}
                                </div>
                                <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="h-3.5 w-3.5 text-purple-400" />
                                        <span className="text-xs text-gray-400">Support Tickets</span>
                                    </div>
                                    <p className="text-xl font-bold text-white">
                                        {orgDetail.stats.support_tickets_open}
                                        <span className="text-xs text-gray-400 ml-1.5 font-medium">open</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {orgDetail.stats.support_tickets_resolved} resolved
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Health */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial Health</h3>
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 divide-y divide-gray-800">
                                <div className="flex justify-between items-center px-4 py-3">
                                    <span className="text-sm text-gray-400">Total Billed</span>
                                    <span className="text-sm font-semibold text-white">{orgDetail.stats.total_billed_label}</span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3">
                                    <span className="text-sm text-gray-400">Collected</span>
                                    <span className="text-sm font-semibold text-emerald-400">{orgDetail.stats.total_collected_label}</span>
                                </div>
                                <div className="flex justify-between items-center px-4 py-3">
                                    <span className="text-sm text-gray-400">Outstanding</span>
                                    <span className={`text-sm font-semibold ${orgDetail.stats.total_outstanding > 0 ? "text-amber-400" : "text-gray-400"}`}>
                                        {orgDetail.stats.total_outstanding_label}
                                    </span>
                                </div>
                                {orgDetail.stats.overdue_amount > 0 && (
                                    <div className="flex justify-between items-center px-4 py-3 bg-red-950/20">
                                        <span className="text-sm text-red-300">Overdue</span>
                                        <span className="text-sm font-bold text-red-400">
                                            {orgDetail.stats.overdue_amount_label} ({orgDetail.stats.invoices_overdue} inv)
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Proposal Value */}
                        {orgDetail.stats.proposals_total > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposal Pipeline</h3>
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 divide-y divide-gray-800">
                                    <div className="flex justify-between items-center px-4 py-3">
                                        <span className="text-sm text-gray-400">Total Pipeline Value</span>
                                        <span className="text-sm font-semibold text-white">{orgDetail.stats.proposal_total_value_label}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3">
                                        <span className="text-sm text-gray-400">Won Value</span>
                                        <span className="text-sm font-semibold text-emerald-400">{orgDetail.stats.proposal_won_value_label}</span>
                                    </div>
                                    {orgDetail.stats.proposals_total > 0 && (
                                        <div className="flex justify-between items-center px-4 py-3">
                                            <span className="text-sm text-gray-400">Conversion Rate</span>
                                            <span className="text-sm font-semibold text-white">
                                                {((orgDetail.stats.proposals_won / orgDetail.stats.proposals_total) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI Usage */}
                        {(orgDetail.stats.ai_requests_mtd > 0 || orgDetail.stats.ai_spend_mtd_usd > 0) && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <BrainCircuit className="h-3.5 w-3.5" />
                                    AI Usage (MTD)
                                </h3>
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 divide-y divide-gray-800">
                                    <div className="flex justify-between items-center px-4 py-3">
                                        <span className="text-sm text-gray-400">Requests</span>
                                        <span className="text-sm font-semibold text-white">
                                            {orgDetail.stats.ai_requests_mtd.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-3">
                                        <span className="text-sm text-gray-400">Estimated Cost</span>
                                        <span className={`text-sm font-semibold ${
                                            orgDetail.stats.ai_spend_mtd_usd >= 25 ? "text-red-400" :
                                            orgDetail.stats.ai_spend_mtd_usd >= 10 ? "text-amber-400" : "text-gray-300"
                                        }`}>
                                            ${orgDetail.stats.ai_spend_mtd_usd.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Members */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Members ({orgDetail.member_count})
                            </h3>
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 divide-y divide-gray-800 overflow-hidden">
                                {orgDetail.members.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => {
                                            setOrgPanelOpen(false);
                                            setOrgDetail(null);
                                            openUserDetail({ id: member.id });
                                        }}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors group"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {member.full_name ?? member.email ?? "Unknown"}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {member.email ?? "No email"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                                                    ROLE_BADGE[member.role ?? ""] ?? "bg-gray-700 text-gray-300"
                                                }`}>
                                                    {member.role?.replace("_", " ") ?? "—"}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 justify-end">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTimeAgo(member.last_sign_in_at)}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                                {orgDetail.members.length === 0 && (
                                    <p className="px-4 py-4 text-sm text-gray-500 text-center">No members in this organization</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
                            <div className="grid gap-2">
                                <InlineEditField
                                    value={orgDetail.organization.tier}
                                    displayValue={orgDetail.organization.tier}
                                    label="Tier"
                                    fieldType="select"
                                    options={TIER_OPTIONS}
                                    onSave={async (newTier) => {
                                        const res = await authedFetch(`/api/superadmin/orgs/${orgDetail.organization.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ subscription_tier: newTier }),
                                        });
                                        if (res.ok) {
                                            showSuccess(`Tier changed to ${newTier}`);
                                            // Refresh org detail
                                            openOrgDetail(orgDetail.organization.id);
                                            fetchData();
                                        } else {
                                            showError("Failed to change tier");
                                        }
                                    }}
                                    badgeClassName={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${TIER_BADGE[orgDetail.organization.tier] ?? ""}`}
                                />
                                <a
                                    href={`/god/collections?tab=invoices&search=${encodeURIComponent(orgDetail.organization.name)}`}
                                    className="inline-flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5
                                               text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                                >
                                    <span className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        View in Collections
                                    </span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <a
                                    href={`/god/directory?search=${encodeURIComponent(orgDetail.organization.name)}`}
                                    className="inline-flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5
                                               text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                                >
                                    <span className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Filter Directory by Org
                                    </span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <a
                                    href={`/god/support?search=${encodeURIComponent(orgDetail.organization.name)}`}
                                    className="inline-flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5
                                               text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                                >
                                    <span className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Support Tickets
                                    </span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                {orgDetail.stats.ai_requests_mtd > 0 && (
                                    <a
                                        href={`/god/costs/org/${orgDetail.organization.id}`}
                                        className="inline-flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5
                                                   text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
                                    >
                                        <span className="flex items-center gap-2">
                                            <BrainCircuit className="h-4 w-4" />
                                            AI Cost Breakdown
                                        </span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                                <button
                                    onClick={() => setDeleteTarget({
                                        id: orgDetail.organization.id,
                                        name: orgDetail.organization.name,
                                        type: "org",
                                    })}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2.5
                                               text-sm text-red-300 font-medium transition-colors hover:border-red-700 hover:bg-red-950/50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Organization
                                </button>
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
            {showImpersonateConfirm && selectedUser && !impersonationLink && (
                <ConfirmDangerModal
                    open={true}
                    title={`Impersonate ${selectedUser.profile.email}?`}
                    message={`Generate a magic link to access this user's account.`}
                    onConfirm={handleImpersonate}
                    onCancel={() => setShowImpersonateConfirm(false)}
                    loading={impersonating}
                />
            )}

            {/* Impersonation Link Modal */}
            {impersonationLink && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-gray-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
                            <Sparkles className="w-6 h-6 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white text-center mb-2">Impersonation Link Ready</h2>
                        <p className="text-sm text-gray-400 text-center mb-6">
                            To avoid overwriting your current God Mode session, <strong className="text-white font-semibold">right-click</strong> the button below and open it in an Incognito / Private window.
                        </p>
                        
                        <div className="flex flex-col gap-3 w-full">
                            <a
                                href={impersonationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 rounded-lg bg-amber-500 text-gray-950 font-bold text-center hover:bg-amber-400 transition-colors"
                            >
                                Open in New Tab (Right-Click Me)
                            </a>
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(impersonationLink);
                                    showSuccess("Link copied to clipboard!");
                                }}
                                className="w-full py-3 rounded-lg bg-gray-800 border border-gray-700 text-white font-medium text-center hover:bg-gray-700 transition-colors"
                            >
                                Copy Link
                            </button>
                            <button
                                type="button"
                                onClick={() => { setImpersonationLink(null); setShowImpersonateConfirm(false); }}
                                className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notifications */}
            <ActionToast {...toast} onDismiss={dismiss} />
        </div>
    );
}
