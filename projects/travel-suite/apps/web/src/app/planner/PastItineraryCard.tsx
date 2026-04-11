"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Copy, Check, Clock, MapPin, Search, UserPlus, Plus, Loader2, Eye, Briefcase, Link2, CalendarHeart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getDeterministicFallback } from "@/lib/image-search";
import { deriveStage, hasClientActivity } from "./planner.types";
import { useClients, clientsKeys } from "@/lib/queries/clients";
import { useUpdateItinerary } from "@/lib/queries/itineraries";
import { useQueryClient } from "@tanstack/react-query";
import { authedFetch } from "@/lib/api/authed-fetch";
import type { ClientComment } from "@/types/feedback";
import { buildSharePaymentSummaryLabel, type SharePaymentSummary } from "@/lib/share/payment-config";

interface PastItineraryCardProps {
    itinerary: {
        id: string;
        trip_title: string;
        destination: string;
        duration_days: number;
        created_at: string;
        budget: string | null;
        client_id: string | null;
        summary?: string | null;
        interests?: string[] | null;
        client?: { full_name: string } | null;
        share_code?: string | null;
        share_status?: string | null;
        trip_id?: string | null;
        proposal_id?: string | null;
        proposal_status?: string | null;
        proposal_share_token?: string | null;
        proposal_title?: string | null;
        share_payment_summary?: SharePaymentSummary | null;
        client_comments?: ClientComment[];
        client_preferences?: import("@/types/feedback").ClientPreferences | null;
        wishlist_items?: string[];
        viewed_at?: string | null;
        approved_by?: string | null;
        approved_at?: string | null;
        self_service_status?: string | null;
        hero_image?: string | null;
        holiday_summary?: {
            holidayName: string;
            date: string;
            country: string;
            countryCode: string;
        } | null;
    };
    compact?: boolean;
    onOpen?: (id: string) => void;
    isLoading?: boolean;
    onDeleteRequest?: (id: string) => void;
}

const PIPELINE_STAGES = ["draft", "shared", "viewed", "approved", "converted"] as const;

const STAGE_LABELS: Record<string, string> = {
    draft: "Draft",
    shared: "Shared",
    viewed: "Viewed",
    approved: "Approved",
    converted: "Paid",
};

const STAGE_PILL_STYLES: Record<string, string> = {
    draft: "text-slate-200",
    shared: "text-blue-300",
    viewed: "text-purple-300",
    feedback: "text-amber-300",
    approved: "text-emerald-300",
    converted: "text-emerald-300",
};

const INR_FORMAT = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
});

