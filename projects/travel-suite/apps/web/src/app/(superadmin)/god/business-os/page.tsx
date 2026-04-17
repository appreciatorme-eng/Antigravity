"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    ArrowRight,
    Bot,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    CircleAlert,
    ClipboardList,
    ExternalLink,
    Filter,
    Loader2,
    RefreshCw,
    Sparkles,
    UserPlus2,
} from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import { cn } from "@/lib/utils";
import type {
    BusinessOsAccountDetail,
    BusinessOsAccountRow,
    BusinessOsAiRecommendation,
    BusinessOsDailyBrief,
    BusinessOsWorkspace,
} from "@/lib/platform/business-os";
type Payload = BusinessOsWorkspace;
type QueueMode = "all" | "my_focus" | "unowned" | "due_today" | "approval_needed";

type AccountDraft = {
    owner_id: string;
    lifecycle_stage: string;
    health_band: string;
    activation_stage: string;
    next_action: string;
    next_action_due_at: string;
    renewal_at: string;
    playbook: string;
    notes: string;
};

type WorkItemDraft = {
    title: string;
    summary: string;
    severity: "low" | "medium" | "high" | "critical";
    due_at: string;
};

type CommsDraft = {
    sequence_type: "activation_rescue" | "viewed_not_approved" | "collections" | "incident_recovery" | "renewal_prep";
    channel: "email" | "whatsapp" | "in_app" | "mixed";
    next_follow_up_at: string;
    promise: string;
};

type CommitmentDraft = {
    title: string;
    detail: string;
    source: "support" | "sales" | "collections" | "incident" | "ops";
    severity: "low" | "medium" | "high" | "critical";
    due_at: string;
};

type MemoryNoteDraft = {
    category: "context" | "handoff" | "promise" | "support";
    title: string;
    body: string;
    pinned: boolean;
};

type ActivitySourceFilter = "all" | "business_os" | "business_os_ops_loop" | "business_os_autopilot" | "business_os_autopilot_approval" | "support_queue" | "support_response" | "system";

type ActivityFeedResponse = {
    events: BusinessOsAccountDetail["org_memory"]["recent_events"];
    next_cursor: string | null;
};

function toDateInput(value: string | null | undefined): string {
    if (!value) return "";
    return value.slice(0, 10);
}

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function priorityTone(score: number): string {
    if (score >= 100) return "text-red-300 border-red-900/80 bg-red-950/30";
    if (score >= 60) return "text-amber-300 border-amber-900/80 bg-amber-950/30";
    return "text-gray-300 border-gray-800 bg-gray-950/50";
}

function metricTone(kind: "danger" | "warning" | "neutral"): string {
    if (kind === "danger") return "border-red-900/70 bg-red-950/20";
    if (kind === "warning") return "border-amber-900/70 bg-amber-950/20";
    return "border-gray-800 bg-gray-950/40";
}

function duplicateAi(ai: BusinessOsAiRecommendation): BusinessOsAiRecommendation {
    return JSON.parse(JSON.stringify(ai)) as BusinessOsAiRecommendation;
}

function isDueToday(value: string | null | undefined): boolean {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
}

function matchesQueueMode(account: BusinessOsAccountRow, mode: QueueMode, currentUserId: string): boolean {
    if (mode === "my_focus") return account.account_state.owner_id === currentUserId;
    if (mode === "unowned") return !account.account_state.owner_id;
    if (mode === "due_today") return isDueToday(account.account_state.next_action_due_at);
    if (mode === "approval_needed") return account.pending_approval_count > 0;
    return true;
}

