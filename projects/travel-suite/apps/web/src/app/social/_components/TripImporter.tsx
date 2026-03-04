"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    MapPin,
    Calendar,
    User,
    ArrowRight,
    Plane,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

/* ---------- Types ---------- */

interface TripListItem {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    destination: string;
    profiles: {
        full_name: string | null;
        email: string | null;
    } | null;
    itineraries: {
        id: string | null;
        trip_title: string | null;
        duration_days: number | null;
        destination: string | null;
    } | null;
}

export interface TripImportData {
    destination?: string;
    price?: string;
    season?: string;
    heroImage?: string;
    services?: string[];
    bulletPoints?: string[];
}

interface Props {
    onImport: (data: TripImportData) => void;
}

/* ---------- Helpers ---------- */

function getSeason(dateStr: string): string {
    const month = new Date(dateStr).getMonth();
    const year = new Date(dateStr).getFullYear();
    if (month >= 2 && month <= 5) return `Summer ${year}`;
    if (month >= 6 && month <= 8) return `Monsoon ${year}`;
    if (month >= 9 && month <= 10) return `Autumn ${year}`;
    return `Winter ${year}`;
}

function formatDateRange(start: string | null, end: string | null): string {
    if (!start) return "Dates TBD";
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    const startFormatted = new Date(start).toLocaleDateString("en-IN", opts);
    if (!end) return startFormatted;
    const endFormatted = new Date(end).toLocaleDateString("en-IN", opts);
    return `${startFormatted} - ${endFormatted}`;
}

function formatPrice(amount: number): string {
    return `\u20B9${amount.toLocaleString("en-IN")}`;
}

const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

/* ---------- Component ---------- */

