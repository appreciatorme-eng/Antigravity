"use client";

import { useState } from "react";
import { useUpdateItinerary } from "@/lib/queries/itineraries";
import { useClients } from "@/lib/queries/clients";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, DollarSign, Check, Share2, ExternalLink, Link2, Globe, Users, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { GlassCard } from "@/components/glass/GlassCard";

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
    };
    compact?: boolean;
}

export function PastItineraryCard({ itinerary, compact = false }: PastItineraryCardProps) {
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
            toast({
                title: "Client assigned ✅",
                description: "The itinerary has been linked to this client.",
            });
        } catch (error) {
            toast({
                title: "Failed to assign client",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive" as any,
            });
        }
    };

    const handleSaveBudget = async () => {
        try {
            await updateItinerary({
                id: itinerary.id,
                updates: { budget }
            });
            setIsEditingBudget(false);
            toast({
                title: "Price updated ✅",
                description: "Budget/price saved successfully.",
            });
        } catch (error) {
            toast({
                title: "Failed to update price",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive" as any,
            });
        }
    };

    const copyShareLink = () => {
        if (!itinerary.share_code) return;
        const url = `${window.location.origin}/share/${itinerary.share_code}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({ title: "Link copied! 🔗", description: "Share this with your client." });
    };

    const shareStatusStyle = (() => {
        switch (itinerary.share_status) {
            case "viewed":
                return { label: "Viewed", color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" };
            case "commented":
                return { label: "Feedback", color: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" };
            case "approved":
                return { label: "Approved ✅", color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" };
            default:
                return { label: "Shared", color: "text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800" };
        }
    })();

    const daysAgo = Math.floor((Date.now() - new Date(itinerary.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

    return (
        <GlassCard padding="none" className="group relative overflow-hidden transition-all duration-300 hover:shadow-md border-gray-100 dark:border-slate-800">
            {/* Hover accent strip */}
            <div className="absolute left-0 top-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />

            <div className="p-4">
                {/* ── Row 1: Icon + Title + Meta ── */}
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mt-0.5">
                        <MapPin className="w-4 h-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-secondary dark:text-white truncate tracking-tight leading-tight">
                                {itinerary.trip_title || itinerary.destination || "Untitled Itinerary"}
                            </h3>
                            {/* Top-right: share status + view trip */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {itinerary.share_code && (
                                    <span className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest",
                                        shareStatusStyle.color
                                    )}>
                                        <Link2 className="w-2.5 h-2.5" />
                                        {shareStatusStyle.label}
                                    </span>
                                )}
                                {itinerary.trip_id && (
                                    <Link
                                        href={`/trips/${itinerary.trip_id}`}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <ExternalLink className="w-2.5 h-2.5" />
                                        Trip
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                            <span className="text-[10px] font-bold text-text-muted flex items-center gap-0.5">
                                <Globe className="w-2.5 h-2.5" /> {itinerary.destination}
                            </span>
                            <span className="text-[10px] font-bold text-text-muted flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {itinerary.duration_days}d
                            </span>
                            <span className="text-[10px] font-bold text-text-muted flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" /> {timeAgo}
                            </span>
                            {itinerary.client?.full_name && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                                    <Users className="w-2.5 h-2.5" /> {itinerary.client.full_name}
                                </span>
                            )}
                        </div>

                        {/* Summary (non-compact only) */}
                        {itinerary.summary && !compact && (
                            <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                                {itinerary.summary}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Row 2: Assign Client + Price (always visible) ── */}
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-800/80 grid grid-cols-2 gap-2">
                    {/* Assign Client */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> Assign Client
                        </p>
                        <Select
                            defaultValue={itinerary.client_id || "unassigned"}
                            onValueChange={handleClientChange}
                            disabled={isPending || isLoadingClients}
                        >
                            <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg">
                                <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned" className="text-text-muted text-xs">
                                    No Client
                                </SelectItem>
                                {clients?.map((client: any) => (
                                    <SelectItem key={client.id} value={client.id} className="text-xs">
                                        {client.full_name || client.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price / Budget */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" /> Price / Budget
                        </p>
                        <div className="flex gap-1.5 items-center">
                            <div className="relative flex-1">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
                                <Input
                                    value={budget}
                                    onChange={(e) => {
                                        setBudget(e.target.value);
                                        setIsEditingBudget(true);
                                    }}
                                    placeholder="e.g. 50000"
                                    className="h-8 pl-6 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveBudget();
                                    }}
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

                {/* ── Row 3: Share link (shown if already shared) ── */}
                {itinerary.share_code && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50/60 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
                        <Share2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span className="text-[11px] text-violet-700 dark:text-violet-300 font-medium truncate flex-1">
                            {typeof window !== "undefined"
                                ? `${window.location.origin}/share/${itinerary.share_code}`
                                : `/share/${itinerary.share_code}`}
                        </span>
                        <button
                            onClick={copyShareLink}
                            className={cn(
                                "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest shrink-0 px-2 py-0.5 rounded-md transition-colors",
                                linkCopied
                                    ? "text-emerald-600 bg-emerald-50 border border-emerald-200"
                                    : "text-violet-600 hover:text-violet-700 hover:bg-violet-100/50"
                            )}
                        >
                            {linkCopied ? <><Check className="w-3 h-3" /> Copied!</> : "Copy Link"}
                        </button>
                    </div>
                )}

                {/* Interests tags (non-compact only) */}
                {itinerary.interests && itinerary.interests.length > 0 && !compact && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {itinerary.interests.map((interest: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 dark:bg-slate-800 text-text-muted border border-gray-100 dark:border-slate-700">
                                {interest}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
