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

export default function NotificationLogsPage() {
    const supabase = createClient();
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [whatsAppMessage, setWhatsAppMessage] = useState("");
    const useMockAdmin = process.env.NEXT_PUBLIC_MOCK_ADMIN === "true";

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            if (useMockAdmin) {
                setLogs(mockLogs);
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
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, statusFilter, useMockAdmin]);

    useEffect(() => {
        void fetchLogs();
    }, [fetchLogs]);

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
            </div>

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