/** djb2 hash for deterministic avatar color */
function djb2Color(name: string): string {
    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) + hash + name.charCodeAt(i)) | 0;
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 45%)`;
}

function relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    if (diffD < 14) return "Last week";
    const diffW = Math.floor(diffD / 7);
    if (diffW < 5) return `${diffW}w ago`;
    const diffM = Math.floor(diffD / 30);
    return `${diffM}mo ago`;
}

function parseBudget(budget: string | null): { value: number; isMuted: boolean } {
    if (!budget) return { value: 0, isMuted: true };
    const num = parseFloat(budget.replace(/[^0-9.]/g, ""));
    if (isNaN(num) || num === 0) return { value: 0, isMuted: true };
    return { value: num, isMuted: false };
}

function PipelineDots({ currentStage }: { currentStage: string }) {
    const stageIndex = PIPELINE_STAGES.indexOf(
        currentStage === "feedback" ? "viewed" : (currentStage as typeof PIPELINE_STAGES[number])
    );
    const activeIdx = stageIndex === -1 ? 0 : stageIndex;

    return (
        <div className="flex items-center justify-between px-4 py-3">
            {PIPELINE_STAGES.map((stage, i) => {
                const reached = i <= activeIdx;
                const isCurrent = i === activeIdx;
                return (
                    <div key={stage} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={cn(
                                    "w-2.5 h-2.5 rounded-full transition-all",
                                    reached
                                        ? "bg-emerald-500"
                                        : "bg-white/20",
                                    isCurrent && "animate-pulse ring-2 ring-emerald-500/30"
                                )}
                            />
                            <span className={cn(
                                "text-[9px] font-medium leading-none",
                                reached ? "text-emerald-400" : "text-white/30"
                            )}>
                                {STAGE_LABELS[stage]}
                            </span>
                        </div>
                        {i < PIPELINE_STAGES.length - 1 && (
                            <div
                                className={cn(
                                    "flex-1 h-px mx-1 mt-[-12px]",
                                    i < activeIdx ? "bg-emerald-500" : "bg-white/10"
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function SkeletonShimmer() {
    return (
        <div className="animate-pulse rounded-xl bg-slate-800 overflow-hidden">
            <div className="h-44 bg-slate-700" />
            <div className="p-4 space-y-3">
                <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700" />
                    <div className="h-4 w-24 rounded bg-slate-700" />
                    <div className="ml-auto h-4 w-16 rounded bg-slate-700" />
                </div>
            </div>
        </div>
    );
}

export function PastItineraryCard({ itinerary, compact = false, onOpen, isLoading = false, onDeleteRequest }: PastItineraryCardProps) {
    const { toast } = useToast();
    const [linkCopied, setLinkCopied] = useState(false);
    const [showClientPicker, setShowClientPicker] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const pickerRef = useRef<HTMLDivElement>(null);
    const { data: allClients } = useClients();
    const updateItinerary = useUpdateItinerary();
    const queryClient = useQueryClient();
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const [quickName, setQuickName] = useState("");
    const [quickEmail, setQuickEmail] = useState("");
    const [quickPhone, setQuickPhone] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Close picker on outside click
    useEffect(() => {
        if (!showClientPicker) return;
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowClientPicker(false);
                setClientSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showClientPicker]);

    const filteredClients = useMemo(() => {
        if (!allClients || !Array.isArray(allClients)) return [];
        const list = allClients as Array<{ id: string; full_name: string | null; email: string | null; phone: string | null }>;
        if (!clientSearch.trim()) return list.slice(0, 8);
        const q = clientSearch.toLowerCase();
        return list.filter(
            (c) => c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
        ).slice(0, 8);
    }, [allClients, clientSearch]);

    const handleAssignClient = async (clientId: string, clientFullName: string) => {
        setShowClientPicker(false);
        setClientSearch("");
        try {
            await updateItinerary.mutateAsync({ id: itinerary.id, updates: { client_id: clientId } });
            toast({ title: "Client assigned", description: `${clientFullName} assigned to this itinerary.`, variant: "success" });
        } catch {
            toast({ title: "Failed to assign", description: "Could not assign client. Try again.", variant: "error" });
        }
    };

    const handleQuickCreateClient = async () => {
        const name = quickName.trim();
        const email = quickEmail.trim().toLowerCase();
        if (!name || !email) {
            toast({ title: "Name & email required", variant: "warning" });
            return;
        }
        setIsCreating(true);
        try {
            const res = await authedFetch("/api/admin/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: name,
                    email,
                    phone: quickPhone.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create client");
            // Invalidate clients cache so the new client appears in the picker
            await queryClient.invalidateQueries({ queryKey: clientsKeys.all });
            // Auto-assign the newly created client
            await handleAssignClient(data.userId, name);
            setShowQuickCreate(false);
            setQuickName("");
            setQuickEmail("");
            setQuickPhone("");
            toast({ title: "Client created & assigned", description: `${name} was added and assigned.`, variant: "success" });
            const warnings = [
                ...(Array.isArray(data.validation?.emailWarnings) ? data.validation.emailWarnings : []),
                ...(Array.isArray(data.validation?.phoneWarnings) ? data.validation.phoneWarnings : []),
            ];
            if (warnings.length > 0) {
                toast({
                    title: "Contact warning",
                    description: warnings[0],
                    variant: "warning",
                });
            }
        } catch (err) {
            toast({ title: "Create failed", description: err instanceof Error ? err.message : "Unknown error", variant: "error" });
        } finally {
            setIsCreating(false);
        }
    };

    const stage = deriveStage(itinerary);
    const hasActivity = hasClientActivity(itinerary);
    const fallbackImage = getDeterministicFallback(itinerary.destination || "travel");
    const [imgSrc, setImgSrc] = useState(itinerary.hero_image || fallbackImage);
    const [imgErrored, setImgErrored] = useState(false);
    const { value: budgetValue, isMuted: budgetMuted } = parseBudget(itinerary.budget);
    const [nowMs] = useState(() => Date.now());
    const daysSinceCreation = Math.floor((nowMs - new Date(itinerary.created_at).getTime()) / 86_400_000);
    const isStale = daysSinceCreation > 7 && stage === "draft";
    const paymentSummaryLabel = buildSharePaymentSummaryLabel(itinerary.share_payment_summary ?? null);

    const copyShareLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!itinerary.share_code) return;
        const url = `${window.location.origin}/share/${itinerary.share_code}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({ title: "Link copied!", description: "Share this with your client." });
    };

    const handleCardClick = () => {
        if (onOpen && !isLoading) onOpen(itinerary.id);
    };

    if (isLoading) return <SkeletonShimmer />;

    const clientName = itinerary.client?.full_name ?? null;

    return (
        <div
            className={cn(
                "group relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer",
                "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                isStale && "border-l-4 border-amber-400"
            )}
            onClick={handleCardClick}
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
            onKeyDown={onOpen ? (e) => { if (e.key === "Enter" || e.key === " ") handleCardClick(); } : undefined}
        >
            {/* Hero Section */}
            <div className="relative h-44 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imgSrc}
                    alt={itinerary.destination || "Destination"}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={() => {
                        if (!imgErrored) {
                            setImgErrored(true);
                            setImgSrc(fallbackImage);
                        }
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Status pill - top left */}
                <div className={cn(
                    "absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-white/20",
                    STAGE_PILL_STYLES[stage] ?? STAGE_PILL_STYLES.draft
                )}>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{STAGE_LABELS[stage] ?? stage}</span>
                </div>

                {/* Duration chip - top right */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                    {onDeleteRequest ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRequest(itinerary.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md bg-black/30 text-white/80 transition hover:bg-rose-500/85 hover:text-white"
                            aria-label={`Delete itinerary ${itinerary.trip_title || itinerary.destination || itinerary.id}`}
                            title="Delete itinerary"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md bg-white/20 text-white">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{itinerary.duration_days}D</span>
                    </div>
                </div>

                {/* Destination + title - bottom left */}
                <div className="absolute bottom-3 left-3 right-3">
                    <p className="flex items-center gap-1 text-white font-bold text-lg leading-tight drop-shadow-lg">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {itinerary.destination || "Unknown"}
                    </p>
                    {itinerary.trip_title && itinerary.trip_title !== itinerary.destination && (
                        <p className="text-white/70 text-xs mt-0.5 truncate">
                            {itinerary.trip_title}
                        </p>
                    )}
                    {itinerary.holiday_summary ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-300/30 bg-rose-500/15 px-2.5 py-1 text-[10px] font-semibold text-rose-100 backdrop-blur-sm">
                            <CalendarHeart className="h-3 w-3" />
                            {itinerary.holiday_summary.holidayName}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Pipeline Progress Dots */}
            {!compact && <PipelineDots currentStage={stage} />}

            {/* Deal Info Row */}
            <div className="flex items-center justify-between px-4 pb-2">
                {/* Client avatar */}
                {clientName ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: djb2Color(clientName) }}
                        >
                            {clientName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
                            {clientName}
                        </span>
                    </div>
                ) : (
                    <div className="relative" ref={pickerRef}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowClientPicker((p) => !p); }}
                            className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                                <UserPlus className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                            </div>
                            <span className="text-xs text-slate-500">Assign client</span>
                        </button>

                        {/* Inline client picker dropdown */}
                        {showClientPicker && (
                            <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                <div className="p-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={clientSearch}
                                            onChange={(e) => setClientSearch(e.target.value)}
                                            placeholder="Search clients..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto px-1 pb-1">
                                    {filteredClients.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4">No clients found</p>
                                    ) : (
                                        filteredClients.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => void handleAssignClient(c.id, c.full_name || "Client")}
                                                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                                            >
                                                <div
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                                    style={{ backgroundColor: djb2Color(c.full_name || "?") }}
                                                >
                                                    {(c.full_name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-white truncate">{c.full_name || "Unnamed"}</p>
                                                    {c.email && <p className="text-[10px] text-slate-400 truncate">{c.email}</p>}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>

                                {/* Quick create divider + form */}
                                <div className="border-t border-slate-700 px-2 py-1.5">
                                    {!showQuickCreate ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickCreate(true)}
                                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-left"
                                        >
                                            <div className="w-7 h-7 rounded-full border-2 border-dashed border-emerald-500/40 flex items-center justify-center">
                                                <Plus className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <span className="text-xs font-medium text-emerald-400">Create new client</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-1.5 py-1">
                                            <input
                                                type="text"
                                                value={quickName}
                                                onChange={(e) => setQuickName(e.target.value)}
                                                placeholder="Full name *"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                                                autoFocus
                                            />
                                            <input
                                                type="email"
                                                value={quickEmail}
                                                onChange={(e) => setQuickEmail(e.target.value)}
                                                placeholder="Email *"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                                            />
                                            <input
                                                type="tel"
                                                value={quickPhone}
                                                onChange={(e) => setQuickPhone(e.target.value)}
                                                placeholder="Phone (optional)"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                                            />
                                            <div className="flex gap-1.5 pt-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowQuickCreate(false); setQuickName(""); setQuickEmail(""); setQuickPhone(""); }}
                                                    className="flex-1 text-[10px] text-slate-400 hover:text-white py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleQuickCreateClient()}
                                                    disabled={isCreating || !quickName.trim() || !quickEmail.trim()}
                                                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 py-1.5 rounded-lg transition-colors"
                                                >
                                                    {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                                    Create & Assign
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Price */}
                <span className={cn(
                    "text-sm tabular-nums",
                    budgetMuted
                        ? "text-slate-500 font-medium"
                        : "text-white font-bold"
                )}>
                    {INR_FORMAT.format(budgetValue)}
                </span>
            </div>

            {/* Share Link Row */}
            {itinerary.share_code && (
                <div className="mx-4 mb-2 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 px-2.5 py-1.5">
                        <span className="text-[10px] text-slate-400 truncate flex-1 font-mono">
                            /share/{itinerary.share_code}
                        </span>
                        <button
                            onClick={copyShareLink}
                            className={cn(
                                "shrink-0 p-1 rounded transition-colors",
                                linkCopied
                                    ? "text-emerald-400"
                                    : "text-slate-400 hover:text-white"
                            )}
                            aria-label="Copy share link"
                        >
                            {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    {itinerary.viewed_at && (
                        <div className="flex items-center gap-1.5 px-2.5 pb-1.5 text-[10px] text-purple-400 font-medium" title={new Date(itinerary.viewed_at).toLocaleString("en-IN")}>
                            <Eye className="w-3 h-3" />
                            Last viewed {relativeTime(itinerary.viewed_at)}
                        </div>
                    )}
                </div>
            )}

            {(itinerary.trip_id || itinerary.share_code) && (
                <div className="mx-4 mb-2 grid gap-2">
                    {itinerary.trip_id ? (
                        <Link
                            href={`/trips/${itinerary.trip_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                        >
                            <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-[11px] font-semibold text-emerald-300">Open Linked Trip</span>
                            <span className="text-[10px] text-emerald-400/70 ml-auto">Ops, pricing, traveler updates</span>
                        </Link>
                    ) : null}

                    {itinerary.share_code ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={copyShareLink}
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors"
                            >
                                <Copy className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-sky-200">Copy client share link</span>
                            </button>
                            <Link
                                href={`/share/${itinerary.share_code}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            >
                                <Link2 className="w-3.5 h-3.5 text-white/70 shrink-0" />
                                <span className="text-[11px] font-semibold text-white/85">Open share preview</span>
                            </Link>
                        </div>
                    ) : null}

                    {paymentSummaryLabel ? (
                        <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-[11px] text-white/72">
                            {paymentSummaryLabel}
                        </div>
                    ) : null}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
                <span className="text-[10px] text-slate-500 font-medium">
                    {relativeTime(itinerary.created_at)}
                </span>
                {hasActivity && (
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                        </span>
                        New feedback
                    </span>
                )}
            </div>
        </div>
    );
}
