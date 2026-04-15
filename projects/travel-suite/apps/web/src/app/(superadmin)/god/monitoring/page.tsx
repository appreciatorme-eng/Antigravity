// Health Monitor — real-time service health, queue depths, and system observability.
// Now includes queue management: retry, flush, and purge operations.

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Activity, RotateCcw, Trash2, Eraser } from "lucide-react";
import StatusDot from "@/components/god-mode/StatusDot";
import StatCard from "@/components/god-mode/StatCard";
import ConfirmActionButton from "@/components/god-mode/ConfirmActionButton";
import ConfirmDangerModal from "@/components/god-mode/ConfirmDangerModal";
import ActionToast, { useActionToast } from "@/components/god-mode/ActionToast";
import { authedFetch } from "@/lib/api/authed-fetch";
import type { HealthStatus } from "@/components/god-mode/StatusDot";

interface ServiceHealth {
    status: "healthy" | "degraded" | "down" | "unknown";
    latency_ms?: number;
    configured?: boolean;
    detail?: string;
}

interface HealthData {
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
        fcm: ServiceHealth;
        whatsapp: ServiceHealth;
        sentry: ServiceHealth;
        posthog: ServiceHealth;
    };
    queues: {
        notifications: { pending: number; failed: number; dead_letters: number };
        social_posts: { pending: number };
    };
    checked_at: string;
}

interface QueueData {
    notification_queue: { pending: number; failed: number; dead_letters: number; oldest_pending_minutes: number };
    social_post_queue: { pending: number };
    pdf_queue: { pending: number };
    checked_at: string;
}

const SERVICE_LABELS: Record<string, string> = {
    database: "Database",
    redis: "Redis (Upstash)",
    fcm: "Firebase FCM",
    whatsapp: "WhatsApp API",
    sentry: "Sentry",
    posthog: "PostHog",
};

function queueStatus(pending: number, threshold = 50): HealthStatus {
    if (pending >= threshold) return "down";
    if (pending >= threshold / 2) return "degraded";
    return "healthy";
}

