"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Bell, MapPin, User, MessageCircle, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";

interface ActivityLogRow {
    id: string;
    notification_type: string;
    title: string | null;
    body: string | null;
    status: string | null;
    created_at: string | null;
    sent_at: string | null;
    profiles: {
        full_name: string | null;
        email: string | null;
    } | null;
}

const TYPE_META: Record<string, { icon: LucideIcon; tone: string }> = {
    itinerary_update: {
        icon: MapPin,
        tone: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    driver_assignment: {
        icon: User,
        tone: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    },
    payment_reminder: {
        icon: Bell,
        tone: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    support: {
        icon: MessageCircle,
        tone: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    },
};

function formatRelativeTime(value: string | null): string {
    if (!value) return "Unknown time";
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return "Unknown time";

    const elapsedMs = Date.now() - timestamp;
    const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / (1000 * 60)));
    if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) return `${elapsedHours}h ago`;

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) return `${elapsedDays}d ago`;

    return new Date(value).toLocaleDateString();
}

export default function AdminActivityPage() {
    const supabase = useMemo(() => createClient(), []);
    const [activityFeed, setActivityFeed] = useState<ActivityLogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivityFeed = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from("notification_logs")
                .select(`
                    id,
                    notification_type,
                    title,
                    body,
                    status,
                    created_at,
                    sent_at,
                    profiles:recipient_id (
                        full_name,
                        email
                    )
                `)
                .order("created_at", { ascending: false })
                .limit(30);

            if (queryError) throw queryError;
            setActivityFeed((data || []) as ActivityLogRow[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load activity feed");
            setActivityFeed([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void fetchActivityFeed();
    }, [fetchActivityFeed]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Activity</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Activity Feed</h1>
                    <p className="text-text-secondary mt-1">Recent operational updates from your live workspace.</p>
                </div>
            </div>

            {/* Activity Feed */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="space-y-6">
                    {loading ? (
                        <div className="rounded-xl border border-white/20 bg-white/40 dark:bg-white/5 p-6">
                            <p className="text-sm text-text-secondary">Loading recent activity...</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/20 p-4">
                            <p className="text-sm text-red-700 dark:text-red-300">Failed to load activity: {error}</p>
                        </div>
                    ) : activityFeed.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/30 bg-white/30 dark:bg-white/5 p-6 text-center">
                            <p className="text-sm font-medium text-secondary dark:text-white">No activity yet</p>
                            <p className="text-xs text-text-secondary mt-1">
                                Activity will appear once notifications and trip events are recorded.
                            </p>
                        </div>
                    ) : (
                        activityFeed.map((item) => {
                            const meta = TYPE_META[item.notification_type] || {
                                icon: Bell,
                                tone: "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400",
                            };
                            const EventIcon = meta.icon;
                            const title = item.title || item.notification_type.replaceAll("_", " ");
                            const detail = item.body || `Recipient: ${item.profiles?.full_name || item.profiles?.email || "Unknown"}`;
                            const statusLabel = item.status ? item.status.replaceAll("_", " ") : "queued";

                            return (
                                <div key={item.id} className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.tone}`}>
                                        <EventIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-secondary dark:text-white capitalize">{title}</p>
                                            <span className="text-xs text-text-secondary">{formatRelativeTime(item.sent_at || item.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary mt-1">{detail}</p>
                                        <div className="mt-2 text-[11px] uppercase tracking-wide text-primary/80">
                                            {statusLabel}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
