"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wand2, Bell, MessageCircle, RefreshCw } from "lucide-react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import {
    NOTIFICATION_TEMPLATE_KEYS,
    NOTIFICATION_TEMPLATE_LABELS,
    renderTemplate,
    type NotificationTemplateKey,
    type TemplateVars,
} from "@/lib/notification-templates";
import { useToast } from "@/components/ui/toast";

const DeliveryRowSchema = z.object({
    id: z.string(),
    notification_type: z.string().nullable().optional(),
    status: z.string(),
    channel: z.string(),
    metadata: z.unknown().nullable().optional(),
    created_at: z.string().nullable().optional(),
});

const DeliveryResponseSchema = z.object({
    rows: z.array(DeliveryRowSchema).default([]),
});

type DeliveryRow = z.infer<typeof DeliveryRowSchema>;

interface TemplateStats {
    sent: number;
    failed: number;
    queued: number;
    lastEventAt: string | null;
}

type TemplateStatsMap = Record<NotificationTemplateKey, TemplateStats>;

const SAMPLE_VARS: TemplateVars = {
    client_name: "Traveler",
    destination: "Bali",
    trip_title: "Bali Escape",
    day_number: 2,
    pickup_time: "10:00 AM",
    pickup_location: "Hotel Lobby",
    driver_name: "Rahul",
};

function buildEmptyStats(): TemplateStatsMap {
    return NOTIFICATION_TEMPLATE_KEYS.reduce((acc, key) => {
        acc[key] = { sent: 0, failed: 0, queued: 0, lastEventAt: null };
        return acc;
    }, {} as TemplateStatsMap);
}

function formatDate(value: string | null): string {
    if (!value) return "No activity";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "No activity";
    return parsed.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function resolveTemplateKey(row: DeliveryRow): NotificationTemplateKey | null {
    const keySet = new Set<string>(NOTIFICATION_TEMPLATE_KEYS);

    if (row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)) {
        const templateFromMetadata = (row.metadata as Record<string, unknown>).template_key;
        if (typeof templateFromMetadata === "string" && keySet.has(templateFromMetadata)) {
            return templateFromMetadata as NotificationTemplateKey;
        }
    }

    if (row.notification_type && keySet.has(row.notification_type)) {
        return row.notification_type as NotificationTemplateKey;
    }

    return null;
}

