// Command Center — business operating view for god mode.

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Activity,
    ArrowRight,
    Bookmark,
    Building2,
    ExternalLink,
    LifeBuoy,
    Megaphone,
    Power,
    RefreshCw,
    ShieldAlert,
    TriangleAlert,
    ReceiptText,
    Wallet,
    Zap,
    TrendingDown,
    TrendingUp,
    Minus,
    ScrollText,
    LogIn,
    Search,
    Users,
    Settings,
    Loader2,
    X,
} from "lucide-react";
import { useRef } from "react";
import TrendChart from "@/components/god-mode/TrendChart";
import TimeRangePicker from "@/components/god-mode/TimeRangePicker";
import StatusDot from "@/components/god-mode/StatusDot";
import type { HealthStatus } from "@/components/god-mode/StatusDot";
import { cn } from "@/lib/utils";
import { authedFetch } from "@/lib/api/authed-fetch";
import ConfirmDangerModal from "@/components/god-mode/ConfirmDangerModal";
import ActionToast, { useActionToast } from "@/components/god-mode/ActionToast";

type Severity = "critical" | "high" | "medium";
type Tone = "neutral" | "warning" | "danger";
type SavedView = "all" | "revenue" | "customer-risk" | "incidents" | "growth";
type OverviewRange = "7d" | "30d" | "90d";
type SavedPreset = { id: string; name: string; view: SavedView; range: OverviewRange };

interface OverviewData {
    generated_at: string;
    header: { title: string; subtitle: string };
    summary_kpis: Array<{
        id: string;
        label: string;
        value: string;
        detail: string;
        trend_pct?: number | null;
        href?: string;
        sparkline?: number[];
        tone: Tone;
    }>;
    delta_strip: Array<{
        id: string;
        label: string;
        value: number;
        comparison: string;
        href?: string;
    }>;
    priority_inbox: Array<{
        id: string;
        kind: string;
        severity: Severity;
        title: string;
        detail: string;
        age_label: string;
        action_label: string;
        href: string;
    }>;
    revenue_risk: {
        overdue_amount: string;
        overdue_count: number;
        due_this_week_amount: string;
        due_this_week_count: number;
        expiring_proposals_amount: string;
        expiring_proposals_count: number;
        open_support_count: number;
        top_overdue_invoices: Array<{
            id: string;
            invoice_number: string | null;
            due_date: string | null;
            amount: string;
            org_name: string;
        }>;
        expiring_proposals: Array<{
            id: string;
            title: string;
            expires_at: string | null;
            value: string;
            org_name: string;
        }>;
    };
    growth: {
        signup_trend_30d: Array<{ date: string; signups: number }>;
        signups_last_30d: number;
        avg_daily_signups: number;
        new_orgs_last_30d: number;
        proposal_conversion_pct: number | null;
    };
    watchlists: {
        customer_risk_orgs: Array<{
            org_id: string;
            name: string;
            tier: string;
            overdue_amount: number;
            overdue_invoices: number;
            open_tickets: number;
            urgent_tickets: number;
            oldest_ticket_at: string | null;
            expiring_proposals: number;
            expiring_value: number;
            ai_spend_usd: number;
            risk_flags: string[];
            href: string;
        }>;
        ai_spend_orgs: Array<{
            org_id: string;
            name: string;
            tier: string;
            spend_usd: number;
            requests: number;
            href: string;
        }>;
        support_load_orgs: Array<{
            org_id: string;
            name: string;
            open: number;
            urgent: number;
            oldest_at: string | null;
            href: string;
        }>;
        newest_orgs: Array<{
            org_id: string;
            name: string;
            tier: string;
            created_at: string | null;
            href: string;
        }>;
    };
    ops_health: {
        services: Array<{
            id: string;
            label: string;
            status: HealthStatus;
            detail: string;
            configured: boolean;
        }>;
        queues: {
            notifications_pending: number;
            notifications_failed: number;
            dead_letters: number;
            social_pending: number;
            pdf_pending: number;
            oldest_pending_minutes: number;
        };
        incidents: {
            open_errors: number;
            open_fatal_errors: number;
            resolved_this_week: number;
        };
    };
    decision_log: Array<{
        id: string;
        action: string;
        category: string;
        created_at: string | null;
        actor_name: string;
        target_type: string | null;
        target_id: string | null;
        href: string;
    }>;
    quick_actions: Array<{
        label: string;
        href: string;
        tone?: "danger";
    }>;
}

type ActionItem = {
    label: string;
    href: string;
    tone?: "danger";
};

const SAVED_VIEWS: Array<{ id: SavedView; label: string }> = [
    { id: "all", label: "All" },
    { id: "revenue", label: "Revenue" },
    { id: "customer-risk", label: "Customer Risk" },
    { id: "incidents", label: "Incidents" },
    { id: "growth", label: "Growth" },
];
const CUSTOM_VIEW_STORAGE_KEY = "god:command-center:presets:fallback:v1";
const LAST_SELECTION_STORAGE_KEY = "god:command-center:last:v1";

function normalizeView(value: string | null): SavedView {
    if (value === "revenue" || value === "customer-risk" || value === "incidents" || value === "growth") return value;
    return "all";
}

function normalizeRange(value: string | null): OverviewRange {
    if (value === "7d" || value === "90d") return value;
    return "30d";
}

function rangeWindowLabel(range: OverviewRange): string {
    if (range === "7d") return "7 days";
    if (range === "90d") return "90 days";
    return "30 days";
}

function isSavedPreset(value: unknown): value is SavedPreset {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.id === "string"
        && typeof candidate.name === "string"
        && typeof candidate.view === "string"
        && typeof candidate.range === "string"
        && ["all", "revenue", "customer-risk", "incidents", "growth"].includes(candidate.view)
        && ["7d", "30d", "90d"].includes(candidate.range)
    );
}

