"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Bell,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    RefreshCcw,
    MessageCircle,
    Activity,
    Phone,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassBadge } from "@/components/glass/GlassBadge";

interface NotificationLog {
    id: string;
    trip_id: string | null;
    recipient_id: string | null;
    recipient_phone: string | null;
    recipient_type: string | null;
    notification_type: string;
    title: string | null;
    body: string | null;
    status: string | null;
    error_message: string | null;
    sent_at: string | null;
    created_at: string | null;
    profiles: {
        full_name: string | null;
        email: string | null;
    } | null;
}

interface QueueHealth {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    upcomingHour: number;
}

interface DeliveryRow {
    id: string;
    queue_id: string | null;
    trip_id: string | null;
    channel: "whatsapp" | "push" | "email";
    status: "queued" | "processing" | "sent" | "failed" | "skipped" | "retrying";
    attempt_number: number;
    error_message: string | null;
    created_at: string;
}

interface DeliveryResponse {
    rows: DeliveryRow[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
    summary: {
        counts_by_status: Record<string, number>;
    };
}

interface WhatsAppHealthSummary {
    total_driver_profiles: number;
    drivers_with_phone: number;
    drivers_missing_phone: number;
    active_trips_with_driver: number;
    stale_active_driver_trips: number;
    location_pings_last_1h: number;
    location_pings_last_24h: number;
    unmapped_external_drivers: number;
}

interface WhatsAppHealthPing {
    driver_id: string;
    driver_name: string;
    trip_id: string | null;
    recorded_at: string | null;
    age_minutes: number | null;
    status: "fresh" | "stale";
}

interface WhatsAppHealthPayload {
    summary: WhatsAppHealthSummary;
    latest_pings: WhatsAppHealthPing[];
    drivers_missing_phone_list: Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        phone?: string | null;
    }>;
}

