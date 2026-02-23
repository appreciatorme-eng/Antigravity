
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Car, Phone, Languages, User, Link2, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";

type AssignmentTrip = {
    start_date: string | null;
    itineraries?: {
        destination?: string | null;
    } | null;
} | null;

type DriverAssignment = {
    id: string;
    day_number: number | null;
    pickup_time: string | null;
    pickup_location: string | null;
    trip?: AssignmentTrip | AssignmentTrip[] | null;
};

export default async function DriverDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch External Driver Details
    const { data: driver } = await supabase
        .from("external_drivers")
        .select("*")
        .eq("id", id)
        .single();

    if (!driver) return notFound();

    // 2. Fetch Linked App Profile
    const { data: link } = await supabase
        .from("driver_accounts")
        .select(`
            is_active,
            profiles (
                id,
                email,
                full_name,
                phone,
                bio,
                driver_info,
                avatar_url
            )
        `)
        .eq("external_driver_id", id)
        .maybeSingle();

    // 3. Fetch Assigned Trips (via trip_driver_assignments)
    const { data: assignments } = await supabase
        .from("trip_driver_assignments")
        .select(`
            id,
            day_number,
            pickup_time,
            pickup_location,
            trip:trips (
                id,
                start_date,
                end_date,
                status,
                itineraries (
                    destination
                )
            )
        `)
        .eq("external_driver_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

    // Prepare helper data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = link?.profiles as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appDriverInfo = (profile?.driver_info as any) || {};

    const profileLanguages = appDriverInfo.languages || [];
    const externalLanguages = driver.languages || [];
    // Merge unique languages
    const allLanguages = Array.from(new Set([...externalLanguages, ...profileLanguages]));

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const normalizedAssignments = ((assignments || []) as DriverAssignment[]).map((assignment) => {
        const trip = Array.isArray(assignment.trip) ? assignment.trip[0] || null : assignment.trip || null;
        return { ...assignment, trip };
    });

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">DRIVER PROFILE</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">{driver.full_name}</h1>
                </div>
            </div>

            {/* Header / Main Card */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-white/60 dark:bg-white/10 rounded-full flex items-center justify-center border border-white/20 text-2xl font-medium text-secondary dark:text-white relative overflow-hidden">
                            {/* Use profile avatar if available, else initials */}
                            {profile?.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt={`${driver.full_name} avatar`}
                                    fill
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                driver.full_name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif text-secondary dark:text-white">{driver.full_name}</h2>
                            <div className="mt-2 text-sm text-text-secondary space-y-1">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    {driver.phone}
                                </div>
                                {link && profile && (
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <Link2 className="w-4 h-4" />
                                        Linked App User: {profile.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                        <GlassBadge variant={driver.is_active ? "success" : "default"}>
                            {driver.is_active ? "Active Status" : "Inactive"}
                        </GlassBadge>

                        {appDriverInfo?.license_number && (
                            <GlassBadge variant="info" icon={ShieldCheck}>
                                Lic: {appDriverInfo.license_number}
                            </GlassBadge>
                        )}
                    </div>
                </div>

                {/* Bio Section (from App Profile) */}
                {profile?.bio && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                        <h3 className="text-sm font-semibold text-secondary dark:text-white mb-2">Driver Bio</h3>
                        <p className="text-sm text-text-secondary italic">{profile.bio}</p>
                    </div>
                )}
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Vehicle & Detailed Info */}
                <div className="space-y-8">
                    <GlassCard padding="lg" rounded="2xl">
                        <h2 className="text-lg font-serif text-secondary dark:text-white mb-4 flex items-center gap-2">
                            <Car className="w-5 h-5 text-primary" />
                            Vehicle Information
                        </h2>

                        <div className="space-y-4">
                            {/* Primary Vehicle (External Driver Data) */}
                            <div className="bg-white/40 dark:bg-white/5 p-4 rounded-lg border border-white/20">
                                <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wider">Primary Vehicle</div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="block text-gray-500 text-xs">Type</span>
                                        <span className="font-medium capitalize text-secondary dark:text-white">{driver.vehicle_type || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs">Plate</span>
                                        <span className="font-medium uppercase text-secondary dark:text-white">{driver.vehicle_plate || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs">Capacity</span>
                                        <span className="font-medium text-secondary dark:text-white">{driver.vehicle_capacity} Passengers</span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info from App Profile */}
                            {appDriverInfo?.vehicle_details && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wider">App Profile Details</div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="block text-blue-400 text-xs">Make/Model</span>
                                            <span className="font-medium text-blue-900 dark:text-blue-300">
                                                {appDriverInfo.vehicle_details.make} {appDriverInfo.vehicle_details.model}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-blue-400 text-xs">Year</span>
                                            <span className="font-medium text-blue-900 dark:text-blue-300">
                                                {appDriverInfo.vehicle_details.year}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Languages */}
                            <div>
                                <h3 className="text-sm font-medium text-secondary dark:text-white mb-2 flex items-center gap-2">
                                    <Languages className="w-4 h-4 text-primary" />
                                    Languages Spoken
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {allLanguages.map((lang: string) => (
                                        <GlassBadge key={lang} variant="primary">
                                            {lang}
                                        </GlassBadge>
                                    ))}
                                    {allLanguages.length === 0 && <span className="text-sm text-gray-400">No languages listed</span>}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: Assignments */}
                <div className="space-y-8">
                    <GlassCard padding="lg" rounded="2xl">
                        <h2 className="text-lg font-serif text-secondary dark:text-white mb-4 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            Recent Assignments
                        </h2>

                        <div className="space-y-3">
                            {normalizedAssignments.length > 0 ? normalizedAssignments.map((assignment) => (
                                <div key={assignment.id} className="p-3 bg-white/40 dark:bg-white/5 rounded-lg border border-white/20">
                                    <div className="text-sm font-semibold text-secondary dark:text-white">{assignment.trip?.itineraries?.destination || "Unknown Trip"}</div>
                                    <div className="text-xs text-text-secondary mt-1 flex justify-between">
                                        <span>
                                            {formatDate(assignment.trip?.start_date)}
                                        </span>
                                        <GlassBadge variant="primary" size="sm">
                                            Day {assignment.day_number}
                                        </GlassBadge>
                                    </div>
                                    {(assignment.pickup_location || assignment.pickup_time) && (
                                        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-500 flex items-center gap-2">
                                            <MapPin className="w-3 h-3" />
                                            {assignment.pickup_time ? `${assignment.pickup_time} - ` : ""}
                                            {assignment.pickup_location || "No location specified"}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-8 text-text-secondary text-sm italic">
                                    No trip assignments found.
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