function toneBorder(tone: Tone): string {
    if (tone === "danger") return "border-red-900/70";
    if (tone === "warning") return "border-amber-900/70";
    return "border-gray-800";
}

function severityStyles(severity: Severity): string {
    if (severity === "critical") return "border-red-900/70 bg-red-950/20 text-red-200";
    if (severity === "high") return "border-amber-900/70 bg-amber-950/20 text-amber-200";
    return "border-gray-800 bg-gray-950/50 text-gray-200";
}

function formatLastUpdated(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatShortDate(iso: string | null): string {
    if (!iso) return "No date";
    return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

function formatRelative(iso: string | null): string {
    if (!iso) return "No activity";
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60_000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function withRangeQuery(href: string, range: OverviewRange): string {
    if (!href.startsWith("/god")) return href;
    const url = new URL(href, "http://localhost");
    url.searchParams.set("range", range);
    return `${url.pathname}${url.search}`;
}

function TrendIndicator({ value }: { value?: number | null }) {
    if (value === null || value === undefined) {
        return <span className="text-xs text-gray-500">No prior baseline</span>;
    }
    if (value === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Minus className="w-3 h-3" />
                Flat
            </span>
        );
    }
    const positive = value > 0;
    return (
        <span className={cn(
            "inline-flex items-center gap-1 text-xs",
            positive ? "text-emerald-300" : "text-red-300",
        )}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {positive ? "+" : ""}{value}%
        </span>
    );
}

function MetricCard({ metric, range }: { metric: OverviewData["summary_kpis"][number]; range: OverviewRange }) {
    const content = (
        <div className={cn(
            "rounded-lg border bg-gray-900 px-4 py-4 transition-colors",
            toneBorder(metric.tone),
            metric.href && "hover:border-gray-700",
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                </div>
                <TrendIndicator value={metric.trend_pct} />
            </div>
            <p className="mt-3 text-sm text-gray-500">{metric.detail}</p>
        </div>
    );

    if (!metric.href) return content;
    return <Link href={withRangeQuery(metric.href, range)}>{content}</Link>;
}

function DeltaCard({ item, range }: { item: OverviewData["delta_strip"][number]; range: OverviewRange }) {
    const content = (
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 transition-colors hover:border-gray-700">
            <p className="text-xs text-gray-500">{item.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
                <span className="text-xl font-semibold text-white">{item.value}</span>
                <span className="text-xs text-gray-500">{item.comparison}</span>
            </div>
        </div>
    );

    if (!item.href) return content;
    return <Link href={withRangeQuery(item.href, range)}>{content}</Link>;
}

function iconForActionLabel(label: string) {
    if (label === "Open incident") return TriangleAlert;
    if (label === "Respond to ticket") return LifeBuoy;
    if (label === "Open collections item") return ReceiptText;
    if (label === "Review spend") return Wallet;
    if (label === "Open queues") return Activity;
    if (label === "Collections") return ReceiptText;
    if (label === "Error events") return TriangleAlert;
    if (label === "Support queue") return LifeBuoy;
    if (label === "Health monitor") return Activity;
    if (label === "Cost dashboard") return Wallet;
    if (label === "Send announcement") return Megaphone;
    return Power;
}

function buildContextActions(item: OverviewData["priority_inbox"][number] | null, range: OverviewRange): ActionItem[] {
    if (!item) return [];
    if (item.kind === "incident") {
        return [
            { label: "Open incident", href: withRangeQuery(item.href, range) },
            { label: "Error events", href: withRangeQuery("/god/errors?status=open", range) },
        ];
    }
    if (item.kind === "support") {
        return [
            { label: "Respond to ticket", href: withRangeQuery(item.href, range) },
            { label: "Support queue", href: withRangeQuery("/god/support?status=open", range) },
        ];
    }
    if (item.kind === "collection_invoice" || item.kind === "collection_proposal") {
        return [
            { label: "Open collections item", href: withRangeQuery(item.href, range) },
            { label: "Collections", href: withRangeQuery("/god/collections?tab=invoices", range) },
        ];
    }
    if (item.kind === "queue") {
        return [
            { label: "Open queues", href: withRangeQuery("/god/monitoring?focus=queues", range) },
            { label: "Health monitor", href: withRangeQuery("/god/monitoring", range) },
        ];
    }
    if (item.kind === "cost") {
        return [
            { label: "Review spend", href: withRangeQuery(item.href, range) },
            { label: "Cost dashboard", href: withRangeQuery("/god/costs", range) },
        ];
    }
    return [];
}

function CurrentPosturePanel({
    data,
    showIncidents,
    showRevenue,
    showCustomerRisk,
    showGrowth,
    selectedRange,
    className,
}: {
    data: OverviewData;
    showIncidents: boolean;
    showRevenue: boolean;
    showCustomerRisk: boolean;
    showGrowth: boolean;
    selectedRange: OverviewRange;
    className?: string;
}) {
    return (
        <section className={cn("overflow-hidden rounded-lg border border-gray-800 bg-gray-900", className)}>
            <div className="border-b border-gray-800 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-medium text-white">Current posture</h2>
                </div>
            </div>
            <div className="space-y-3 p-4 text-sm">
                {showIncidents && (
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 w-4 h-4 text-red-300" />
                        <p className="text-gray-300">
                            {data.ops_health.incidents.open_fatal_errors} fatal issues and {data.ops_health.incidents.open_errors} total open errors are live right now.
                        </p>
                    </div>
                )}
                {showRevenue && (
                    <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 w-4 h-4 text-amber-300" />
                        <p className="text-gray-300">
                            {data.revenue_risk.overdue_count} overdue invoices and {data.revenue_risk.expiring_proposals_count} proposals are the main revenue risks in the next 72 hours.
                        </p>
                    </div>
                )}
                {showCustomerRisk && (
                    <div className="flex items-start gap-3">
                        <Zap className="mt-0.5 w-4 h-4 text-blue-300" />
                        <p className="text-gray-300">
                            {data.watchlists.ai_spend_orgs[0]
                                ? `${data.watchlists.ai_spend_orgs[0].name} is the highest AI spend org this month at $${data.watchlists.ai_spend_orgs[0].spend_usd.toFixed(2)}.`
                                : "AI spend is not reporting yet."}
                        </p>
                    </div>
                )}
                {showGrowth && (
                    <div className="flex items-start gap-3">
                        <TrendingUp className="mt-0.5 w-4 h-4 text-emerald-300" />
                        <p className="text-gray-300">
                            {data.growth.signups_last_30d} signups and {data.growth.new_orgs_last_30d} new orgs landed in the last {rangeWindowLabel(selectedRange)}.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

interface QuickUser { id: string; full_name: string | null; email: string | null; role: string | null; org_name: string | null; }

export default function GodCommandCenter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast, showSuccess, showError, dismiss } = useActionToast();
    const [suspendTargetId, setSuspendTargetId] = useState<string | null>(null);
    const [suspending, setSuspending] = useState(false);
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [customViews, setCustomViews] = useState<SavedPreset[]>([]);
    const [presetsLoaded, setPresetsLoaded] = useState(false);
    const [savingPreset, setSavingPreset] = useState(false);
    const [focusedInboxId, setFocusedInboxId] = useState<string | null>(null);
    const currentView = normalizeView(searchParams.get("view"));
    const currentRange = normalizeRange(searchParams.get("range"));

    // --- Quick Impersonate from Home ---
    const [impSearch, setImpSearch] = useState("");
    const [impResults, setImpResults] = useState<QuickUser[]>([]);
    const [impSearching, setImpSearching] = useState(false);
    const [impTarget, setImpTarget] = useState<QuickUser | null>(null);
    const [impersonating, setImpersonating] = useState(false);
    const [showImpConfirm, setShowImpConfirm] = useState(false);
    const impDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchImpUsers = useCallback(async (q: string) => {
        if (!q.trim()) { setImpResults([]); return; }
        setImpSearching(true);
        try {
            const res = await fetch(`/api/superadmin/users/directory?search=${encodeURIComponent(q)}&limit=8`);
            if (res.ok) {
                const json = await res.json();
                setImpResults((json.users ?? []).map((u: { id: string; full_name: string | null; email: string | null; role: string | null; org_name: string | null }) => ({
                    id: u.id,
                    full_name: u.full_name,
                    email: u.email,
                    role: u.role,
                    org_name: u.org_name,
                })));
            }
        } catch { /* silent */ } finally { setImpSearching(false); }
    }, []);

    async function handleHomeImpersonate() {
        if (!impTarget) return;
        setImpersonating(true);
        try {
            const res = await authedFetch(`/api/superadmin/users/${impTarget.id}/impersonate`, { method: "POST" });
            if (res.ok) {
                const d = await res.json();
                if (d.data?.magic_link) { window.location.href = d.data.magic_link; return; }
                if (d.magic_link) { window.location.href = d.magic_link; return; }
                showError("Invalid impersonation response");
            } else {
                const json = await res.json();
                showError(json.error ?? "Failed to impersonate");
            }
        } catch { showError("Network error"); }
        finally { setImpersonating(false); setShowImpConfirm(false); setImpTarget(null); setImpSearch(""); setImpResults([]); }
    }

    useEffect(() => {
        let cancelled = false;
        const loadPresets = async () => {
            try {
                const response = await fetch("/api/superadmin/overview/presets", { cache: "no-store" });
                if (response.ok) {
                    const payload = await response.json() as { presets?: unknown[] };
                    const serverPresets = Array.isArray(payload.presets)
                        ? payload.presets.filter(isSavedPreset).slice(0, 8)
                        : [];
                    if (!cancelled) {
                        setCustomViews(serverPresets);
                        localStorage.setItem(CUSTOM_VIEW_STORAGE_KEY, JSON.stringify(serverPresets));
                        setPresetsLoaded(true);
                    }
                    return;
                }
            } catch {
                // fall back to local storage cache when API is unavailable
            }
            try {
                const raw = localStorage.getItem(CUSTOM_VIEW_STORAGE_KEY);
                if (!raw) {
                    if (!cancelled) setCustomViews([]);
                } else {
                    const parsed = JSON.parse(raw);
                    if (!cancelled && Array.isArray(parsed)) {
                        setCustomViews(parsed.filter(isSavedPreset).slice(0, 8));
                    }
                }
            } catch {
                if (!cancelled) setCustomViews([]);
            } finally {
                if (!cancelled) setPresetsLoaded(true);
            }
        };
        void loadPresets();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(LAST_SELECTION_STORAGE_KEY, JSON.stringify({ view: currentView, range: currentRange }));
    }, [currentRange, currentView]);

    useEffect(() => {
        const hasView = searchParams.has("view");
        const hasRange = searchParams.has("range");
        if (hasView && hasRange) return;
        try {
            const raw = localStorage.getItem(LAST_SELECTION_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { view?: string; range?: string } | null;
            if (!parsed) return;
            const params = new URLSearchParams(searchParams.toString());
            if (!hasView) {
                const view = normalizeView(parsed.view ?? null);
                if (view === "all") params.delete("view");
                else params.set("view", view);
            }
            if (!hasRange) {
                params.set("range", normalizeRange(parsed.range ?? null));
            }
            const next = params.toString();
            if (next !== searchParams.toString()) {
                router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
            }
        } catch {
            // no-op
        }
    }, [pathname, router, searchParams]);

    const fetchOverview = useCallback(async (force = false) => {
        setLoading(true);
        try {
            const query = force ? `&_t=${Date.now()}` : '';
            const response = await fetch(`/api/superadmin/overview?range=${currentRange}${query}`);
            if (!response.ok) return;
            setData(await response.json());
        } finally {
            setLoading(false);
        }
    }, [currentRange]);

    async function handleSuspendOrg() {
        if (!suspendTargetId) return;
        setSuspending(true);
        try {
            const res = await authedFetch("/api/superadmin/settings/org-suspend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ org_id: suspendTargetId, action: "suspend", reason: "Suspended from Command Center watchlist" }),
            });
            if (res.ok) {
                showSuccess("Organization suspended instantly.");
                await fetchOverview(true);
            } else {
                const json = await res.json();
                showError(json.error ?? "Failed to suspend org");
            }
        } catch {
            showError("Network error suspending org");
        } finally {
            setSuspending(false);
            setSuspendTargetId(null);
        }
    }

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const setView = useCallback((view: SavedView) => {
        const params = new URLSearchParams(searchParams.toString());
        if (view === "all") params.delete("view");
        else params.set("view", view);
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);

    const setRange = useCallback((range: OverviewRange) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", range);
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);

    const persistPresets = useCallback(async (nextPresets: SavedPreset[]) => {
        setCustomViews(nextPresets);
        localStorage.setItem(CUSTOM_VIEW_STORAGE_KEY, JSON.stringify(nextPresets));
        if (!presetsLoaded) return;
        setSavingPreset(true);
        try {
            const response = await authedFetch("/api/superadmin/overview/presets", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ presets: nextPresets }),
            });
            if (!response.ok) return;
            const payload = await response.json() as { presets?: unknown[] };
            if (Array.isArray(payload.presets)) {
                const normalized = payload.presets.filter(isSavedPreset).slice(0, 8);
                setCustomViews(normalized);
                localStorage.setItem(CUSTOM_VIEW_STORAGE_KEY, JSON.stringify(normalized));
            }
        } finally {
            setSavingPreset(false);
        }
    }, [presetsLoaded]);

    const saveCurrentPreset = useCallback(() => {
        const defaultName = `${SAVED_VIEWS.find((view) => view.id === currentView)?.label ?? "View"} · ${currentRange}`;
        const name = window.prompt("Save current view as:", defaultName)?.trim();
        if (!name) return;
        const preset: SavedPreset = {
            id: `preset-${Date.now()}`,
            name,
            view: currentView,
            range: currentRange,
        };
        const next = [
            preset,
            ...customViews.filter((item) => item.name.toLowerCase() !== name.toLowerCase()),
        ].slice(0, 8);
        void persistPresets(next);
    }, [currentRange, currentView, customViews, persistPresets]);

    const applyPreset = useCallback((preset: SavedPreset) => {
        const params = new URLSearchParams(searchParams.toString());
        if (preset.view === "all") params.delete("view");
        else params.set("view", preset.view);
        params.set("range", preset.range);
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);

    const deletePreset = useCallback((presetId: string) => {
        void persistPresets(customViews.filter((item) => item.id !== presetId));
    }, [customViews, persistPresets]);

    const showRevenue = currentView === "all" || currentView === "revenue";
    const showGrowth = currentView === "all" || currentView === "growth";
    const showCustomerRisk = currentView === "all" || currentView === "customer-risk";
    const showIncidents = currentView === "all" || currentView === "incidents";

    useEffect(() => {
        if (!data?.priority_inbox.length) {
            setFocusedInboxId(null);
            return;
        }
        if (!focusedInboxId || !data.priority_inbox.some((item) => item.id === focusedInboxId)) {
            setFocusedInboxId(data.priority_inbox[0].id);
        }
    }, [data?.priority_inbox, focusedInboxId]);

    const focusedInboxItem = useMemo(
        () => data?.priority_inbox.find((item) => item.id === focusedInboxId) ?? null,
        [data?.priority_inbox, focusedInboxId],
    );
    const contextActions = useMemo(() => buildContextActions(focusedInboxItem, currentRange), [currentRange, focusedInboxItem]);

    if (!data && loading) {
        return (
            <div className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                        <div className="h-40 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="h-64 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="h-48 rounded-lg bg-gray-900 animate-pulse" />
                    </div>
                    <div className="space-y-4">
                        <div className="h-36 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="h-56 rounded-lg bg-gray-900 animate-pulse" />
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="h-96 rounded-lg bg-gray-900 animate-pulse" />
                            <div className="h-80 rounded-lg bg-gray-900 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-lg border border-red-900/70 bg-red-950/20 p-6 text-sm text-red-200">
                God mode could not load the live overview payload.
            </div>
        );
    }

    return (
        <div className="space-y-4 min-w-0">
            {/* ── Power Actions Bar ── */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-900/50 bg-indigo-950/20 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Power Actions</span>
                {/* User search + impersonate */}
                <div className="relative flex-1 min-w-[220px] max-w-xs">
                    <div className="flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5">
                        {impSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" /> : <Search className="h-3.5 w-3.5 text-gray-500" />}
                        <input
                            type="text"
                            value={impSearch}
                            placeholder="Find user to impersonate…"
                            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                            onChange={(e) => {
                                setImpSearch(e.target.value);
                                if (impDebounce.current) clearTimeout(impDebounce.current);
                                impDebounce.current = setTimeout(() => searchImpUsers(e.target.value), 300);
                            }}
                        />
                        {impSearch && (
                            <button onClick={() => { setImpSearch(""); setImpResults([]); setImpTarget(null); }}>
                                <X className="h-3.5 w-3.5 text-gray-500 hover:text-white" />
                            </button>
                        )}
                    </div>
                    {impResults.length > 0 && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-gray-700 bg-gray-900 shadow-xl">
                            {impResults.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => { setImpTarget(u); setImpSearch(u.email ?? u.full_name ?? u.id); setImpResults([]); setShowImpConfirm(true); }}
                                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-800"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{u.full_name ?? "No name"}</p>
                                        <p className="text-xs text-gray-400 truncate">{u.email} · {u.role ?? "user"}</p>
                                        {u.org_name && <p className="text-xs text-gray-500 truncate">{u.org_name}</p>}
                                    </div>
                                    <LogIn className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Link href="/god/directory" className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white">
                    <Users className="h-3.5 w-3.5" /> Directory
                </Link>
                <Link href="/god/announcements" className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white">
                    <Megaphone className="h-3.5 w-3.5" /> Announcement
                </Link>
                <Link href="/god/settings" className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:text-white">
                    <Settings className="h-3.5 w-3.5" /> Settings
                </Link>
            </div>
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">{data.header.title}</h1>
                    <p className="mt-1 text-sm text-gray-400">{data.header.subtitle}</p>
                    <p className="mt-2 text-xs text-gray-500">Last updated {formatLastUpdated(data.generated_at)}</p>
                </div>

                <div className="flex w-full flex-col gap-2 2xl:w-auto 2xl:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="overflow-x-auto pb-1">
                            <div className="flex w-max items-center gap-1 rounded-md border border-gray-800 bg-gray-900 p-1">
                                {SAVED_VIEWS.map((view) => (
                                    <button
                                        key={view.id}
                                        onClick={() => setView(view.id)}
                                        className={cn(
                                            "rounded px-2.5 py-1.5 text-xs transition-colors",
                                            currentView === view.id
                                                ? "bg-gray-800 text-white"
                                                : "text-gray-400 hover:text-gray-200",
                                        )}
                                    >
                                        {view.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <TimeRangePicker value={currentRange} onChange={(value) => setRange(value as OverviewRange)} />
                        <button
                            onClick={saveCurrentPreset}
                            disabled={savingPreset}
                            className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                        >
                            {savingPreset ? "Saving…" : "Save View"}
                        </button>
                    </div>
                    {customViews.length > 0 && (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            {customViews.map((preset) => (
                                <div key={preset.id} className="inline-flex items-center overflow-hidden rounded-md border border-gray-800 bg-gray-900">
                                    <button
                                        onClick={() => applyPreset(preset)}
                                        className="px-2.5 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                                    >
                                        {preset.name}
                                    </button>
                                    <button
                                        onClick={() => deletePreset(preset.id)}
                                        className="border-l border-gray-800 px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-800 hover:text-red-300"
                                        aria-label={`Delete ${preset.name} preset`}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={withRangeQuery("/god/support?status=open", currentRange)}
                            className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                        >
                            Support queue
                        </Link>
                        <Link
                            href={withRangeQuery("/god/errors?status=open", currentRange)}
                            className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                        >
                            Incidents
                        </Link>
                        <Link
                            href={withRangeQuery("/god/costs", currentRange)}
                            className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                        >
                            Costs
                        </Link>
                        <Link
                            href={withRangeQuery("/god/collections?tab=invoices", currentRange)}
                            className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                        >
                            Collections
                        </Link>
                        <button
                            onClick={() => fetchOverview(true)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="min-w-0 space-y-4">
                    <CurrentPosturePanel
                        data={data}
                        showIncidents={showIncidents}
                        showRevenue={showRevenue}
                        showCustomerRisk={showCustomerRisk}
                        showGrowth={showGrowth}
                        selectedRange={currentRange}
                    />
                    <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                        <div className="border-b border-gray-800 px-4 py-3">
                            <h2 className="text-sm font-medium text-white">Priority inbox</h2>
                            <p className="mt-1 text-xs text-gray-500">What needs action next.</p>
                        </div>
                        <div className="p-3">
                            {data.priority_inbox.length === 0 ? (
                                <div className="rounded-md border border-emerald-900/50 bg-emerald-950/20 px-3 py-4 text-sm text-emerald-200">
                                    No urgent work is stacked right now.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {data.priority_inbox.map((item) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "rounded-md border px-3 py-3 transition-colors",
                                                severityStyles(item.severity),
                                                focusedInboxItem?.id === item.id && "ring-1 ring-amber-400/70",
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white">{item.title}</p>
                                                    <p className="mt-1 text-xs text-gray-400">{item.detail}</p>
                                                </div>
                                                <span className="text-[11px] text-gray-500">{item.age_label}</span>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <button
                                                    onClick={() => setFocusedInboxId(item.id)}
                                                    className={cn(
                                                        "rounded border px-2 py-1 text-xs transition-colors",
                                                        focusedInboxItem?.id === item.id
                                                            ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                                                            : "border-gray-700 bg-gray-900/70 text-gray-300 hover:border-gray-600",
                                                    )}
                                                >
                                                    {focusedInboxItem?.id === item.id ? "Focused" : "Focus"}
                                                </button>
                                                <Link href={withRangeQuery(item.href, currentRange)} className="inline-flex items-center gap-1 text-xs text-gray-300 transition-colors hover:text-white">
                                                    {item.action_label}
                                                    <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                        <div className="border-b border-gray-800 px-4 py-3">
                            <h2 className="text-sm font-medium text-white">Newest orgs</h2>
                        </div>
                        <div className="p-3">
                            <div className="space-y-2">
                                {data.watchlists.newest_orgs.map((org) => (
                                    <Link
                                        key={org.org_id}
                                        href={org.href}
                                        className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-gray-950"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-white">{org.name}</p>
                                            <p className="text-xs text-gray-500">{org.tier} · {formatShortDate(org.created_at)}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="min-w-0 space-y-4">
                    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="min-w-0 space-y-4">
                            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {data.summary_kpis.map((metric) => (
                                    <MetricCard key={metric.id} metric={metric} range={currentRange} />
                                ))}
                            </section>

                            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                {data.delta_strip.map((item) => (
                                    <DeltaCard key={item.id} item={item} range={currentRange} />
                                ))}
                            </section>

                            {(showGrowth || showRevenue) && (
                                <section className={cn(
                                    "grid min-w-0 gap-4",
                                    showGrowth && showRevenue
                                        ? "xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
                                        : "grid-cols-1",
                                )}>
                                    {showGrowth && (
                                        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                            <div className="border-b border-gray-800 px-4 py-3">
                                                <h2 className="text-sm font-medium text-white">Growth</h2>
                                                <p className="mt-1 text-xs text-gray-500">Signups across the last {rangeWindowLabel(currentRange)}.</p>
                                            </div>
                                            <div className="px-4 pb-4 pt-3">
                                                <div className="grid gap-3 md:grid-cols-3">
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-500">Signups, {currentRange}</p>
                                                        <p className="mt-1 text-xl font-semibold text-white">{data.growth.signups_last_30d}</p>
                                                    </div>
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-500">Average per day</p>
                                                        <p className="mt-1 text-xl font-semibold text-white">{data.growth.avg_daily_signups}</p>
                                                    </div>
                                                    <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                        <p className="text-xs text-gray-500">New orgs, {currentRange}</p>
                                                        <p className="mt-1 text-xl font-semibold text-white">{data.growth.new_orgs_last_30d}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <TrendChart
                                                        data={data.growth.signup_trend_30d}
                                                        series={[{ key: "signups", label: "Signups", color: "#f59e0b" }]}
                                                        type="area"
                                                        height={220}
                                                        onClickBar={(entry) => {
                                                            if (entry.date) {
                                                                router.push(`/god/signups?range=${currentRange}&date=${entry.date}`);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {showRevenue && (
                                        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                            <div className="border-b border-gray-800 px-4 py-3">
                                                <h2 className="text-sm font-medium text-white">Revenue leakage</h2>
                                                <p className="mt-1 text-xs text-gray-500">Outstanding money and expiring deal flow.</p>
                                            </div>
                                            <div className="space-y-4 p-4">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <Link href={withRangeQuery("/god/collections?tab=invoices", currentRange)} className="rounded-md border border-red-900/60 bg-red-950/20 px-3 py-3 transition-colors hover:border-red-800/70">
                                                        <p className="text-xs text-gray-400">Overdue invoices</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.overdue_amount}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{data.revenue_risk.overdue_count} invoices</p>
                                                    </Link>
                                                    <Link href={withRangeQuery("/god/collections?tab=invoices", currentRange)} className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 transition-colors hover:border-gray-700">
                                                        <p className="text-xs text-gray-400">Due this week</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.due_this_week_amount}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{data.revenue_risk.due_this_week_count} invoices</p>
                                                    </Link>
                                                    <Link href={withRangeQuery("/god/collections?tab=proposals", currentRange)} className="rounded-md border border-amber-900/60 bg-amber-950/20 px-3 py-3 transition-colors hover:border-amber-800/70">
                                                        <p className="text-xs text-gray-400">Expiring proposals</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.expiring_proposals_amount}</p>
                                                        <p className="mt-1 text-xs text-gray-500">{data.revenue_risk.expiring_proposals_count} proposals in 72h</p>
                                                    </Link>
                                                    <Link href={withRangeQuery("/god/support?status=open", currentRange)} className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 transition-colors hover:border-gray-700">
                                                        <p className="text-xs text-gray-400">Open support</p>
                                                        <p className="mt-1 text-lg font-semibold text-white">{data.revenue_risk.open_support_count}</p>
                                                        <p className="mt-1 text-xs text-gray-500">Support load affecting customer trust</p>
                                                    </Link>
                                                </div>

                                                <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-500">Oldest overdue invoices</p>
                                                        <div className="mt-2 space-y-2">
                                                            {data.revenue_risk.top_overdue_invoices.length === 0 ? (
                                                                <p className="text-sm text-gray-500">No overdue invoices.</p>
                                                            ) : (
                                                                data.revenue_risk.top_overdue_invoices.map((invoice) => (
                                                                    <Link
                                                                        key={invoice.id}
                                                                        href={withRangeQuery(`/god/collections?tab=invoices&invoiceId=${invoice.id}`, currentRange)}
                                                                        className="block rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 transition-colors hover:border-gray-700"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <p className="text-sm text-white">#{invoice.invoice_number ?? "—"} · {invoice.org_name}</p>
                                                                                <p className="mt-1 text-xs text-gray-500">Due {formatShortDate(invoice.due_date)}</p>
                                                                            </div>
                                                                            <span className="text-sm text-red-200">{invoice.amount}</span>
                                                                        </div>
                                                                    </Link>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-xs text-gray-500">Proposals expiring next</p>
                                                        <div className="mt-2 space-y-2">
                                                            {data.revenue_risk.expiring_proposals.length === 0 ? (
                                                                <p className="text-sm text-gray-500">No proposals expiring in the next 72 hours.</p>
                                                            ) : (
                                                                data.revenue_risk.expiring_proposals.map((proposal) => (
                                                                    <Link
                                                                        key={proposal.id}
                                                                        href={withRangeQuery(`/god/collections?tab=proposals&proposalId=${proposal.id}`, currentRange)}
                                                                        className="block rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 transition-colors hover:border-gray-700"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-sm text-white">{proposal.title}</p>
                                                                                <p className="mt-1 text-xs text-gray-500">{proposal.org_name} · expires {formatShortDate(proposal.expires_at)}</p>
                                                                            </div>
                                                                            <span className="text-sm text-amber-200">{proposal.value}</span>
                                                                        </div>
                                                                    </Link>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {showCustomerRisk && (
                                <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                    <div className="border-b border-gray-800 px-4 py-3">
                                        <h2 className="text-sm font-medium text-white">Customer risk watchlist</h2>
                                        <p className="mt-1 text-xs text-gray-500">Explicit risk signals by organization, not synthetic scoring.</p>
                                    </div>
                                    <div className="grid min-w-0 gap-3 p-4 xl:grid-cols-2">
                                        {data.watchlists.customer_risk_orgs.length === 0 ? (
                                            <p className="text-sm text-gray-500">No orgs currently meet the risk thresholds.</p>
                                        ) : (
                                            data.watchlists.customer_risk_orgs.map((org) => (
                                                <div
                                                    key={org.org_id}
                                                    className="rounded-md border border-gray-800 bg-gray-950/50 p-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <Link href={org.href} className="text-sm font-medium text-white hover:underline">{org.name}</Link>
                                                            <p className="mt-1 text-xs text-gray-500">
                                                                {org.tier} · {org.open_tickets} open tickets · oldest {formatRelative(org.oldest_ticket_at)}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className="text-xs text-gray-500">{org.urgent_tickets} urgent</span>
                                                            <button 
                                                                onClick={(e) => { e.preventDefault(); setSuspendTargetId(org.org_id); }}
                                                                className="rounded bg-red-950/50 border border-red-900/50 px-2 py-1 text-xs text-red-300 hover:bg-red-900/50 transition-colors"
                                                            >
                                                                Suspend
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                        {org.overdue_amount > 0 && (
                                                            <span className="rounded bg-red-950/30 px-2 py-1 text-xs text-red-200">
                                                                ₹{org.overdue_amount.toLocaleString("en-IN")} overdue
                                                            </span>
                                                        )}
                                                        {org.expiring_value > 0 && (
                                                            <span className="rounded bg-amber-950/30 px-2 py-1 text-xs text-amber-200">
                                                                ₹{org.expiring_value.toLocaleString("en-IN")} expiring
                                                            </span>
                                                        )}
                                                        {org.ai_spend_usd > 0 && (
                                                            <span className="rounded bg-blue-950/30 px-2 py-1 text-xs text-blue-200">
                                                                ${org.ai_spend_usd.toFixed(2)} AI spend
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-3 text-xs text-gray-400">{org.risk_flags.join(" · ")}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            )}

                            {(currentView === "all" || currentView === "customer-risk" || currentView === "revenue") && (
                                <section className="grid gap-4 xl:grid-cols-2">
                                    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                        <div className="border-b border-gray-800 px-4 py-3">
                                            <h2 className="text-sm font-medium text-white">AI spend watchlist</h2>
                                        </div>
                                        <div className="p-3">
                                            <div className="space-y-2">
                                                {data.watchlists.ai_spend_orgs.length === 0 ? (
                                                    <p className="px-1 py-2 text-sm text-gray-500">No AI spend data yet.</p>
                                                ) : (
                                                    data.watchlists.ai_spend_orgs.map((org) => (
                                                        <div
                                                            key={org.org_id}
                                                            className="flex flex-col gap-2 rounded-md border border-gray-800 p-3"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div>
                                                                    <Link href={org.href} className="text-sm font-medium text-white hover:underline">{org.name}</Link>
                                                                    <p className="mt-1 text-xs text-gray-500">{org.requests.toLocaleString()} requests · {org.tier}</p>
                                                                </div>
                                                                <span className="text-sm text-white">${org.spend_usd.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <button 
                                                                    onClick={(e) => { e.preventDefault(); setSuspendTargetId(org.org_id); }}
                                                                    className="rounded bg-red-950/50 border border-red-900/50 px-2 py-1 text-xs text-red-300 hover:bg-red-900/50 transition-colors"
                                                                >
                                                                    Suspend
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                        <div className="border-b border-gray-800 px-4 py-3">
                                            <h2 className="text-sm font-medium text-white">Support pressure by org</h2>
                                        </div>
                                        <div className="p-3">
                                            <div className="space-y-2">
                                                {data.watchlists.support_load_orgs.length === 0 ? (
                                                    <p className="px-1 py-2 text-sm text-gray-500">No active support backlog.</p>
                                                ) : (
                                                    data.watchlists.support_load_orgs.map((org) => (
                                                        <Link
                                                            key={org.org_id}
                                                            href={org.href}
                                                            className="flex items-start justify-between rounded-md border border-gray-800 px-3 py-3 transition-colors hover:border-gray-700"
                                                        >
                                                            <div>
                                                                <p className="text-sm text-white">{org.name}</p>
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    {org.open} open · {org.urgent} urgent/high · oldest {formatRelative(org.oldest_at)}
                                                                </p>
                                                            </div>
                                                            <ArrowRight className="mt-0.5 w-4 h-4 text-gray-600" />
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className="min-w-0 space-y-4">
                            <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                <div className="border-b border-gray-800 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Ops health</h2>
                                    <p className="mt-1 text-xs text-gray-500">Only live service and queue signals.</p>
                                </div>
                                <div className="space-y-4 p-4">
                                    <div className="space-y-2">
                                        {data.ops_health.services.map((service) => (
                                            <div
                                                key={service.id}
                                                className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-950/50 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm text-white">{service.label}</p>
                                                    <p className="text-xs text-gray-500">{service.detail}</p>
                                                </div>
                                                <StatusDot status={service.status} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Notifications pending</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.queues.notifications_pending}</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Dead letters</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.queues.dead_letters}</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Oldest pending</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.queues.oldest_pending_minutes}m</p>
                                        </div>
                                        <div className="rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3">
                                            <p className="text-xs text-gray-500">Resolved this week</p>
                                            <p className="mt-1 text-xl font-semibold text-white">{data.ops_health.incidents.resolved_this_week}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href={withRangeQuery("/god/monitoring?focus=queues", currentRange)}
                                        className="inline-flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white"
                                    >
                                        Open health monitor
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                <div className="border-b border-gray-800 px-4 py-3">
                                    <h2 className="text-sm font-medium text-white">Quick actions</h2>
                                </div>
                                <div className="grid gap-2 p-3">
                                    {contextActions.length > 0 && (
                                        <div className="rounded-md border border-amber-900/40 bg-amber-950/10 p-2">
                                            <p className="px-1 pb-2 text-[11px] uppercase tracking-wide text-amber-300/80">
                                                Focused: {focusedInboxItem?.title ?? "priority item"}
                                            </p>
                                            <div className="grid gap-2">
                                                {contextActions.map((action) => {
                                                    const Icon = iconForActionLabel(action.label);
                                                    return (
                                                        <Link
                                                            key={`context-${action.label}-${action.href}`}
                                                            href={action.href}
                                                            className="inline-flex items-center justify-between rounded-md border border-amber-900/50 bg-amber-950/20 px-3 py-2.5 text-sm text-amber-100 transition-colors hover:border-amber-700"
                                                        >
                                                            <span className="inline-flex items-center gap-2">
                                                                <Icon className="h-4 w-4" />
                                                                {action.label}
                                                            </span>
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {data.quick_actions.map((action) => {
                                        const Icon = iconForActionLabel(action.label);
                                        return (
                                            <Link
                                                key={action.href}
                                                href={withRangeQuery(action.href, currentRange)}
                                                className={cn(
                                                    "inline-flex items-center justify-between rounded-md border px-3 py-3 text-sm transition-colors",
                                                    action.tone === "danger"
                                                        ? "border-red-900/70 bg-red-950/20 text-red-200 hover:border-red-800"
                                                        : "border-gray-800 bg-gray-950/50 text-gray-300 hover:border-gray-700 hover:text-white",
                                                )}
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <Icon className="w-4 h-4" />
                                                    {action.label}
                                                </span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        );
                                    })}
                                    <Link
                                        href="/god/directory"
                                        className="inline-flex items-center justify-between rounded-md border border-indigo-900/50 bg-indigo-950/20 px-3 py-3 text-sm text-indigo-200 transition-colors hover:border-indigo-800"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            User Directory
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href="/god/announcements"
                                        className="inline-flex items-center justify-between rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Megaphone className="w-4 h-4" />
                                            Send Announcement
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href="/god/settings"
                                        className="inline-flex items-center justify-between rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Settings className="w-4 h-4" />
                                            Platform Settings
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <a
                                        href="https://us.posthog.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-between rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4" />
                                            PostHog
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                                <div className="border-b border-gray-800 px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-medium text-white">Decision log</h2>
                                            <p className="mt-1 text-xs text-gray-500">Recent superadmin actions and interventions.</p>
                                        </div>
                                        <Link href={withRangeQuery("/god/audit-log", currentRange)} className="text-xs text-gray-400 transition-colors hover:text-white">
                                            Open audit log
                                        </Link>
                                    </div>
                                </div>
                                <div className="space-y-2 p-3">
                                    {data.decision_log.length === 0 ? (
                                        <p className="px-1 py-2 text-sm text-gray-500">No recent platform actions logged yet.</p>
                                    ) : (
                                        data.decision_log.map((entry) => (
                                            <Link
                                                key={entry.id}
                                                href={withRangeQuery(entry.href, currentRange)}
                                                className="block rounded-md border border-gray-800 bg-gray-950/50 px-3 py-3 transition-colors hover:border-gray-700"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <ScrollText className="mt-0.5 w-4 h-4 text-gray-500" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white">{entry.action}</p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {entry.actor_name} · {entry.category.replace(/_/g, " ")} · {formatRelative(entry.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </div>
            {/* Impersonate confirm modal (from Power Actions bar) */}
            {showImpConfirm && impTarget && (
                <ConfirmDangerModal
                    open={true}
                    title={`Login as ${impTarget.email ?? impTarget.full_name}?`}
                    message={`This will replace your current superadmin session in this browser window. You will need to log out and sign back in as yourself to regain access.`}
                    onConfirm={handleHomeImpersonate}
                    onCancel={() => { setShowImpConfirm(false); setImpTarget(null); setImpSearch(""); setImpResults([]); }}
                    loading={impersonating}
                />
            )}

            {/* Suspend org confirmation */}
            {suspendTargetId && (
                <ConfirmDangerModal
                    open={true}
                    title="Suspend organization?"
                    message="This will immediately disable all access for this organization. They will not be able to log in until unsuspended."
                    onConfirm={handleSuspendOrg}
                    onCancel={() => setSuspendTargetId(null)}
                    loading={suspending}
                />
            )}

            <ActionToast {...toast} onDismiss={dismiss} />
        </div>
    );
}
