
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Mail, Phone, MapPin, CalendarDays, BadgeCheck, Utensils, Accessibility, User, HeartPulse, FileText } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";

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
        if (amount == null) return "N/A";
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

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">CLIENT PROFILE</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">{profile.full_name || "Unnamed Client"}</h1>
                </div>
            </div>

            {/* Header Card */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-serif text-secondary dark:text-white">{profile.full_name || "Unnamed Client"}</h2>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-secondary">
                            {profile.email && (
                                <span className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {profile.email}
                                </span>
                            )}
                            {profile.phone && (
                                <span className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {profile.phone}
                                </span>
                            )}
                            {profile.phone_whatsapp && (
                                <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <Phone className="w-4 h-4" />
                                    WhatsApp: {profile.phone_whatsapp}
                                </span>
                            )}
                        </div>
                        {profile.bio && (
                            <p className="mt-4 text-sm text-text-secondary italic border-l-2 border-primary pl-3">
                                {profile.bio}
                            </p>
                        )}
                    </div>
                    {/* Tags / Badges */}
                    <div className="flex flex-col items-end gap-2">
                        {profile.lifecycle_stage && (
                            <GlassBadge variant="primary" icon={BadgeCheck}>
                                {profile.lifecycle_stage.replace('_', ' ')}
                            </GlassBadge>
                        )}
                        {clientInfo.loyalty_tier && (
                            <GlassBadge variant="warning">
                                {clientInfo.loyalty_tier} Tier
                            </GlassBadge>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Column: Preferences & Needs */}
                <div className="space-y-8">
                    <GlassCard padding="lg" rounded="2xl">
                        <h2 className="text-lg font-serif text-secondary dark:text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Travel Preferences
                        </h2>
                        <div className="grid gap-3 text-sm text-text-secondary">
                            <div className="flex items-center justify-between border-b border-white/10 dark:border-white/5 pb-2">
                                <span>Preferred Destination</span>
                                <span className="font-medium text-secondary dark:text-white">{profile.preferred_destination || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/10 dark:border-white/5 pb-2">
                                <span>Travelers Count</span>
                                <span className="font-medium text-secondary dark:text-white">{profile.travelers_count || 1}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/10 dark:border-white/5 pb-2">
                                <span>Budget Range</span>
                                <span className="font-medium text-secondary dark:text-white">{formatCurrency(profile.budget_min)} - {formatCurrency(profile.budget_max)}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/10 dark:border-white/5 pb-2">
                                <span>Travel Style</span>
                                <span className="font-medium text-secondary dark:text-white">{profile.travel_style || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/10 dark:border-white/5 pb-2">
                                <span>Home Airport</span>
                                <span className="font-medium text-secondary dark:text-white">{profile.home_airport || "—"}</span>
                            </div>

                            <div className="mt-2">
                                <span className="block mb-2 text-xs uppercase tracking-widest text-primary font-bold">Interests</span>
                                <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(profile.interests) ? profile.interests : []).map((interest: string) => (
                                        <GlassBadge key={interest} variant="success">
                                            {interest}
                                        </GlassBadge>
                                    ))}
                                    {(!profile.interests || profile.interests.length === 0) && (
                                        <span className="text-xs text-gray-400">No interests selected</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* NEW: Health & Dietary Requirements */}
                    {(Array.isArray(profile.dietary_requirements) && profile.dietary_requirements.length > 0 || profile.mobility_needs) ? (
                        <GlassCard padding="lg" rounded="2xl">
                            <h2 className="text-lg font-serif text-secondary dark:text-white mb-4 flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-rose-400" />
                                Health & Accessibility
                            </h2>
                            <div className="space-y-4">
                                {Array.isArray(profile.dietary_requirements) && profile.dietary_requirements.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-secondary dark:text-white mb-2">
                                            <Utensils className="w-4 h-4 text-primary" />
                                            Dietary Requirements
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(profile.dietary_requirements as string[]).map((req: string) => (
                                                <GlassBadge key={req} variant="danger">
                                                    {req}
                                                </GlassBadge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profile.mobility_needs && (
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-secondary dark:text-white mb-2">
                                            <Accessibility className="w-4 h-4 text-primary" />
                                            Mobility Needs
                                        </div>
                                        <p className="text-sm text-text-secondary bg-white/40 dark:bg-white/5 p-3 rounded-lg border border-white/20">
                                            {profile.mobility_needs}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    ) : null}
                </div>

                {/* Right Column: Trips & History */}
                <div className="space-y-8">
                    <GlassCard padding="lg" rounded="2xl" blur="md" opacity="medium">
                        <h2 className="text-lg font-serif text-secondary dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Notes & Preferences
                        </h2>
                        {profile.notes ? (
                            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                                {profile.notes}
                            </p>
                        ) : (
                            <p className="text-sm text-text-secondary italic">
                                No notes recorded.
                            </p>
                        )}
                    </GlassCard>

                    <GlassCard padding="lg" rounded="2xl">
                        <h2 className="text-lg font-serif text-secondary dark:text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            Trip History
                        </h2>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {trips && trips.length > 0 ? trips.map((trip) => (
                                <div key={trip.id} className="flex items-center justify-between rounded-lg border border-white/20 bg-white/40 dark:bg-white/5 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-secondary dark:text-white">
                                            {(() => {
                                                const itin = (trip as any).itineraries || (trip as any).itinerary;
                                                if (Array.isArray(itin)) return itin[0]?.destination || "Custom Trip";
                                                return itin?.destination || "Custom Trip";
                                            })()}
                                        </p>
                                        <p className="text-xs text-text-secondary flex items-center gap-2 mt-1">
                                            <CalendarDays className="w-3 h-3" />
                                            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                        <GlassBadge
                                            variant={
                                                trip.status === 'completed' ? 'default' :
                                                    trip.status === 'confirmed' ? 'success' :
                                                        'warning'
                                            }
                                        >
                                            {trip.status || 'Planned'}
                                        </GlassBadge>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-text-secondary text-sm italic">
                                    No trips recorded for this client.
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
