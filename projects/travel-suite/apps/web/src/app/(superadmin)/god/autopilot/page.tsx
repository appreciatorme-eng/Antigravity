"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    ArrowRight,
    Bot,
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
import type { AutopilotSnapshot } from "@/lib/platform/business-os";

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "—";
    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function severityClasses(value: "medium" | "high" | "critical"): string {
    if (value === "critical") return "border-red-900/70 bg-red-950/20 text-red-200";
    if (value === "high") return "border-amber-900/70 bg-amber-950/20 text-amber-200";
    return "border-gray-800 bg-gray-950/50 text-gray-300";
}

function workItemHref(kind: string): string {
    if (kind === "collections" || kind === "renewal") return "/god/collections?tab=invoices";
    if (kind === "support_escalation") return "/god/support?status=open";
    if (kind === "incident_followup") return "/god/errors?status=open";
    return "/god/business-os";
}

export default function GodAutopilotPage() {
    const [data, setData] = useState<AutopilotSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const response = await authedFetch("/api/superadmin/autopilot");
            if (!response.ok) throw new Error("Failed to load Autopilot");
            setData(await response.json() as AutopilotSnapshot);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load Autopilot");
        } finally {
            setLoading(false);
        }
    }

    async function runNow() {
        setRunning(true);
        setError(null);
        try {
            const response = await authedFetch("/api/superadmin/autopilot/run", { method: "POST" });
            if (!response.ok) throw new Error("Failed to run Autopilot");
            const payload = await response.json() as { result: { ops_loop: { created_count: number; candidate_count: number } } };
            setMessage(`Autopilot run completed. Created ${payload.result.ops_loop.created_count} of ${payload.result.ops_loop.candidate_count} candidate work items.`);
            await loadData();
        } catch (runError) {
            setError(runError instanceof Error ? runError.message : "Failed to run Autopilot");
        } finally {
            setRunning(false);
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
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-amber-300">
                        <Bot className="h-4 w-4" />
                        Autopilot
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold text-white">Automation control room</h1>
                    <p className="mt-1 max-w-3xl text-sm text-gray-400">
                        Monitor what AI is prioritizing, what was auto-created or auto-closed, what needs approval, and which loops are actually working.
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
                <div className="rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            ) : null}
            {message ? (
                <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
                    {message}
                </div>
            ) : null}

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Pending approvals</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.pending_approvals ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Policy violations</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.policy_violations ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Autopilot work</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.autopilot_work_items ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Promise watchdog</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.promise_watchdog_accounts ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Recent runs</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.recent_runs ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Comms drafts</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.communication_drafts ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Renewal candidates</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.renewal_candidates ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Expansion candidates</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{data?.summary.expansion_candidates ?? "—"}</div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-red-900/50 bg-red-950/10 p-5">
                    <div className="text-sm font-medium text-red-100">Founder mode</div>
                    <div className="mt-2 text-sm text-red-200/80">{data?.founder_mode.headline ?? "Loading founder mode..."}</div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-red-900/40 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-wide text-red-200/70">Approvals</div>
                            <div className="mt-2 text-2xl font-semibold text-white">{data?.founder_mode.approvals.length ?? "—"}</div>
                        </div>
                        <div className="rounded-xl border border-red-900/40 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-wide text-red-200/70">Revenue</div>
                            <div className="mt-2 text-2xl font-semibold text-white">{data?.founder_mode.revenue_moves.length ?? "—"}</div>
                        </div>
                        <div className="rounded-xl border border-red-900/40 bg-black/20 p-4">
                            <div className="text-xs uppercase tracking-wide text-red-200/70">Churn</div>
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
                                <Link key={account.org_id} href="/god/business-os" className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-2 hover:border-gray-700">
                                    <div className="text-sm text-white">{account.account_name}</div>
                                    <div className="mt-1 text-xs text-gray-400">priority {account.priority_score}</div>
                                </Link>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Revenue</div>
                            {(data?.founder_mode.revenue_moves ?? []).slice(0, 3).map((item) => (
                                <Link key={item.id} href={item.href} className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-2 hover:border-gray-700">
                                    <div className="text-sm text-white">{item.account_name}</div>
                                    <div className="mt-1 text-xs text-gray-400">{item.detail}</div>
                                </Link>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Churn</div>
                            {(data?.founder_mode.churn_risks ?? []).slice(0, 3).map((item) => (
                                <Link key={item.id} href={item.href} className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-2 hover:border-gray-700">
                                    <div className="text-sm text-white">{item.account_name}</div>
                                    <div className="mt-1 text-xs text-gray-400">{item.detail}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-100">
                        <Sparkles className="h-4 w-4" />
                        Founder digest
                    </div>
                    <div className="mt-3 text-lg font-semibold text-white">{data?.founder_digest.headline ?? "Loading founder digest..."}</div>
                    <p className="mt-2 text-sm text-amber-100/80">{data?.founder_digest.summary ?? "Building the current founder exception digest..."}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {(data?.founder_digest.sections ?? []).map((section) => (
                            <div key={section.id} className="rounded-xl border border-amber-900/30 bg-black/20 p-4">
                                <div className="text-xs uppercase tracking-wide text-amber-200/70">{section.title}</div>
                                <div className="mt-3 space-y-2">
                                    {section.items.map((item) => (
                                        <div key={item} className="rounded-lg border border-amber-900/20 bg-amber-950/10 px-3 py-2 text-sm text-amber-50/90">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        AI daily brief
                    </div>
                    <div className="mt-3 text-lg font-semibold text-white">{data?.daily_brief.headline ?? "Loading brief..."}</div>
                    <p className="mt-2 text-sm text-gray-300">{data?.daily_brief.summary ?? "Reviewing current automation posture..."}</p>
                    <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-4">
                        <div className="text-sm font-medium text-white">Queue focus</div>
                        <div className="mt-2 text-sm text-gray-300">{data?.daily_brief.queue_focus ?? "Loading queue focus..."}</div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Priorities</div>
                            <div className="mt-2 space-y-2">
                                {(data?.daily_brief.priorities ?? []).length > 0 ? data?.daily_brief.priorities.map((item) => (
                                    <div key={item} className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300">
                                        {item}
                                    </div>
                                )) : (
                                    <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-400">
                                        No urgent priorities right now.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Gaps</div>
                            <div className="mt-2 space-y-2">
                                {(data?.daily_brief.gaps ?? []).length > 0 ? data?.daily_brief.gaps.map((item) => (
                                    <div key={item} className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                                        {item}
                                    </div>
                                )) : (
                                    <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-400">
                                        No major automation gaps surfaced.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                    <div className="text-sm font-medium text-gray-200">Autopilot loops</div>
                    <div className="mt-4 space-y-3">
                        {(data?.loops ?? []).map((loop) => (
                            <div key={loop.id} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-medium text-white">{loop.label}</div>
                                    <div className="text-sm text-amber-200">{loop.count}</div>
                                </div>
                                <div className="mt-2 text-sm text-gray-400">{loop.detail}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-medium text-gray-200">Approval inbox</div>
                            <div className="mt-1 text-sm text-gray-400">Risky actions stay human-in-the-loop. Approve only when you want the follow-through work opened.</div>
                        </div>
                        <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-200">
                            {(data?.approvals ?? []).filter((approval) => approval.status === "pending").length} pending
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {(data?.approvals ?? []).length > 0 ? data?.approvals.map((approval) => (
                            <div key={approval.id} className={cn("rounded-xl border p-4", severityClasses(approval.severity))}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-white">{approval.account_name}</div>
                                        <div className="mt-1 text-sm text-white/90">{approval.title}</div>
                                        <div className="mt-2 text-xs text-gray-300">{approval.description}</div>
                                        <div className="mt-2 text-xs text-gray-400">{approval.rationale}</div>
                                    </div>
                                    <div className="text-right text-xs text-gray-400">
                                        <div>{approval.status}</div>
                                        <div className="mt-1">priority {approval.priority_score}</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Link
                                        href="/god/business-os"
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:border-gray-700 hover:text-white"
                                    >
                                        Open in Business OS
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                    {approval.status === "pending" ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <div className="text-xs text-gray-400">
                                            {approval.decided_by ? `${approval.status} by ${approval.decided_by}` : approval.status} · {formatDateTime(approval.decided_at)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                No approval-gated actions are pending right now.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-gray-200">Recent runs</div>
                        <div className="mt-4 space-y-3">
                            {(data?.recent_runs ?? []).length > 0 ? data?.recent_runs.map((run) => (
                                <div key={run.id} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-white">{run.action}</div>
                                        <div className="text-xs text-gray-500">{formatDateTime(run.created_at)}</div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-300">{run.summary}</div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {run.trigger} • {run.actor_name ?? "System"}
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                    No autopilot runs are recorded yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-gray-200">Brief history</div>
                        <div className="mt-4 space-y-3">
                            {(data?.daily_brief_history ?? []).map((brief) => (
                                <div key={brief.id} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-white">{brief.headline}</div>
                                        <div className="text-xs text-gray-500">{formatDateTime(brief.generated_at)}</div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-300">{brief.summary}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                        <ShieldAlert className="h-4 w-4 text-amber-300" />
                        Policy violations + promise watchdog
                    </div>
                    <div className="mt-4 space-y-3">
                        {(data?.policy_violations ?? []).slice(0, 6).map((violation) => (
                            <div key={violation.id} className={cn("rounded-xl border p-4", severityClasses(violation.severity))}>
                                <div className="text-sm font-medium text-white">{violation.account_name}</div>
                                <div className="mt-1 text-xs text-gray-400">{violation.rule}</div>
                                <div className="mt-2 text-sm text-white/90">{violation.detail}</div>
                            </div>
                        ))}
                        {(data?.promise_watchdog ?? []).slice(0, 4).map((item) => (
                            <div key={item.org_id} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-medium text-white">{item.account_name}</div>
                                    <div className="text-xs text-amber-200">priority {item.priority_score}</div>
                                </div>
                                <div className="mt-2 space-y-2">
                                    {item.reasons.map((reason) => (
                                        <div key={reason} className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                                            {reason}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-gray-200">Customer comms drafts</div>
                        <div className="mt-4 space-y-3">
                            {(data?.communication_drafts ?? []).length > 0 ? data?.communication_drafts.map((draft) => (
                                <div key={draft.id} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-medium text-white">{draft.account_name}</div>
                                            <div className="mt-1 text-xs text-gray-500">{draft.sequence_type.replaceAll("_", " ")} • {draft.channel}</div>
                                        </div>
                                        <div className="text-xs text-amber-200">priority {draft.priority_score}</div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">{draft.reason}</div>
                                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-gray-800 bg-black/20 p-3 text-xs text-gray-300">
                                        {draft.draft}
                                    </pre>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                    No customer comms drafts are queued right now.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-gray-200">Autopilot-created work</div>
                        <div className="mt-4 space-y-3">
                            {(data?.autopilot_work_items ?? []).length > 0 ? data?.autopilot_work_items.map((item) => (
                                <Link
                                    key={item.id}
                                    href={workItemHref(item.kind)}
                                    className="block rounded-xl border border-gray-800 bg-black/30 p-4 transition-colors hover:border-gray-700"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-medium text-white">{item.title}</div>
                                            <div className="mt-1 text-xs text-gray-500">{item.kind.replaceAll("_", " ")} • {item.status}</div>
                                            <div className="mt-2 text-sm text-gray-300">{item.summary ?? "No summary recorded."}</div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-gray-500" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                    No active autopilot work items are open.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                            <ClipboardList className="h-4 w-4" />
                            Playbook learning
                        </div>
                        <div className="mt-4 space-y-3">
                            {(data?.playbook_learning ?? []).length > 0 ? data?.playbook_learning.map((row) => (
                                <div key={row.kind} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-medium text-white">{row.kind.replaceAll("_", " ")}</div>
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
                                <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-sm text-gray-400">
                                    No playbook outcomes are recorded yet.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">
                        <div className="text-sm font-medium text-gray-200">Renewal and expansion queue</div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div>
                                <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">Renewal</div>
                                <div className="space-y-2">
                                    {(data?.renewal_candidates ?? []).length > 0 ? data?.renewal_candidates.map((item) => (
                                        <Link key={item.id} href={item.href} className="block rounded-lg border border-gray-800 bg-black/30 px-3 py-2 hover:border-gray-700">
                                            <div className="text-sm text-white">{item.account_name}</div>
                                            <div className="mt-1 text-xs text-gray-400">{item.detail}</div>
                                        </Link>
                                    )) : (
                                        <div className="rounded-lg border border-gray-800 bg-black/30 px-3 py-2 text-sm text-gray-400">No renewal candidates yet.</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">Expansion</div>
                                <div className="space-y-2">
                                    {(data?.expansion_candidates ?? []).length > 0 ? data?.expansion_candidates.map((item) => (
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
                </div>
            </section>
        </div>
    );
}
