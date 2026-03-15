"use client";

import { useState } from "react";
import { useUpdateItinerary } from "@/lib/queries/itineraries";
import { useClients } from "@/lib/queries/clients";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, DollarSign, Check, Share2, ExternalLink, Globe, Users, Calendar, Eye, Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { STAGE_CONFIG } from "./ItineraryFilterBar";
import { ClientFeedbackPanel } from "./ClientFeedbackPanel";
import { deriveStage, hasClientActivity } from "./planner.types";
import type { ClientComment, ClientPreferences } from "@/types/feedback";

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
        client_preferences?: ClientPreferences | null;
        wishlist_items?: string[];
        approved_by?: string | null;
        approved_at?: string | null;
        self_service_status?: string | null;
    };
    compact?: boolean;
    onOpen?: (id: string) => void;
    isLoading?: boolean;
}

export function PastItineraryCard({ itinerary, compact = false, onOpen, isLoading = false }: PastItineraryCardProps) {
    const { toast } = useToast();
    const { mutateAsync: updateItinerary, isPending } = useUpdateItinerary();
    const { data: clients, isLoading: isLoadingClients } = useClients();

    const [budget, setBudget] = useState(itinerary.budget || "");
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleClientChange = async (clientId: string) => {
        try {
            await updateItinerary({
                id: itinerary.id,
                updates: { client_id: clientId === "unassigned" ? null : clientId }
            });
            toast({ title: "Client assigned", description: "Itinerary linked to this client." });
        } catch (error) {
            toast({
                title: "Failed to assign client",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "error",
            });
        }
    };

    const handleSaveBudget = async () => {
        try {
            await updateItinerary({ id: itinerary.id, updates: { budget } });
            setIsEditingBudget(false);
            toast({ title: "Price updated", description: "Budget/price saved successfully." });
        } catch (error) {
            toast({
                title: "Failed to update price",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "error",
            });
        }
    };

    const copyShareLink = () => {
        if (!itinerary.share_code) return;
        const url = `${window.location.origin}/share/${itinerary.share_code}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({ title: "Link copied!", description: "Share this with your client." });
    };

    const stage = deriveStage(itinerary);
    const stageConfig = STAGE_CONFIG[stage] ?? STAGE_CONFIG.draft;
    const StageIcon = stageConfig.icon;
    const hasActivity = hasClientActivity(itinerary);
    const comments = itinerary.client_comments ?? [];
    const unresolvedCount = comments.filter((c: ClientComment) => !c.resolved_at).length;
    const preferences = itinerary.client_preferences ?? null;
    const wishlist = itinerary.wishlist_items ?? [];

    const createdDateLabel = new Date(itinerary.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });

    const handleCardClick = () => {
        if (onOpen && !isLoading) onOpen(itinerary.id);
    };

    return (
        <div className={cn(
            "group relative bg-white dark:bg-slate-900 rounded-2xl border-2 overflow-hidden transition-all duration-300",
            isLoading && "opacity-60 pointer-events-none",
            onOpen
                ? "border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
                : "border-slate-100 dark:border-slate-800"
        )}>
            {/* Top gradient accent bar */}
            <div className={cn(
                "h-1 bg-gradient-to-r transition-all duration-500",
                stageConfig.gradient,
                "opacity-40 group-hover:opacity-100"
            )} />

            <div className="p-4">
                {/* ── Header: Title + Stage Badge ── */}
                <div
                    className={cn("flex items-start gap-3", onOpen && "cursor-pointer")}
                    onClick={handleCardClick}
                    role={onOpen ? "button" : undefined}
                    tabIndex={onOpen ? 0 : undefined}
                    onKeyDown={onOpen ? (e) => { if (e.key === "Enter" || e.key === " ") handleCardClick(); } : undefined}
                >
                    <div className={cn(
                        "w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center transition-all duration-300 mt-0.5 shadow-sm",
                        stageConfig.gradient,
                        "group-hover:scale-110 group-hover:shadow-md"
                    )}>
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                            <MapPin className="w-4 h-4 text-white" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate tracking-tight leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {itinerary.trip_title || itinerary.destination || "Untitled Itinerary"}
                            </h3>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest",
                                    stageConfig.color, stageConfig.bg, stageConfig.borderColor,
                                    stageConfig.darkColor, stageConfig.darkBg,
                                )}>
                                    <StageIcon className="w-2.5 h-2.5" />
                                    {stageConfig.label}
                                </span>
                                {itinerary.trip_id && (
                                    <Link
                                        href={`/trips/${itinerary.trip_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800/40"
                                    >
                                        <ExternalLink className="w-2.5 h-2.5" />
                                        Trip
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Meta chips */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" /> {itinerary.destination}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {itinerary.duration_days}d
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> {createdDateLabel}
                            </span>
                            {itinerary.client?.full_name && (
                                <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5" /> {itinerary.client.full_name}
                                </span>
                            )}
                            {hasActivity && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                                    </span>
                                    <MessageCircle className="w-2.5 h-2.5" />
                                    {unresolvedCount > 0
                                        ? `${unresolvedCount} unresolved`
                                        : "Feedback"}
                                </span>
                            )}
                        </div>

                        {itinerary.summary && !compact && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                {itinerary.summary}
                            </p>
                        )}
                    </div>
                </div>

                {/* Open button */}
                {onOpen && (
                    <button
                        onClick={handleCardClick}
                        disabled={isLoading}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/30 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 transition-all"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
                        ) : (
                            <><Eye className="w-3.5 h-3.5" /> Open Itinerary</>
                        )}
                    </button>
                )}

                {/* ── Assign Client + Price ── */}
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/60 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> Client
                        </p>
                        <Select
                            defaultValue={itinerary.client_id || "unassigned"}
                            onValueChange={handleClientChange}
                            disabled={isPending || isLoadingClients}
                        >
                            <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 rounded-lg">
                                <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned" className="text-slate-400 text-xs">No Client</SelectItem>
                                {clients?.map((client: { id: string; full_name?: string | null; email?: string | null }) => (
                                    <SelectItem key={client.id} value={client.id} className="text-xs">
                                        {client.full_name || client.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" /> Price
                        </p>
                        <div className="flex gap-1.5 items-center">
                            <div className="relative flex-1">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                <Input
                                    value={budget}
                                    onChange={(e) => { setBudget(e.target.value); setIsEditingBudget(true); }}
                                    placeholder="e.g. 50000"
                                    className="h-8 pl-6 text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 rounded-lg"
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveBudget(); }}
                                />
                            </div>
                            {isEditingBudget && (
                                <button
                                    className="h-8 w-8 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center border border-emerald-200 dark:border-emerald-800"
                                    onClick={handleSaveBudget}
                                    title="Save price"
                                >
                                    <Check className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Share link */}
                {itinerary.share_code && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100/80 dark:border-violet-800/30">
                        <Share2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span className="text-[10px] text-violet-600 dark:text-violet-300 font-medium truncate flex-1">
                            {typeof window !== "undefined"
                                ? `${window.location.origin}/share/${itinerary.share_code}`
                                : `/share/${itinerary.share_code}`}
                        </span>
                        <button
                            onClick={copyShareLink}
                            className={cn(
                                "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest shrink-0 px-2.5 py-1 rounded-lg transition-all",
                                linkCopied
                                    ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
                                    : "text-violet-600 hover:bg-violet-100/60 dark:hover:bg-violet-900/20"
                            )}
                        >
                            {linkCopied ? <><Check className="w-3 h-3" /> Copied!</> : "Copy"}
                        </button>
                    </div>
                )}

                {/* Interest tags */}
                {itinerary.interests && itinerary.interests.length > 0 && !compact && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {itinerary.interests.map((interest: string, i: number) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
                                {interest}
                            </span>
                        ))}
                    </div>
                )}

                {/* Client Feedback Panel */}
                <div>
                    <ClientFeedbackPanel
                        itineraryId={itinerary.id}
                        comments={comments}
                        preferences={preferences}
                        wishlistItems={wishlist}
                        approvedBy={itinerary.approved_by ?? null}
                        approvedAt={itinerary.approved_at ?? null}
                        clientName={itinerary.client?.full_name ?? null}
                    />
                </div>
            </div>
        </div>
    );
}
