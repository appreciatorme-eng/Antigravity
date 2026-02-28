"use client";

import { useState } from "react";
import { useUpdateItinerary } from "@/lib/queries/itineraries";
import { useClients } from "@/lib/queries/clients";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, DollarSign, Check, Share2, ExternalLink, Link2, Globe, ChevronDown, ChevronUp, Users } from "lucide-react";
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
    const [expanded, setExpanded] = useState(false);

    const [budget, setBudget] = useState(itinerary.budget || "");
    const [isEditingBudget, setIsEditingBudget] = useState(false);

    const handleClientChange = async (clientId: string) => {
        try {
            await updateItinerary({
                id: itinerary.id,
                updates: { client_id: clientId === "unassigned" ? null : clientId }
            });
            toast({
                title: "Client attached",
                description: "Successfully updated the itinerary's client.",
            });
        } catch (error) {
            toast({
                title: "Failed to update client",
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
                title: "Budget updated",
                description: "Successfully updated the itinerary's budget.",
            });
        } catch (error) {
            toast({
                title: "Failed to update budget",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive" as any,
            });
        }
    };

    const getShareStatusStyles = (status: string | null | undefined) => {
        switch (status) {
            case "viewed":
                return { label: "Viewed", color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" };
            case "commented":
                return { label: "Feedback", color: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" };
            case "approved":
                return { label: "Approved", color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" };
            default:
                return { label: "Shared", color: "text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800" };
        }
    };

    const daysAgo = Math.floor((Date.now() - new Date(itinerary.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

    return (
        <GlassCard padding="none" className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-gray-100 dark:border-slate-800">
            {/* Hover accent */}
            <div className="absolute left-0 top-0 w-1 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />

            <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <MapPin className="w-5 h-5 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-secondary dark:text-white truncate tracking-tight leading-tight">
                                {itinerary.trip_title || itinerary.destination || "Untitled Itinerary"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {itinerary.destination}
                                </span>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {itinerary.duration_days} Days
                                </span>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {timeAgo}
                                </span>
                                {itinerary.budget && (
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {itinerary.budget}
                                    </span>
                                )}
                            </div>
                            {itinerary.summary && !compact && (
                                <p className="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
                                    {itinerary.summary}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status badges + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        {itinerary.client?.full_name && (
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
                                <Users className="w-3 h-3 text-text-muted" />
                                <span className="text-[10px] font-bold text-secondary dark:text-white uppercase tracking-wider">{itinerary.client.full_name}</span>
                            </div>
                        )}

                        {itinerary.share_code && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest",
                                getShareStatusStyles(itinerary.share_status).color
                            )}>
                                <Link2 className="w-3 h-3" />
                                {getShareStatusStyles(itinerary.share_status).label}
                            </div>
                        )}

                        {itinerary.trip_id && (
                            <Link
                                href={`/trips/${itinerary.trip_id}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-black uppercase tracking-widest"
                            >
                                <ExternalLink className="w-3 h-3" />
                                View Trip
                            </Link>
                        )}

                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-8 h-8 rounded-lg border border-gray-100 dark:border-slate-700 flex items-center justify-center text-text-muted hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Interests tags */}
                {itinerary.interests && itinerary.interests.length > 0 && !compact && (
                    <div className="flex flex-wrap gap-1.5 mt-3 ml-16">
                        {itinerary.interests.map((interest: string, i: number) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 dark:bg-slate-800 text-text-muted border border-gray-100 dark:border-slate-700">
                                {interest}
                            </span>
                        ))}
                    </div>
                )}

                {/* Expanded: Client + Budget management */}
                {expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800 ml-16 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Client Selector */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Assign Client</Label>
                                <Select
                                    defaultValue={itinerary.client_id || "unassigned"}
                                    onValueChange={handleClientChange}
                                    disabled={isPending || isLoadingClients}
                                >
                                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-sm rounded-xl">
                                        <SelectValue placeholder="Select client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned" className="text-text-muted">
                                            No Client
                                        </SelectItem>
                                        {clients?.map((client: any) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.full_name || client.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Budget/Price */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Price / Budget</Label>
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                                        <Input
                                            value={budget}
                                            onChange={(e) => {
                                                setBudget(e.target.value);
                                                setIsEditingBudget(true);
                                            }}
                                            placeholder="0.00"
                                            className="h-9 pl-8 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-sm rounded-xl"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveBudget();
                                            }}
                                        />
                                    </div>
                                    {isEditingBudget && (
                                        <button
                                            className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center border border-emerald-200 dark:border-emerald-800"
                                            onClick={handleSaveBudget}
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Share link display */}
                        {itinerary.share_code && (
                            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
                                <Share2 className="w-4 h-4 text-violet-500 shrink-0" />
                                <span className="text-xs text-violet-700 dark:text-violet-300 font-medium truncate flex-1">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/share/${itinerary.share_code}` : `/share/${itinerary.share_code}`}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/share/${itinerary.share_code}`);
                                        toast({ title: "Link copied!", description: "Share link copied to clipboard." });
                                    }}
                                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700 uppercase tracking-widest shrink-0"
                                >
                                    Copy
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