export default function TemplatesPage() {
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<TemplateStatsMap>(buildEmptyStats());

    const loadTemplateStats = useCallback(
        async (showToast = false) => {
            if (showToast) setRefreshing(true);
            else setLoading(true);
            setError(null);

            try {
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError || !session?.access_token) {
                    throw new Error("Unauthorized access");
                }

                const response = await fetch("/api/admin/notifications/delivery?limit=300", {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    cache: "no-store",
                });

                const rawPayload: unknown = await response.json();
                if (!response.ok) {
                    const fallbackMessage =
                        typeof rawPayload === "object" && rawPayload && "error" in rawPayload
                            ? String((rawPayload as Record<string, unknown>).error)
                            : "Failed to fetch delivery tracking";
                    throw new Error(fallbackMessage);
                }

                const parsed = DeliveryResponseSchema.safeParse(rawPayload);
                if (!parsed.success) {
                    throw new Error("Unexpected delivery response format");
                }

                const nextStats = buildEmptyStats();
                for (const row of parsed.data.rows) {
                    const templateKey = resolveTemplateKey(row);
                    if (!templateKey) continue;

                    const status = row.status.toLowerCase();
                    if (status === "sent" || status === "delivered") {
                        nextStats[templateKey].sent += 1;
                    } else if (status === "failed" || status === "retrying") {
                        nextStats[templateKey].failed += 1;
                    } else {
                        nextStats[templateKey].queued += 1;
                    }

                    if (row.created_at) {
                        const current = nextStats[templateKey].lastEventAt;
                        if (!current || new Date(row.created_at).getTime() > new Date(current).getTime()) {
                            nextStats[templateKey].lastEventAt = row.created_at;
                        }
                    }
                }

                setStats(nextStats);

                if (showToast) {
                    toast({
                        title: "Template metrics refreshed",
                        description: "Notification template delivery stats are updated.",
                        variant: "success",
                    });
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load template metrics";
                setError(message);
                setStats(buildEmptyStats());
                toast({
                    title: "Template metrics failed",
                    description: message,
                    variant: "error",
                });
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [supabase, toast]
    );

    useEffect(() => {
        void loadTemplateStats(false);
    }, [loadTemplateStats]);

    const totals = NOTIFICATION_TEMPLATE_KEYS.reduce(
        (acc, key) => {
            acc.sent += stats[key].sent;
            acc.failed += stats[key].failed;
            acc.queued += stats[key].queued;
            return acc;
        },
        { sent: 0, failed: 0, queued: 0 }
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
                        <Wand2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Templates</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Notification Templates</h1>
                        <p className="mt-1 text-text-secondary">Live template library with delivery performance by template key.</p>
                    </div>
                </div>
                <GlassButton variant="outline" size="sm" loading={refreshing} onClick={() => void loadTemplateStats(true)}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </GlassButton>
            </div>

            {error ? (
                <GlassCard padding="lg" rounded="2xl" className="border border-rose-200/70 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-900/20">
                    <p className="text-sm text-rose-700 dark:text-rose-300">Failed to load template performance: {error}</p>
                </GlassCard>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Sent</p>
                    <p className="mt-1 text-2xl font-serif text-emerald-600 dark:text-emerald-300">{loading ? "..." : totals.sent}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Queued/Processing</p>
                    <p className="mt-1 text-2xl font-serif text-secondary dark:text-white">{loading ? "..." : totals.queued}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Failed</p>
                    <p className="mt-1 text-2xl font-serif text-rose-600 dark:text-rose-300">{loading ? "..." : totals.failed}</p>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {NOTIFICATION_TEMPLATE_KEYS.map((templateKey) => {
                    const preview = renderTemplate(templateKey, SAMPLE_VARS);
                    const itemStats = stats[templateKey];

                    return (
                        <GlassCard key={templateKey} padding="lg" rounded="2xl">
                            <div className="mb-4 flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-secondary dark:text-white">
                                        {NOTIFICATION_TEMPLATE_LABELS[templateKey]}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <GlassBadge variant="info" size="sm">
                                            {templateKey}
                                        </GlassBadge>
                                    </div>
                                </div>
                                {templateKey.startsWith("lifecycle_") ? (
                                    <Bell className="h-5 w-5 text-primary" />
                                ) : (
                                    <MessageCircle className="h-5 w-5 text-primary" />
                                )}
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <p className="mb-1 text-xs uppercase tracking-wide text-primary">Subject</p>
                                    <p className="text-sm text-secondary dark:text-white">{preview.title}</p>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs uppercase tracking-wide text-primary">Body Preview</p>
                                    <p className="rounded-lg border border-white/20 bg-white/40 p-3 text-sm text-text-secondary dark:bg-white/5">
                                        {preview.body}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg bg-emerald-100/70 px-2 py-2 text-xs dark:bg-emerald-900/30">
                                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">{itemStats.sent}</p>
                                    <p className="text-emerald-700/80 dark:text-emerald-300/80">Sent</p>
                                </div>
                                <div className="rounded-lg bg-slate-100/80 px-2 py-2 text-xs dark:bg-slate-800/60">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">{itemStats.queued}</p>
                                    <p className="text-slate-700/80 dark:text-slate-200/80">Queued</p>
                                </div>
                                <div className="rounded-lg bg-rose-100/70 px-2 py-2 text-xs dark:bg-rose-900/30">
                                    <p className="font-semibold text-rose-700 dark:text-rose-300">{itemStats.failed}</p>
                                    <p className="text-rose-700/80 dark:text-rose-300/80">Failed</p>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-text-secondary">Last activity: {formatDate(itemStats.lastEventAt)}</p>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