export function TripImporter({ onImport }: Props) {
    const [trips, setTrips] = useState<TripListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

    const fetchTrips = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const resp = await fetch("/api/trips", {
                headers: {
                    ...(session?.access_token
                        ? { Authorization: `Bearer ${session.access_token}` }
                        : {}),
                },
            });

            if (!resp.ok) {
                throw new Error("Failed to fetch trips");
            }

            const data = await resp.json();
            setTrips(data.trips ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error loading trips");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    /* Filter + sort: search by destination/title/client name, sort by start_date desc, limit 20 */
    const filtered = trips
        .filter((trip) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            const destination = (trip.itineraries?.destination ?? trip.destination ?? "").toLowerCase();
            const title = (trip.itineraries?.trip_title ?? "").toLowerCase();
            const client = (trip.profiles?.full_name ?? "").toLowerCase();
            return destination.includes(q) || title.includes(q) || client.includes(q);
        })
        .sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, 20);

    /* Import handler: fetch tour_template data for the selected trip */
    const handleImport = useCallback(
        async (trip: TripListItem) => {
            setImporting(true);
            setSelectedTripId(trip.id);

            try {
                const importData: TripImportData = {};

                // Destination from itinerary title or destination field
                const itineraryTitle = trip.itineraries?.trip_title;
                const itineraryDestination = trip.itineraries?.destination;
                const durationDays = trip.itineraries?.duration_days;

                if (itineraryTitle && durationDays) {
                    importData.destination = `${itineraryTitle} ${durationDays - 1}N/${durationDays}D`;
                } else if (itineraryTitle) {
                    importData.destination = itineraryTitle;
                } else if (itineraryDestination) {
                    importData.destination = itineraryDestination;
                } else if (trip.destination && trip.destination !== "TBD") {
                    importData.destination = trip.destination;
                }

                // Season from start_date
                if (trip.start_date) {
                    importData.season = getSeason(trip.start_date);
                }

                // Try to enrich from tour_template via itinerary.template_id
                if (trip.itineraries?.id) {
                    try {
                        const supabase = createClient();

                        // Get itinerary with template_id and raw_data
                        const { data: itinerary } = await supabase
                            .from("itineraries")
                            .select("template_id, raw_data, interests")
                            .eq("id", trip.itineraries.id)
                            .maybeSingle();

                        // Extract bullet points from itinerary day themes / activities
                        if (itinerary?.raw_data) {
                            const rawData = itinerary.raw_data as { days?: Array<{ theme?: string; activities?: Array<{ title?: string }> }> };
                            if (rawData.days && Array.isArray(rawData.days)) {
                                const themes = rawData.days
                                    .map((d) => d.theme)
                                    .filter((t): t is string => !!t)
                                    .slice(0, 4);
                                if (themes.length > 0) {
                                    importData.bulletPoints = themes;
                                }
                            }
                        }

                        // Use interests as services if available
                        if (itinerary?.interests && Array.isArray(itinerary.interests) && itinerary.interests.length > 0) {
                            importData.services = itinerary.interests.slice(0, 4);
                        }

                        // Enrich from tour_template if linked
                        if (itinerary?.template_id) {
                            const { data: template } = await supabase
                                .from("tour_templates")
                                .select("base_price, hero_image_url, tags")
                                .eq("id", itinerary.template_id)
                                .maybeSingle();

                            if (template) {
                                if (template.base_price) {
                                    importData.price = formatPrice(template.base_price);
                                }
                                if (template.hero_image_url) {
                                    importData.heroImage = template.hero_image_url;
                                }
                                if (template.tags && Array.isArray(template.tags) && template.tags.length > 0) {
                                    importData.services = template.tags.slice(0, 4);
                                }
                            }
                        }
                    } catch {
                        // Enrichment from template is best-effort; proceed with what we have
                    }
                }

                onImport(importData);
            } finally {
                setImporting(false);
                setSelectedTripId(null);
            }
        },
        [onImport],
    );

    /* ---------- Render ---------- */

    return (
        <div className="space-y-6">
            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search trips by destination, title, or client..."
                    className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 transition-all outline-none"
                />
            </div>

            {/* Trip list */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                        <p className="text-sm font-medium">Loading trips...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-red-500">
                        <AlertCircle className="w-8 h-8 mb-3" />
                        <p className="text-sm font-medium">{error}</p>
                        <button
                            onClick={fetchTrips}
                            className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <Plane className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-sm font-medium text-slate-500">
                            {search ? "No trips match your search." : "No trips found."}
                        </p>
                        {!search && (
                            <Link
                                href="/trips"
                                className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                Create your first trip
                            </Link>
                        )}
                    </div>
                ) : (
                    filtered.map((trip, i) => {
                        const isSelected = selectedTripId === trip.id;
                        const displayDestination =
                            trip.itineraries?.trip_title ??
                            trip.itineraries?.destination ??
                            trip.destination ??
                            "Untitled Trip";
                        const statusKey = (trip.status ?? "draft").toLowerCase();

                        return (
                            <motion.div
                                key={trip.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <GlassCard
                                    className={`p-4 cursor-pointer transition-all border dark:bg-slate-900/40 shadow-sm ${
                                        isSelected
                                            ? "border-indigo-400 shadow-indigo-100 dark:shadow-indigo-900/20"
                                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                    }`}
                                    onClick={() => {
                                        if (!importing) {
                                            handleImport(trip);
                                        }
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Trip title / destination */}
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {displayDestination}
                                                </h3>
                                            </div>

                                            {/* Date range */}
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                <span className="font-medium">
                                                    {formatDateRange(trip.start_date, trip.end_date)}
                                                </span>
                                                {trip.itineraries?.duration_days && (
                                                    <span className="text-slate-400 dark:text-slate-500">
                                                        ({trip.itineraries.duration_days} days)
                                                    </span>
                                                )}
                                            </div>

                                            {/* Client name */}
                                            {trip.profiles?.full_name && (
                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                    <User className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="font-medium">{trip.profiles.full_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right side: status badge + arrow */}
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    STATUS_COLORS[statusKey] ?? STATUS_COLORS.draft
                                                }`}
                                            >
                                                {trip.status ?? "draft"}
                                            </span>
                                            {isSelected && importing ? (
                                                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Footer hint */}
            {!loading && filtered.length > 0 && (
                <p className="text-center text-xs text-slate-400 font-medium">
                    Click a trip to auto-fill your poster with its data
                </p>
            )}
        </div>
    );
}
