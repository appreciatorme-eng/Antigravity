// Collections workspace — revenue recovery drill-through for overdue invoices and expiring proposals.

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, RefreshCw, Search, CheckCircle2, XCircle, CalendarClock, Bell, Ban } from "lucide-react";
import SlideOutPanel from "@/components/god-mode/SlideOutPanel";
import StatCard from "@/components/god-mode/StatCard";
import ConfirmActionButton from "@/components/god-mode/ConfirmActionButton";
import ActionToast, { useActionToast } from "@/components/god-mode/ActionToast";
import { authedFetch } from "@/lib/api/authed-fetch";

type WorkspaceTab = "invoices" | "proposals";

type AccountState = {
    owner_id: string | null;
    lifecycle_stage: string;
    health_band: string;
    renewal_at: string | null;
    next_action: string | null;
};

type BusinessImpact = {
    outstanding_balance_label: string;
    overdue_balance_label: string;
    overdue_invoice_count: number;
    expiring_proposal_count: number;
    open_support_count: number;
    urgent_support_count: number;
    fatal_error_count: number;
    risk_flags: string[];
};

type LinkedWorkItem = {
    id: string;
    status: string;
    severity: string;
    title: string;
    due_at: string | null;
    owner_name: string | null;
};

interface CollectionsData {
    generated_at: string;
    summary: {
        overdue_invoices_count: number;
        overdue_amount: string;
        due_this_week_count: number;
        due_this_week_amount: string;
        expiring_proposals_count: number;
        expiring_proposals_amount: string;
    };
    invoices: Array<{
        id: string;
        invoice_number: string | null;
        status: string;
        due_date: string | null;
        amount_due: number;
        amount_label: string;
        org_id: string | null;
        org_name: string;
        org_tier: string;
        days_until_due: number | null;
        href: string;
        account_state: AccountState | null;
        business_impact: BusinessImpact | null;
        work_item: LinkedWorkItem | null;
        recommended_playbook: string;
    }>;
    proposals: Array<{
        id: string;
        title: string;
        status: string;
        expires_at: string | null;
        value: number;
        value_label: string;
        org_id: string | null;
        org_name: string;
        org_tier: string;
        hours_until_expiry: number | null;
        href: string;
        account_state: AccountState | null;
        business_impact: BusinessImpact | null;
        work_item: LinkedWorkItem | null;
        recommended_playbook: string;
    }>;
}

function normalizeTab(value: string | null): WorkspaceTab {
    return value === "proposals" ? "proposals" : "invoices";
}