export default function NotificationLogsPage() {
    const supabase = createClient();
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [whatsAppMessage, setWhatsAppMessage] = useState("");
    const [queueHealth, setQueueHealth] = useState<QueueHealth>({
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        upcomingHour: 0,
    });
    const [runningQueue, setRunningQueue] = useState(false);
    const [retryingFailed, setRetryingFailed] = useState(false);
    const [schedulingFollowups, setSchedulingFollowups] = useState(false);
    const [cleaningShares, setCleaningShares] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [healthLoading, setHealthLoading] = useState(false);
    const [whatsAppHealth, setWhatsAppHealth] = useState<WhatsAppHealthPayload | null>(null);
    const [normalizingDriverId, setNormalizingDriverId] = useState<string | null>(null);
    const [normalizingAllDrivers, setNormalizingAllDrivers] = useState(false);
    const [deliveryRows, setDeliveryRows] = useState<DeliveryRow[]>([]);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryChannel, setDeliveryChannel] = useState<"all" | "whatsapp" | "push" | "email">("all");
    const [deliveryFailedOnly, setDeliveryFailedOnly] = useState(true);
    const [deliverySummary, setDeliverySummary] = useState<Record<string, number>>({});
    const [retryingQueueId, setRetryingQueueId] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("notification_logs")
                .select(`
                    *,
                    profiles:recipient_id (
                        full_name,
                        email
                    )
                `)
                .order("created_at", { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);

            const now = new Date();
            const inOneHourIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            const nowIso = now.toISOString();

            const [
                { count: pendingCount = 0 },
                { count: processingCount = 0 },
                { count: sentCount = 0 },
                { count: failedCount = 0 },
                { count: upcomingHourCount = 0 },
            ] = await Promise.all([
                supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
                supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "processing"),
                supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "sent"),
                supabase.from("notification_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
                supabase
                    .from("notification_queue")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "pending")
                    .gte("scheduled_for", nowIso)
                    .lte("scheduled_for", inOneHourIso),
            ]);

            setQueueHealth({
                pending: Number(pendingCount || 0),
                processing: Number(processingCount || 0),
                sent: Number(sentCount || 0),
                failed: Number(failedCount || 0),
                upcomingHour: Number(upcomingHourCount || 0),
            });
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, statusFilter]);

    useEffect(() => {
        void fetchLogs();
    }, [fetchLogs]);

    const fetchWhatsAppHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/whatsapp/health", {
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to fetch WhatsApp health");
            }
            setWhatsAppHealth(payload);
        } catch (error) {
            console.error("Error fetching WhatsApp health:", error);
        } finally {
            setHealthLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void fetchWhatsAppHealth();
    }, [fetchWhatsAppHealth]);

    const fetchDeliveryTracking = useCallback(async () => {
        setDeliveryLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const params = new URLSearchParams();
            params.set("limit", "40");
            if (deliveryChannel !== "all") params.set("channel", deliveryChannel);
            if (deliveryFailedOnly) params.set("failed_only", "true");

            const response = await fetch(`/api/admin/notifications/delivery?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });
            const payload = (await response.json()) as DeliveryResponse & { error?: string };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to fetch delivery tracking");
            }

            setDeliveryRows(payload.rows || []);
            setDeliverySummary(payload.summary?.counts_by_status || {});
        } catch (error) {
            console.error("Error fetching delivery tracking:", error);
        } finally {
            setDeliveryLoading(false);
        }
    }, [supabase, deliveryChannel, deliveryFailedOnly]);

    useEffect(() => {
        void fetchDeliveryTracking();
    }, [fetchDeliveryTracking]);

    useEffect(() => {
        if (!actionMessage && !actionError) return;
        const timer = window.setTimeout(() => {
            setActionMessage(null);
            setActionError(null);
        }, 4000);
        return () => window.clearTimeout(timer);
    }, [actionMessage, actionError]);

    const getStatusIcon = (status: string | null) => {
        switch (status) {
            case "sent":
            case "delivered":
                return <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
            case "pending":
                return <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
            default:
                return null;
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    const filteredLogs = logs.filter(log =>
        log.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const normalizePhone = (phone?: string | null) => (phone ? phone.replace(/\D/g, "") : "");

    const getWhatsAppLink = (phone?: string | null, message?: string | null) => {
        const cleanPhone = normalizePhone(phone);
        if (!cleanPhone) return null;
        const text = encodeURIComponent(
            message || whatsAppMessage || "Hi! We have an update for you from Travel Suite."
        );
        return `https://wa.me/${cleanPhone}?text=${text}`;
    };

    const runQueueNow = async () => {
        try {
            setRunningQueue(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/notifications/process-queue", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });

            const payload = await response.json();
            if (!response.ok) {
                setActionError(payload?.error || "Failed to run queue");
                return;
            }

            setActionMessage(
                `Queue processed: ${payload.processed}, sent: ${payload.sent}, failed: ${payload.failed}`
            );
            await fetchLogs();
        } catch (error) {
            console.error("Run queue error:", error);
            setActionError("Failed to run queue");
        } finally {
            setRunningQueue(false);
        }
    };

    const retryFailedQueue = async () => {
        try {
            setRetryingFailed(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/notifications/retry-failed", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                setActionError(payload?.error || "Failed to retry failed queue items");
                return;
            }

            setActionMessage(`Moved ${payload.retried || 0} failed item(s) back to pending.`);
            await fetchLogs();
        } catch (error) {
            console.error("Retry failed queue error:", error);
            setActionError("Failed to retry failed queue items");
        } finally {
            setRetryingFailed(false);
        }
    };

    const scheduleFollowupsNow = async () => {
        try {
            setSchedulingFollowups(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/notifications/schedule-followups?limit=300", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                setActionError(payload?.error || "Failed to schedule follow-up notifications");
                return;
            }

            setActionMessage(
                `Follow-up scheduler scanned ${payload?.scanned || 0} trips, queued ${payload?.queued || 0}, skipped ${payload?.skipped_existing || 0}.`
            );
            await fetchLogs();
            await fetchDeliveryTracking();
        } catch (error) {
            console.error("Schedule followups error:", error);
            setActionError("Failed to schedule follow-up notifications");
        } finally {
            setSchedulingFollowups(false);
        }
    };

    const cleanupExpiredShares = async () => {
        try {
            setCleaningShares(true);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/location/cleanup-expired", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                setActionError(payload?.error || "Failed to clean expired shares");
                return;
            }
            setActionMessage(`Deactivated ${payload.cleaned || 0} expired live share link(s).`);
        } catch (error) {
            console.error("Cleanup expired shares error:", error);
            setActionError("Failed to clean expired shares");
        } finally {
            setCleaningShares(false);
        }
    };

    const normalizeDriverPhoneMappings = async (driverId?: string) => {
        try {
            setActionError(null);
            if (driverId) {
                setNormalizingDriverId(driverId);
            } else {
                setNormalizingAllDrivers(true);
            }

            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/whatsapp/normalize-driver-phones", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify(driverId ? { driver_id: driverId } : {}),
            });

            const payload = await response.json();
            if (!response.ok) {
                setActionError(payload?.error || "Failed to normalize driver phone mapping");
                return;
            }

            setActionMessage(
                `Phone mapping updated: ${payload.updated || 0} updated, ${payload.skipped || 0} skipped.`
            );
            await fetchWhatsAppHealth();
        } catch (error) {
            console.error("Normalize driver mapping error:", error);
            setActionError("Failed to normalize driver phone mapping");
        } finally {
            if (driverId) {
                setNormalizingDriverId(null);
            } else {
                setNormalizingAllDrivers(false);
            }
        }
    };

    const retrySingleQueueItem = async (queueId: string) => {
        try {
            setRetryingQueueId(queueId);
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/notifications/delivery/retry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({ queue_id: queueId }),
            });

            const payload = await response.json();
            if (!response.ok) {
                setActionError(payload?.error || "Failed to retry delivery");
                return;
            }

            setActionMessage("Delivery item moved back to pending queue.");
            await fetchLogs();
            await fetchDeliveryTracking();
        } catch (error) {
            console.error("Retry delivery error:", error);
            setActionError("Failed to retry delivery");
        } finally {
            setRetryingQueueId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Notifications</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Notification History</h1>
                    <p className="text-text-secondary mt-1">Monitor all sent and pending push notifications.</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={fetchLogs}
                    loading={loading}
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                </GlassButton>
                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={fetchWhatsAppHealth}
                    loading={healthLoading}
                >
                    <Activity className="w-4 h-4" />
                    Webhook Health
                </GlassButton>
                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => void normalizeDriverPhoneMappings()}
                    disabled={normalizingAllDrivers}
                    loading={normalizingAllDrivers}
                >
                    <Phone className="w-4 h-4" />
                    Fix All Phone Mapping
                </GlassButton>
                <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={runQueueNow}
                    disabled={runningQueue}
                    loading={runningQueue}
                >
                    <Bell className="w-4 h-4" />
                    Run Queue Now
                </GlassButton>
                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={retryFailedQueue}
                    disabled={retryingFailed}
                    loading={retryingFailed}
                >
                    <RefreshCcw className="w-4 h-4" />
                    Retry Failed
                </GlassButton>
                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={scheduleFollowupsNow}
                    disabled={schedulingFollowups}
                    loading={schedulingFollowups}
                >
                    <MessageCircle className="w-4 h-4" />
                    Schedule Follow-ups
                </GlassButton>
                <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={cleanupExpiredShares}
                    disabled={cleaningShares}
                    loading={cleaningShares}
                >
                    <Clock className="w-4 h-4" />
                    Cleanup Expired Live Links
                </GlassButton>
            </div>

            {/* Status Messages */}
            {actionMessage && (
                <GlassCard padding="md" rounded="xl" className="bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-800 dark:text-emerald-400">{actionMessage}</p>
                </GlassCard>
            )}
            {actionError && (
                <GlassCard padding="md" rounded="xl" className="bg-rose-50/80 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800">
                    <p className="text-sm text-rose-800 dark:text-rose-400">{actionError}</p>
                </GlassCard>
            )}

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                    <GlassInput
                        type="text"
                        placeholder="Search logs by title, message or recipient..."
                        icon={Search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 dark:border-white/10 text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="sent">Sent</option>
                        <option value="delivered">Delivered</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <input
                        type="text"
                        placeholder="Global WhatsApp message (optional)"
                        className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 dark:border-white/10 text-secondary dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                        value={whatsAppMessage}
                        onChange={(e) => setWhatsAppMessage(e.target.value)}
                    />
                </div>
            </div>

            {/* Queue Health Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Pending</p>
                    <p className="text-2xl font-serif text-secondary dark:text-white mt-1">{queueHealth.pending}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Processing</p>
                    <p className="text-2xl font-serif text-secondary dark:text-white mt-1">{queueHealth.processing}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Sent</p>
                    <p className="text-2xl font-serif text-emerald-600 dark:text-emerald-400 mt-1">{queueHealth.sent}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Failed</p>
                    <p className="text-2xl font-serif text-rose-600 dark:text-rose-400 mt-1">{queueHealth.failed}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Due in 1h</p>
                    <p className="text-2xl font-serif text-secondary dark:text-white mt-1">{queueHealth.upcomingHour}</p>
                </GlassCard>
            </div>

            {/* Delivery Tracking */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h2 className="text-lg font-serif text-secondary dark:text-white">
                        Delivery Tracking
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            className="px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 border border-white/20 dark:border-white/10 text-sm text-secondary dark:text-white cursor-pointer"
                            value={deliveryChannel}
                            onChange={(e) => setDeliveryChannel(e.target.value as "all" | "whatsapp" | "push" | "email")}
                        >
                            <option value="all">All channels</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="push">Push</option>
                            <option value="email">Email</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-text-secondary px-3 py-2 rounded-lg bg-white/80 dark:bg-white/10 border border-white/20 dark:border-white/10 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={deliveryFailedOnly}
                                onChange={(e) => setDeliveryFailedOnly(e.target.checked)}
                                className="rounded cursor-pointer"
                            />
                            Failed only
                        </label>
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => void fetchDeliveryTracking()}
                        >
                            Refresh
                        </GlassButton>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(deliverySummary).map(([key, value]) => (
                        <GlassBadge key={key} variant="default" size="sm">
                            {key}: {value}
                        </GlassBadge>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/40 dark:border-white/5">
                                <th className="py-3 pr-3 text-text-secondary font-medium bg-white/40 dark:bg-white/5 px-4">Channel</th>
                                <th className="py-3 pr-3 text-text-secondary font-medium bg-white/40 dark:bg-white/5 px-4">Status</th>
                                <th className="py-3 pr-3 text-text-secondary font-medium bg-white/40 dark:bg-white/5 px-4">Attempt</th>
                                <th className="py-3 pr-3 text-text-secondary font-medium bg-white/40 dark:bg-white/5 px-4">Trip</th>
                                <th className="py-3 pr-3 text-text-secondary font-medium bg-white/40 dark:bg-white/5 px-4">Error</th>
                                <th className="py-3 pr-3 text-text-secondary font-medium bg-white/40 dark:bg-white/5 px-4">Time</th>
                                <th className="py-3 text-text-secondary font-medium bg-white/40 dark:bg-white/5 px-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-6 text-center text-text-secondary">Loading delivery rows...</td>
                                </tr>
                            ) : deliveryRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-6 text-center text-text-secondary">No delivery records found.</td>
                                </tr>
                            ) : (
                                deliveryRows.map((row) => (
                                    <tr key={row.id} className="border-b border-white/20 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-3 pr-3 px-4 uppercase text-secondary dark:text-white">{row.channel}</td>
                                        <td className="py-3 pr-3 px-4">
                                            <GlassBadge
                                                variant={
                                                    row.status === "sent" ? "success" :
                                                    row.status === "failed" ? "danger" :
                                                    "warning"
                                                }
                                                size="sm"
                                            >
                                                {row.status}
                                            </GlassBadge>
                                        </td>
                                        <td className="py-3 pr-3 px-4 text-secondary dark:text-white">{row.attempt_number}</td>
                                        <td className="py-3 pr-3 px-4 text-secondary dark:text-white">{row.trip_id ? row.trip_id.slice(0, 8) : "-"}</td>
                                        <td className="py-3 pr-3 px-4 text-xs text-text-secondary max-w-[320px] truncate">
                                            {row.error_message || "-"}
                                        </td>
                                        <td className="py-3 pr-3 px-4 text-text-secondary">{formatDate(row.created_at)}</td>
                                        <td className="py-3 px-4">
                                            {(row.status === "failed" || row.status === "retrying") && row.queue_id ? (
                                                <GlassButton
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => void retrySingleQueueItem(row.queue_id!)}
                                                    disabled={retryingQueueId === row.queue_id}
                                                >
                                                    {retryingQueueId === row.queue_id ? "Retrying..." : "Retry"}
                                                </GlassButton>
                                            ) : (
                                                <span className="text-xs text-text-secondary/40">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* WhatsApp Health */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif text-secondary dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        WhatsApp Webhook Health
                    </h2>
                    <span className="text-xs text-text-secondary">
                        {healthLoading ? "Refreshing..." : "Live diagnostics"}
                    </span>
                </div>

                {!whatsAppHealth ? (
                    <p className="text-sm text-text-secondary">No webhook data available yet.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <GlassCard padding="md" rounded="lg" className="bg-white/60 dark:bg-white/5">
                                <p className="text-[11px] uppercase tracking-wide text-text-secondary">Pings 1h</p>
                                <p className="text-xl font-serif text-secondary dark:text-white">{whatsAppHealth.summary.location_pings_last_1h}</p>
                            </GlassCard>
                            <GlassCard padding="md" rounded="lg" className="bg-white/60 dark:bg-white/5">
                                <p className="text-[11px] uppercase tracking-wide text-text-secondary">Pings 24h</p>
                                <p className="text-xl font-serif text-secondary dark:text-white">{whatsAppHealth.summary.location_pings_last_24h}</p>
                            </GlassCard>
                            <GlassCard padding="md" rounded="lg" className="bg-white/60 dark:bg-white/5">
                                <p className="text-[11px] uppercase tracking-wide text-text-secondary">Stale Driver Trips</p>
                                <p className="text-xl font-serif text-rose-600 dark:text-rose-400">{whatsAppHealth.summary.stale_active_driver_trips}</p>
                            </GlassCard>
                            <GlassCard padding="md" rounded="lg" className="bg-white/60 dark:bg-white/5">
                                <p className="text-[11px] uppercase tracking-wide text-text-secondary">Unmapped Ext Drivers</p>
                                <p className="text-xl font-serif text-amber-600 dark:text-amber-400">{whatsAppHealth.summary.unmapped_external_drivers}</p>
                            </GlassCard>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassCard padding="md" rounded="xl" className="bg-white/60 dark:bg-white/5">
                                <p className="text-sm font-semibold text-secondary dark:text-white mb-2">Latest Driver Pings</p>
                                {whatsAppHealth.latest_pings.length === 0 ? (
                                    <p className="text-sm text-text-secondary">No active driver pings yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {whatsAppHealth.latest_pings.map((item) => (
                                            <div key={item.driver_id} className="flex items-center justify-between text-sm">
                                                <div>
                                                    <p className="font-medium text-secondary dark:text-white">{item.driver_name}</p>
                                                    <p className="text-xs text-text-secondary">
                                                        Trip {item.trip_id ? item.trip_id.slice(0, 8) : "unassigned"} • {item.recorded_at ? new Date(item.recorded_at).toLocaleTimeString() : "never"}
                                                    </p>
                                                </div>
                                                <GlassBadge
                                                    variant={item.status === "fresh" ? "success" : "danger"}
                                                    size="sm"
                                                >
                                                    {item.age_minutes == null ? "No ping" : `${item.age_minutes}m`}
                                                </GlassBadge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                            <GlassCard padding="md" rounded="xl" className="bg-white/60 dark:bg-white/5">
                                <p className="text-sm font-semibold text-secondary dark:text-white mb-2">Drivers Missing Phone Mapping</p>
                                <p className="text-xs text-text-secondary mb-3">
                                    WhatsApp inbound location can map only if phone_normalized exists.
                                </p>
                                {whatsAppHealth.drivers_missing_phone_list.length === 0 ? (
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400">All driver profiles have normalized phone numbers.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {whatsAppHealth.drivers_missing_phone_list.map((driver) => (
                                            <div key={driver.id} className="text-sm rounded-lg bg-amber-50/80 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 px-3 py-2 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-amber-900 dark:text-amber-400">{driver.full_name || "Unnamed driver"}</p>
                                                    <p className="text-xs text-amber-700 dark:text-amber-500">{driver.email || "No email"}</p>
                                                    <p className="text-xs text-amber-700 dark:text-amber-500">{driver.phone || "No phone in profile"}</p>
                                                </div>
                                                <GlassButton
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => void normalizeDriverPhoneMappings(driver.id)}
                                                    disabled={normalizingDriverId === driver.id}
                                                >
                                                    {normalizingDriverId === driver.id ? "Fixing..." : "Fix"}
                                                </GlassButton>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </>
                )}
            </GlassCard>

            {/* Notification Logs Table */}
            <GlassCard padding="none" rounded="2xl" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 dark:bg-white/5 border-b border-white/40 dark:border-white/5 text-text-secondary text-sm">
                                <th className="px-6 py-4 font-medium">Recipient</th>
                                <th className="px-6 py-4 font-medium">WhatsApp</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Content</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Sent At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20 dark:divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-48"></div><div className="h-3 bg-white/40 dark:bg-white/10 rounded w-32 mt-2"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-20"></div></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                        No notification logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const whatsappLink = getWhatsAppLink(log.recipient_phone, log.body || log.title);
                                    return (
                                        <tr key={log.id} className="hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-secondary dark:text-white">{log.profiles?.full_name || 'System User'}</div>
                                                <div className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">{log.recipient_type}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {whatsappLink ? (
                                                    <a
                                                        href={whatsappLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1"
                                                    >
                                                        <GlassBadge variant="success" size="sm">
                                                            <MessageCircle className="w-3 h-3" />
                                                            WhatsApp
                                                        </GlassBadge>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-text-secondary/40">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <GlassBadge variant="info" size="sm">
                                                    {log.notification_type.replace('_', ' ')}
                                                </GlassBadge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-secondary dark:text-white font-medium truncate max-w-xs">{log.title}</div>
                                                <div className="text-xs text-text-secondary line-clamp-1 max-w-xs">{log.body}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(log.status)}
                                                    <span className={`text-sm font-medium ${
                                                        log.status === 'sent' ? 'text-emerald-600 dark:text-emerald-400' :
                                                        log.status === 'failed' ? 'text-rose-600 dark:text-rose-400' :
                                                        log.status === 'pending' ? 'text-amber-600 dark:text-amber-400' :
                                                        'text-text-secondary'
                                                    }`}>
                                                        {(log.status || 'unknown').charAt(0).toUpperCase() + (log.status || 'unknown').slice(1)}
                                                    </span>
                                                </div>
                                                {log.error_message && (
                                                    <div className="text-[10px] text-rose-400 dark:text-rose-500 mt-1 max-w-[150px] truncate" title={log.error_message}>
                                                        {log.error_message}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary">
                                                {formatDate(log.sent_at || log.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
