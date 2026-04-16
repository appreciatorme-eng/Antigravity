// Broadcast Center — compose and send announcements to operators.

"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Send, RefreshCw, Megaphone } from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";

interface Announcement {
    id: string;
    title: string;
    body: string;
    announcement_type: string;
    target_segment: string;
    status: string;
    recipient_count: number | null;
    sent_at: string | null;
    created_at: string | null;
}

const TYPE_BADGE: Record<string, string> = {
    info: "bg-blue-900/60 text-blue-300",
    warning: "bg-amber-900/60 text-amber-300",
    critical: "bg-red-900/60 text-red-300",
    maintenance: "bg-purple-900/60 text-purple-300",
};

const STATUS_BADGE: Record<string, string> = {
    draft: "bg-gray-700 text-gray-400",
    scheduled: "bg-blue-900/60 text-blue-300",
    sent: "bg-emerald-900/60 text-emerald-300",
    cancelled: "bg-gray-800 text-gray-500",
};

function timeAgo(iso: string | null): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days > 0) return `${days}d ago`;
    const hrs = Math.floor(diff / 3_600_000);
    if (hrs > 0) return `${hrs}h ago`;
    return "Just now";
}

type ComposeField = "title" | "body" | "announcement_type" | "target_segment";

const DEFAULT_COMPOSE = {
    title: "",
    body: "",
    announcement_type: "info",
    target_segment: "all",
    delivery_channels: ["in_app"],
};

const SCENARIO_TEMPLATES = [
    {
        label: "Maintenance Window",
        title: "Scheduled Maintenance Notification",
        body: "We will be performing scheduled maintenance on our infrastructure on [Date] between [Time] and [Time] UTC. During this window, you may experience brief periods of degraded performance or unavailability. We apologize for any inconvenience this may cause and appreciate your patience as we work to improve the platform.",
        announcement_type: "maintenance",
    },
    {
        label: "New Feature Launch",
        title: "New Feature available: [Feature Name]",
        body: "We are excited to announce the launch of [Feature Name]! This new capability allows you to [Benefit/Action]. You can access it starting today by navigating to [Location]. Check out our documentation for a full walkthrough.",
        announcement_type: "info",
    },
    {
        label: "Bug Fix / Stability Update",
        title: "Recent System Updates & Fixes",
        body: "We've deployed a patch that addresses recent issues with [Specific Issue]. You should now experience improved stability and performance when [Action]. Please refresh your browser to ensure you are on the latest version.",
        announcement_type: "info",
    },
    {
        label: "Critical Incident / System Degradation",
        title: "Investigating: System Performance Issues",
        body: "We are currently investigating reports of degraded performance impacting [Service/Feature]. Our engineering team is engaged and actively working to identify the root cause. We will provide further updates as soon as more information becomes available. We apologize for the disruption.",
        announcement_type: "critical",
    },
    {
        label: "Billing / Pricing Update",
        title: "Important Update Regarding Your Subscription",
        body: "We are writing to inform you about upcoming changes to our subscription plans starting on [Date]. We are introducing new features to the [Tier] tier while adjusting the pricing to [Amount]. Existing users will be grandfathered into their current rates until [Date]. Please review the full details on our pricing page.",
        announcement_type: "warning",
    }
];

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [compose, setCompose] = useState({ ...DEFAULT_COMPOSE });
    const [submitting, setSubmitting] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/superadmin/announcements?limit=20");
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data.announcements ?? []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    function setField(field: ComposeField, value: string) {
        setCompose((prev) => ({ ...prev, [field]: value }));
    }

    async function saveDraft() {
        if (!compose.title.trim() || !compose.body.trim()) return;
        setSubmitting(true);
        try {
            const res = await authedFetch("/api/superadmin/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(compose),
            });
            if (res.ok) {
                setCompose({ ...DEFAULT_COMPOSE });
                setShowCompose(false);
                await fetchData();
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function sendNow(id: string) {
        if (!confirm("Send this announcement to all target users now?")) return;
        setSendingId(id);
        try {
            const res = await authedFetch(`/api/superadmin/announcements/${id}/send`, { method: "POST" });
            if (res.ok) await fetchData();
        } finally {
            setSendingId(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Broadcast Center</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Send announcements to all operators</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                                   hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={() => setShowCompose(!showCompose)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black
                                   font-semibold text-sm hover:bg-amber-400 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Announcement
                    </button>
                </div>
            </div>

            {/* Compose form */}
            {showCompose && (
                <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                            <Megaphone className="w-4 h-4" />
                            Compose Announcement
                        </h2>
                        <select
                            onChange={(e) => {
                                const index = e.target.value;
                                if (index === "") return;
                                const template = SCENARIO_TEMPLATES[Number(index)];
                                if (template) {
                                    setCompose({
                                        ...compose,
                                        title: template.title,
                                        body: template.body,
                                        announcement_type: template.announcement_type,
                                    });
                                }
                            }}
                            className="bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded-md px-2 py-1 focus:outline-none focus:border-amber-500/50"
                        >
                            <option value="">Load a template…</option>
                            {SCENARIO_TEMPLATES.map((t, i) => (
                                <option key={i} value={i}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <input
                        value={compose.title}
                        onChange={(e) => setField("title", e.target.value)}
                        placeholder="Title…"
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                   text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    />

                    <textarea
                        value={compose.body}
                        onChange={(e) => setField("body", e.target.value)}
                        placeholder="Message body…"
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                   text-white text-sm placeholder-gray-500 resize-none
                                   focus:outline-none focus:border-amber-500/50"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Type</label>
                            <select
                                value={compose.announcement_type}
                                onChange={(e) => setField("announcement_type", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                           text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Target</label>
                            <select
                                value={compose.target_segment}
                                onChange={(e) => setField("target_segment", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                                           text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                            >
                                <option value="all">All Operators</option>
                                <option value="free">Free Tier</option>
                                <option value="pro">Pro Tier</option>
                                <option value="enterprise">Enterprise Tier</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={saveDraft}
                            disabled={submitting || !compose.title.trim() || !compose.body.trim()}
                            className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm font-medium
                                       hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Save Draft"}
                        </button>
                        <button
                            onClick={() => { setCompose({ ...DEFAULT_COMPOSE }); setShowCompose(false); }}
                            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Announcement history */}
            <div className="space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
                    ))
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No announcements yet</div>
                ) : (
                    announcements.map((ann) => (
                        <div
                            key={ann.id}
                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <button
                                    onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
                                    className="text-left flex-1"
                                >
                                    <p className="font-medium text-white text-sm">{ann.title}</p>
                                </button>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[ann.announcement_type] ?? "bg-gray-700 text-gray-300"}`}>
                                        {ann.announcement_type}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[ann.status] ?? "bg-gray-700 text-gray-300"}`}>
                                        {ann.status}
                                    </span>
                                </div>
                            </div>

                            {expanded === ann.id && (
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{ann.body}</p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex gap-3">
                                    <span>Target: {ann.target_segment}</span>
                                    {ann.recipient_count !== null && ann.recipient_count !== undefined && <span>{ann.recipient_count} recipients</span>}
                                    <span>{ann.sent_at ? `Sent ${timeAgo(ann.sent_at)}` : timeAgo(ann.created_at)}</span>
                                </div>
                                {ann.status === "draft" && (
                                    <button
                                        onClick={() => sendNow(ann.id)}
                                        disabled={sendingId === ann.id}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20
                                                   text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors
                                                   disabled:opacity-50 text-xs font-medium"
                                    >
                                        <Send className="w-3 h-3" />
                                        {sendingId === ann.id ? "Sending…" : "Send Now"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
