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
} from "lucide-react";

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
    }>;
}

const mockLogs: NotificationLog[] = [
    {
        id: "mock-log-1",
        trip_id: "mock-trip-001",
        recipient_id: "mock-user-1",
        recipient_phone: null,
        recipient_type: "client",
        notification_type: "itinerary_update",
        title: "Kyoto updates ready",
        body: "Your itinerary has been refreshed with cherry blossom timings.",
        status: "delivered",
        error_message: null,
        sent_at: "2026-02-10T09:22:00Z",
        created_at: "2026-02-10T09:20:00Z",
        profiles: {
            full_name: "Ava Chen",
            email: "ava.chen@example.com",
        },
    },
    {
        id: "mock-log-2",
        trip_id: "mock-trip-002",
        recipient_id: "mock-user-2",
        recipient_phone: null,
        recipient_type: "client",
        notification_type: "driver_assignment",
        title: "Driver assigned",
        body: "Your driver for day 2 has been confirmed. Pickup at 8:30 AM.",
        status: "sent",
        error_message: null,
        sent_at: "2026-02-08T18:05:00Z",
        created_at: "2026-02-08T18:05:00Z",
        profiles: {
            full_name: "Liam Walker",
            email: "liam.walker@example.com",
        },
    },
    {
        id: "mock-log-3",
        trip_id: "mock-trip-002",
        recipient_id: "mock-user-2",
        recipient_phone: null,
        recipient_type: "client",
        notification_type: "flight_update",
        title: "Flight update pending",
        body: "We are waiting on the airline confirmation for your return leg.",
        status: "pending",
        error_message: null,
        sent_at: null,
        created_at: "2026-02-08T17:40:00Z",
        profiles: {
            full_name: "Liam Walker",
            email: "liam.walker@example.com",
        },
    },
    {
        id: "mock-log-4",
        trip_id: "mock-trip-001",
        recipient_id: "mock-user-1",
        recipient_phone: null,
        recipient_type: "client",
        notification_type: "payment_reminder",
        title: "Deposit reminder",
        body: "Your deposit is due in 3 days. Tap to review the invoice.",
        status: "failed",
        error_message: "Device token expired",
        sent_at: "2026-02-06T12:11:00Z",
        created_at: "2026-02-06T12:11:00Z",
        profiles: {
            full_name: "Ava Chen",
            email: "ava.chen@example.com",
        },
    },
];

