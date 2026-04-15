// Health Monitor — real-time service health, queue depths, and system observability.

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Activity } from "lucide-react";
import StatusDot from "@/components/god-mode/StatusDot";
import StatCard from "@/components/god-mode/StatCard";
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

            {/* PDF queue */}
            {(queues?.pdf_queue.pending ?? 0) > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-300 font-medium">PDF Extraction Queue</p>
                        <p className="text-xs text-gray-500">Pending items awaiting processing</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-amber-400">{queues?.pdf_queue.pending}</span>
                        <StatusDot status={queueStatus(queues?.pdf_queue.pending ?? 0, 20)} label="" />
                    </div>
                </div>
            )}
        </div>
    );
}