export default function MonitoringPage() {
    const searchParams = useSearchParams();
    const [health, setHealth] = useState<HealthData | null>(null);
    const [queues, setQueues] = useState<QueueData | null>(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const focus = searchParams.get("focus");

    // Action state
    const [purgeTarget, setPurgeTarget] = useState<{ queue: string; label: string } | null>(null);
    const [purgeLoading, setPurgeLoading] = useState(false);
    const { toast, showSuccess, showError, dismiss } = useActionToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [healthRes, queuesRes] = await Promise.all([
                fetch("/api/superadmin/monitoring/health"),
                fetch("/api/superadmin/monitoring/queues"),
            ]);
            if (healthRes.ok) setHealth(await healthRes.json());
            if (queuesRes.ok) setQueues(await queuesRes.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        intervalRef.current = setInterval(fetchData, 30_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchData]);

    // --- QUEUE ACTION HANDLERS ---

    async function handleQueueAction(queue: string, action: "retry" | "flush") {
        const res = await authedFetch(`/api/superadmin/monitoring/queues/${queue}/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
            const json = await res.json();
            showSuccess(`${action === "retry" ? "Retried" : "Flushed"} ${json.affected_count ?? 0} items from ${queue}`);
            await fetchData();
        } else {
            showError(`Failed to ${action} queue: ${queue}`);
        }
    }

    async function handlePurgeConfirm() {
        if (!purgeTarget) return;
        setPurgeLoading(true);
        try {
            const res = await authedFetch(`/api/superadmin/monitoring/queues/${purgeTarget.queue}/purge`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                const json = await res.json();
                showSuccess(`Purged ${json.affected_count ?? 0} items from ${purgeTarget.label}`);
                await fetchData();
            } else {
                showError(`Failed to purge ${purgeTarget.label}`);
            }
        } finally {
            setPurgeLoading(false);
            setPurgeTarget(null);
        }
    }

    const services = health?.services;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        Health Monitor
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Auto-refreshes every 30s
                        {health?.checked_at && (
                            <span className="ml-2 text-gray-600">
                                — Last: {new Date(health.checked_at).toLocaleTimeString()}
                            </span>
                        )}
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

            {/* Service health grid */}
            <div className={`grid grid-cols-2 lg:grid-cols-3 gap-4 ${focus === "services" ? "rounded-xl ring-1 ring-amber-500/60 ring-offset-0" : ""}`}>
                {services && Object.entries(services).map(([key, svc]) => (
                    <div
                        key={key}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">
                                {SERVICE_LABELS[key] ?? key}
                            </p>
                            {svc.latency_ms !== undefined && svc.latency_ms >= 0 && (
                                <p className="text-sm text-gray-300 mt-1">{svc.latency_ms}ms</p>
                            )}
                            {svc.configured !== undefined && !svc.configured && (
                                <p className="text-xs text-amber-500 mt-1">Not configured</p>
                            )}
                            {svc.detail && (
                                <p className="text-xs text-gray-500 mt-1">{svc.detail}</p>
                            )}
                        </div>
                        <StatusDot status={svc.status as HealthStatus} label={svc.status} />
                    </div>
                ))}
                {loading && !services && Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                ))}
            </div>

            {/* Queue depths */}
            <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${focus === "queues" ? "ring-1 ring-amber-500/60" : ""}`}>
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                    Queue Depths
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Notif. Pending"
                        value={loading ? "…" : (queues?.notification_queue.pending ?? 0)}
                        accent={queueStatus(queues?.notification_queue.pending ?? 0) === "healthy" ? "emerald" : "red"}
                    />
                    <StatCard
                        label="Notif. Failed"
                        value={loading ? "…" : (queues?.notification_queue.failed ?? 0)}
                        accent={queues?.notification_queue.failed ? "red" : "emerald"}
                    />
                    <StatCard
                        label="Dead Letters"
                        value={loading ? "…" : (queues?.notification_queue.dead_letters ?? 0)}
                        accent={queues?.notification_queue.dead_letters ? "amber" : "emerald"}
                    />
                    <StatCard
                        label="Social Pending"
                        value={loading ? "…" : (queues?.social_post_queue.pending ?? 0)}
                        accent="blue"
                    />
                </div>

                {/* Queue management actions */}
                <div className="mt-6 space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Queue Management</h3>

                    {/* Notifications queue */}
                    <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Notification Queue</p>
                                <p className="text-xs text-gray-500">
                                    {queues?.notification_queue.failed ?? 0} failed · {queues?.notification_queue.dead_letters ?? 0} dead letters
                                </p>
                            </div>
                            <StatusDot status={queueStatus(queues?.notification_queue.pending ?? 0)} label="" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ConfirmActionButton
                                label="Retry Failed"
                                confirmLabel="Retry All"
                                icon={<RotateCcw className="h-3.5 w-3.5" />}
                                disabled={(queues?.notification_queue.failed ?? 0) === 0}
                                onConfirm={() => handleQueueAction("notifications", "retry")}
                            />
                            <ConfirmActionButton
                                label="Flush Dead Letters"
                                confirmLabel="Retry Dead Letters"
                                icon={<RotateCcw className="h-3.5 w-3.5" />}
                                disabled={(queues?.notification_queue.dead_letters ?? 0) === 0}
                                onConfirm={() => handleQueueAction("dead-letters", "retry")}
                            />
                            <ConfirmActionButton
                                label="Clean Up"
                                confirmLabel="Flush Completed"
                                icon={<Eraser className="h-3.5 w-3.5" />}
                                onConfirm={() => handleQueueAction("notifications", "flush")}
                            />
                            <button
                                onClick={() => setPurgeTarget({ queue: "notifications", label: "Notification Queue" })}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-950/20 px-3 py-2 text-sm text-red-300
                                           transition-colors hover:border-red-700 hover:bg-red-950/30"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Purge All
                            </button>
                        </div>
                    </div>

                    {/* Social queue */}
                    <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Social Post Queue</p>
                                <p className="text-xs text-gray-500">{queues?.social_post_queue.pending ?? 0} pending</p>
                            </div>
                            <StatusDot status={queueStatus(queues?.social_post_queue.pending ?? 0, 20)} label="" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ConfirmActionButton
                                label="Retry Failed"
                                confirmLabel="Retry All"
                                icon={<RotateCcw className="h-3.5 w-3.5" />}
                                onConfirm={() => handleQueueAction("social", "retry")}
                            />
                            <ConfirmActionButton
                                label="Clean Up"
                                confirmLabel="Flush Completed"
                                icon={<Eraser className="h-3.5 w-3.5" />}
                                onConfirm={() => handleQueueAction("social", "flush")}
                            />
                            <button
                                onClick={() => setPurgeTarget({ queue: "social", label: "Social Post Queue" })}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-950/20 px-3 py-2 text-sm text-red-300
                                           transition-colors hover:border-red-700 hover:bg-red-950/30"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Purge All
                            </button>
                        </div>
                    </div>

                    {/* PDF queue */}
                    <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">PDF Extraction Queue</p>
                                <p className="text-xs text-gray-500">{queues?.pdf_queue.pending ?? 0} pending</p>
                            </div>
                            <StatusDot status={queueStatus(queues?.pdf_queue.pending ?? 0, 20)} label="" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <ConfirmActionButton
                                label="Retry Failed"
                                confirmLabel="Retry All"
                                icon={<RotateCcw className="h-3.5 w-3.5" />}
                                onConfirm={() => handleQueueAction("pdf", "retry")}
                            />
                            <ConfirmActionButton
                                label="Clean Up"
                                confirmLabel="Flush Completed"
                                icon={<Eraser className="h-3.5 w-3.5" />}
                                onConfirm={() => handleQueueAction("pdf", "flush")}
                            />
                            <button
                                onClick={() => setPurgeTarget({ queue: "pdf", label: "PDF Extraction Queue" })}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-950/20 px-3 py-2 text-sm text-red-300
                                           transition-colors hover:border-red-700 hover:bg-red-950/30"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Purge All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Oldest pending */}
                {(queues?.notification_queue.oldest_pending_minutes ?? 0) > 5 && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-900/40">
                        <p className="text-sm text-amber-300">
                            Oldest pending notification is {queues!.notification_queue.oldest_pending_minutes} minutes old
                            — queue processing may be stalled
                        </p>
                    </div>
                )}
            </div>

            {/* Purge confirmation modal */}
            {purgeTarget && (
                <ConfirmDangerModal
                    open={true}
                    title={`Purge ${purgeTarget.label}`}
                    message={`This will permanently delete ALL items from the ${purgeTarget.label}, including pending items. This cannot be undone.`}
                    onConfirm={handlePurgeConfirm}
                    onCancel={() => setPurgeTarget(null)}
                    loading={purgeLoading}
                />
            )}

            {/* Toast notifications */}
            <ActionToast {...toast} onDismiss={dismiss} />
        </div>
    );
}