const mockWhatsAppHealth: WhatsAppHealthPayload = {
    summary: {
        total_driver_profiles: 6,
        drivers_with_phone: 5,
        drivers_missing_phone: 1,
        active_trips_with_driver: 4,
        stale_active_driver_trips: 1,
        location_pings_last_1h: 18,
        location_pings_last_24h: 163,
        unmapped_external_drivers: 2,
    },
    latest_pings: [
        {
            driver_id: "mock-driver-1",
            driver_name: "Kenji Sato",
            trip_id: "mock-trip-001",
            recorded_at: new Date().toISOString(),
            age_minutes: 1,
            status: "fresh",
        },
        {
            driver_id: "mock-driver-2",
            driver_name: "Elena Petrova",
            trip_id: "mock-trip-002",
            recorded_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
            age_minutes: 22,
            status: "stale",
        },
    ],
    drivers_missing_phone_list: [
        {
            id: "mock-driver-missing-1",
            full_name: "Driver Missing Phone",
            email: "driver.missing@example.com",
        },
    ],
};

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
    const [cleaningShares, setCleaningShares] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [healthLoading, setHealthLoading] = useState(false);
    const [whatsAppHealth, setWhatsAppHealth] = useState<WhatsAppHealthPayload | null>(null);
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            if (useMockAdmin) {
                setLogs(mockLogs);
                setQueueHealth({
                    pending: 3,
                    processing: 1,
                    sent: 24,
                    failed: 2,
                    upcomingHour: 2,
                });
                return;
            }

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
    }, [supabase, statusFilter, useMockAdmin]);

    useEffect(() => {
        void fetchLogs();
    }, [fetchLogs]);

    const fetchWhatsAppHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            if (useMockAdmin) {
                setWhatsAppHealth(mockWhatsAppHealth);
                return;
            }

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
    }, [supabase, useMockAdmin]);

    useEffect(() => {
        void fetchWhatsAppHealth();
    }, [fetchWhatsAppHealth]);

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
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-rose-500" />;
            case "pending":
                return <Clock className="w-4 h-4 text-amber-500" />;
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
            if (useMockAdmin) {
                setActionMessage("Mock queue run complete.");
                await fetchLogs();
                return;
            }

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
            if (useMockAdmin) {
                setActionMessage("Mock retry complete.");
                await fetchLogs();
                return;
            }

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

    const cleanupExpiredShares = async () => {
        try {
            setCleaningShares(true);
            if (useMockAdmin) {
                setActionMessage("Mock cleanup complete.");
                return;
            }

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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <span className="text-xs uppercase tracking-[0.3em] text-[#bda87f]">Notifications</span>
                    <h1 className="text-3xl font-[var(--font-display)] text-[#1b140a] mt-2 flex items-center gap-3">
                        <Bell className="w-8 h-8 text-[#c4a870]" />
                        Notification History
                    </h1>
                    <p className="text-[#6f5b3e] mt-1">Monitor all sent and pending push notifications.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#eadfcd] rounded-lg text-[#6f5b3e] hover:bg-[#f8f1e6] transition-colors shadow-sm"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
                <button
                    onClick={fetchWhatsAppHealth}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#eadfcd] rounded-lg text-[#6f5b3e] hover:bg-[#f8f1e6] transition-colors shadow-sm"
                >
                    <Activity className={`w-4 h-4 ${healthLoading ? "animate-spin" : ""}`} />
                    Webhook Health
                </button>
                <button
                    onClick={runQueueNow}
                    disabled={runningQueue}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1b140a] text-[#f5e7c6] rounded-lg hover:bg-[#2a2217] transition-colors shadow-sm disabled:opacity-60"
                >
                    <Bell className="w-4 h-4" />
                    {runningQueue ? "Running Queue..." : "Run Queue Now"}
                </button>
                <button
                    onClick={retryFailedQueue}
                    disabled={retryingFailed}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#eadfcd] rounded-lg text-[#6f5b3e] hover:bg-[#f8f1e6] transition-colors shadow-sm disabled:opacity-60"
                >
                    <RefreshCcw className={`w-4 h-4 ${retryingFailed ? 'animate-spin' : ''}`} />
                    {retryingFailed ? "Retrying Failed..." : "Retry Failed"}
                </button>
                <button
                    onClick={cleanupExpiredShares}
                    disabled={cleaningShares}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#eadfcd] rounded-lg text-[#6f5b3e] hover:bg-[#f8f1e6] transition-colors shadow-sm disabled:opacity-60"
                >
                    <Clock className={`w-4 h-4 ${cleaningShares ? 'animate-spin' : ''}`} />
                    {cleaningShares ? "Cleaning..." : "Cleanup Expired Live Links"}
                </button>
            </div>

            {actionMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {actionMessage}
                </div>
            ) : null}
            {actionError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {actionError}
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search logs by title, message or recipient..."
                        className="w-full pl-10 pr-4 py-2 border border-[#eadfcd] rounded-lg focus:ring-2 focus:ring-[#c4a870] focus:border-transparent outline-none transition-all bg-white/90"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:ring-2 focus:ring-[#c4a870] outline-none appearance-none bg-white text-[#1b140a]"
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
                        className="w-full px-4 py-2 border border-[#eadfcd] rounded-lg focus:ring-2 focus:ring-[#c4a870] focus:border-transparent outline-none transition-all bg-white/90"
                        value={whatsAppMessage}
                        onChange={(e) => setWhatsAppMessage(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[#9c7c46]">Pending</p>
                    <p className="text-2xl font-semibold text-[#1b140a] mt-1">{queueHealth.pending}</p>
                </div>
                <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[#9c7c46]">Processing</p>
                    <p className="text-2xl font-semibold text-[#1b140a] mt-1">{queueHealth.processing}</p>
                </div>
                <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[#9c7c46]">Sent</p>
                    <p className="text-2xl font-semibold text-emerald-600 mt-1">{queueHealth.sent}</p>
                </div>
                <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[#9c7c46]">Failed</p>
                    <p className="text-2xl font-semibold text-rose-600 mt-1">{queueHealth.failed}</p>
                </div>
                <div className="rounded-xl border border-[#eadfcd] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[#9c7c46]">Due in 1h</p>
                    <p className="text-2xl font-semibold text-[#1b140a] mt-1">{queueHealth.upcomingHour}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-[#eadfcd] bg-white/90 p-5 shadow-[0_12px_30px_rgba(20,16,12,0.06)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-[var(--font-display)] text-[#1b140a] flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#9c7c46]" />
                        WhatsApp Webhook Health
                    </h2>
                    <span className="text-xs text-[#8d7650]">
                        {healthLoading ? "Refreshing..." : "Live diagnostics"}
                    </span>
                </div>

                {!whatsAppHealth ? (
                    <p className="text-sm text-[#8d7650]">No webhook data available yet.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="rounded-lg border border-[#eadfcd] p-3">
                                <p className="text-[11px] uppercase tracking-wide text-[#9c7c46]">Pings 1h</p>
                                <p className="text-xl font-semibold text-[#1b140a]">{whatsAppHealth.summary.location_pings_last_1h}</p>
                            </div>
                            <div className="rounded-lg border border-[#eadfcd] p-3">
                                <p className="text-[11px] uppercase tracking-wide text-[#9c7c46]">Pings 24h</p>
                                <p className="text-xl font-semibold text-[#1b140a]">{whatsAppHealth.summary.location_pings_last_24h}</p>
                            </div>
                            <div className="rounded-lg border border-[#eadfcd] p-3">
                                <p className="text-[11px] uppercase tracking-wide text-[#9c7c46]">Stale Driver Trips</p>
                                <p className="text-xl font-semibold text-rose-600">{whatsAppHealth.summary.stale_active_driver_trips}</p>
                            </div>
                            <div className="rounded-lg border border-[#eadfcd] p-3">
                                <p className="text-[11px] uppercase tracking-wide text-[#9c7c46]">Unmapped Ext Drivers</p>
                                <p className="text-xl font-semibold text-amber-600">{whatsAppHealth.summary.unmapped_external_drivers}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-[#eadfcd] p-4">
                                <p className="text-sm font-semibold text-[#1b140a] mb-2">Latest Driver Pings</p>
                                {whatsAppHealth.latest_pings.length === 0 ? (
                                    <p className="text-sm text-slate-500">No active driver pings yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {whatsAppHealth.latest_pings.map((item) => (
                                            <div key={item.driver_id} className="flex items-center justify-between text-sm">
                                                <div>
                                                    <p className="font-medium text-[#1b140a]">{item.driver_name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Trip {item.trip_id ? item.trip_id.slice(0, 8) : "unassigned"} • {item.recorded_at ? new Date(item.recorded_at).toLocaleTimeString() : "never"}
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === "fresh" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                    {item.age_minutes == null ? "No ping" : `${item.age_minutes}m`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="rounded-xl border border-[#eadfcd] p-4">
                                <p className="text-sm font-semibold text-[#1b140a] mb-2">Drivers Missing Phone Mapping</p>
                                <p className="text-xs text-[#8d7650] mb-3">
                                    WhatsApp inbound location can map only if `phone_normalized` exists.
                                </p>
                                {whatsAppHealth.drivers_missing_phone_list.length === 0 ? (
                                    <p className="text-sm text-emerald-700">All driver profiles have normalized phone numbers.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {whatsAppHealth.drivers_missing_phone_list.map((driver) => (
                                            <div key={driver.id} className="text-sm rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                                                <p className="font-medium text-amber-900">{driver.full_name || "Unnamed driver"}</p>
                                                <p className="text-xs text-amber-700">{driver.email || "No email"}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="bg-white/90 border border-[#eadfcd] rounded-2xl shadow-[0_12px_30px_rgba(20,16,12,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#f8f1e6] border-bottom border-[#eadfcd] font-medium text-[#6f5b3e] text-sm">
                                <th className="px-6 py-4">Recipient</th>
                                <th className="px-6 py-4">WhatsApp</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Content</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Sent At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div><div className="h-3 bg-slate-100 rounded w-32 mt-2"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No notification logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const whatsappLink = getWhatsAppLink(log.recipient_phone, log.body || log.title);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{log.profiles?.full_name || 'System User'}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{log.recipient_type}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {whatsappLink ? (
                                                    <a
                                                        href={whatsappLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50"
                                                    >
                                                        <MessageCircle className="w-3 h-3" />
                                                        WhatsApp
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                    {log.notification_type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-900 font-medium truncate max-w-xs">{log.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{log.body}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(log.status)}
                                                    <span className={`text-sm font-medium ${log.status === 'sent' ? 'text-emerald-600' :
                                                        log.status === 'failed' ? 'text-rose-600' :
                                                            log.status === 'pending' ? 'text-amber-600' :
                                                                'text-slate-600'
                                                        }`}>
                                                        {(log.status || 'unknown').charAt(0).toUpperCase() + (log.status || 'unknown').slice(1)}
                                                    </span>
                                                </div>
                                                {log.error_message && (
                                                    <div className="text-[10px] text-rose-400 mt-1 max-w-[150px] truncate" title={log.error_message}>
                                                        {log.error_message}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {formatDate(log.sent_at || log.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
