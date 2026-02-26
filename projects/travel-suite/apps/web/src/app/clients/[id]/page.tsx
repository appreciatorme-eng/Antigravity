import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    Mail, Phone, MapPin, CalendarDays, BadgeCheck, Utensils,
    Accessibility, User, HeartPulse, FileText, Globe, Plane,
    Clock, Tag, TrendingUp, AlertCircle, Briefcase, Activity
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { cn } from "@/lib/utils";

export default async function ClientProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !profile) {
        console.error("Profile fetch error or not found:", error, id);
        notFound();
    }

    // Fetch trips
    const { data: trips, error: tripsError } = await supabase
        .from("trips")
        .select("*, itineraries(destination)")
        .eq("client_id", id)
        .order("start_date", { ascending: false });

    if (tripsError) {
        console.error("Trips fetch error:", tripsError);
    }

    // Helper to format currency
    const formatCurrency = (amount: number | null) => {
        if (amount == null) return "Unspecified Limit";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
    };

    // Helper for date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // Extract client info safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientInfo = (profile.client_info as any) || {};

    // Compute tactical stats
    const totalTrips = trips?.length || 0;
    const completedTrips = trips?.filter(t => t.status === 'completed').length || 0;
    const activeTrips = trips?.filter(t => t.status === 'confirmed' || t.status === 'in_progress').length || 0;

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                        <User className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-black">
                                Identity Profile
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50">
                                #{id.slice(0, 8)}
                            </span>
                        </div>
                        <h1 className="text-4xl font-serif text-secondary dark:text-white tracking-tight leading-none mb-3">
                            {profile.full_name || "Guest Entity"}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            {profile.email && (
                                <div className="flex items-center gap-2 text-text-muted font-medium bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{profile.email}</span>
                                </div>
                            )}
                            {profile.phone && (
                                <div className="flex items-center gap-2 text-text-muted font-medium bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                            {profile.client_tag && profile.client_tag !== 'standard' && (
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-widest",
                                    profile.client_tag === 'vip'
                                        ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-500"
                                        : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-500"
                                )}>
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>{profile.client_tag}</span>
                                </div>
                            )}
                            {profile.lifecycle_stage && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-widest bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-500">
                                    <Activity className="w-3.5 h-3.5" />
                                    <span>{profile.lifecycle_stage.replace('_', ' ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tactical Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 group hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Deployments Executed</p>
                            <p className="text-4xl font-black text-secondary dark:text-white tabular-nums tracking-tight">
                                {totalTrips}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 group hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Missions Completed</p>
                            <p className="text-4xl font-black text-secondary dark:text-white tabular-nums tracking-tight">
                                {completedTrips}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <BadgeCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 group hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Total Yield Status</p>
                            <p className="text-4xl font-black text-secondary dark:text-white tabular-nums tracking-tight">
                                Optimal
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-violet-100/50 dark:bg-violet-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Intelligence */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Logistical Preferences
                        </h2>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Primary Objective</span>
                                <span className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    {profile.preferred_destination || "Undisclosed"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Unit Size Capacity</span>
                                <span className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    {profile.travelers_count ? `${profile.travelers_count} Personnel` : "Solo Operation"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Financial Parameters</span>
                                <span className="text-sm font-bold text-secondary dark:text-white bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 w-fit">
                                    {formatCurrency(profile.budget_min)} - {formatCurrency(profile.budget_max)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Operation Style</span>
                                <span className="text-sm font-bold text-secondary dark:text-white">
                                    {profile.travel_style || "Standard Protocols"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Origin Point</span>
                                <span className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-primary" />
                                    {profile.home_airport || "Classified"}
                                </span>
                            </div>

                            {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
                                <div className="pt-2">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-3">Strategic Interests</span>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map((interest: string) => (
                                            <span key={interest} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {((profile.dietary_requirements && Array.isArray(profile.dietary_requirements) && profile.dietary_requirements.length > 0) || profile.mobility_needs) && (
                        <GlassCard padding="lg" className="border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10">
                            <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <HeartPulse className="w-4 h-4" />
                                Critical Requirements
                            </h2>
                            <div className="space-y-4">
                                {Array.isArray(profile.dietary_requirements) && profile.dietary_requirements.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                                            <Utensils className="w-3.5 h-3.5 text-rose-400" />
                                            Dietary Mandates
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(profile.dietary_requirements as string[]).map((req: string) => (
                                                <span key={req} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-800">
                                                    {req}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profile.mobility_needs && (
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                                            <Accessibility className="w-3.5 h-3.5 text-rose-400" />
                                            Mobility Protocols
                                        </div>
                                        <p className="text-sm font-medium text-secondary dark:text-white bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 shadow-sm leading-relaxed">
                                            {profile.mobility_needs}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Right Column: Mission Log & Notes */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Command Notes
                        </h2>
                        {profile.notes ? (
                            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-5 border border-gray-100 dark:border-slate-800">
                                <p className="text-sm text-text-secondary dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                                    {profile.notes}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No intelligence recorded</p>
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Deployment Log
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-text-muted">
                                {trips?.length || 0} Records
                            </span>
                        </div>

                        <div className="space-y-4">
                            {trips && trips.length > 0 ? trips.map((trip) => {
                                const statusColors: Record<string, string> = {
                                    completed: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-500",
                                    confirmed: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-500",
                                    in_progress: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-500",
                                    cancelled: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-500",
                                    draft: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400"
                                };

                                const statusColor = statusColors[trip.status || "draft"] || statusColors.draft;

                                return (
                                    <Link key={trip.id} href={`/trips/${trip.id}`}>
                                        <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-base font-bold text-secondary dark:text-white group-hover:text-primary transition-colors">
                                                        {(() => {
                                                            const itin = (trip as any).itineraries || (trip as any).itinerary;
                                                            if (Array.isArray(itin)) return itin[0]?.destination || trip.destination || "Standard Deployment";
                                                            return itin?.destination || trip.destination || "Standard Deployment";
                                                        })()}
                                                    </h3>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50">#{trip.id.slice(0, 8)}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
                                                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest", statusColor)}>
                                                    {trip.status?.replace('_', ' ') || 'Planing Protocol'}
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 dark:border-slate-700">
                                                    →
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
                                        <AlertCircle className="w-8 h-8 text-text-muted opacity-50" />
                                    </div>
                                    <p className="text-sm font-bold text-secondary dark:text-white mb-2">No Deployment Records</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted max-w-sm mx-auto">
                                        This identity has not been assigned to any operations. Initiate a new mission to begin tracking.
                                    </p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
