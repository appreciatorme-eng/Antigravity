"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, Clock, MapPin, User } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getDeterministicFallback } from "@/lib/image-search";
import { deriveStage, hasClientActivity } from "./planner.types";
import type { ClientComment } from "@/types/feedback";

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
        client_comments?: ClientComment[];
        client_preferences?: import("@/types/feedback").ClientPreferences | null;
        wishlist_items?: string[];
        approved_by?: string | null;
        approved_at?: string | null;
        self_service_status?: string | null;
    };
    compact?: boolean;
    onOpen?: (id: string) => void;
    isLoading?: boolean;
}

const PIPELINE_STAGES = ["draft", "shared", "viewed", "approved", "converted"] as const;

const STAGE_LABELS: Record<string, string> = {
    draft: "Draft",
    shared: "Shared",
    viewed: "Viewed",
    approved: "Approved",
    converted: "Won",
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

export function PastItineraryCard({ itinerary, compact = false, onOpen, isLoading = false }: PastItineraryCardProps) {
    const { toast } = useToast();
    const [linkCopied, setLinkCopied] = useState(false);

    const stage = deriveStage(itinerary);
    const hasActivity = hasClientActivity(itinerary);
    const heroImage = getDeterministicFallback(itinerary.destination || "travel");
    const { value: budgetValue, isMuted: budgetMuted } = parseBudget(itinerary.budget);
    const [nowMs] = useState(() => Date.now());
    const daysSinceCreation = Math.floor((nowMs - new Date(itinerary.created_at).getTime()) / 86_400_000);
    const isStale = daysSinceCreation > 7 && stage === "draft";

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
                <Image
                    src={heroImage}
                    alt={itinerary.destination || "Destination"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md bg-white/20 text-white">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{itinerary.duration_days}D</span>
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
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                            <User className="w-3 h-3 text-slate-500" />
                        </div>
                        <span className="text-xs text-slate-500">Unassigned</span>
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
                <div className="flex items-center gap-2 mx-4 mb-2 px-2.5 py-1.5 rounded-lg bg-white/5">
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
