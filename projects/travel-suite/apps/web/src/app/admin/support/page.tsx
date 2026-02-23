"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, MessageCircle, UserCircle2, RefreshCw, Phone, Mail, Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { useToast } from "@/components/ui/toast";

interface ConciergeRequestRow {
    id: string;
    client_id: string;
    trip_id: string | null;
    type: string;
    message: string;
    response: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface ProfileRow {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
}

interface SupportSnapshot {
    requests: ConciergeRequestRow[];
    clientProfiles: Record<string, ProfileRow>;
    openCount: number;
    pendingCount: number;
    resolvedCount: number;
}

const EMPTY_SNAPSHOT: SupportSnapshot = {
    requests: [],
    clientProfiles: {},
    openCount: 0,
    pendingCount: 0,
    resolvedCount: 0,
};

function normalizeStatus(status: string | null): "open" | "pending" | "resolved" {
    const normalized = (status || "open").toLowerCase();
    if (normalized === "resolved" || normalized === "closed") return "resolved";
    if (normalized === "pending" || normalized === "in_progress") return "pending";
    return "open";
}

function statusToBadge(status: "open" | "pending" | "resolved"): "warning" | "info" | "success" {
    if (status === "resolved") return "success";
    if (status === "pending") return "info";
    return "warning";
}

function formatTimestamp(value: string | null): string {
    if (!value) return "Unknown";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Unknown";
    return parsed.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function SupportPage() {
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [snapshot, setSnapshot] = useState<SupportSnapshot>(EMPTY_SNAPSHOT);

    const loadSupportData = useCallback(
        async (showToast = false) => {
            if (showToast) setRefreshing(true);
            else setLoading(true);
            setError(null);

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();
                if (authError || !user) {
                    throw new Error("Unauthorized access");
                }

                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("organization_id")
                    .eq("id", user.id)
                    .single();

                if (profileError || !profile?.organization_id) {
                    throw new Error("Unable to resolve organization");
                }

                const { data: clientsData, error: clientsError } = await supabase
                    .from("clients")
                    .select("id")
                    .eq("organization_id", profile.organization_id);

                if (clientsError) throw clientsError;

                const clientIds = (clientsData || []).map((item) => item.id).filter(Boolean);
                if (clientIds.length === 0) {
                    setSnapshot(EMPTY_SNAPSHOT);
                    return;
                }

                const [requestsRes, profileRes] = await Promise.all([
                    supabase
                        .from("concierge_requests")
                        .select("id,client_id,trip_id,type,message,response,status,created_at,updated_at")
                        .in("client_id", clientIds)
                        .order("updated_at", { ascending: false })
                        .limit(80),
                    supabase
                        .from("profiles")
                        .select("id,full_name,email,phone")
                        .in("id", clientIds),
                ]);

                if (requestsRes.error) throw requestsRes.error;
                if (profileRes.error) throw profileRes.error;

                const requests = (requestsRes.data || []) as ConciergeRequestRow[];
                const profileMap: Record<string, ProfileRow> = {};
                for (const userProfile of (profileRes.data || []) as ProfileRow[]) {
                    profileMap[userProfile.id] = userProfile;
                }

                let openCount = 0;
                let pendingCount = 0;
                let resolvedCount = 0;

                for (const request of requests) {
                    const normalized = normalizeStatus(request.status);
                    if (normalized === "open") openCount += 1;
                    else if (normalized === "pending") pendingCount += 1;
                    else resolvedCount += 1;
                }

                setSnapshot({
                    requests,
                    clientProfiles: profileMap,
                    openCount,
                    pendingCount,
                    resolvedCount,
                });

                if (showToast) {
                    toast({
                        title: "Support inbox refreshed",
                        description: "Latest concierge requests are now visible.",
                        variant: "success",
                    });
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load support inbox";
                setError(message);
                setSnapshot(EMPTY_SNAPSHOT);
                toast({
                    title: "Support load failed",
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
        void loadSupportData(false);
    }, [loadSupportData]);

    const updateStatus = useCallback(
        async (requestId: string, nextStatus: "open" | "pending" | "resolved") => {
            setSavingId(requestId);
            try {
                const { error: updateError } = await supabase
                    .from("concierge_requests")
                    .update({ status: nextStatus, updated_at: new Date().toISOString() })
                    .eq("id", requestId);

                if (updateError) throw updateError;

                setSnapshot((prev) => {
                    const nextRequests = prev.requests.map((item) =>
                        item.id === requestId ? { ...item, status: nextStatus, updated_at: new Date().toISOString() } : item
                    );

                    let openCount = 0;
                    let pendingCount = 0;
                    let resolvedCount = 0;
                    for (const request of nextRequests) {
                        const normalized = normalizeStatus(request.status);
                        if (normalized === "open") openCount += 1;
                        else if (normalized === "pending") pendingCount += 1;
                        else resolvedCount += 1;
                    }

                    return {
                        ...prev,
                        requests: nextRequests,
                        openCount,
                        pendingCount,
                        resolvedCount,
                    };
                });

                toast({
                    title: "Support status updated",
                    description: `Request moved to ${nextStatus}.`,
                    variant: "success",
                });
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to update request status";
                toast({
                    title: "Status update failed",
                    description: message,
                    variant: "error",
                });
            } finally {
                setSavingId(null);
            }
        },
        [supabase, toast]
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
                        <Inbox className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Support</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Support Inbox</h1>
                        <p className="mt-1 text-text-secondary">Live concierge requests from your clients.</p>
                    </div>
                </div>
                <GlassButton variant="outline" size="sm" loading={refreshing} onClick={() => void loadSupportData(true)}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </GlassButton>
            </div>

            {error ? (
                <GlassCard padding="lg" rounded="2xl" className="border border-rose-200/70 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-900/20">
                    <p className="text-sm text-rose-700 dark:text-rose-300">Unable to load support requests: {error}</p>
                </GlassCard>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Open</p>
                    <p className="mt-1 text-2xl font-serif text-secondary dark:text-white">{loading ? "..." : snapshot.openCount}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Pending</p>
                    <p className="mt-1 text-2xl font-serif text-secondary dark:text-white">{loading ? "..." : snapshot.pendingCount}</p>
                </GlassCard>
                <GlassCard padding="lg" rounded="xl">
                    <p className="text-xs uppercase tracking-wide text-text-secondary">Resolved</p>
                    <p className="mt-1 text-2xl font-serif text-secondary dark:text-white">{loading ? "..." : snapshot.resolvedCount}</p>
                </GlassCard>
            </div>

            <GlassCard padding="none" rounded="2xl">
                <div className="grid grid-cols-12 border-b border-white/10 px-6 py-3 text-xs font-semibold uppercase text-secondary dark:text-white">
                    <div className="col-span-3">Requester</div>
                    <div className="col-span-4">Request</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2 text-right">Updated</div>
                </div>
                <div className="divide-y divide-white/10">
                    {snapshot.requests.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                            <p className="text-sm font-medium text-secondary dark:text-white">No support requests yet</p>
                            <p className="mt-1 text-xs text-text-secondary">Client concierge messages will appear here.</p>
                        </div>
                    ) : (
                        snapshot.requests.map((request) => {
                            const requester = snapshot.clientProfiles[request.client_id];
                            const status = normalizeStatus(request.status);

                            return (
                                <div key={request.id} className="grid grid-cols-12 items-center gap-2 px-6 py-4 hover:bg-white/10 dark:hover:bg-white/5">
                                    <div className="col-span-3 flex items-start gap-3">
                                        <UserCircle2 className="h-8 w-8 text-text-secondary" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-secondary dark:text-white">
                                                {requester?.full_name || "Unknown client"}
                                            </p>
                                            <div className="mt-1 space-y-0.5">
                                                {requester?.email ? (
                                                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                                                        <Mail className="h-3 w-3" />
                                                        {requester.email}
                                                    </p>
                                                ) : null}
                                                {requester?.phone ? (
                                                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                                                        <Phone className="h-3 w-3" />
                                                        {requester.phone}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-4">
                                        <p className="line-clamp-2 text-sm text-text-secondary">{request.message}</p>
                                        {request.response ? (
                                            <p className="mt-1 line-clamp-1 text-xs text-primary">Response: {request.response}</p>
                                        ) : null}
                                    </div>

                                    <div className="col-span-2 text-xs capitalize text-text-secondary">
                                        <span className="inline-flex items-center gap-1">
                                            <MessageCircle className="h-3.5 w-3.5 text-primary" />
                                            {request.type.replaceAll("_", " ")}
                                        </span>
                                    </div>

                                    <div className="col-span-1">
                                        <GlassBadge variant={statusToBadge(status)} size="sm">
                                            {status}
                                        </GlassBadge>
                                    </div>

                                    <div className="col-span-2 flex flex-col items-end gap-2">
                                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            {formatTimestamp(request.updated_at || request.created_at)}
                                        </span>
                                        <select
                                            className="rounded-lg border border-white/30 bg-white/60 px-2 py-1 text-xs text-secondary dark:border-white/20 dark:bg-white/10 dark:text-white"
                                            value={status}
                                            onChange={(event) =>
                                                void updateStatus(
                                                    request.id,
                                                    event.target.value as "open" | "pending" | "resolved"
                                                )
                                            }
                                            disabled={savingId === request.id}
                                        >
                                            <option value="open">Open</option>
                                            <option value="pending">Pending</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
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