function formatDate(iso: string | null): string {
    if (!iso) return "No date";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function dueLabel(days: number | null): string {
    if (days === null) return "No due date";
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days}d`;
}

function expiryLabel(hours: number | null): string {
    if (hours === null) return "No expiry";
    if (hours <= 0) return "Expires now";
    if (hours < 24) return `Expires in ${hours}h`;
    return `Expires in ${Math.ceil(hours / 24)}d`;
}

function healthBadge(band: string | null | undefined) {
    if (band === "at_risk") return "bg-red-950/40 text-red-300";
    if (band === "watch") return "bg-amber-950/40 text-amber-300";
    return "bg-emerald-950/40 text-emerald-300";
}

export default function CollectionsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [tab, setTab] = useState<WorkspaceTab>(normalizeTab(searchParams.get("tab")));
    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [data, setData] = useState<CollectionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const rangeParam = searchParams.get("range");
    const currentRange = (rangeParam === "7d" || rangeParam === "30d" || rangeParam === "90d")
        ? rangeParam
        : "30d";

    const invoiceId = searchParams.get("invoiceId");
    const proposalId = searchParams.get("proposalId");
    const orgId = searchParams.get("orgId");

    const { toast, showSuccess, showError, dismiss } = useActionToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.set("search", search.trim());
            if (orgId) params.set("orgId", orgId);
            const res = await fetch(`/api/superadmin/collections?${params.toString()}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, [orgId, search]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        if (search.trim()) params.set("search", search.trim());
        else params.delete("search");
        if (tab === "invoices") params.delete("proposalId");
        if (tab === "proposals") params.delete("invoiceId");
        const next = params.toString();
        if (next !== searchParams.toString()) {
            router.replace(`${pathname}?${next}`, { scroll: false });
        }
    }, [pathname, router, search, searchParams, tab]);

    const selectedInvoice = useMemo(() => {
        if (!invoiceId) return null;
        return data?.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
    }, [data?.invoices, invoiceId]);

    const selectedProposal = useMemo(() => {
        if (!proposalId) return null;
        return data?.proposals.find((proposal) => proposal.id === proposalId) ?? null;
    }, [data?.proposals, proposalId]);

    const panelOpen = Boolean(selectedInvoice || selectedProposal);

    function setActiveInvoice(id: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", "invoices");
        params.set("invoiceId", id);
        params.delete("proposalId");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    function setActiveProposal(id: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", "proposals");
        params.set("proposalId", id);
        params.delete("invoiceId");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    function closePanel() {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("invoiceId");
        params.delete("proposalId");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Revenue Ops</h1>
                    <p className="mt-0.5 text-sm text-gray-400">Recover overdue invoices, rescue renewals, and move owned revenue work.</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-400 transition-colors hover:text-white disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard label="Overdue invoices" value={loading ? "…" : data?.summary.overdue_amount ?? "₹0"} subtitle={`${data?.summary.overdue_invoices_count ?? 0} invoices`} accent="red" />
                <StatCard label="Due this week" value={loading ? "…" : data?.summary.due_this_week_amount ?? "₹0"} subtitle={`${data?.summary.due_this_week_count ?? 0} invoices`} accent="amber" />
                <StatCard label="Expiring proposals" value={loading ? "…" : data?.summary.expiring_proposals_amount ?? "₹0"} subtitle={`${data?.summary.expiring_proposals_count ?? 0} proposals`} accent="amber" />
                <StatCard label="Recovery queue" value={loading ? "…" : String((data?.summary.overdue_invoices_count ?? 0) + (data?.summary.expiring_proposals_count ?? 0))} subtitle="Items needing decision" accent="blue" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
                    <button
                        onClick={() => setTab("invoices")}
                        className={`rounded px-3 py-1.5 text-sm ${tab === "invoices" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        Invoices
                    </button>
                    <button
                        onClick={() => setTab("proposals")}
                        className={`rounded px-3 py-1.5 text-sm ${tab === "proposals" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        Proposals
                    </button>
                </div>

                <div className="relative min-w-[240px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search org, invoice number, or proposal title..."
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:border-amber-500/50 focus:outline-none"
                    />
                </div>
            </div>

            {tab === "invoices" ? (
                <section className="space-y-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="h-24 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
                        ))
                    ) : (data?.invoices.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-10 text-center text-sm text-gray-500">
                            No invoice exposure found for this filter.
                        </div>
                    ) : (
                        data?.invoices.map((invoice) => (
                            <button
                                key={invoice.id}
                                onClick={() => setActiveInvoice(invoice.id)}
                                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                                    invoice.id === selectedInvoice?.id
                                        ? "border-amber-700/70 bg-amber-950/20"
                                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white">#{invoice.invoice_number ?? "—"} · {invoice.org_name}</p>
                                        <p className="mt-1 text-xs text-gray-500">{invoice.org_tier} · due {formatDate(invoice.due_date)}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <span className={`rounded px-2 py-1 text-[11px] ${healthBadge(invoice.account_state?.health_band)}`}>
                                                {invoice.account_state?.health_band ?? "healthy"}
                                            </span>
                                            <span className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300">
                                                {invoice.work_item?.owner_name ?? "Unowned"}
                                            </span>
                                            <span className="rounded bg-blue-950/30 px-2 py-1 text-[11px] text-blue-200">
                                                {invoice.recommended_playbook}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-red-200">{invoice.amount_label}</p>
                                        <p className="mt-1 text-xs text-gray-500">{dueLabel(invoice.days_until_due)}</p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </section>
            ) : (
                <section className="space-y-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="h-24 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
                        ))
                    ) : (data?.proposals.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-10 text-center text-sm text-gray-500">
                            No expiring proposals found for this filter.
                        </div>
                    ) : (
                        data?.proposals.map((proposal) => (
                            <button
                                key={proposal.id}
                                onClick={() => setActiveProposal(proposal.id)}
                                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                                    proposal.id === selectedProposal?.id
                                        ? "border-amber-700/70 bg-amber-950/20"
                                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">{proposal.title}</p>
                                        <p className="mt-1 text-xs text-gray-500">{proposal.org_name} · expires {formatDate(proposal.expires_at)}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <span className={`rounded px-2 py-1 text-[11px] ${healthBadge(proposal.account_state?.health_band)}`}>
                                                {proposal.account_state?.health_band ?? "healthy"}
                                            </span>
                                            <span className="rounded bg-gray-800 px-2 py-1 text-[11px] text-gray-300">
                                                {proposal.work_item?.owner_name ?? "Unowned"}
                                            </span>
                                            <span className="rounded bg-blue-950/30 px-2 py-1 text-[11px] text-blue-200">
                                                {proposal.recommended_playbook}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-amber-200">{proposal.value_label}</p>
                                        <p className="mt-1 text-xs text-gray-500">{expiryLabel(proposal.hours_until_expiry)}</p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </section>
            )}

            <SlideOutPanel
                open={panelOpen}
                onClose={closePanel}
                title={selectedInvoice ? "Invoice details" : "Proposal details"}
                width="lg"
            >
                {selectedInvoice && (
                    <div className="space-y-5">
                        <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-4">
                            <p className="text-xs text-gray-500">Invoice</p>
                            <p className="mt-1 text-lg font-semibold text-white">#{selectedInvoice.invoice_number ?? "—"}</p>
                            <p className="mt-1 text-sm text-gray-400">{selectedInvoice.org_name}</p>
                            <p className="mt-4 text-2xl font-bold text-red-200">{selectedInvoice.amount_label}</p>
                            <p className="mt-1 text-xs text-gray-500">{dueLabel(selectedInvoice.days_until_due)}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account State</p>
                                <div className="mt-3 space-y-2 text-sm text-gray-300">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Health</span>
                                        <span className="capitalize text-white">{selectedInvoice.account_state?.health_band ?? "healthy"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Lifecycle</span>
                                        <span className="capitalize text-white">{selectedInvoice.account_state?.lifecycle_stage ?? "active"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Renewal</span>
                                        <span className="text-white">{selectedInvoice.account_state?.renewal_at ? formatDate(selectedInvoice.account_state.renewal_at) : "Not set"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Next action</span>
                                        <span className="text-right text-white">{selectedInvoice.account_state?.next_action ?? "None set"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Revenue Risk</p>
                                <div className="mt-3 space-y-2 text-sm text-gray-300">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Outstanding</span>
                                        <span className="text-white">{selectedInvoice.business_impact?.outstanding_balance_label ?? selectedInvoice.amount_label}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Overdue balance</span>
                                        <span className="text-white">{selectedInvoice.business_impact?.overdue_balance_label ?? selectedInvoice.amount_label}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Support pressure</span>
                                        <span className="text-white">{selectedInvoice.business_impact?.urgent_support_count ?? 0} urgent / {selectedInvoice.business_impact?.open_support_count ?? 0} open</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {selectedInvoice.business_impact?.risk_flags?.map((flag) => (
                                        <span key={flag} className="rounded bg-amber-950/30 px-2 py-1 text-[11px] text-amber-200">
                                            {flag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {selectedInvoice.work_item && (
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Linked Work Item</p>
                                <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                                    <div>
                                        <p className="font-medium text-white">{selectedInvoice.work_item.title}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {selectedInvoice.work_item.owner_name ?? "Unowned"} · {selectedInvoice.work_item.status.replace("_", " ")}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">{selectedInvoice.work_item.due_at ? formatDate(selectedInvoice.work_item.due_at) : "No due date"}</span>
                                </div>
                            </div>
                        )}

                        {/* Revenue recovery actions */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recovery Actions</h3>
                            <div className="grid gap-2">
                                <ConfirmActionButton
                                    label="Mark as Paid"
                                    confirmLabel="Confirm Paid"
                                    variant="success"
                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        const res = await authedFetch(`/api/superadmin/collections`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                type: "invoice",
                                                id: selectedInvoice.id,
                                                action: "mark_paid",
                                                work_item_update: selectedInvoice.work_item ? { id: selectedInvoice.work_item.id, status: "done" } : undefined,
                                            }),
                                        });
                                        if (res.ok) { showSuccess("Invoice marked as paid"); closePanel(); fetchData(); }
                                        else showError("Failed to mark as paid");
                                    }}
                                />
                                <ConfirmActionButton
                                    label="Send Payment Reminder"
                                    confirmLabel="Send Now"
                                    icon={<Bell className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        const res = await authedFetch(`/api/superadmin/collections`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                type: "invoice",
                                                id: selectedInvoice.id,
                                                action: "remind",
                                                org_id: selectedInvoice.org_id,
                                                work_item_id: selectedInvoice.work_item?.id ?? null,
                                            }),
                                        });
                                        if (res.ok) showSuccess("Payment reminder sent");
                                        else showError("Failed to send reminder");
                                    }}
                                />
                                <ConfirmActionButton
                                    label="Extend Due Date (+7 days)"
                                    confirmLabel="Extend"
                                    icon={<CalendarClock className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        const newDate = selectedInvoice.due_date
                                            ? new Date(new Date(selectedInvoice.due_date).getTime() + 7 * 86_400_000).toISOString()
                                            : new Date(Date.now() + 7 * 86_400_000).toISOString();
                                        const res = await authedFetch(`/api/superadmin/collections`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                type: "invoice",
                                                id: selectedInvoice.id,
                                                action: "extend",
                                                due_date: newDate,
                                                work_item_update: selectedInvoice.work_item ? { id: selectedInvoice.work_item.id, status: "in_progress", due_at: newDate } : undefined,
                                            }),
                                        });
                                        if (res.ok) { showSuccess("Due date extended by 7 days"); fetchData(); }
                                        else showError("Failed to extend due date");
                                    }}
                                />
                                <ConfirmActionButton
                                    label="Write Off"
                                    confirmLabel="Yes, Write Off"
                                    variant="danger"
                                    icon={<XCircle className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        const res = await authedFetch(`/api/superadmin/collections`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                type: "invoice",
                                                id: selectedInvoice.id,
                                                action: "write_off",
                                                work_item_update: selectedInvoice.work_item ? { id: selectedInvoice.work_item.id, status: "done" } : undefined,
                                            }),
                                        });
                                        if (res.ok) { showSuccess("Invoice written off"); closePanel(); fetchData(); }
                                        else showError("Failed to write off");
                                    }}
                                />
                                <ConfirmActionButton
                                    label="Suspend Org for Non-Payment"
                                    confirmLabel="Suspend Org"
                                    variant="danger"
                                    icon={<Ban className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        if (!selectedInvoice.org_id) { showError("No org associated"); return; }
                                        const res = await authedFetch(`/api/superadmin/settings/org-suspend`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ org_id: selectedInvoice.org_id, action: "suspend", reason: `Non-payment: invoice #${selectedInvoice.invoice_number}` }),
                                        });
                                        if (res.ok) showSuccess("Organization suspended");
                                        else showError("Failed to suspend org");
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Link href={`/god/directory?search=${encodeURIComponent(selectedInvoice.org_name)}`} className="inline-flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white">
                                Open organization
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href={`/god/support?status=open&search=${encodeURIComponent(selectedInvoice.org_name)}`} className="inline-flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white">
                                Check related support load
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {selectedProposal && (
                    <div className="space-y-5">
                        <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-4">
                            <p className="text-xs text-gray-500">Proposal</p>
                            <p className="mt-1 text-lg font-semibold text-white">{selectedProposal.title}</p>
                            <p className="mt-1 text-sm text-gray-400">{selectedProposal.org_name}</p>
                            <p className="mt-4 text-2xl font-bold text-amber-200">{selectedProposal.value_label}</p>
                            <p className="mt-1 text-xs text-gray-500">{expiryLabel(selectedProposal.hours_until_expiry)}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account State</p>
                                <div className="mt-3 space-y-2 text-sm text-gray-300">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Health</span>
                                        <span className="capitalize text-white">{selectedProposal.account_state?.health_band ?? "healthy"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Lifecycle</span>
                                        <span className="capitalize text-white">{selectedProposal.account_state?.lifecycle_stage ?? "active"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Renewal</span>
                                        <span className="text-white">{selectedProposal.account_state?.renewal_at ? formatDate(selectedProposal.account_state.renewal_at) : "Not set"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Playbook</span>
                                        <span className="text-right text-white">{selectedProposal.recommended_playbook}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Business Impact</p>
                                <div className="mt-3 space-y-2 text-sm text-gray-300">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Outstanding</span>
                                        <span className="text-white">{selectedProposal.business_impact?.outstanding_balance_label ?? "₹0"}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Expiring proposals</span>
                                        <span className="text-white">{selectedProposal.business_impact?.expiring_proposal_count ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Support pressure</span>
                                        <span className="text-white">{selectedProposal.business_impact?.urgent_support_count ?? 0} urgent / {selectedProposal.business_impact?.open_support_count ?? 0} open</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {selectedProposal.business_impact?.risk_flags?.map((flag) => (
                                        <span key={flag} className="rounded bg-amber-950/30 px-2 py-1 text-[11px] text-amber-200">
                                            {flag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {selectedProposal.work_item && (
                            <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Linked Work Item</p>
                                <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                                    <div>
                                        <p className="font-medium text-white">{selectedProposal.work_item.title}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {selectedProposal.work_item.owner_name ?? "Unowned"} · {selectedProposal.work_item.status.replace("_", " ")}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">{selectedProposal.work_item.due_at ? formatDate(selectedProposal.work_item.due_at) : "No due date"}</span>
                                </div>
                            </div>
                        )}

                        {/* Proposal actions */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Actions</h3>
                            <div className="grid gap-2">
                                <ConfirmActionButton
                                    label="Mark as Converted"
                                    confirmLabel="Confirm Conversion"
                                    variant="success"
                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        const res = await authedFetch(`/api/superadmin/collections`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                type: "proposal",
                                                id: selectedProposal.id,
                                                action: "convert",
                                                work_item_update: selectedProposal.work_item ? { id: selectedProposal.work_item.id, status: "done" } : undefined,
                                            }),
                                        });
                                        if (res.ok) { showSuccess("Proposal marked as converted"); closePanel(); fetchData(); }
                                        else showError("Failed to mark as converted");
                                    }}
                                />
                                <ConfirmActionButton
                                    label="Extend Expiry (+48 hours)"
                                    confirmLabel="Extend"
                                    icon={<CalendarClock className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        const newExpiry = selectedProposal.expires_at
                                            ? new Date(new Date(selectedProposal.expires_at).getTime() + 48 * 3_600_000).toISOString()
                                            : new Date(Date.now() + 48 * 3_600_000).toISOString();
                                        const res = await authedFetch(`/api/superadmin/collections`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                type: "proposal",
                                                id: selectedProposal.id,
                                                action: "extend",
                                                expires_at: newExpiry,
                                                work_item_update: selectedProposal.work_item ? { id: selectedProposal.work_item.id, status: "in_progress", due_at: newExpiry } : undefined,
                                            }),
                                        });
                                        if (res.ok) { showSuccess("Expiry extended by 48 hours"); fetchData(); }
                                        else showError("Failed to extend expiry");
                                    }}
                                />
                                <ConfirmActionButton
                                    label="Cancel Proposal"
                                    confirmLabel="Yes, Cancel"
                                    variant="danger"
                                    icon={<XCircle className="h-4 w-4" />}
                                    onConfirm={async () => {
                                        const res = await authedFetch(`/api/superadmin/collections`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                type: "proposal",
                                                id: selectedProposal.id,
                                                action: "cancel",
                                                work_item_update: selectedProposal.work_item ? { id: selectedProposal.work_item.id, status: "done" } : undefined,
                                            }),
                                        });
                                        if (res.ok) { showSuccess("Proposal cancelled"); closePanel(); fetchData(); }
                                        else showError("Failed to cancel proposal");
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Link href={`/god/directory?search=${encodeURIComponent(selectedProposal.org_name)}`} className="inline-flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white">
                                Open organization
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href={`/god/analytics?feature=proposals&range=${currentRange}`} className="inline-flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white">
                                Open proposal conversion analytics
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </SlideOutPanel>

            {/* Toast notifications */}
            <ActionToast {...toast} onDismiss={dismiss} />
        </div>
    );
}
