import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    Mail, Phone, MapPin, CalendarDays, BadgeCheck, Utensils,
    Accessibility, User, HeartPulse, FileText, Globe, Plane,
    Clock, Tag, Activity, ArrowLeft, IndianRupee,
    Languages, MessageCircle, Plus, TrendingUp, Eye,
    CheckCircle2, XCircle, Timer, AlertCircle, Send, Star,
    Home, Users, Target, Sparkles, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import ClientEditButton from "./ClientEditButton";

const formatINR = (n: number | null | undefined) => {
    if (!n) return "—";
    return "₹" + Math.round(n).toLocaleString("en-IN");
};

const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const timeAgo = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const ms = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(ms / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? "s" : ""} ago`;
};

const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
};

const STAGE_COLORS: Record<string, string> = {
    lead: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    prospect: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
    proposal: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    payment_pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    payment_confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    review: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    past: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
};

const STAGE_LABELS: Record<string, string> = {
    lead: "🌱 Lead",
    prospect: "👀 Prospect",
    proposal: "📋 Proposal",
    payment_pending: "⏳ Payment Pending",
    payment_confirmed: "✅ Confirmed",
    active: "✈️ Active Trip",
    review: "⭐ Review",
    past: "🏁 Closed",
};

const PROPOSAL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Eye }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700", icon: FileText },
    sent: { label: "Quote Sent", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800", icon: Send },
    viewed: { label: "Viewed 👀", color: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800", icon: Eye },
    commented: { label: "Gave Feedback 💬", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800", icon: MessageCircle },
    approved: { label: "Approved ✅", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800", icon: CheckCircle2 },
    rejected: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800", icon: XCircle },
    expired: { label: "Expired", color: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-gray-500 dark:border-slate-700", icon: Timer },
};

const TRIP_STATUS_COLORS: Record<string, string> = {
    completed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    in_progress: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    draft: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700",
};

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
        console.error("Profile fetch error:", error, id);
        notFound();
    }

    // Fetch trips
    const { data: trips } = await supabase
        .from("trips")
        .select("id, status, start_date, end_date, itineraries(destination)")
        .eq("client_id", id)
        .order("start_date", { ascending: false });

    // Fetch proposals (enquiry history)
    const { data: proposals } = await supabase
        .from("proposals")
        .select("id, title, status, total_price, created_at, viewed_at, approved_at, expires_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

    // Compute stats
    const totalTrips = trips?.length || 0;
    const completedTrips = trips?.filter(t => t.status === "completed").length || 0;
    const totalProposals = proposals?.length || 0;
    const wonProposals = proposals?.filter(p => p.status === "approved").length || 0;
    const winRate = totalProposals > 0 ? Math.round((wonProposals / totalProposals) * 100) : 0;
    const memberSinceDays = profile.created_at
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
        : 0;

    const language = (profile as any).language_preference || "English";
    const initials = getInitials(profile.full_name);

    const hasPreferences = profile.preferred_destination || profile.travelers_count ||
        profile.budget_min || profile.budget_max || profile.travel_style ||
        (profile.interests && profile.interests.length > 0) || profile.home_airport;

    const activeProposal = proposals?.find(p => ["sent", "viewed", "commented"].includes(p.status || ""));

    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto">

            {/* ── Back nav ── */}
            <Link
                href="/clients"
                className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Client Directory
            </Link>

            {/* ── Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 text-white text-xl font-black">
                        {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Client Profile</span>
                            <span className="text-[10px] text-text-muted font-bold opacity-50">#{id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-serif text-secondary dark:text-white tracking-tight leading-none mb-3 truncate">
                            {profile.full_name || "Unknown Client"}
                        </h1>

                        {/* Contact & meta chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            {profile.email && (
                                <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 text-xs font-medium text-text-muted bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700 hover:text-primary hover:border-primary/30 transition-colors">
                                    <Mail className="w-3 h-3" />
                                    {profile.email}
                                </a>
                            )}
                            {profile.phone && (
                                <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 text-xs font-medium text-text-muted bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700 hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                                    <Phone className="w-3 h-3" />
                                    {profile.phone}
                                </a>
                            )}
                            {/* Language badge */}
                            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <Languages className="w-3 h-3" />
                                {language}
                            </span>
                            {profile.lifecycle_stage && (
                                <span className={cn("flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", STAGE_COLORS[profile.lifecycle_stage] || STAGE_COLORS.lead)}>
                                    <Activity className="w-3 h-3" />
                                    {STAGE_LABELS[profile.lifecycle_stage] || profile.lifecycle_stage}
                                </span>
                            )}
                            {profile.client_tag && profile.client_tag !== "standard" && (
                                <span className={cn(
                                    "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                                    profile.client_tag === "vip"
                                        ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
                                        : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                )}>
                                    <Star className="w-3 h-3" />
                                    {profile.client_tag}
                                </span>
                            )}
                            {profile.referral_source && (
                                <span className="text-[10px] font-bold text-text-muted bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-gray-100 dark:border-slate-700">
                                    via {profile.referral_source}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {profile.phone && (
                        <a
                            href={`https://wa.me/${(profile.phone || "").replace(/\D/g, "")}?text=Hi ${encodeURIComponent(profile.full_name?.split(" ")[0] || "there")}!`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1eb857] transition-colors shadow-sm shadow-green-500/20"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                        </a>
                    )}
                    {profile.email && (
                        <a
                            href={`mailto:${profile.email}?subject=Your travel enquiry`}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                        </a>
                    )}
                    <Link
                        href="/proposals/create"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 text-xs font-bold hover:bg-violet-100 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Proposal
                    </Link>
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
                        language_preference: language,
                    }} />
                </div>
            </div>

            {/* ── Active Enquiry Banner ── */}
            {activeProposal && (
                <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-0.5">Active Enquiry</p>
                            <p className="text-sm font-bold text-secondary dark:text-white">
                                {activeProposal.title || "Quote in progress"}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                                Sent {timeAgo(activeProposal.created_at)}
                                {activeProposal.viewed_at && ` · Viewed ${timeAgo(activeProposal.viewed_at)}`}
                                {activeProposal.expires_at && ` · Expires ${formatDate(activeProposal.expires_at)}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", PROPOSAL_STATUS_CONFIG[activeProposal.status || "sent"]?.color)}>
                            {PROPOSAL_STATUS_CONFIG[activeProposal.status || "sent"]?.label}
                        </span>
                        <Link
                            href={`/proposals/${activeProposal.id}`}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-700 transition-colors px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800"
                        >
                            View <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                    </div>
                </div>
            )}

            {/* ── What They're Looking For ── */}
            {hasPreferences && (
                <GlassCard padding="none" className="border-gray-100 dark:border-slate-800 overflow-hidden">
                    <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-primary/5 to-transparent">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            What They're Looking For
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5 font-medium">Current travel interests and requirements</p>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {profile.preferred_destination && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5" /> Destination
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.preferred_destination}</span>
                                </div>
                            )}
                            {profile.travelers_count && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <Users className="w-2.5 h-2.5" /> Group Size
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.travelers_count} pax</span>
                                </div>
                            )}
                            {(profile.budget_min || profile.budget_max) && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <IndianRupee className="w-2.5 h-2.5" /> Budget Range
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">
                                        {formatINR(profile.budget_min)} – {formatINR(profile.budget_max)}
                                    </span>
                                </div>
                            )}
                            {profile.travel_style && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5" /> Travel Style
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.travel_style}</span>
                                </div>
                            )}
                            {profile.home_airport && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <Home className="w-2.5 h-2.5" /> Flying From
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.home_airport}</span>
                                </div>
                            )}
                        </div>
                        {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Interests</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.interests.map((interest: string) => (
                                        <span key={interest} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>
            )}

            {/* ── 4 Key Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Trips Booked",
                        value: totalTrips,
                        sub: `${completedTrips} completed`,
                        icon: Plane,
                        color: "text-blue-600 dark:text-blue-400",
                        bg: "bg-blue-50 dark:bg-blue-900/20",
                    },
                    {
                        label: "Proposals Sent",
                        value: totalProposals,
                        sub: `${wonProposals} approved`,
                        icon: Send,
                        color: "text-violet-600 dark:text-violet-400",
                        bg: "bg-violet-50 dark:bg-violet-900/20",
                    },
                    {
                        label: "Win Rate",
                        value: totalProposals > 0 ? `${winRate}%` : "—",
                        sub: totalProposals > 0 ? `of ${totalProposals} quotes` : "No quotes yet",
                        icon: TrendingUp,
                        color: winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                        bg: winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20",
                    },
                    {
                        label: "Est. LTV",
                        value: formatINR((totalTrips || 1) * (profile.budget_max || 85000)),
                        sub: memberSinceDays < 30 ? "New client" : `Client for ${Math.floor(memberSinceDays / 30)}mo`,
                        icon: IndianRupee,
                        color: "text-emerald-600 dark:text-emerald-400",
                        bg: "bg-emerald-50 dark:bg-emerald-900/20",
                    },
                ].map((stat) => (
                    <GlassCard key={stat.label} padding="lg" className="border-gray-100 dark:border-slate-800 group hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.18em] mb-1.5">{stat.label}</p>
                                <p className="text-3xl font-black text-secondary dark:text-white tabular-nums tracking-tight">{stat.value}</p>
                                <p className="text-[10px] text-text-muted font-medium mt-1">{stat.sub}</p>
                            </div>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0", stat.bg)}>
                                <stat.icon className={cn("w-4.5 h-4.5 w-5 h-5", stat.color)} />
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* ── Main 3-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT: Profile Details ── */}
                <div className="space-y-5">
                    {/* Preferences card */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            Client Details
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: "Language", value: language, icon: Languages },
                                { label: "Destination", value: profile.preferred_destination, icon: MapPin },
                                { label: "Group Size", value: profile.travelers_count ? `${profile.travelers_count} travellers` : null, icon: Users },
                                { label: "Budget", value: (profile.budget_min || profile.budget_max) ? `${formatINR(profile.budget_min)} – ${formatINR(profile.budget_max)}` : null, icon: IndianRupee },
                                { label: "Travel Style", value: profile.travel_style, icon: Star },
                                { label: "Flies From", value: profile.home_airport, icon: Globe },
                                { label: "Referred By", value: profile.referral_source, icon: Target },
                                { label: "Channel", value: profile.source_channel, icon: Activity },
                                {
                                    label: "Client Since",
                                    value: profile.created_at ? formatDate(profile.created_at) : null,
                                    icon: CalendarDays,
                                },
                            ].filter(item => item.value).map((item) => (
                                <div key={item.label} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 dark:border-slate-800/80 last:border-0">
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest shrink-0 pt-0.5">
                                        <item.icon className="w-2.5 h-2.5" />
                                        {item.label}
                                    </span>
                                    <span className="text-xs font-bold text-secondary dark:text-white text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Special Requirements */}
                    {((profile.dietary_requirements && Array.isArray(profile.dietary_requirements) && profile.dietary_requirements.length > 0) || profile.mobility_needs || profile.notes) && (
                        <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                            <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <HeartPulse className="w-3.5 h-3.5" />
                                Special Requirements
                            </h2>
                            <div className="space-y-4">
                                {Array.isArray(profile.dietary_requirements) && profile.dietary_requirements.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                                            <Utensils className="w-2.5 h-2.5 text-rose-400" />
                                            Dietary
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(profile.dietary_requirements as string[]).map((req: string) => (
                                                <span key={req} className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 rounded-md border border-rose-200 dark:border-rose-800">
                                                    {req}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile.mobility_needs && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                                            <Accessibility className="w-2.5 h-2.5 text-rose-400" />
                                            Accessibility
                                        </div>
                                        <p className="text-xs font-medium text-secondary dark:text-white leading-relaxed">{profile.mobility_needs}</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    )}

                    {/* Notes */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Agent Notes
                        </h2>
                        {profile.notes ? (
                            <div className="bg-amber-50/60 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-sm text-secondary dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                                    {profile.notes}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No notes yet</p>
                                <p className="text-[10px] text-text-muted mt-1">Click "Edit Client" to add notes</p>
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* ── RIGHT: History (2/3 width) ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Enquiry History */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <Send className="w-3.5 h-3.5" />
                                Enquiry History
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md text-text-muted">
                                    {totalProposals} proposal{totalProposals !== 1 ? "s" : ""}
                                </span>
                                {totalProposals > 0 && (
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                        {winRate}% win rate
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {proposals && proposals.length > 0 ? proposals.map((proposal) => {
                                const statusConf = PROPOSAL_STATUS_CONFIG[proposal.status || "draft"] || PROPOSAL_STATUS_CONFIG.draft;
                                const StatusIcon = statusConf.icon;
                                return (
                                    <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
                                        <div className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", statusConf.color.split(" ").slice(0, 2).join(" "))}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-secondary dark:text-white truncate group-hover:text-primary transition-colors">
                                                        {proposal.title || "Untitled Quote"}
                                                    </p>
                                                    <p className="text-[10px] text-text-muted font-medium">
                                                        {formatDate(proposal.created_at)}
                                                        {proposal.viewed_at && <span className="ml-1.5 text-violet-500">· Viewed {timeAgo(proposal.viewed_at)}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {proposal.total_price && (
                                                    <span className="text-xs font-black text-secondary dark:text-white tabular-nums">
                                                        {formatINR(proposal.total_price)}
                                                    </span>
                                                )}
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border whitespace-nowrap", statusConf.color)}>
                                                    {statusConf.label}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <div className="text-center py-10 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                    <Send className="w-8 h-8 text-text-muted opacity-30 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-secondary dark:text-white mb-1">No proposals yet</p>
                                    <p className="text-xs text-text-muted mb-3">Create your first quote for this client.</p>
                                    <Link
                                        href="/proposals/create"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Create Proposal
                                    </Link>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Trip History */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <Plane className="w-3.5 h-3.5" />
                                Trip History
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md text-text-muted">
                                {totalTrips} trip{totalTrips !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {trips && trips.length > 0 ? trips.map((trip) => {
                                const statusColor = TRIP_STATUS_COLORS[trip.status || "draft"] || TRIP_STATUS_COLORS.draft;
                                const tripDestination = (() => {
                                    const itin = (trip as any).itineraries;
                                    if (Array.isArray(itin)) return itin[0]?.destination || "Untitled Trip";
                                    return itin?.destination || "Untitled Trip";
                                })();
                                return (
                                    <Link key={trip.id} href={`/trips/${trip.id}`}>
                                        <div className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                                    <Plane className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-secondary dark:text-white truncate group-hover:text-primary transition-colors">
                                                        {tripDestination}
                                                    </p>
                                                    {(trip.start_date || trip.end_date) && (
                                                        <p className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                                                            <CalendarDays className="w-2.5 h-2.5" />
                                                            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shrink-0", statusColor)}>
                                                {trip.status?.replace("_", " ") || "Planning"}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <div className="text-center py-10 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                    <Plane className="w-8 h-8 text-text-muted opacity-30 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-secondary dark:text-white mb-1">No trips yet</p>
                                    <p className="text-xs text-text-muted">Once you book a trip, it will appear here.</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
