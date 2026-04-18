"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    Loader2,
    RefreshCw,
    ShieldAlert,
    Sparkles,
    XCircle,
} from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import { cn } from "@/lib/utils";
import type { AutopilotApproval, AutopilotSnapshot } from "@/lib/platform/business-os";

type SlackStatus = {
    configured: boolean;
    source: "SLACK_OPS_WEBHOOK_URL" | "SLACK_WEBHOOK_URL" | null;
};

type ApprovalGroup = {
    org_id: string;
    account_name: string;
    highest_priority: number;
    highest_severity: AutopilotApproval["severity"];
    oldest_first_seen_at: string | null;
    pending_count: number;
    revenue_count: number;
    customer_count: number;
    policy_count: number;
    approvals: AutopilotApproval[];
};

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatHoursSince(value: string | null | undefined): string {
    if (!value) return "new";
    const hours = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 3_600_000));
    if (hours < 1) return "<1h";
    return `${hours}h`;
}

function formatCountLabel(value: number, noun: string): string {
    return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

function formatSlackSource(source: SlackStatus["source"]): string {
    if (source === "SLACK_OPS_WEBHOOK_URL") return "ops webhook";
    if (source === "SLACK_WEBHOOK_URL") return "default webhook";
    return "not configured";
}

function severityWeight(value: AutopilotApproval["severity"]): number {
    if (value === "critical") return 3;
    if (value === "high") return 2;
    return 1;
}

function severityClasses(value: AutopilotApproval["severity"]): string {
    if (value === "critical") return "border-red-900/70 bg-red-950/20 text-red-100";
    if (value === "high") return "border-amber-900/70 bg-amber-950/20 text-amber-100";
    return "border-gray-800 bg-gray-950/50 text-gray-200";
}

function actionKindLabel(approval: AutopilotApproval): string {
    if (approval.action_kind === "guarded_collections_writeoff" || approval.suggested_work_item_kind === "collections") {
        return "Revenue";
    }
    if (approval.action_kind === "guarded_customer_communication") {
        return "Customer";
    }
    if (approval.action_kind === "guarded_support_escalation") {
        return "Support";
    }
    return "Policy";
}

function workItemHref(kind: string): string {
    if (kind === "collections" || kind === "renewal") return "/god/collections?tab=invoices";
    if (kind === "support_escalation") return "/god/support?status=open";
    if (kind === "incident_followup") return "/god/errors?status=open";
    return "/god/business-os";
}

function businessOsHref(orgId: string): string {
    return `/god/business-os?selected_org_id=${encodeURIComponent(orgId)}`;
}

function buildApprovalGroups(approvals: AutopilotApproval[]): ApprovalGroup[] {
    const groups = new Map<string, ApprovalGroup>();
    for (const approval of approvals.filter((item) => item.status === "pending")) {
        const current = groups.get(approval.org_id);
        const isRevenue = approval.action_kind === "guarded_collections_writeoff" || approval.suggested_work_item_kind === "collections";
        const isCustomer = approval.action_kind === "guarded_customer_communication";
        const isPolicy = approval.action_kind === "guarded_feature_flag_change";
        const nextGroup: ApprovalGroup = current ?? {
            org_id: approval.org_id,
            account_name: approval.account_name,
            highest_priority: approval.priority_score,
            highest_severity: approval.severity,
            oldest_first_seen_at: approval.first_seen_at,
            pending_count: 0,
            revenue_count: 0,
            customer_count: 0,
            policy_count: 0,
            approvals: [],
        };
        nextGroup.pending_count += 1;
        nextGroup.highest_priority = Math.max(nextGroup.highest_priority, approval.priority_score);
        nextGroup.highest_severity = severityWeight(approval.severity) > severityWeight(nextGroup.highest_severity)
            ? approval.severity
            : nextGroup.highest_severity;
        nextGroup.oldest_first_seen_at = !nextGroup.oldest_first_seen_at
            ? approval.first_seen_at
            : !approval.first_seen_at
                ? nextGroup.oldest_first_seen_at
                : new Date(approval.first_seen_at).getTime() < new Date(nextGroup.oldest_first_seen_at).getTime()
                    ? approval.first_seen_at
                    : nextGroup.oldest_first_seen_at;
        if (isRevenue) nextGroup.revenue_count += 1;
        if (isCustomer) nextGroup.customer_count += 1;
        if (isPolicy) nextGroup.policy_count += 1;
        nextGroup.approvals.push(approval);
        groups.set(approval.org_id, nextGroup);
    }

    return Array.from(groups.values())
        .map((group) => ({
            ...group,
            approvals: [...group.approvals].sort((left, right) =>
                severityWeight(right.severity) - severityWeight(left.severity)
                || right.priority_score - left.priority_score
                || left.title.localeCompare(right.title),
            ),
        }))
        .sort((left, right) =>
            severityWeight(right.highest_severity) - severityWeight(left.highest_severity)
            || right.highest_priority - left.highest_priority
            || (right.pending_count - left.pending_count)
            || left.account_name.localeCompare(right.account_name),
        );
}

export default function GodAutopilotPage() {
    const [data, setData] = useState<AutopilotSnapshot | null>(null);
    const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [testingSlack, setTestingSlack] = useState(false);
    const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [response, slackResponse] = await Promise.all([
                authedFetch("/api/superadmin/autopilot"),
                authedFetch("/api/superadmin/settings/slack"),
            ]);
            if (!response.ok) throw new Error("Failed to load Autopilot");
            setData(await response.json() as AutopilotSnapshot);
            if (slackResponse.ok) {
                setSlackStatus(await slackResponse.json() as SlackStatus);
            }
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load Autopilot");
        } finally {
            setLoading(false);
        }
    }, []);

    async function runNow() {
        setRunning(true);
        setError(null);
        try {
            const response = await authedFetch("/api/superadmin/autopilot/run", { method: "POST" });
            if (!response.ok) throw new Error("Failed to run Autopilot");
            const payload = await response.json() as {
                result: { ops_loop: { created_count: number; candidate_count: number } };
                slack?: { configured: boolean; posted: boolean; source: SlackStatus["source"] };
            };
            const workSummary = `Autopilot run completed. Created ${payload.result.ops_loop.created_count} of ${payload.result.ops_loop.candidate_count} candidate work items.`;
            const slackSummary = payload.slack?.posted
                ? `Slack digest sent (${formatSlackSource(payload.slack.source)}).`
                : payload.slack?.configured
                    ? "Slack digest failed to send."
                    : "Slack is not configured.";
            setMessage(`${workSummary} ${slackSummary}`);
            await loadData();
        } catch (runError) {
            setError(runError instanceof Error ? runError.message : "Failed to run Autopilot");
        } finally {
            setRunning(false);
        }
    }

    async function sendSlackTest() {
        setTestingSlack(true);
        setError(null);
        try {
            const response = await authedFetch("/api/superadmin/settings/slack", { method: "POST" });
            const payload = await response.json() as { error?: string; source?: SlackStatus["source"] };
            if (!response.ok) {
                throw new Error(payload.error ?? "Failed to send Slack test");
            }
            setMessage(`Slack test alert sent (${formatSlackSource(payload.source ?? null)}).`);
            await loadData();
        } catch (slackError) {
            setError(slackError instanceof Error ? slackError.message : "Failed to send Slack test");
        } finally {
            setTestingSlack(false);
        }
    }

    async function decideApproval(id: string, decision: "approve" | "reject") {
        setBusyApprovalId(id);
        setError(null);
        try {
            const response = await authedFetch(`/api/superadmin/autopilot/approvals/${encodeURIComponent(id)}/${decision}`, {
                method: "POST",
            });
            if (!response.ok) throw new Error(`Failed to ${decision} action`);
            setMessage(decision === "approve" ? "Autopilot action approved." : "Autopilot action rejected.");
            await loadData();
        } catch (decisionError) {
            setError(decisionError instanceof Error ? decisionError.message : `Failed to ${decision} action`);
        } finally {
            setBusyApprovalId(null);
        }
    }

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const groupedApprovals = buildApprovalGroups(data?.approvals ?? []);
    const latestRun = data?.recent_runs[0] ?? null;
    const communicationDrafts = data?.communication_drafts ?? [];
    const autopilotWorkItems = data?.autopilot_work_items ?? [];
    const renewalCandidates = data?.renewal_candidates ?? [];
    const expansionCandidates = data?.expansion_candidates ?? [];
    const playbookLearning = data?.playbook_learning ?? [];
    const recentRunLabel = latestRun ? formatHoursSince(latestRun.created_at) : "none";
    const runAlerts = data?.run_health.alerts ?? [];
    const runAlertLevel = runAlerts.length > 0
        ? runAlerts.some((alert) => alert.includes("stale") || alert.includes("failed") || alert.includes("No autopilot runs"))
            ? "danger"
            : "warning"
        : "ok";
    const summaryTiles = [
        {
            label: "Approvals waiting",
            value: data?.summary.pending_approvals ?? 0,
            detail: formatCountLabel(groupedApprovals.length, "account"),
        },
        {
            label: "Blocked accounts",
            value: data?.summary.blocked_by_approval_accounts ?? 0,
            detail: `${data?.approval_watchdog.stale_48h ?? 0} stale >48h`,
        },
        {
            label: "Latest run",
            value: recentRunLabel,
            detail: latestRun ? latestRun.trigger : "not recorded",
        },
        {
            label: "Auto-handled work",
            value: data?.summary.autopilot_work_items ?? 0,
            detail: `${data?.summary.communication_drafts ?? 0} drafts queued`,
        },
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-white">Autopilot</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Review exceptions, approve risky actions, and check whether automation is actually keeping the business moving.
                    </p>
                    <div className={cn(
                        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                        slackStatus?.configured
                            ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-200"
                            : "border-amber-900/60 bg-amber-950/20 text-amber-200",
                    )}>
                        <span>{slackStatus?.configured ? "Slack connected" : "Slack disconnected"}</span>
                        <span className="text-gray-300">· {formatSlackSource(slackStatus?.source ?? null)}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/god"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                    >
                        Command Center
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/god/business-os"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
                    >
                        Business OS
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
                    <button
                        onClick={() => void sendSlackTest()}
                        disabled={testingSlack}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-700 hover:text-white disabled:opacity-60"
                    >
                        {testingSlack ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {testingSlack ? "Sending..." : "Send Slack test"}
                    </button>
                    <button
                        onClick={() => void runNow()}
                        disabled={running}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200 transition-colors hover:border-amber-700/60 disabled:opacity-60"
                    >
                        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {running ? "Running..." : "Run now"}
                    </button>
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            ) : null}
            {message ? (
                <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
                    {message}
                </div>
            ) : null}

            <section className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-white">
                                {data?.founder_digest.headline ?? "Loading founder brief..."}
                            </div>
                            <p className="text-sm text-gray-400">
                                {data?.founder_digest.summary ?? "Building the current founder summary from approvals, runs, and automation posture."}
                            </p>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            {(data?.daily_brief.priorities ?? []).slice(0, 2).map((item) => (
                                <div key={item} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-200">
                                    {item}
                                </div>
                            ))}
                            {(data?.daily_brief.gaps ?? []).slice(0, 2).map((item) => (
                                <div key={item} className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {summaryTiles.map((tile) => (
                            <div key={tile.label} className="rounded-lg border border-gray-800 bg-black/30 p-4">
                                <div className="text-sm text-gray-400">{tile.label}</div>
                                <div className="mt-2 text-2xl font-semibold text-white">{tile.value}</div>
                                <div className="mt-1 text-xs text-gray-500">{tile.detail}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-medium text-white">Approval queue</div>
                            <div className="mt-1 text-sm text-gray-400">
                                Grouped by account so you can approve the highest-impact work without reading duplicate cards.
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-200">
                            {formatCountLabel(data?.summary.pending_approvals ?? 0, "approval")}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-gray-800 bg-black/20 px-3 py-2 text-sm text-gray-300">
                            {formatCountLabel(data?.approval_watchdog.pending ?? 0, "pending")}
                        </div>
                        <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                            {formatCountLabel(data?.approval_watchdog.stale_24h ?? 0, "stale >24h")}
                        </div>
                        <div className="rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-2 text-sm text-red-200">
                            {formatCountLabel(data?.approval_watchdog.stale_48h ?? 0, "stale >48h")}
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {groupedApprovals.length > 0 ? groupedApprovals.map((group) => (
                            <div key={group.org_id} className={cn("rounded-xl border p-4", severityClasses(group.highest_severity))}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-base font-medium text-white">{group.account_name}</div>
                                            <div className="rounded-md border border-gray-800 bg-black/30 px-2 py-1 text-xs text-gray-300">
                                                priority {group.highest_priority}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                                            <span className="rounded-md border border-gray-800 bg-black/30 px-2 py-1">
                                                {formatCountLabel(group.pending_count, "approval")}
                                            </span>
                                            {group.revenue_count > 0 ? (
                                                <span className="rounded-md border border-amber-900/60 bg-amber-950/20 px-2 py-1 text-amber-200">
                                                    {formatCountLabel(group.revenue_count, "revenue action")}
                                                </span>
                                            ) : null}
                                            {group.customer_count > 0 ? (
                                                <span className="rounded-md border border-gray-800 bg-black/30 px-2 py-1">
                                                    {formatCountLabel(group.customer_count, "customer send")}
                                                </span>
                                            ) : null}
                                            {group.policy_count > 0 ? (
                                                <span className="rounded-md border border-red-900/60 bg-red-950/20 px-2 py-1 text-red-200">
                                                    {formatCountLabel(group.policy_count, "policy change")}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs text-gray-400">
                                        <div>oldest {formatHoursSince(group.oldest_first_seen_at)}</div>
                                        <div className="mt-1">{group.highest_severity}</div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {group.approvals.map((approval) => (
                                        <div key={approval.id} className="rounded-lg border border-gray-800 bg-black/25 p-3">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="text-sm font-medium text-white">{approval.title}</div>
                                                        <div className="rounded-md border border-gray-800 bg-black/30 px-2 py-0.5 text-[11px] text-gray-300">
                                                            {actionKindLabel(approval)}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-300">{approval.description}</div>
                                                    <div className="text-xs text-gray-500">{approval.rationale}</div>
                                                </div>
                                                <div className="text-right text-xs text-gray-400">
                                                    <div>{formatHoursSince(approval.first_seen_at)}</div>
                                                    <div className="mt-1">priority {approval.priority_score}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={businessOsHref(group.org_id)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white"
                                                >
                                                    Open in Business OS
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => void decideApproval(approval.id, "approve")}
                                                    disabled={busyApprovalId === approval.id}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-200 hover:border-emerald-700/60 disabled:opacity-60"
                                                >
                                                    {busyApprovalId === approval.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => void decideApproval(approval.id, "reject")}
                                                    disabled={busyApprovalId === approval.id}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-800/60 bg-red-950/20 px-3 py-1.5 text-xs text-red-200 hover:border-red-700/60 disabled:opacity-60"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-lg border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                No approval-gated actions are pending right now.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-white">Exceptions and run status</div>
                        <div className="mt-3 space-y-2">
                            <div className={cn(
                                "rounded-lg border px-3 py-3 text-sm",
                                runAlertLevel === "danger"
                                    ? "border-red-900/70 bg-red-950/20 text-red-200"
                                    : runAlertLevel === "warning"
                                        ? "border-amber-900/70 bg-amber-950/20 text-amber-200"
                                        : "border-emerald-900/60 bg-emerald-950/20 text-emerald-200",
                            )}>
                                {latestRun
                                    ? `Last run ${formatDateTime(latestRun.created_at)} via ${latestRun.trigger}.`
                                    : "No autopilot runs are recorded yet."}
                            </div>
                            {runAlerts.length > 0 ? runAlerts.slice(0, 3).map((alert) => (
                                <div key={alert} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-300">
                                    {alert}
                                </div>
                            )) : (
                                <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-300">
                                    No active run-health alerts.
                                </div>
                            )}
                        </div>
                        <div className="mt-4 space-y-2">
                            {(data?.run_health.loops ?? []).map((loop) => (
                                <div key={loop.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-800 bg-black/30 px-3 py-2">
                                    <div>
                                        <div className="text-sm text-white">{loop.label}</div>
                                        <div className="mt-1 text-xs text-gray-500">{loop.detail}</div>
                                    </div>
                                    <div className="text-right text-xs text-gray-400">
                                        <div>{loop.status}</div>
                                        <div className="mt-1">{loop.processed_count} handled</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-white">Recent runs</div>
                        <div className="mt-3 space-y-2">
                            {(data?.recent_runs ?? []).length > 0 ? data?.recent_runs.slice(0, 5).map((run) => (
                                <div key={run.id} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-white">{run.action}</div>
                                        <div className="text-xs text-gray-500">{formatDateTime(run.created_at)}</div>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-300">{run.summary}</div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {run.trigger} · {run.actor_name ?? "System"}
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-3 text-sm text-gray-400">
                                    Start with a manual run to seed the first baseline, then check whether the scheduled run stays current.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                    <div className="text-sm font-medium text-white">Auto-handled activity</div>
                    <div className="mt-1 text-sm text-gray-400">What AI created, escalated, or closed most recently.</div>
                    <div className="mt-4 space-y-2">
                        {(data?.run_traces ?? []).length > 0 ? data?.run_traces.slice(0, 12).map((trace) => (
                            <Link key={trace.id} href={trace.href} className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-3 transition-colors hover:border-gray-700">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                    <span>{formatDateTime(trace.occurred_at)}</span>
                                    <span>·</span>
                                    <span>{trace.account_name ?? trace.org_id}</span>
                                    {trace.run_key ? (
                                        <>
                                            <span>·</span>
                                            <span>{trace.run_key}</span>
                                        </>
                                    ) : null}
                                </div>
                                <div className="mt-1 text-sm font-medium text-white">{trace.title}</div>
                                <div className="mt-1 text-xs text-gray-400">{trace.reason ?? trace.detail ?? "No reason recorded."}</div>
                            </Link>
                        )) : (
                            <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-3 text-sm text-gray-400">
                                No autopilot trace events are recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-white">Queued outputs</div>
                        <div className="mt-4 space-y-3">
                            {communicationDrafts.length > 0 ? communicationDrafts.slice(0, 4).map((draft) => (
                                <div key={draft.id} className="rounded-lg border border-gray-800 bg-black/30 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm text-white">{draft.account_name}</div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                {draft.sequence_type.replaceAll("_", " ")} · {draft.channel}
                                            </div>
                                        </div>
                                        <div className="text-xs text-amber-200">priority {draft.priority_score}</div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">{draft.reason}</div>
                                </div>
                            )) : (
                                <div className="rounded-lg border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                    No customer drafts are queued right now.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-white">Autopilot-created work</div>
                        <div className="mt-4 space-y-2">
                            {autopilotWorkItems.length > 0 ? autopilotWorkItems.slice(0, 6).map((item) => (
                                <Link
                                    key={item.id}
                                    href={workItemHref(item.kind)}
                                    className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-3 transition-colors hover:border-gray-700"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-white">{item.title}</div>
                                        <div className="text-xs text-gray-500">{item.kind.replaceAll("_", " ")}</div>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-400">{item.summary ?? "No summary recorded."}</div>
                                </Link>
                            )) : (
                                <div className="rounded-lg border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                    No active autopilot work items are open.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <ShieldAlert className="h-4 w-4 text-amber-300" />
                            Policy and promise watch
                        </div>
                        <div className="mt-4 space-y-2">
                            {(data?.policy_violations ?? []).slice(0, 4).map((violation) => (
                                <div key={violation.id} className={cn("rounded-lg border px-3 py-3", severityClasses(violation.severity))}>
                                    <div className="text-sm font-medium text-white">{violation.account_name}</div>
                                    <div className="mt-1 text-xs text-gray-400">{violation.rule}</div>
                                    <div className="mt-2 text-sm text-gray-300">{violation.detail}</div>
                                </div>
                            ))}
                            {(data?.promise_watchdog ?? []).slice(0, 3).map((item) => (
                                <div key={item.org_id} className="rounded-lg border border-gray-800 bg-black/30 px-3 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-white">{item.account_name}</div>
                                        <div className="text-xs text-amber-200">priority {item.priority_score}</div>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {item.reasons.map((reason) => (
                                            <div key={reason} className="text-sm text-gray-300">{reason}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-white">Renewal and expansion</div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="text-sm text-gray-400">Renewal</div>
                                {renewalCandidates.length > 0 ? renewalCandidates.slice(0, 3).map((item) => (
                                    <Link key={item.id} href={item.href} className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-2 hover:border-gray-700">
                                        <div className="text-sm text-white">{item.account_name}</div>
                                        <div className="mt-1 text-xs text-gray-400">{item.detail}</div>
                                    </Link>
                                )) : (
                                    <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">No renewal candidates yet.</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-gray-400">Expansion</div>
                                {expansionCandidates.length > 0 ? expansionCandidates.slice(0, 3).map((item) => (
                                    <Link key={item.id} href={item.href} className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-2 hover:border-gray-700">
                                        <div className="text-sm text-white">{item.account_name}</div>
                                        <div className="mt-1 text-xs text-gray-400">{item.detail}</div>
                                    </Link>
                                )) : (
                                    <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">No expansion candidates yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-white">ROI and trust</div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
                                <div className="text-sm text-gray-400">Runs</div>
                                <div className="mt-2 text-xl font-semibold text-white">{data?.roi_scorecard.run_count ?? "—"}</div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
                                <div className="text-sm text-gray-400">Work items created</div>
                                <div className="mt-2 text-xl font-semibold text-white">{data?.roi_scorecard.work_items_created ?? "—"}</div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
                                <div className="text-sm text-gray-400">Auto-closed work</div>
                                <div className="mt-2 text-xl font-semibold text-white">{data?.roi_scorecard.work_items_auto_closed ?? "—"}</div>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-black/30 p-4">
                                <div className="text-sm text-gray-400">Estimated hours saved</div>
                                <div className="mt-2 text-xl font-semibold text-white">{data?.roi_scorecard.estimated_hours_saved ?? "—"}h</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    {data?.roi_scorecard.estimated_hours_saved_provenance === "estimated" ? "Estimated" : "Unknown provenance"}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4">
                            <div className="text-sm text-emerald-200">Cash recovered</div>
                            <div className="mt-2 text-xl font-semibold text-emerald-100">
                                {data?.roi_scorecard.cash_recovered_inr === null
                                    ? "Unknown"
                                    : `₹${data?.roi_scorecard.cash_recovered_inr?.toLocaleString("en-IN") ?? "0"}`}
                            </div>
                            <div className="mt-1 text-xs text-emerald-200/80">
                                {data?.roi_scorecard.cash_recovered_provenance === "exact"
                                    ? "Payment-linked exact recovery only."
                                    : "Hidden until payment-linked recovery is recorded directly."}
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            {(data?.truth_lock.checks ?? []).slice(0, 4).map((check) => (
                                <div key={check.id} className={cn(
                                    "rounded-lg border px-3 py-2 text-sm",
                                    check.status === "pass"
                                        ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-200"
                                        : "border-amber-900/60 bg-amber-950/20 text-amber-200",
                                )}>
                                    <div className="font-medium">{check.label}</div>
                                    <div className="mt-1 text-xs">{check.detail}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <ClipboardList className="h-4 w-4" />
                            Playbook learning
                        </div>
                        <div className="mt-4 space-y-2">
                            {playbookLearning.length > 0 ? playbookLearning.slice(0, 6).map((row) => (
                                <div key={row.kind} className="rounded-lg border border-gray-800 bg-black/30 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-white">{row.kind.replaceAll("_", " ")}</div>
                                        <div className="text-sm text-emerald-300">{Math.round(row.success_rate * 100)}% success</div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-500">
                                        <div>Total {row.total}</div>
                                        <div>Success {row.success}</div>
                                        <div>Neutral {row.neutral}</div>
                                        <div>Fail {row.fail}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-lg border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                    No playbook outcomes are recorded yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
