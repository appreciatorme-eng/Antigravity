import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    Mail, Phone, MapPin, CalendarDays, BadgeCheck, Utensils,
    Accessibility, User, HeartPulse, FileText, Globe, Plane,
    Clock, Tag, TrendingUp, AlertCircle, Briefcase, Activity,
    ArrowLeft, IndianRupee
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import ClientEditButton from "./ClientEditButton";

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
        .select("id, status, start_date, end_date, itineraries(destination)")
        .eq("client_id", id)
        .order("start_date", { ascending: false });

    if (tripsError) {
        console.error("Trips fetch error:", tripsError);
    }

    // Helper to format currency
    const formatINR = (amount: number | null) => {
        if (amount == null) return "—";
        return "₹" + Math.round(amount).toLocaleString("en-IN");
    };

    // Helper for date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    };

    // Compute stats
    const totalTrips = trips?.length || 0;
    const completedTrips = trips?.filter(t => t.status === "completed").length || 0;
    const activeTrips = trips?.filter(t => t.status === "confirmed" || t.status === "in_progress").length || 0;

    // Get initials
    const initials = (profile.full_name || "?")
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();

    const stageColors: Record<string, string> = {
        lead: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        prospect: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
        proposal: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        payment_pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        payment_confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        review: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
        past: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    };

    const stageLabel: Record<string, string> = {
        lead: "🌱 Lead",
        prospect: "👀 Prospect",
        proposal: "📋 Proposal",
        payment_pending: "⏳ Payment Pending",
        payment_confirmed: "✅ Confirmed",
        active: "✈️ Active Trip",
        review: "⭐ Review",
        past: "🏁 Closed",
    };

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto">
            {/* Back navigation */}
            <div>
                <Link
                    href="/clients"
                    className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Clients
                </Link>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <span className="text-xl font-black text-white">{initials}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">
                                Client Profile
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50">
                                #{id.slice(0, 8)}
                            </span>
                        </div>
                        <h1 className="text-4xl font-serif text-secondary dark:text-white tracking-tight leading-none mb-3">
                            {profile.full_name || "Unknown Client"}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            {profile.email && (
                                <a
                                    href={`mailto:${profile.email}`}
                                    className="flex items-center gap-2 text-text-muted font-medium bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 hover:text-primary hover:border-primary/30 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{profile.email}</span>
                                </a>
                            )}
                            {profile.phone && (
                                <a
                                    href={`tel:${profile.phone}`}
                                    className="flex items-center gap-2 text-text-muted font-medium bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 hover:text-primary hover:border-primary/30 transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{profile.phone}</span>
                                </a>
                            )}
                            {profile.client_tag && profile.client_tag !== "standard" && (
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-widest",
                                    profile.client_tag === "vip"
                                        ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-500"
                                        : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-500"
                                )}>
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>{profile.client_tag}</span>
                                </div>
                            )}
                            {profile.lifecycle_stage && (
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-widest",
                                    stageColors[profile.lifecycle_stage] || stageColors.lead
                                )}>
                                    <Activity className="w-3.5 h-3.5" />
                                    <span>{stageLabel[profile.lifecycle_stage] || profile.lifecycle_stage}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Edit button — client component */}
                <div className="flex items-center gap-3">
                    <ClientEditButton client={{
                        id: profile.id,
                        full_name: profile.full_name,
                        email: profile.email,
                        phone: profile.phone,
                        preferred_destination: profile.preferred_destination,
                        travelers_count: profile.travelers_count,
                        budget_min: profile.budget_min,
                        budget_max: profile.budget_max,
                        travel_style: profile.travel_style,
                        interests: profile.interests,
                        home_airport: profile.home_airport,
                        notes: profile.notes,
                        lead_status: profile.lead_status,
                        client_tag: profile.client_tag,
                        lifecycle_stage: profile.lifecycle_stage,
                    }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 group hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Trips Booked</p>
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
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Completed</p>
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
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Active Now</p>
                            <p className="text-4xl font-black text-secondary dark:text-white tabular-nums tracking-tight">
                                {activeTrips}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-100/50 dark:bg-amber-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 group hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Est. LTV</p>
                            <p className="text-3xl font-black text-secondary dark:text-white tabular-nums tracking-tight">
                                {formatINR((totalTrips || 1) * (profile.budget_max || 85000))}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-violet-100/50 dark:bg-violet-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <IndianRupee className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Travel Preferences
                        </h2>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Preferred Destination</span>
                                <span className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    {profile.preferred_destination || "Not specified"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Group Size</span>
                                <span className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" />
                                    {profile.travelers_count ? `${profile.travelers_count} travellers` : "Not specified"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Budget Range</span>
                                <span className="text-sm font-bold text-secondary dark:text-white bg-gray-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 w-fit">
                                    {profile.budget_min || profile.budget_max
                                        ? `${formatINR(profile.budget_min)} – ${formatINR(profile.budget_max)}`
                                        : "Not specified"
                                    }
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Travel Style</span>
                                <span className="text-sm font-bold text-secondary dark:text-white">
                                    {profile.travel_style || "Not specified"}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 pb-4 border-b border-gray-100 dark:border-slate-800/80">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Home Airport</span>
                                <span className="text-sm font-bold text-secondary dark:text-white flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-primary" />
                                    {profile.home_airport || "Not specified"}
                                </span>
                            </div>

                            {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
                                <div className="pt-2">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-3">Interests</span>
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
                                Special Requirements
                            </h2>
                            <div className="space-y-4">
                                {Array.isArray(profile.dietary_requirements) && profile.dietary_requirements.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                                            <Utensils className="w-3.5 h-3.5 text-rose-400" />
                                            Dietary Requirements
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
                                            Accessibility Needs
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

                {/* Right Column: Trip History & Notes */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Notes
                        </h2>
                        {profile.notes ? (
                            <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-sm text-secondary dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                                    {profile.notes}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No notes recorded</p>
                                <p className="text-xs text-text-muted mt-1">Click "Edit Client" to add notes</p>
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Trip History
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-text-muted">
                                {trips?.length || 0} trips
                            </span>
                        </div>

                        <div className="space-y-3">
                            {trips && trips.length > 0 ? trips.map((trip) => {
                                const statusColors: Record<string, string> = {
                                    completed: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-500",
                                    confirmed: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-500",
                                    in_progress: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-500",
                                    cancelled: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-500",
                                    draft: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400"
                                };
                                const statusColor = statusColors[trip.status || "draft"] || statusColors.draft;

                                const tripDestination = (() => {
                                    const itin = (trip as any).itineraries;
                                    if (Array.isArray(itin)) return itin[0]?.destination || "Untitled Trip";
                                    return itin?.destination || "Untitled Trip";
                                })();

                                return (
                                    <Link key={trip.id} href={`/trips/${trip.id}`}>
                                        <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Plane className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-secondary dark:text-white group-hover:text-primary transition-colors">
                                                        {tripDestination}
                                                    </h3>
                                                    {(trip.start_date || trip.end_date) && (
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mt-0.5">
                                                            <CalendarDays className="w-3 h-3" />
                                                            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={cn("px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest self-start sm:self-auto shrink-0", statusColor)}>
                                                {trip.status?.replace("_", " ") || "Planning"}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <div className="text-center py-12 px-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
                                        <AlertCircle className="w-7 h-7 text-text-muted opacity-50" />
                                    </div>
                                    <p className="text-sm font-bold text-secondary dark:text-white mb-1">No trips yet</p>
                                    <p className="text-xs text-text-muted max-w-xs mx-auto">
                                        This client hasn't been assigned any trips. Head to the Trips page to create one.
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
