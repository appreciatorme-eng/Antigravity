import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
    Mail, Phone, MapPin, CalendarDays, Utensils,
    Accessibility, User, HeartPulse, FileText, Globe, Plane,
    Activity as ActivityIcon, ArrowLeft, IndianRupee,
    Languages, MessageCircle, Plus,
    AlertCircle, Send, Star,
    Home, Users, Target, Sparkles, ExternalLink, Clock,
    Percent
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";
import ClientEditButton from "./ClientEditButton";
import {
    CLIENT_PROFILE_SELECT,
    deriveClientDashboardState,
    formatDate,
    formatINR,
    getDaysSince,
    type ClientProfile,
    type ItineraryMeta,
    type ProposalRow,
    PROPOSAL_STATUS_CONFIG,
    STAGE_COLORS,
    STAGE_LABELS,
    timeAgo,
    TRIP_STATUS_COLORS,
    type TripRow,
} from "./client-profile-shared";
import { logError } from "@/lib/observability/logger";

// ─── Page ────────────────────────────────────────────────────────────────────
function isAdminRole(role: string | null | undefined): role is "admin" | "super_admin" {
    return role === "admin" || role === "super_admin";
}

export async function renderClientProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) notFound();

    const { data: viewerProfile, error: viewerProfileError } = await supabase
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .maybeSingle();
    if (viewerProfileError || !viewerProfile || !isAdminRole(viewerProfile.role)) {
        notFound();
    }

    const isSuperAdmin = viewerProfile.role === "super_admin";
    const organizationId = viewerProfile.organization_id;
    if (!isSuperAdmin && !organizationId) {
        notFound();
    }

    let profileQuery = supabase
        .from("profiles")
        .select(CLIENT_PROFILE_SELECT)
        .eq("id", id);
    if (!isSuperAdmin) {
        profileQuery = profileQuery.eq("organization_id", organizationId!);
    }

    const { data: profileData, error: profileError } = await profileQuery.maybeSingle();
    if (profileError || !profileData) {
        notFound();
    }
    const profile = profileData as unknown as ClientProfile;

    // ─── Fetch trips (partial failure OK) ─────────────────────────────────────
    let trips: TripRow[] = [];
    try {
        let tripsQuery = supabase
            .from("trips")
            .select("id, status, start_date, end_date, itinerary_id, created_at")
            .eq("client_id", id)
            .order("created_at", { ascending: false });
        if (!isSuperAdmin) {
            tripsQuery = tripsQuery.eq("organization_id", organizationId!);
        }
        const { data, error } = await tripsQuery;
        if (!error && data) trips = data;
    } catch (err) {
        logError("Trips fetch failed", err);
    }

    // ─── Fetch itineraries linked to trips ────────────────────────────────────
    let itineraryMap: Record<string, ItineraryMeta> = {};
    try {
        const tripItineraryIds = trips
            .map(t => t.itinerary_id)
            .filter((value): value is string => Boolean(value));

        if (tripItineraryIds.length > 0) {
            const { data } = await supabase
                .from("itineraries")
                .select("id, destination, trip_title, duration_days")
                .in("id", tripItineraryIds);
            if (data) {
                itineraryMap = Object.fromEntries(
                    data.map((itinerary) => [itinerary.id, itinerary as ItineraryMeta])
                );
            }
        }
    } catch (err) {
        logError("Itineraries fetch failed", err);
    }

    // ─── Fetch proposals (partial failure OK) ─────────────────────────────────
    let proposals: ProposalRow[] = [];
    try {
        let proposalsQuery = supabase
            .from("proposals")
            .select("id, title, status, total_price, created_at, viewed_at, approved_at, expires_at")
            .eq("client_id", id)
            .order("created_at", { ascending: false })
            .limit(15);
        if (!isSuperAdmin) {
            proposalsQuery = proposalsQuery.eq("organization_id", organizationId!);
        }
        const { data, error } = await proposalsQuery;
        if (!error && data) proposals = data;
    } catch (err) {
        logError("Proposals fetch failed", err);
    }

    // ─── Derived stats ───────────────────────────────────────────────────────
    const {
        activeProposal,
        activeTrips,
        completedTrips,
        hasPreferences,
        initials,
        language,
        lastContactDate,
        memberSinceDays,
        openProposals,
        rejectedProposals,
        tagConf,
        totalProposals,
        totalRevenue,
        totalTrips,
        urgentProposal,
        winRate,
        wonProposals,
    } = deriveClientDashboardState(profile, trips, proposals);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 pb-24 max-w-7xl mx-auto">

            {/* ── Back nav ── */}
            <Link
                href="/clients"
                className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                Client Directory
            </Link>

            {/* ── Header card ── */}
            <GlassCard padding="none" className="overflow-hidden border-gray-100 dark:border-slate-800">
                {/* Top accent stripe */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-violet-500 to-teal-500" />

                <div className="p-6 flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Avatar + name */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 text-white text-xl font-black">
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Client Profile</span>
                                <span className="text-[10px] text-text-muted font-bold opacity-40">#{id.slice(0, 8)}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-serif text-secondary dark:text-white tracking-tight leading-none mb-3 truncate">
                                {profile.full_name ?? "Unknown Client"}
                            </h1>

                            {/* Chips row */}
                            <div className="flex flex-wrap items-center gap-2">
                                {profile.email && (
                                    <a
                                        href={`mailto:${profile.email}`}
                                        className="flex items-center gap-1.5 text-xs font-medium text-text-muted bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700 hover:text-primary hover:border-primary/30 transition-colors"
                                    >
                                        <Mail className="w-3 h-3" /> {profile.email}
                                    </a>
                                )}
                                {profile.phone && (
                                    <a
                                        href={`tel:${profile.phone}`}
                                        className="flex items-center gap-1.5 text-xs font-medium text-text-muted bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
                                    >
                                        <Phone className="w-3 h-3" /> {profile.phone}
                                    </a>
                                )}
                                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                    <Languages className="w-3 h-3" /> {language}
                                </span>
                                {profile.lifecycle_stage && (
                                    <span className={cn("flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", STAGE_COLORS[profile.lifecycle_stage] ?? STAGE_COLORS.lead)}>
                                        <ActivityIcon className="w-3 h-3" />
                                        {STAGE_LABELS[profile.lifecycle_stage] ?? profile.lifecycle_stage}
                                    </span>
                                )}
                                {tagConf && (
                                    <span className={cn("flex items-center gap-1 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", tagConf.color)}>
                                        {tagConf.label}
                                    </span>
                                )}
                                {profile.referral_source && (
                                    <span className="text-[10px] font-bold text-text-muted bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-gray-100 dark:border-slate-700">
                                        via {profile.referral_source}
                                    </span>
                                )}
                                <span className="text-[10px] font-bold text-text-muted bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-gray-100 dark:border-slate-700 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    Last contact: {timeAgo(lastContactDate)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {profile.phone && (
                            <a
                                href={`https://wa.me/${(profile.phone ?? "").replace(/\D/g, "")}?text=Hi ${encodeURIComponent(profile.full_name?.split(" ")[0] ?? "there")}!`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1eb857] transition-colors shadow-sm shadow-green-500/20"
                            >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                        )}
                        {profile.email && (
                            <a
                                href={`mailto:${profile.email}?subject=Your travel enquiry`}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors"
                            >
                                <Mail className="w-3.5 h-3.5" /> Email
                            </a>
                        )}
                        <Link
                            href="/proposals/create"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 text-xs font-bold hover:bg-violet-100 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> New Proposal
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
                            interests: profile.interests as string[] | null,
                            home_airport: profile.home_airport,
                            notes: profile.notes,
                            lead_status: profile.lead_status,
                            client_tag: profile.client_tag,
                            lifecycle_stage: profile.lifecycle_stage,
                            language_preference: language,
                        }} />
                    </div>
                </div>
            </GlassCard>

            {/* ── Follow-up Alert ── */}
            {urgentProposal && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-800/50 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">⚠️ Follow-up Needed</p>
                            <p className="text-sm font-bold text-secondary dark:text-white">
                                &ldquo;{urgentProposal.title ?? "Quote"}&rdquo; sent {timeAgo(urgentProposal.created_at)} — no response yet
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {profile.phone && (
                            <a
                                href={`https://wa.me/${(profile.phone ?? "").replace(/\D/g, "")}?text=Hi ${encodeURIComponent(profile.full_name?.split(" ")[0] ?? "there")}, just checking if you had a chance to look at the quote I sent!`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1eb857] transition-colors"
                            >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                        )}
                        {profile.email && (
                            <a
                                href={`mailto:${profile.email}?subject=Re: ${encodeURIComponent(urgentProposal.title ?? "Your travel quote")}&body=Hi ${encodeURIComponent(profile.full_name?.split(" ")[0] ?? "there")},%0A%0AJust checking if you had a chance to look at the quote I sent. Let me know if you have any questions!`}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                <Mail className="w-3 h-3" /> Email
                            </a>
                        )}
                        {!profile.phone && !profile.email && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <AlertCircle className="w-3 h-3" /> No contact info — add phone or email
                            </span>
                        )}
                        <Link
                            href={`/proposals/${urgentProposal.id}`}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800"
                        >
                            View Quote <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                    </div>
                </div>
            )}

            {/* ── Active Enquiry Banner ── */}
            {activeProposal && !urgentProposal && (
                <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                            <Target className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Active Enquiry</p>
                            <p className="text-sm font-bold text-secondary dark:text-white">
                                {activeProposal.title ?? "Quote in progress"}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                                Sent {timeAgo(activeProposal.created_at)}
                                {activeProposal.viewed_at && ` · Viewed ${timeAgo(activeProposal.viewed_at)}`}
                                {activeProposal.expires_at && ` · Expires ${formatDate(activeProposal.expires_at)}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", PROPOSAL_STATUS_CONFIG[activeProposal.status ?? "sent"]?.color)}>
                            {PROPOSAL_STATUS_CONFIG[activeProposal.status ?? "sent"]?.label}
                        </span>
                        <Link
                            href={`/proposals/${activeProposal.id}`}
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-700 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800"
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
                            <Sparkles className="w-3.5 h-3.5" /> What They&apos;re Looking For
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5 font-medium">Current travel interests & requirements</p>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {profile.preferred_destination && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5 text-rose-400" /> Destination
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.preferred_destination}</span>
                                </div>
                            )}
                            {profile.travelers_count && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <Users className="w-2.5 h-2.5 text-blue-400" /> Group Size
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.travelers_count} pax</span>
                                </div>
                            )}
                            {(profile.budget_min || profile.budget_max) && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <IndianRupee className="w-2.5 h-2.5 text-emerald-400" /> Budget
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">
                                        {formatINR(profile.budget_min)} – {formatINR(profile.budget_max)}
                                    </span>
                                </div>
                            )}
                            {profile.travel_style && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 text-amber-400" /> Travel Style
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.travel_style}</span>
                                </div>
                            )}
                            {profile.home_airport && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <Home className="w-2.5 h-2.5 text-violet-400" /> Flying From
                                    </span>
                                    <span className="text-sm font-bold text-secondary dark:text-white">{profile.home_airport}</span>
                                </div>
                            )}
                        </div>
                        {profile.interests && Array.isArray(profile.interests) && (profile.interests as string[]).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">Interests</span>
                                <div className="flex flex-wrap gap-2">
                                    {(profile.interests as string[]).map((interest: string) => (
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

            {/* ── 5 Key Stats (drill-through) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                    {
                        label: "Trips Taken",
                        value: totalTrips,
                        sub: completedTrips > 0 ? `${completedTrips} completed` : activeTrips > 0 ? `${activeTrips} active now` : "None yet",
                        icon: Plane,
                        color: "text-blue-600 dark:text-blue-400",
                        bg: "bg-blue-50 dark:bg-blue-900/20",
                        href: "#trip-history",
                    },
                    {
                        label: "Quotes Sent",
                        value: totalProposals,
                        sub: openProposals > 0 ? `${openProposals} open` : `${wonProposals} won`,
                        icon: Send,
                        color: "text-violet-600 dark:text-violet-400",
                        bg: "bg-violet-50 dark:bg-violet-900/20",
                        href: "#enquiry-history",
                    },
                    {
                        label: "Win Rate",
                        value: totalProposals > 0 ? `${winRate}%` : "—",
                        sub: totalProposals > 0
                            ? `${wonProposals} won · ${rejectedProposals} lost`
                            : "No quotes yet",
                        icon: Percent,
                        color: winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                        bg: winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20",
                        href: "#enquiry-history",
                    },
                    {
                        label: "Total Revenue",
                        value: totalRevenue > 0 ? formatINR(totalRevenue) : "—",
                        sub: totalRevenue > 0 ? `from ${wonProposals} booking${wonProposals !== 1 ? "s" : ""}` : "No bookings yet",
                        icon: IndianRupee,
                        color: "text-emerald-600 dark:text-emerald-400",
                        bg: "bg-emerald-50 dark:bg-emerald-900/20",
                        href: "#enquiry-history",
                    },
                    {
                        label: "Client Since",
                        value: memberSinceDays < 30 ? `${memberSinceDays}d` : memberSinceDays < 365 ? `${Math.floor(memberSinceDays / 30)}mo` : `${Math.floor(memberSinceDays / 365)}yr`,
                        sub: formatDate(profile.created_at),
                        icon: CalendarDays,
                        color: "text-slate-600 dark:text-slate-400",
                        bg: "bg-slate-50 dark:bg-slate-800",
                        href: "#client-details",
                    },
                ].map((stat) => (
                    <a
                        key={stat.label}
                        href={stat.href}
                        className="no-underline block group"
                    >
                        <GlassCard padding="lg" hoverEffect className="border-gray-100 dark:border-slate-800 hover:shadow-md hover:border-primary/20 transition-all h-full">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-1.5 leading-tight">{stat.label}</p>
                                    <p className="text-2xl font-black text-secondary dark:text-white tabular-nums tracking-tight truncate">{stat.value}</p>
                                    <p className="text-[10px] text-text-muted font-medium mt-1 truncate">{stat.sub}</p>
                                </div>
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0", stat.bg)}>
                                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                                </div>
                            </div>
                        </GlassCard>
                    </a>
                ))}
            </div>

            {/* ── Main 3-column layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT col: Profile details ── */}
                <div className="space-y-5">

                    {/* Client details */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 scroll-mt-6" id="client-details">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Client Details
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
                                { label: "Channel", value: profile.source_channel, icon: ActivityIcon },
                                { label: "Client Since", value: profile.created_at ? formatDate(profile.created_at) : null, icon: CalendarDays },
                            ].filter(item => item.value).map((item) => (
                                <div key={item.label} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 dark:border-slate-800/80 last:border-0">
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest shrink-0 pt-0.5">
                                        <item.icon className="w-2.5 h-2.5" />
                                        {item.label}
                                    </span>
                                    <span className="text-xs font-bold text-secondary dark:text-white text-right">{String(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Special Requirements */}
                    {((profile.dietary_requirements && Array.isArray(profile.dietary_requirements) && (profile.dietary_requirements as string[]).length > 0) || profile.mobility_needs) && (
                        <GlassCard padding="lg" className="border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10">
                            <h2 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <HeartPulse className="w-3.5 h-3.5" /> Special Requirements
                            </h2>
                            <div className="space-y-4">
                                {Array.isArray(profile.dietary_requirements) && (profile.dietary_requirements as string[]).length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                                            <Utensils className="w-2.5 h-2.5 text-rose-400" /> Dietary
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(profile.dietary_requirements as string[]).map((req) => (
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
                                            <Accessibility className="w-2.5 h-2.5 text-rose-400" /> Accessibility
                                        </div>
                                        <p className="text-xs font-medium text-secondary dark:text-white leading-relaxed">{String(profile.mobility_needs)}</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    )}

                    {/* Agent Notes */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800">
                        <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Agent Notes
                        </h2>
                        {profile.notes ? (
                            <div className="bg-amber-50/60 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-sm text-secondary dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                                    {String(profile.notes)}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No notes yet</p>
                                <p className="text-[10px] text-text-muted mt-1">Click &ldquo;Edit Client&rdquo; to add notes</p>
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* ── RIGHT col (2/3): History ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── ENQUIRY HISTORY ── */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 scroll-mt-6" id="enquiry-history">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-0.5">
                                    <Send className="w-3.5 h-3.5" /> Enquiry History
                                </h2>
                                <p className="text-[10px] text-text-muted font-medium">All quotes sent to this client and where they left off</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md text-text-muted">
                                    {totalProposals} quote{totalProposals !== 1 ? "s" : ""}
                                </span>
                                {totalProposals > 0 && (
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border",
                                        winRate >= 50
                                            ? "bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                                            : "bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                                    )}>
                                        {winRate}% win rate
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {proposals && proposals.length > 0 ? proposals.map((proposal) => {
                                const statusConf = PROPOSAL_STATUS_CONFIG[proposal.status ?? "draft"] ?? PROPOSAL_STATUS_CONFIG.draft;
                                const StatusIcon = statusConf.icon;
                                const daysSinceSent = getDaysSince(proposal.created_at);
                                const isStale = ["sent", "viewed"].includes(proposal.status ?? "") && daysSinceSent >= 3;

                                return (
                                    <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
                                        <div className={cn(
                                            "group flex items-center justify-between gap-3 p-3.5 rounded-xl border bg-white dark:bg-slate-900/50 hover:shadow-md transition-all duration-200",
                                            isStale
                                                ? "border-rose-200 dark:border-rose-800/50 hover:border-rose-300"
                                                : "border-gray-100 dark:border-slate-800 hover:border-primary/20"
                                        )}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", statusConf.color.split(" ").slice(0, 2).join(" "))}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-secondary dark:text-white truncate group-hover:text-primary transition-colors">
                                                            {proposal.title ?? "Untitled Quote"}
                                                        </p>
                                                        {isStale && (
                                                            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                                                Follow up
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-text-muted font-medium mt-0.5">
                                                        Sent {formatDate(proposal.created_at)}
                                                        {proposal.viewed_at && <span className="ml-1.5 text-violet-500">· Viewed {timeAgo(proposal.viewed_at)}</span>}
                                                        {proposal.approved_at && <span className="ml-1.5 text-emerald-600">· Approved {timeAgo(proposal.approved_at)}</span>}
                                                    </p>
                                                    <p className="text-[10px] text-text-muted/60 italic mt-0.5">{statusConf.hint}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {proposal.total_price !== null && proposal.total_price !== undefined && (
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
                                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                    <Send className="w-8 h-8 text-text-muted opacity-30 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-secondary dark:text-white mb-1">No quotes sent yet</p>
                                    <p className="text-xs text-text-muted mb-4">Create a proposal and it will appear here, along with whether they viewed it, gave feedback, or approved it.</p>
                                    <Link
                                        href="/proposals/create"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Create First Proposal
                                    </Link>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* ── TRIP HISTORY ── */}
                    <GlassCard padding="lg" className="border-gray-100 dark:border-slate-800 scroll-mt-6" id="trip-history">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-0.5">
                                    <Plane className="w-3.5 h-3.5" /> Trip History
                                </h2>
                                <p className="text-[10px] text-text-muted font-medium">All trips this client has taken with you</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-md text-text-muted">
                                {totalTrips} trip{totalTrips !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {trips && trips.length > 0 ? trips.map((trip) => {
                                const statusConf = TRIP_STATUS_COLORS[(trip.status ?? "draft")] ?? TRIP_STATUS_COLORS.draft;
                                const itin = trip.itinerary_id ? itineraryMap[trip.itinerary_id] : undefined;
                                const tripTitle = itin?.trip_title ?? itin?.destination ?? "Untitled Trip";
                                const tripDestination = itin?.destination ?? null;

                                return (
                                    <Link key={trip.id} href={`/trips/${trip.id}`}>
                                        <div className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 flex items-center justify-center shrink-0">
                                                    <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-secondary dark:text-white truncate group-hover:text-primary transition-colors">
                                                        {tripTitle}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                        {tripDestination && (
                                                            <span className="text-[10px] text-text-muted font-medium flex items-center gap-0.5">
                                                                <MapPin className="w-2.5 h-2.5" /> {tripDestination}
                                                            </span>
                                                        )}
                                                        {itin?.duration_days && (
                                                            <span className="text-[10px] text-text-muted font-medium flex items-center gap-0.5">
                                                                <CalendarDays className="w-2.5 h-2.5" /> {itin.duration_days} days
                                                            </span>
                                                        )}
                                                        {(trip.start_date || trip.end_date) && (
                                                            <span className="text-[10px] text-text-muted font-medium">
                                                                {formatDate(trip.start_date)}{trip.end_date && ` – ${formatDate(trip.end_date)}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shrink-0", statusConf.badge)}>
                                                {statusConf.label}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            }) : (
                                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                                    <Plane className="w-8 h-8 text-text-muted opacity-30 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-secondary dark:text-white mb-1">No trips yet</p>
                                    <p className="text-xs text-text-muted">Once you confirm a booking and create a trip for this client, it will appear here with full details.</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                </div>
            </div>
        </div>
    );
}