export default function BusinessOsPage() {
    const [data, setData] = useState<Payload | null>(null);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshingBrief, setRefreshingBrief] = useState(false);
    const [refreshingDrafts, setRefreshingDrafts] = useState(false);
    const [savingAccount, setSavingAccount] = useState(false);
    const [savingWorkItem, setSavingWorkItem] = useState(false);
    const [recordingOutcomeId, setRecordingOutcomeId] = useState<string | null>(null);
    const [savingComms, setSavingComms] = useState(false);
    const [savingCommitment, setSavingCommitment] = useState(false);
    const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null);
    const [activitySource, setActivitySource] = useState<ActivitySourceFilter>("all");
    const [activityFeed, setActivityFeed] = useState<BusinessOsAccountDetail["org_memory"]["recent_events"]>([]);
    const [activityCursor, setActivityCursor] = useState<string | null>(null);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [rightTab, setRightTab] = useState<"operate" | "growth">("operate");
    const [queueMode, setQueueMode] = useState<QueueMode>("all");
    const [filters, setFilters] = useState({
        owner: "all",
        health_band: "all",
        lifecycle_stage: "all",
        risk: "all",
        search: "",
        only_my_accounts: false,
        activation_risk: false,
    });
    const [accountDraft, setAccountDraft] = useState<AccountDraft>({
        owner_id: "",
        lifecycle_stage: "active",
        health_band: "healthy",
        activation_stage: "signed_up",
        next_action: "",
        next_action_due_at: "",
        renewal_at: "",
        playbook: "",
        notes: "",
    });
    const [workItemDraft, setWorkItemDraft] = useState<WorkItemDraft>({
        title: "",
        summary: "",
        severity: "medium",
        due_at: "",
    });
    const [memoryNoteDraft, setMemoryNoteDraft] = useState<MemoryNoteDraft>({
        category: "context",
        title: "",
        body: "",
        pinned: false,
    });
    const [commsDraft, setCommsDraft] = useState<CommsDraft>({
        sequence_type: "activation_rescue",
        channel: "mixed",
        next_follow_up_at: "",
        promise: "",
    });
    const [commitmentDraft, setCommitmentDraft] = useState<CommitmentDraft>({
        title: "",
        detail: "",
        source: "ops",
        severity: "medium",
        due_at: "",
    });

    async function loadData(signal?: AbortSignal) {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.owner !== "all") params.set("owner", filters.owner);
            if (filters.health_band !== "all") params.set("health_band", filters.health_band);
            if (filters.lifecycle_stage !== "all") params.set("lifecycle_stage", filters.lifecycle_stage);
            if (filters.risk !== "all") params.set("risk", filters.risk);
            if (filters.search.trim()) params.set("search", filters.search.trim());
            if (filters.only_my_accounts) params.set("only_my_accounts", "true");
            if (filters.activation_risk) params.set("activation_risk", "true");
            if (selectedOrgId) params.set("selected_org_id", selectedOrgId);
            const response = await authedFetch(`/api/superadmin/business-os?${params.toString()}`, { signal });
            if (!response.ok) throw new Error("Failed to load Business OS");
            const payload = await response.json() as Payload;
            setData(payload);
            if (!selectedOrgId && payload.selected_org_id) {
                setSelectedOrgId(payload.selected_org_id);
            }
        } catch (fetchError) {
            if ((fetchError as Error).name === "AbortError") return;
            setError(fetchError instanceof Error ? fetchError.message : "Failed to load Business OS");
        } finally {
            setLoading(false);
        }
    }

    async function loadActivityFeed(options?: { append?: boolean; source?: ActivitySourceFilter }) {
        const selectedAccount = data?.selected_account;
        if (!selectedAccount) return;

        const append = Boolean(options?.append);
        const source = options?.source ?? activitySource;
        const cursor = append ? activityCursor : null;

        if (append) setLoadingMoreActivity(true);
        else setLoadingActivity(true);

        try {
            const params = new URLSearchParams();
            params.set("limit", "20");
            if (source !== "all") params.set("source", source);
            if (cursor) params.set("cursor", cursor);
            const response = await authedFetch(`/api/superadmin/accounts/${selectedAccount.organization.id}/activity?${params.toString()}`);
            if (!response.ok) throw new Error("Failed to load org activity log");
            const payload = await response.json() as ActivityFeedResponse;
            setActivityFeed((current) => append ? [...current, ...payload.events] : payload.events);
            setActivityCursor(payload.next_cursor);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load org activity log");
        } finally {
            if (append) setLoadingMoreActivity(false);
            else setLoadingActivity(false);
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void loadData(controller.signal);
        }, filters.search ? 250 : 0);
        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [filters, selectedOrgId]);

    useEffect(() => {
        const selected = data?.selected_account;
        if (!selected) return;
        setAccountDraft({
            owner_id: selected.account_state.owner_id ?? "",
            lifecycle_stage: selected.account_state.lifecycle_stage,
            health_band: selected.account_state.health_band,
            activation_stage: selected.account_state.activation_stage,
            next_action: selected.account_state.next_action ?? "",
            next_action_due_at: toDateInput(selected.account_state.next_action_due_at),
            renewal_at: toDateInput(selected.account_state.renewal_at),
            playbook: selected.account_state.playbook ?? "",
            notes: selected.account_state.notes ?? "",
        });
        setWorkItemDraft((current) => ({
            ...current,
            due_at: current.due_at || toDateInput(selected.account_state.next_action_due_at),
        }));
        setMemoryNoteDraft({
            category: "context",
            title: "",
            body: "",
            pinned: false,
        });
        setCommsDraft((current) => ({
            ...current,
            next_follow_up_at: current.next_follow_up_at || toDateInput(selected.account_state.next_action_due_at),
            promise: current.promise || selected.account_state.next_action || "",
        }));
        setCommitmentDraft((current) => ({
            ...current,
            due_at: current.due_at || toDateInput(selected.account_state.next_action_due_at),
        }));
    }, [data?.selected_account?.organization.id]);

    useEffect(() => {
        const selected = data?.selected_account;
        if (!selected) {
            setActivityFeed([]);
            setActivityCursor(null);
            return;
        }
        setActivityFeed(selected.org_memory.recent_events);
        setActivityCursor(null);
        void loadActivityFeed({ append: false, source: activitySource });
    }, [data?.selected_account?.organization.id, activitySource]);

    function applyAiSuggestion(kind: "next" | "playbook" | "note" | "work-item" | "outreach") {
        const ai = data?.selected_account?.ai;
        if (!ai) return;
        if (kind === "next") {
            setAccountDraft((current) => ({
                ...current,
                next_action: ai.recommended_next_step,
                next_action_due_at: current.next_action_due_at || toDateInput(new Date(Date.now() + 86_400_000).toISOString()),
            }));
            setMessage("AI next step copied into the account action draft.");
            return;
        }
        if (kind === "playbook") {
            setAccountDraft((current) => ({ ...current, playbook: ai.playbook_draft }));
            setMessage("AI playbook draft copied into the account draft.");
            return;
        }
        if (kind === "note") {
            setAccountDraft((current) => ({ ...current, notes: ai.what_changed }));
            setMessage("AI summary copied into notes.");
            return;
        }
        if (kind === "work-item") {
            setWorkItemDraft({
                title: ai.recommended_next_step,
                summary: ai.rationale,
                severity: data?.selected_account?.priority_score && data.selected_account.priority_score >= 100 ? "critical" : "high",
                due_at: toDateInput(new Date(Date.now() + 86_400_000).toISOString()),
            });
            setMessage("AI work item draft prepared.");
            return;
        }
        setAccountDraft((current) => ({ ...current, notes: `${current.notes ? `${current.notes}\n\n` : ""}${ai.customer_save_outreach}` }));
        setMessage("AI outreach draft appended into notes for editing.");
    }

    async function refreshBrief() {
        setRefreshingBrief(true);
        try {
            const response = await authedFetch("/api/superadmin/ai/daily-brief");
            if (!response.ok) throw new Error("Failed to refresh AI brief");
            const payload = await response.json() as { brief: BusinessOsDailyBrief };
            setData((current) => current ? { ...current, ai_daily_brief: payload.brief } : current);
        } catch (refreshError) {
            setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh AI brief");
        } finally {
            setRefreshingBrief(false);
        }
    }

    async function refreshDrafts() {
        const selected = data?.selected_account;
        if (!selected) return;
        setRefreshingDrafts(true);
        try {
            const response = await authedFetch("/api/superadmin/ai/account-playbook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ org_id: selected.organization.id }),
            });
            if (!response.ok) throw new Error("Failed to refresh AI drafts");
            const payload = await response.json() as {
                playbook: string;
                outreach: string;
                collections: string;
                renewal: string;
                growth: string;
            };
            setData((current) => {
                if (!current?.selected_account) return current;
                return {
                    ...current,
                    selected_account: {
                        ...current.selected_account,
                        ai: {
                            ...duplicateAi(current.selected_account.ai),
                            playbook_draft: payload.playbook,
                            customer_save_outreach: payload.outreach,
                            collections_sequence: payload.collections,
                            renewal_strategy: payload.renewal,
                            growth_experiment: payload.growth,
                        },
                    },
                };
            });
            setMessage("AI drafts refreshed for the selected account.");
        } catch (refreshError) {
            setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh AI drafts");
        } finally {
            setRefreshingDrafts(false);
        }
    }

    async function saveAccountState() {
        const selected = data?.selected_account;
        if (!selected) return;
        setSavingAccount(true);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/accounts/${selected.organization.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    owner_id: accountDraft.owner_id || null,
                    lifecycle_stage: accountDraft.lifecycle_stage,
                    health_band: accountDraft.health_band,
                    activation_stage: accountDraft.activation_stage,
                    next_action: accountDraft.next_action || null,
                    next_action_due_at: accountDraft.next_action_due_at || null,
                    renewal_at: accountDraft.renewal_at || null,
                    playbook: accountDraft.playbook || null,
                    notes: accountDraft.notes || null,
                }),
            });
            if (!response.ok) throw new Error("Failed to update account state");
            setMessage("Account state updated.");
            await loadData();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to update account state");
        } finally {
            setSavingAccount(false);
        }
    }

    async function markReviewedNow() {
        const selected = data?.selected_account;
        if (!selected) return;
        setSavingAccount(true);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/accounts/${selected.organization.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    last_reviewed_at: new Date().toISOString(),
                    last_review_summary: selected.ai.what_changed,
                }),
            });
            if (!response.ok) throw new Error("Failed to mark account reviewed");
            setMessage("Account review timestamp updated.");
            await loadData();
        } catch (reviewError) {
            setError(reviewError instanceof Error ? reviewError.message : "Failed to mark account reviewed");
        } finally {
            setSavingAccount(false);
        }
    }

    async function decideApproval(id: string, decision: "approve" | "reject") {
        setBusyApprovalId(id);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/autopilot/approvals/${encodeURIComponent(id)}/${decision}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error(`Failed to ${decision} approval`);
            setMessage(decision === "approve" ? "Approval accepted and follow-up work opened." : "Approval rejected.");
            await loadData();
        } catch (approvalError) {
            setError(approvalError instanceof Error ? approvalError.message : `Failed to ${decision} approval`);
        } finally {
            setBusyApprovalId(null);
        }
    }

    async function createWorkItem() {
        const selected = data?.selected_account;
        if (!selected || !workItemDraft.title.trim()) return;
        setSavingWorkItem(true);
        setError(null);
        try {
            const response = await authedFetch("/api/superadmin/work-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    kind: selected.snapshot.overdue_balance > 0 ? "collections" : selected.snapshot.fatal_error_count > 0 ? "incident_followup" : "growth_followup",
                    target_type: "organization",
                    target_id: selected.organization.id,
                    org_id: selected.organization.id,
                    owner_id: accountDraft.owner_id || null,
                    severity: workItemDraft.severity,
                    title: workItemDraft.title.trim(),
                    summary: workItemDraft.summary.trim() || null,
                    due_at: workItemDraft.due_at || null,
                }),
            });
            if (!response.ok) throw new Error("Failed to create work item");
            setWorkItemDraft({ title: "", summary: "", severity: "medium", due_at: "" });
            setMessage("Work item created.");
            await loadData();
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Failed to create work item");
        } finally {
            setSavingWorkItem(false);
        }
    }

    async function updateWorkItem(id: string, patch: Record<string, unknown>) {
        try {
            const response = await authedFetch("/api/superadmin/work-items", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...patch }),
            });
            if (!response.ok) throw new Error("Failed to update work item");
            await loadData();
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Failed to update work item");
        }
    }

    async function recordWorkItemOutcome(
        id: string,
        outcomeType: "recovered" | "no_change" | "worse" | "payment_collected" | "proposal_approved",
    ) {
        setRecordingOutcomeId(id);
        setError(null);
        try {
            const markDone = outcomeType !== "worse";
            const response = await authedFetch(`/api/superadmin/work-items/${id}/outcomes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outcome_type: outcomeType,
                    mark_done: markDone,
                }),
            });
            if (!response.ok) throw new Error("Failed to record work item outcome");
            setMessage(`Outcome recorded: ${outcomeType.replaceAll("_", " ")}.`);
            await loadData();
        } catch (recordError) {
            setError(recordError instanceof Error ? recordError.message : "Failed to record work item outcome");
        } finally {
            setRecordingOutcomeId(null);
        }
    }

    async function createMemoryNote() {
        const selectedAccount = data?.selected_account;
        if (!selectedAccount) return;
        if (!memoryNoteDraft.title.trim() || !memoryNoteDraft.body.trim()) return;

        setSavingAccount(true);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/accounts/${selectedAccount.organization.id}/memory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: memoryNoteDraft.category,
                    title: memoryNoteDraft.title.trim(),
                    body: memoryNoteDraft.body.trim(),
                    pinned: memoryNoteDraft.pinned,
                }),
            });
            if (!response.ok) throw new Error("Failed to create org memory note");
            setMemoryNoteDraft({
                category: "context",
                title: "",
                body: "",
                pinned: false,
            });
            setMessage("Org memory note saved.");
            await loadData();
        } catch (noteError) {
            setError(noteError instanceof Error ? noteError.message : "Failed to create org memory note");
        } finally {
            setSavingAccount(false);
        }
    }

    async function createCommsSequence() {
        const selectedAccount = data?.selected_account;
        if (!selectedAccount) return;
        setSavingComms(true);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/accounts/${selectedAccount.organization.id}/comms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sequence_type: commsDraft.sequence_type,
                    channel: commsDraft.channel,
                    owner_id: accountDraft.owner_id || null,
                    next_follow_up_at: commsDraft.next_follow_up_at || null,
                    promise: commsDraft.promise || null,
                }),
            });
            if (!response.ok) throw new Error("Failed to create communication sequence");
            setMessage("Communication sequence created.");
            await loadData();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to create communication sequence");
        } finally {
            setSavingComms(false);
        }
    }

    async function updateCommsSequence(id: string, patch: Record<string, unknown>) {
        const selectedAccount = data?.selected_account;
        if (!selectedAccount) return;
        setSavingComms(true);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/accounts/${selectedAccount.organization.id}/comms`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...patch }),
            });
            if (!response.ok) throw new Error("Failed to update communication sequence");
            await loadData();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to update communication sequence");
        } finally {
            setSavingComms(false);
        }
    }

    async function createCommitment() {
        const selectedAccount = data?.selected_account;
        if (!selectedAccount || !commitmentDraft.title.trim() || !commitmentDraft.due_at) return;
        setSavingCommitment(true);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/accounts/${selectedAccount.organization.id}/commitments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    owner_id: accountDraft.owner_id || null,
                    source: commitmentDraft.source,
                    title: commitmentDraft.title.trim(),
                    detail: commitmentDraft.detail.trim() || null,
                    severity: commitmentDraft.severity,
                    due_at: commitmentDraft.due_at,
                }),
            });
            if (!response.ok) throw new Error("Failed to create commitment");
            setCommitmentDraft({
                title: "",
                detail: "",
                source: "ops",
                severity: "medium",
                due_at: "",
            });
            setMessage("Commitment created.");
            await loadData();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to create commitment");
        } finally {
            setSavingCommitment(false);
        }
    }

    async function updateCommitment(id: string, patch: Record<string, unknown>) {
        const selectedAccount = data?.selected_account;
        if (!selectedAccount) return;
        setSavingCommitment(true);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/accounts/${selectedAccount.organization.id}/commitments`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...patch }),
            });
            if (!response.ok) throw new Error("Failed to update commitment");
            await loadData();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to update commitment");
        } finally {
            setSavingCommitment(false);
        }
    }

    const selected = data?.selected_account ?? null;
    const displayedAccounts = (data?.accounts ?? []).filter((account) => matchesQueueMode(account, queueMode, data?.current_user_id ?? ""));

    useEffect(() => {
        if (displayedAccounts.length === 0) return;
        if (!selectedOrgId || !displayedAccounts.some((account) => account.org_id === selectedOrgId)) {
            setSelectedOrgId(displayedAccounts[0].org_id);
        }
    }, [displayedAccounts, selectedOrgId]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Business OS</h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Account-led operations with AI drafts layered into the same work queue and account model.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/god"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                    >
                        Command Center
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                        onClick={() => void loadData()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white disabled:opacity-60"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            ) : null}
            {message ? (
                <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
                    {message}
                </div>
            ) : null}

            <section className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-amber-300">
                            <Bot className="h-4 w-4" />
                            Today&apos;s operating brief
                        </div>
                        <div className="text-lg font-semibold text-white">
                            {data?.ai_daily_brief.headline ?? "Loading operating brief..."}
                        </div>
                        <p className="max-w-4xl text-sm text-gray-300">
                            {data?.ai_daily_brief.summary ?? "Reviewing account posture, ownership gaps, and next operating moves."}
                        </p>
                        <div className="rounded-xl border border-gray-800 bg-black/30 px-4 py-3 text-sm text-gray-300">
                            {data?.ai_daily_brief.queue_focus ?? "Loading queue focus..."}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/god/autopilot"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                        >
                            Autopilot
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                            onClick={() => void refreshBrief()}
                            disabled={refreshingBrief}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white disabled:opacity-60"
                        >
                            <RefreshCw className={cn("h-4 w-4", refreshingBrief && "animate-spin")} />
                            Refresh brief
                        </button>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                        <div className="text-xs uppercase tracking-wide text-gray-500">What needs attention</div>
                        <div className="mt-3 space-y-2">
                            {(data?.ai_daily_brief.priorities ?? []).slice(0, 4).map((item) => (
                                <div key={item} className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300">
                                    {item}
                                </div>
                            ))}
                            {(data?.ai_daily_brief.gaps ?? []).slice(0, 2).map((gap) => (
                                <div key={gap} className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                                    {gap}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Queue posture</div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-3">
                                <div className="text-xs text-gray-500">Accounts</div>
                                <div className="mt-1 text-xl font-semibold text-white">{data?.summary.total_accounts ?? "—"}</div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-3">
                                <div className="text-xs text-gray-500">My queue</div>
                                <div className="mt-1 text-xl font-semibold text-white">{data?.summary.my_accounts ?? "—"}</div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-3">
                                <div className="text-xs text-gray-500">Due today</div>
                                <div className="mt-1 text-xl font-semibold text-white">{data ? data.accounts.filter((account) => isDueToday(account.account_state.next_action_due_at)).length : "—"}</div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-3">
                                <div className="text-xs text-gray-500">Approval needed</div>
                                <div className="mt-1 text-xl font-semibold text-white">{data?.summary.pending_approvals ?? "—"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-medium text-red-100">Founder mode</div>
                            <div className="mt-1 text-sm text-red-200/80">{data?.founder_mode.headline ?? "Loading founder exceptions..."}</div>
                        </div>
                        <Link href="/god/autopilot" className="text-xs text-red-200/80 hover:text-red-100">
                            Open Autopilot
                        </Link>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-red-900/40 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-wide text-red-200/70">Approvals</div>
                            <div className="mt-2 text-2xl font-semibold text-white">{data?.founder_mode.approvals.length ?? "—"}</div>
                        </div>
                        <div className="rounded-xl border border-red-900/40 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-wide text-red-200/70">Revenue moves</div>
                            <div className="mt-2 text-2xl font-semibold text-white">{data?.founder_mode.revenue_moves.length ?? "—"}</div>
                        </div>
                        <div className="rounded-xl border border-red-900/40 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-wide text-red-200/70">Churn risks</div>
                            <div className="mt-2 text-2xl font-semibold text-white">{data?.founder_mode.churn_risks.length ?? "—"}</div>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                    <div className="text-sm font-medium text-gray-200">Only you today</div>
                    <div className="mt-2 text-sm text-gray-400">{data?.founder_mode.summary ?? "Loading founder summary..."}</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Highest risk</div>
                            {(data?.founder_mode.highest_risk_accounts ?? []).slice(0, 3).map((account) => (
                                <button
                                    key={account.org_id}
                                    onClick={() => setSelectedOrgId(account.org_id)}
                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-left hover:border-gray-700"
                                >
                                    <div className="text-sm text-white">{account.account_name}</div>
                                    <div className="mt-1 text-xs text-gray-400">priority {account.priority_score}</div>
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Revenue</div>
                            {(data?.founder_mode.revenue_moves ?? []).slice(0, 3).map((item) => (
                                <a key={item.id} href={item.href} className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-2 hover:border-gray-700">
                                    <div className="text-sm text-white">{item.account_name}</div>
                                    <div className="mt-1 text-xs text-gray-400">{item.detail}</div>
                                </a>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Churn</div>
                            {(data?.founder_mode.churn_risks ?? []).slice(0, 3).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedOrgId(item.org_id)}
                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-left hover:border-gray-700"
                                >
                                    <div className="text-sm text-white">{item.account_name}</div>
                                    <div className="mt-1 text-xs text-gray-400">{item.detail}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-4 rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                        <Filter className="h-4 w-4" />
                        Account queue
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: "all", label: "All" },
                            { id: "my_focus", label: "My focus" },
                            { id: "unowned", label: "Unowned" },
                            { id: "due_today", label: "Due today" },
                            { id: "approval_needed", label: "Approval needed" },
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setQueueMode(mode.id as QueueMode)}
                                className={cn(
                                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                                    queueMode === mode.id
                                        ? "border-amber-700/60 bg-amber-950/30 text-amber-200"
                                        : "border-gray-800 bg-black/30 text-gray-300 hover:border-gray-700 hover:text-white",
                                    mode.id === "approval_needed" && "col-span-2",
                                )}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <input
                            value={filters.search}
                            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                            placeholder="Search organization"
                            className="w-full rounded-lg border border-gray-800 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-amber-700/60"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setFilters((current) => ({ ...current, only_my_accounts: !current.only_my_accounts }))}
                                className={cn(
                                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                                    filters.only_my_accounts
                                        ? "border-amber-700/60 bg-amber-950/30 text-amber-200"
                                        : "border-gray-800 bg-black/30 text-gray-300 hover:border-gray-700 hover:text-white",
                                )}
                            >
                                My accounts
                            </button>
                            <button
                                onClick={() => setFilters((current) => ({ ...current, owner: current.owner === "unowned" ? "all" : "unowned", only_my_accounts: false }))}
                                className={cn(
                                    "rounded-lg border px-3 py-2 text-sm transition-colors",
                                    filters.owner === "unowned"
                                        ? "border-amber-700/60 bg-amber-950/30 text-amber-200"
                                        : "border-gray-800 bg-black/30 text-gray-300 hover:border-gray-700 hover:text-white",
                                )}
                            >
                                Unowned
                            </button>
                        </div>
                        <label className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-300">
                            Activation risk only
                            <input
                                type="checkbox"
                                checked={filters.activation_risk}
                                onChange={(event) => setFilters((current) => ({ ...current, activation_risk: event.target.checked }))}
                                className="h-4 w-4 rounded border-gray-700 bg-transparent text-amber-500"
                            />
                        </label>
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
                            <select
                                value={filters.risk}
                                onChange={(event) => setFilters((current) => ({ ...current, risk: event.target.value }))}
                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                            >
                                <option value="all">All risk</option>
                                <option value="revenue">Revenue risk</option>
                                <option value="churn">Churn risk</option>
                                <option value="support">Support pressure</option>
                                <option value="incident">Incident load</option>
                            </select>
                            <select
                                value={filters.health_band}
                                onChange={(event) => setFilters((current) => ({ ...current, health_band: event.target.value }))}
                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                            >
                                <option value="all">All health</option>
                                <option value="healthy">Healthy</option>
                                <option value="watch">Watch</option>
                                <option value="at_risk">At risk</option>
                            </select>
                            <select
                                value={filters.lifecycle_stage}
                                onChange={(event) => setFilters((current) => ({ ...current, lifecycle_stage: event.target.value }))}
                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                            >
                                <option value="all">All lifecycle</option>
                                <option value="new">New</option>
                                <option value="onboarding">Onboarding</option>
                                <option value="active">Active</option>
                                <option value="watch">Watch</option>
                                <option value="at_risk">At risk</option>
                                <option value="churned">Churned</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                            <div className="text-gray-400">Accounts</div>
                            <div className="mt-1 text-xl font-semibold text-white">{data?.summary.total_accounts ?? "—"}</div>
                        </div>
                        <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                            <div className="text-gray-400">My queue</div>
                            <div className="mt-1 text-xl font-semibold text-white">{data?.summary.my_accounts ?? "—"}</div>
                        </div>
                        <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                            <div className="text-gray-400">Activation risk</div>
                            <div className="mt-1 text-xl font-semibold text-white">{data?.summary.activation_risk_accounts ?? "—"}</div>
                        </div>
                        <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                            <div className="text-gray-400">Approvals</div>
                            <div className="mt-1 text-xl font-semibold text-white">{data?.summary.pending_approvals ?? "—"}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {displayedAccounts.length > 0 ? (
                            displayedAccounts.map((account) => (
                                <button
                                    key={account.org_id}
                                    onClick={() => setSelectedOrgId(account.org_id)}
                                    className={cn(
                                        "w-full rounded-xl border p-3 text-left transition-colors",
                                        selectedOrgId === account.org_id
                                            ? "border-amber-700/70 bg-amber-950/20"
                                            : "border-gray-800 bg-black/30 hover:border-gray-700 hover:bg-black/40",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-white">{account.name}</div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                {account.tier} • {account.account_state.owner_id ? "Owned" : "Unowned"} • {account.effective_activation_stage.replaceAll("_", " ")}
                                            </div>
                                        </div>
                                        <div className={cn("rounded-md border px-2 py-1 text-xs font-medium", priorityTone(account.priority_score))}>
                                            {account.priority_score}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-300">
                                        {account.priority_reasons.slice(0, 3).map((reason) => (
                                            <span key={reason} className="rounded border border-gray-800 bg-gray-950/60 px-2 py-1">
                                                {reason}
                                            </span>
                                        ))}
                                        {account.pending_approval_count > 0 ? (
                                            <span className="rounded border border-red-900/60 bg-red-950/20 px-2 py-1 text-red-200">
                                                {account.pending_approval_count} approvals
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
                                        <div>Overdue: {account.snapshot.overdue_balance_label}</div>
                                        <div>Support: {account.snapshot.urgent_support_count} urgent</div>
                                        <div>Open work: {account.open_work_item_count}</div>
                                        <div>AI spend: ${account.snapshot.ai_spend_mtd_usd.toFixed(2)}</div>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                No accounts match the current queue mode and filters.
                            </div>
                        )}
                    </div>
                </aside>

                <section className="space-y-4">
                    {loading && !selected ? (
                        <div className="flex h-96 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950/70 text-gray-400">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading selected account...
                        </div>
                    ) : selected ? (
                        <>
                            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-2xl font-semibold text-white">{selected.organization.name}</div>
                                            <span className="rounded-md border border-gray-800 bg-black/30 px-2 py-1 text-xs uppercase tracking-wide text-gray-300">
                                                {selected.organization.tier}
                                            </span>
                                            <span className="rounded-md border border-gray-800 bg-black/30 px-2 py-1 text-xs uppercase tracking-wide text-gray-300">
                                                {selected.account_state.lifecycle_stage.replaceAll("_", " ")}
                                            </span>
                                            <span className="rounded-md border border-gray-800 bg-black/30 px-2 py-1 text-xs uppercase tracking-wide text-gray-300">
                                                {selected.account_state.activation_stage.replaceAll("_", " ")}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                            <span>Owner: {selected.owner?.name ?? "Unassigned"}</span>
                                            <span>Renewal: {formatDate(selected.account_state.renewal_at)}</span>
                                            <span>Priority score: {selected.priority_score}</span>
                                            <span>Last reviewed: {formatDate(selected.account_state.last_reviewed_at)}</span>
                                        </div>
                                        <div className="max-w-4xl text-sm text-gray-300">
                                            {selected.ai.what_changed}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setAccountDraft((current) => ({ ...current, owner_id: data?.current_user_id ?? "" }))}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                                        >
                                            <UserPlus2 className="h-4 w-4" />
                                            Assign to me
                                        </button>
                                        <button
                                            onClick={() => setAccountDraft((current) => ({ ...current, owner_id: "" }))}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                                        >
                                            Release owner
                                        </button>
                                        <button
                                            onClick={() => void markReviewedNow()}
                                            disabled={savingAccount}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white disabled:opacity-60"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            Mark reviewed
                                        </button>
                                        <button
                                            onClick={() => void refreshDrafts()}
                                            disabled={refreshingDrafts}
                                            className="inline-flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200 transition-colors hover:border-amber-700/60 disabled:opacity-60"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            {refreshingDrafts ? "Refreshing AI..." : "Refresh AI drafts"}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <div className={cn("rounded-xl border p-4", metricTone(selected.snapshot.overdue_balance > 0 ? "danger" : "neutral"))}>
                                        <div className="text-xs uppercase tracking-wide text-gray-400">Outstanding balance</div>
                                        <div className="mt-2 text-xl font-semibold text-white">{selected.snapshot.outstanding_balance_label}</div>
                                        <div className="mt-1 text-xs text-gray-400">{selected.snapshot.overdue_invoice_count} overdue invoices</div>
                                    </div>
                                    <div className={cn("rounded-xl border p-4", metricTone(selected.snapshot.expiring_proposal_count > 0 ? "warning" : "neutral"))}>
                                        <div className="text-xs uppercase tracking-wide text-gray-400">Proposals</div>
                                        <div className="mt-2 text-xl font-semibold text-white">{selected.snapshot.expiring_proposal_value_label}</div>
                                        <div className="mt-1 text-xs text-gray-400">{selected.snapshot.expiring_proposal_count} expiring within 72h</div>
                                    </div>
                                    <div className={cn("rounded-xl border p-4", metricTone(selected.snapshot.urgent_support_count > 0 || selected.snapshot.fatal_error_count > 0 ? "danger" : "neutral"))}>
                                        <div className="text-xs uppercase tracking-wide text-gray-400">Support + incidents</div>
                                        <div className="mt-2 text-xl font-semibold text-white">{selected.snapshot.urgent_support_count} / {selected.snapshot.fatal_error_count}</div>
                                        <div className="mt-1 text-xs text-gray-400">Urgent tickets / fatal incidents</div>
                                    </div>
                                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                        <div className="text-xs uppercase tracking-wide text-gray-400">Activation funnel</div>
                                        <div className="mt-2 text-xl font-semibold text-white">
                                            {selected.snapshot.proposal_draft_count + selected.snapshot.whatsapp_proposal_draft_count} drafts • {selected.snapshot.proposal_sent_count} sent
                                        </div>
                                        <div className="mt-1 text-xs text-gray-400">
                                            {selected.snapshot.proposal_viewed_count} viewed • {selected.snapshot.proposal_approved_count || selected.snapshot.proposal_won_count} approved • {selected.snapshot.trip_count} trips
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-gray-200">Activation funnel</div>
                                            <div className="mt-1 text-sm text-gray-400">Track the account from signup to first proposal, approval, and converted trip.</div>
                                        </div>
                                        <div className="text-xs uppercase tracking-wide text-gray-500">
                                            Time to first proposal: {selected.snapshot.time_to_first_proposal_days ?? "—"} days
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                                        {selected.activation_funnel.map((step) => (
                                            <div
                                                key={step.id}
                                                className={cn(
                                                    "rounded-xl border p-4",
                                                    step.status === "done"
                                                        ? "border-emerald-900/60 bg-emerald-950/20"
                                                        : step.status === "current"
                                                            ? "border-amber-800/60 bg-amber-950/20"
                                                            : "border-gray-800 bg-black/30",
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-sm font-medium text-white">{step.label}</div>
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                                                            step.status === "done"
                                                                ? "bg-emerald-950/70 text-emerald-200"
                                                                : step.status === "current"
                                                                    ? "bg-amber-950/70 text-amber-200"
                                                                    : "bg-gray-900 text-gray-400",
                                                        )}
                                                    >
                                                        {step.status}
                                                    </span>
                                                </div>
                                                <div className="mt-3 text-lg font-semibold text-white">{step.value}</div>
                                                <div className="mt-1 text-xs text-gray-400">{step.detail}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                                    <div className="text-sm font-medium text-gray-200">Review loop</div>
                                    <div className="mt-1 text-sm text-gray-400">
                                        Use AI as memory, but keep a clear human review cadence for high-risk accounts.
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                            <div className="text-xs uppercase tracking-wide text-gray-500">Last review</div>
                                            <div className="mt-2 text-sm text-white">
                                                {selected.account_state.last_reviewed_at
                                                    ? new Date(selected.account_state.last_reviewed_at).toLocaleString()
                                                    : "No Business OS review recorded yet."}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-400">
                                                {selected.account_state.last_review_summary ?? "Use “Mark reviewed” once the account has been explicitly triaged."}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                            <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">What changed since review</div>
                                            <div className="space-y-2 text-sm text-gray-300">
                                                {selected.changed_since_review.map((item) => (
                                                    <div key={item} className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                            <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">Operating gaps</div>
                                            <div className="space-y-2 text-sm text-gray-300">
                                                {selected.operating_gaps.length > 0 ? selected.operating_gaps.map((gap) => (
                                                    <div key={gap} className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-amber-200">
                                                        {gap}
                                                    </div>
                                                )) : (
                                                    <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-gray-400">
                                                        No major operating gaps surfaced right now.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">Account operating state</div>
                                                <div className="mt-1 text-sm text-gray-400">Ownership, lifecycle, next step, and operator notes.</div>
                                            </div>
                                            <button
                                                onClick={() => void saveAccountState()}
                                                disabled={savingAccount}
                                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-200 transition-colors hover:border-emerald-700/60 disabled:opacity-60"
                                            >
                                                {savingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                Save account
                                            </button>
                                        </div>
                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <label className="space-y-2 text-sm">
                                                <span className="text-gray-400">Owner</span>
                                                <select
                                                    value={accountDraft.owner_id}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, owner_id: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {(data?.operators ?? []).map((operator) => (
                                                        <option key={operator.id} value={operator.id}>
                                                            {operator.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="space-y-2 text-sm">
                                                <span className="text-gray-400">Lifecycle</span>
                                                <select
                                                    value={accountDraft.lifecycle_stage}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, lifecycle_stage: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                >
                                                    <option value="new">New</option>
                                                    <option value="onboarding">Onboarding</option>
                                                    <option value="active">Active</option>
                                                    <option value="watch">Watch</option>
                                                    <option value="at_risk">At risk</option>
                                                    <option value="churned">Churned</option>
                                                </select>
                                            </label>
                                            <label className="space-y-2 text-sm">
                                                <span className="text-gray-400">Health band</span>
                                                <select
                                                    value={accountDraft.health_band}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, health_band: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                >
                                                    <option value="healthy">Healthy</option>
                                                    <option value="watch">Watch</option>
                                                    <option value="at_risk">At risk</option>
                                                </select>
                                            </label>
                                            <label className="space-y-2 text-sm">
                                                <span className="text-gray-400">Activation stage</span>
                                                <select
                                                    value={accountDraft.activation_stage}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, activation_stage: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                >
                                                    <option value="signed_up">Signed up</option>
                                                    <option value="onboarding">Onboarding</option>
                                                    <option value="first_proposal_sent">First proposal sent</option>
                                                    <option value="active">Active</option>
                                                    <option value="expansion">Expansion</option>
                                                    <option value="at_risk">At risk</option>
                                                    <option value="churned">Churned</option>
                                                </select>
                                            </label>
                                            <label className="space-y-2 text-sm md:col-span-2">
                                                <span className="flex items-center justify-between text-gray-400">
                                                    Next action
                                                    <button
                                                        onClick={() => applyAiSuggestion("next")}
                                                        type="button"
                                                        className="text-xs text-amber-300 transition-colors hover:text-amber-200"
                                                    >
                                                        Use AI draft
                                                    </button>
                                                </span>
                                                <textarea
                                                    value={accountDraft.next_action}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, next_action: event.target.value }))}
                                                    rows={3}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                />
                                            </label>
                                            <label className="space-y-2 text-sm">
                                                <span className="text-gray-400">Next action due</span>
                                                <input
                                                    type="date"
                                                    value={accountDraft.next_action_due_at}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, next_action_due_at: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                />
                                            </label>
                                            <label className="space-y-2 text-sm">
                                                <span className="text-gray-400">Renewal date</span>
                                                <input
                                                    type="date"
                                                    value={accountDraft.renewal_at}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, renewal_at: event.target.value }))}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                />
                                            </label>
                                            <label className="space-y-2 text-sm md:col-span-2">
                                                <span className="flex items-center justify-between text-gray-400">
                                                    Playbook
                                                    <button
                                                        onClick={() => applyAiSuggestion("playbook")}
                                                        type="button"
                                                        className="text-xs text-amber-300 transition-colors hover:text-amber-200"
                                                    >
                                                        Use AI playbook
                                                    </button>
                                                </span>
                                                <textarea
                                                    value={accountDraft.playbook}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, playbook: event.target.value }))}
                                                    rows={4}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                />
                                            </label>
                                            <label className="space-y-2 text-sm md:col-span-2">
                                                <span className="flex items-center justify-between text-gray-400">
                                                    Notes
                                                    <div className="flex gap-3 text-xs">
                                                        <button onClick={() => applyAiSuggestion("note")} type="button" className="text-amber-300 transition-colors hover:text-amber-200">Summarize risk</button>
                                                        <button onClick={() => applyAiSuggestion("outreach")} type="button" className="text-amber-300 transition-colors hover:text-amber-200">Append outreach draft</button>
                                                    </div>
                                                </span>
                                                <textarea
                                                    value={accountDraft.notes}
                                                    onChange={(event) => setAccountDraft((current) => ({ ...current, notes: event.target.value }))}
                                                    rows={6}
                                                    className="w-full rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-white outline-none focus:border-amber-700/60"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">Open work</div>
                                                <div className="mt-1 text-sm text-gray-400">Move work without leaving the account context.</div>
                                            </div>
                                            <button
                                                onClick={() => applyAiSuggestion("work-item")}
                                                type="button"
                                                className="text-sm text-amber-300 transition-colors hover:text-amber-200"
                                            >
                                                Use AI work item
                                            </button>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {selected.work_items.length > 0 ? (
                                                selected.work_items.map((item) => (
                                                    <div key={item.id} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-white">{item.title}</div>
                                                                <div className="mt-1 text-sm text-gray-400">{item.summary ?? "No summary"}</div>
                                                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-300">
                                                                    <span className="rounded border border-gray-800 px-2 py-1">{item.kind.replaceAll("_", " ")}</span>
                                                                    <span className="rounded border border-gray-800 px-2 py-1">{item.status.replaceAll("_", " ")}</span>
                                                                    <span className="rounded border border-gray-800 px-2 py-1">{item.severity}</span>
                                                                    <span className="rounded border border-gray-800 px-2 py-1">Due {formatDate(item.due_at)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <button onClick={() => void updateWorkItem(item.id, { owner_id: data?.current_user_id ?? null, status: "in_progress" })} className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-300 hover:border-gray-700 hover:text-white">Claim</button>
                                                                <button onClick={() => void updateWorkItem(item.id, { status: "blocked" })} className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-300 hover:border-gray-700 hover:text-white">Block</button>
                                                                <button onClick={() => void updateWorkItem(item.id, { status: "done" })} className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200 hover:border-emerald-700/60">Done</button>
                                                                <button
                                                                    onClick={() => void recordWorkItemOutcome(item.id, "recovered")}
                                                                    disabled={recordingOutcomeId === item.id}
                                                                    className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200 hover:border-emerald-700/60 disabled:opacity-60"
                                                                >
                                                                    {recordingOutcomeId === item.id ? "Saving..." : "Recovered"}
                                                                </button>
                                                                <button
                                                                    onClick={() => void recordWorkItemOutcome(item.id, "payment_collected")}
                                                                    disabled={recordingOutcomeId === item.id}
                                                                    className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200 hover:border-emerald-700/60 disabled:opacity-60"
                                                                >
                                                                    Payment
                                                                </button>
                                                                <button
                                                                    onClick={() => void recordWorkItemOutcome(item.id, "proposal_approved")}
                                                                    disabled={recordingOutcomeId === item.id}
                                                                    className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200 hover:border-emerald-700/60 disabled:opacity-60"
                                                                >
                                                                    Approved
                                                                </button>
                                                                <button
                                                                    onClick={() => void recordWorkItemOutcome(item.id, "no_change")}
                                                                    disabled={recordingOutcomeId === item.id}
                                                                    className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-60"
                                                                >
                                                                    No change
                                                                </button>
                                                                <button
                                                                    onClick={() => void recordWorkItemOutcome(item.id, "worse")}
                                                                    disabled={recordingOutcomeId === item.id}
                                                                    className="rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-200 hover:border-red-800/60 disabled:opacity-60"
                                                                >
                                                                    Worse
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-gray-800 bg-black/20 p-4 text-sm text-gray-400">
                                                    No active work items. Create one from the AI draft or add a manual next step below.
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            <input
                                                value={workItemDraft.title}
                                                onChange={(event) => setWorkItemDraft((current) => ({ ...current, title: event.target.value }))}
                                                placeholder="New work item title"
                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                            />
                                            <textarea
                                                value={workItemDraft.summary}
                                                onChange={(event) => setWorkItemDraft((current) => ({ ...current, summary: event.target.value }))}
                                                rows={3}
                                                placeholder="Summary or owner guidance"
                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                            />
                                            <select
                                                value={workItemDraft.severity}
                                                onChange={(event) => setWorkItemDraft((current) => ({ ...current, severity: event.target.value as WorkItemDraft["severity"] }))}
                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                            <input
                                                type="date"
                                                value={workItemDraft.due_at}
                                                onChange={(event) => setWorkItemDraft((current) => ({ ...current, due_at: event.target.value }))}
                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                                            />
                                            <button
                                                onClick={() => void createWorkItem()}
                                                disabled={savingWorkItem || !workItemDraft.title.trim()}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200 transition-colors hover:border-amber-700/60 disabled:opacity-60 md:col-span-2"
                                            >
                                                {savingWorkItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                                                Create work item
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                                                <BriefcaseBusiness className="h-4 w-4" />
                                                AI operating layer
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRightTab("operate")}
                                                    className={cn(
                                                        "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                                                        rightTab === "operate"
                                                            ? "border-amber-700/60 bg-amber-950/30 text-amber-200"
                                                            : "border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white",
                                                    )}
                                                >
                                                    Operate
                                                </button>
                                                <button
                                                    onClick={() => setRightTab("growth")}
                                                    className={cn(
                                                        "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                                                        rightTab === "growth"
                                                            ? "border-amber-700/60 bg-amber-950/30 text-amber-200"
                                                            : "border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white",
                                                    )}
                                                >
                                                    Growth
                                                </button>
                                            </div>
                                        </div>

                                        {rightTab === "operate" ? (
                                            <div className="mt-4 space-y-4">
                                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm font-medium text-white">AI recommended next step</div>
                                                        <div className={cn(
                                                            "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide",
                                                            selected.ai.confidence_label === "high"
                                                                ? "border-emerald-800/60 bg-emerald-950/20 text-emerald-200"
                                                                : selected.ai.confidence_label === "medium"
                                                                    ? "border-amber-800/60 bg-amber-950/20 text-amber-200"
                                                                    : "border-gray-800 bg-gray-950/40 text-gray-300",
                                                        )}>
                                                            {selected.ai.automation_posture.replaceAll("_", " ")} • {selected.ai.confidence_score}%
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-300">{selected.ai.recommended_next_step}</div>
                                                    <div className="mt-2 text-xs text-gray-400">{selected.ai.rationale}</div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {selected.ai.evidence.map((evidence) => (
                                                            <div key={evidence} className="rounded-lg border border-gray-800 bg-gray-950/50 px-2.5 py-1.5 text-xs text-gray-300">
                                                                {evidence}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm font-medium text-white">Draft customer communication</div>
                                                        <div className="text-xs text-gray-500">Approve before sending</div>
                                                    </div>
                                                    <div className="mt-3 space-y-3">
                                                        {selected.ai.communication_drafts.length > 0 ? selected.ai.communication_drafts.map((draft) => (
                                                            <div key={draft.id} className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <div className="text-sm text-white">{draft.title}</div>
                                                                        <div className="mt-1 text-xs text-gray-400">{draft.sequence_type.replaceAll("_", " ")} • {draft.channel}</div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setCommsDraft((current) => ({
                                                                            ...current,
                                                                            sequence_type: draft.sequence_type,
                                                                            channel: draft.channel,
                                                                            promise: draft.reason,
                                                                            next_follow_up_at: toDateInput(data?.selected_account?.account_state.next_action_due_at ?? new Date(Date.now() + 86_400_000).toISOString()),
                                                                        }))}
                                                                        className="rounded-lg border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white"
                                                                    >
                                                                        Queue draft
                                                                    </button>
                                                                </div>
                                                                <div className="mt-2 text-xs text-gray-400">{draft.reason}</div>
                                                                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-gray-800 bg-black/20 p-3 text-xs text-gray-300">
                                                                    {draft.draft}
                                                                </pre>
                                                            </div>
                                                        )) : (
                                                            <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-400">
                                                                No customer comms draft is urgent for this account right now.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                    <div className="text-sm font-medium text-white">Safe draft actions</div>
                                                    <div className="mt-3 space-y-2">
                                                        {selected.ai.safe_actions.map((action) => (
                                                            <div key={action.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
                                                                <div>
                                                                    <div className="text-sm text-white">{action.label}</div>
                                                                    <div className="text-xs text-gray-400">{action.description}</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        if (action.action_kind === "draft_next_action") applyAiSuggestion("next");
                                                                        else if (action.action_kind === "draft_playbook") applyAiSuggestion("playbook");
                                                                        else if (action.action_kind === "draft_work_item") applyAiSuggestion("work-item");
                                                                        else if (action.action_kind === "draft_summary") applyAiSuggestion("note");
                                                                        else applyAiSuggestion("outreach");
                                                                    }}
                                                                    className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-300 hover:border-gray-700 hover:text-white"
                                                                >
                                                                    Apply
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="text-sm font-medium text-red-200">Approval inbox</div>
                                                        <Link href="/god/autopilot" className="text-xs text-red-200/80 hover:text-red-100">
                                                            Open Autopilot
                                                        </Link>
                                                    </div>
                                                    <div className="mt-3 space-y-2">
                                                        {selected.pending_approvals.length > 0 ? selected.pending_approvals.map((approval) => (
                                                            <div key={approval.id} className="rounded-lg border border-red-900/50 bg-black/20 px-3 py-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div>
                                                                        <div className="text-sm text-red-100">{approval.title}</div>
                                                                        <div className="mt-1 text-xs text-red-200/80">{approval.description}</div>
                                                                    </div>
                                                                    <div className="text-[11px] uppercase tracking-wide text-red-200/70">
                                                                        {approval.status}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-xs text-gray-400">{approval.rationale}</div>
                                                                {approval.status === "pending" ? (
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        <button
                                                                            onClick={() => void decideApproval(approval.id, "approve")}
                                                                            disabled={busyApprovalId === approval.id}
                                                                            className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-200 hover:border-emerald-700/60 disabled:opacity-60"
                                                                        >
                                                                            {busyApprovalId === approval.id ? "Working..." : "Approve"}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => void decideApproval(approval.id, "reject")}
                                                                            disabled={busyApprovalId === approval.id}
                                                                            className="rounded-lg border border-red-800/60 bg-red-950/20 px-3 py-1.5 text-xs text-red-200 hover:border-red-700/60 disabled:opacity-60"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-3 text-xs text-gray-500">
                                                                        {approval.decided_by ? `${approval.status} by ${approval.decided_by}` : approval.status}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )) : (
                                                            <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-400">
                                                                No approval-gated actions are pending for this account.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 space-y-4">
                                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                    <div className="text-sm font-medium text-white">Growth opportunities</div>
                                                    <div className="mt-3 space-y-2">
                                                        {selected.ai.growth_opportunities.length > 0 ? (
                                                            selected.ai.growth_opportunities.map((opportunity) => (
                                                                <div key={opportunity} className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300">
                                                                    {opportunity}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-400">
                                                                No immediate growth plays. Focus on stabilizing the current operating loop first.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                    <div className="text-sm font-medium text-white">Renewal strategy</div>
                                                    <div className="mt-2 text-sm text-gray-300">{selected.ai.renewal_strategy}</div>
                                                </div>
                                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                    <div className="text-sm font-medium text-white">Growth experiment</div>
                                                    <div className="mt-2 text-sm text-gray-300">{selected.ai.growth_experiment}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                                        <div className="text-sm font-medium text-gray-200">Revenue and customer context</div>
                                        <div className="mt-4 grid gap-4">
                                            <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                                                    <BriefcaseBusiness className="h-4 w-4" />
                                                    Customer comms + commitments
                                                </div>
                                                <div className="grid gap-3 xl:grid-cols-2">
                                                    <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                                        <div className="text-xs uppercase tracking-wide text-gray-500">Communication sequences</div>
                                                        <div className="mt-2 space-y-2">
                                                            {selected.comms_sequences.length > 0 ? selected.comms_sequences.map((sequence) => (
                                                                <div key={sequence.id} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="text-sm text-white">{sequence.sequence_type.replaceAll("_", " ")}</div>
                                                                        <div className="text-xs text-gray-500">{sequence.status}</div>
                                                                    </div>
                                                                    <div className="mt-1 text-xs text-gray-400">
                                                                        {sequence.channel} • next {formatDate(sequence.next_follow_up_at)}
                                                                    </div>
                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                        <button
                                                                            onClick={() => void updateCommsSequence(sequence.id, {
                                                                                status: "active",
                                                                                last_sent_at: new Date().toISOString(),
                                                                                step_index: sequence.step_index + 1,
                                                                            })}
                                                                            disabled={savingComms}
                                                                            className="rounded-lg border border-gray-800 px-2 py-1 text-xs text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-60"
                                                                        >
                                                                            Sent
                                                                        </button>
                                                                        <button
                                                                            onClick={() => void updateCommsSequence(sequence.id, { status: "paused" })}
                                                                            disabled={savingComms}
                                                                            className="rounded-lg border border-gray-800 px-2 py-1 text-xs text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-60"
                                                                        >
                                                                            Pause
                                                                        </button>
                                                                        <button
                                                                            onClick={() => void updateCommsSequence(sequence.id, { status: "completed" })}
                                                                            disabled={savingComms}
                                                                            className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-2 py-1 text-xs text-emerald-200 hover:border-emerald-700/60 disabled:opacity-60"
                                                                        >
                                                                            Complete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">
                                                                    No communication sequences yet.
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                            <select
                                                                value={commsDraft.sequence_type}
                                                                onChange={(event) => setCommsDraft((current) => ({
                                                                    ...current,
                                                                    sequence_type: event.target.value as CommsDraft["sequence_type"],
                                                                }))}
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                                                            >
                                                                <option value="activation_rescue">Activation rescue</option>
                                                                <option value="viewed_not_approved">Viewed not approved</option>
                                                                <option value="collections">Collections</option>
                                                                <option value="incident_recovery">Incident recovery</option>
                                                                <option value="renewal_prep">Renewal prep</option>
                                                            </select>
                                                            <select
                                                                value={commsDraft.channel}
                                                                onChange={(event) => setCommsDraft((current) => ({
                                                                    ...current,
                                                                    channel: event.target.value as CommsDraft["channel"],
                                                                }))}
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                                                            >
                                                                <option value="mixed">Mixed</option>
                                                                <option value="email">Email</option>
                                                                <option value="whatsapp">WhatsApp</option>
                                                                <option value="in_app">In-app</option>
                                                            </select>
                                                            <input
                                                                type="date"
                                                                value={commsDraft.next_follow_up_at}
                                                                onChange={(event) => setCommsDraft((current) => ({ ...current, next_follow_up_at: event.target.value }))}
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                                            />
                                                            <input
                                                                value={commsDraft.promise}
                                                                onChange={(event) => setCommsDraft((current) => ({ ...current, promise: event.target.value }))}
                                                                placeholder="Promise or intent"
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                                            />
                                                            <button
                                                                onClick={() => void createCommsSequence()}
                                                                disabled={savingComms}
                                                                className="inline-flex items-center justify-center rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200 hover:border-amber-700/60 disabled:opacity-60 md:col-span-2"
                                                            >
                                                                {savingComms ? "Saving..." : "Create sequence"}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="text-xs uppercase tracking-wide text-gray-500">Commitments / SLA promises</div>
                                                            <div className="text-xs text-red-300">{selected.breached_commitments.length} breached</div>
                                                        </div>
                                                        <div className="mt-2 space-y-2">
                                                            {selected.commitments.length > 0 ? selected.commitments.map((commitment) => (
                                                                <div key={commitment.id} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="text-sm text-white">{commitment.title}</div>
                                                                        <div className={cn("text-xs", commitment.status === "breached" ? "text-red-300" : "text-gray-500")}>
                                                                            {commitment.status}
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-1 text-xs text-gray-400">
                                                                        {commitment.source} • due {formatDate(commitment.due_at)} • {commitment.severity}
                                                                    </div>
                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                        <button
                                                                            onClick={() => void updateCommitment(commitment.id, { status: "met" })}
                                                                            disabled={savingCommitment}
                                                                            className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-2 py-1 text-xs text-emerald-200 hover:border-emerald-700/60 disabled:opacity-60"
                                                                        >
                                                                            Met
                                                                        </button>
                                                                        <button
                                                                            onClick={() => void updateCommitment(commitment.id, { status: "breached" })}
                                                                            disabled={savingCommitment}
                                                                            className="rounded-lg border border-red-900/60 bg-red-950/20 px-2 py-1 text-xs text-red-200 hover:border-red-800/60 disabled:opacity-60"
                                                                        >
                                                                            Breached
                                                                        </button>
                                                                        <button
                                                                            onClick={() => void updateCommitment(commitment.id, { status: "cancelled" })}
                                                                            disabled={savingCommitment}
                                                                            className="rounded-lg border border-gray-800 px-2 py-1 text-xs text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-60"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">
                                                                    No commitments logged yet.
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                            <input
                                                                value={commitmentDraft.title}
                                                                onChange={(event) => setCommitmentDraft((current) => ({ ...current, title: event.target.value }))}
                                                                placeholder="Commitment title"
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                                            />
                                                            <textarea
                                                                value={commitmentDraft.detail}
                                                                onChange={(event) => setCommitmentDraft((current) => ({ ...current, detail: event.target.value }))}
                                                                rows={2}
                                                                placeholder="Promise detail"
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                                            />
                                                            <select
                                                                value={commitmentDraft.source}
                                                                onChange={(event) => setCommitmentDraft((current) => ({
                                                                    ...current,
                                                                    source: event.target.value as CommitmentDraft["source"],
                                                                }))}
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                                                            >
                                                                <option value="ops">Ops</option>
                                                                <option value="support">Support</option>
                                                                <option value="sales">Sales</option>
                                                                <option value="collections">Collections</option>
                                                                <option value="incident">Incident</option>
                                                            </select>
                                                            <select
                                                                value={commitmentDraft.severity}
                                                                onChange={(event) => setCommitmentDraft((current) => ({
                                                                    ...current,
                                                                    severity: event.target.value as CommitmentDraft["severity"],
                                                                }))}
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                                                            >
                                                                <option value="low">Low</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="high">High</option>
                                                                <option value="critical">Critical</option>
                                                            </select>
                                                            <input
                                                                type="date"
                                                                value={commitmentDraft.due_at}
                                                                onChange={(event) => setCommitmentDraft((current) => ({ ...current, due_at: event.target.value }))}
                                                                className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                                            />
                                                            <button
                                                                onClick={() => void createCommitment()}
                                                                disabled={savingCommitment || !commitmentDraft.title.trim() || !commitmentDraft.due_at}
                                                                className="inline-flex items-center justify-center rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200 hover:border-amber-700/60 disabled:opacity-60 md:col-span-2"
                                                            >
                                                                {savingCommitment ? "Saving..." : "Create commitment"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                                                    <BriefcaseBusiness className="h-4 w-4" />
                                                    Org memory
                                                </div>
                                                <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-3 text-sm text-gray-300">
                                                    {selected.org_memory.support_ready_summary}
                                                </div>
                                                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                                                    <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                                        <div className="text-xs uppercase tracking-wide text-gray-500">Pending right now</div>
                                                        <div className="mt-2 space-y-2">
                                                            {selected.org_memory.pending_items.length > 0 ? selected.org_memory.pending_items.map((item) => (
                                                                <div key={item} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-300">
                                                                    {item}
                                                                </div>
                                                            )) : (
                                                                <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">
                                                                    No pending items are surfaced for this org right now.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="text-xs uppercase tracking-wide text-gray-500">Org operating log</div>
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={activitySource}
                                                                    onChange={(event) => setActivitySource(event.target.value as ActivitySourceFilter)}
                                                                    className="rounded-md border border-gray-800 bg-black/30 px-2 py-1 text-[11px] text-white outline-none focus:border-amber-700/60"
                                                                >
                                                                    <option value="all">All sources</option>
                                                                    <option value="business_os">Business OS</option>
                                                                    <option value="business_os_ops_loop">AI ops loop</option>
                                                                    <option value="business_os_autopilot">Autopilot</option>
                                                                    <option value="business_os_autopilot_approval">Approvals</option>
                                                                    <option value="support_queue">Support queue</option>
                                                                    <option value="support_response">Support response</option>
                                                                    <option value="system">System</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => void loadActivityFeed({ append: false, source: activitySource })}
                                                                    disabled={loadingActivity}
                                                                    className="rounded-md border border-gray-800 px-2 py-1 text-[11px] text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-60"
                                                                >
                                                                    {loadingActivity ? "Loading..." : "Refresh"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 space-y-2">
                                                            {activityFeed.length > 0 ? activityFeed.map((event) => (
                                                                <div key={event.id} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2">
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <div className="text-sm text-white">{event.title}</div>
                                                                        <div className="text-xs text-gray-500">{formatDate(event.occurred_at)}</div>
                                                                    </div>
                                                                    <div className="mt-1 text-xs text-gray-400">
                                                                        {event.detail ?? event.event_type.replaceAll("_", " ")}
                                                                    </div>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                                                        <span>{event.actor_name ?? "System"} • {event.source.replaceAll("_", " ")}</span>
                                                                        <span className="rounded border border-gray-800 bg-gray-950/60 px-1.5 py-0.5">
                                                                            {event.event_type.replaceAll("_", " ")}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">
                                                                    No org events have been captured yet.
                                                                </div>
                                                            )}
                                                            {activityCursor ? (
                                                                <button
                                                                    onClick={() => void loadActivityFeed({ append: true, source: activitySource })}
                                                                    disabled={loadingMoreActivity}
                                                                    className="w-full rounded-lg border border-gray-800 bg-black/20 px-3 py-2 text-xs text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-60"
                                                                >
                                                                    {loadingMoreActivity ? "Loading older events..." : "Load older activity"}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                                                    <div className="mb-3 text-xs uppercase tracking-wide text-gray-500">Operator notes</div>
                                                    <div className="space-y-2">
                                                        {selected.org_memory.notes.length > 0 ? selected.org_memory.notes.map((note) => (
                                                            <div key={note.id} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-3">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="text-sm font-medium text-white">{note.title}</div>
                                                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                                        {note.pinned ? <span className="rounded border border-amber-800/60 bg-amber-950/20 px-2 py-0.5 text-amber-200">Pinned</span> : null}
                                                                        <span>{note.category}</span>
                                                                        <span>{formatDate(note.updated_at ?? note.created_at)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2 text-sm text-gray-300">{note.body}</div>
                                                                <div className="mt-2 text-[11px] text-gray-500">
                                                                    {note.author_name ?? "Unknown operator"}
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">
                                                                No operator notes yet. Save a handoff, promise, or support note below.
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        <select
                                                            value={memoryNoteDraft.category}
                                                            onChange={(event) => setMemoryNoteDraft((current) => ({
                                                                ...current,
                                                                category: event.target.value as MemoryNoteDraft["category"],
                                                            }))}
                                                            className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60"
                                                        >
                                                            <option value="context">Context</option>
                                                            <option value="handoff">Handoff</option>
                                                            <option value="promise">Promise</option>
                                                            <option value="support">Support</option>
                                                        </select>
                                                        <label className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-300">
                                                            Pin note
                                                            <input
                                                                type="checkbox"
                                                                checked={memoryNoteDraft.pinned}
                                                                onChange={(event) => setMemoryNoteDraft((current) => ({
                                                                    ...current,
                                                                    pinned: event.target.checked,
                                                                }))}
                                                                className="h-4 w-4 rounded border-gray-700 bg-transparent text-amber-500"
                                                            />
                                                        </label>
                                                        <input
                                                            value={memoryNoteDraft.title}
                                                            onChange={(event) => setMemoryNoteDraft((current) => ({ ...current, title: event.target.value }))}
                                                            placeholder="Note title"
                                                            className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                                        />
                                                        <textarea
                                                            value={memoryNoteDraft.body}
                                                            onChange={(event) => setMemoryNoteDraft((current) => ({ ...current, body: event.target.value }))}
                                                            rows={4}
                                                            placeholder="What happened, what is pending, and what was promised."
                                                            className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-700/60 md:col-span-2"
                                                        />
                                                        <button
                                                            onClick={() => void createMemoryNote()}
                                                            disabled={savingAccount || !memoryNoteDraft.title.trim() || !memoryNoteDraft.body.trim()}
                                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200 transition-colors hover:border-amber-700/60 disabled:opacity-60 md:col-span-2"
                                                        >
                                                            {savingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                                                            Save org memory note
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                                                    <Building2 className="h-4 w-4" />
                                                    Recent invoices and proposals
                                                </div>
                                                <div className="space-y-2">
                                                    {selected.recent_invoices.slice(0, 4).map((invoice) => (
                                                        <a key={invoice.id} href={`/god/collections?invoice=${invoice.id}`} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 hover:border-gray-700 hover:text-white">
                                                            <span>{invoice.invoice_number ?? invoice.id.slice(0, 8)}</span>
                                                            <span>{invoice.balance_amount_label}</span>
                                                        </a>
                                                    ))}
                                                    {selected.expiring_proposals.slice(0, 4).map((proposal) => (
                                                        <a key={proposal.id} href={`/god/collections?proposal=${proposal.id}`} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 hover:border-gray-700 hover:text-white">
                                                            <span>{proposal.title ?? proposal.id.slice(0, 8)}</span>
                                                            <span>{proposal.value_label}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                                                    <CircleAlert className="h-4 w-4" />
                                                    Support and incident context
                                                </div>
                                                <div className="space-y-2">
                                                    {selected.recent_support_tickets.map((ticket) => (
                                                        <a key={ticket.id} href={ticket.href} className="flex items-start justify-between rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 hover:border-gray-700 hover:text-white">
                                                            <div>
                                                                <div>{ticket.title}</div>
                                                                <div className="text-xs text-gray-500">{ticket.priority ?? "normal"} • {ticket.status ?? "open"}</div>
                                                            </div>
                                                            <ExternalLink className="h-4 w-4 shrink-0 text-gray-500" />
                                                        </a>
                                                    ))}
                                                    {selected.recent_incidents.map((incident) => (
                                                        <a key={incident.id} href={incident.href} className="flex items-start justify-between rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 hover:border-gray-700 hover:text-white">
                                                            <div>
                                                                <div>{incident.title}</div>
                                                                <div className="text-xs text-gray-500">{incident.level ?? "unknown"} • {incident.status ?? "open"}</div>
                                                            </div>
                                                            <ExternalLink className="h-4 w-4 shrink-0 text-gray-500" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                                <div className="mb-3 text-sm font-medium text-white">Customer 360 timeline</div>
                                                <div className="space-y-2">
                                                    {selected.timeline.map((entry) => (
                                                        <div key={entry.id} className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="text-sm text-white">{entry.title}</div>
                                                                <div className="text-xs text-gray-500">{formatDate(entry.at)}</div>
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-400">{entry.detail}</div>
                                                            {entry.href ? (
                                                                <a href={entry.href} className="mt-2 inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200">
                                                                    Open
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-96 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950/70 text-gray-400">
                            Select an account from the left pane to open the Business OS dossier.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
