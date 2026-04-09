"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Check, ExternalLink, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { itinerariesKeys } from "@/lib/queries/itineraries";
import Link from "next/link";
import type { ItineraryResult } from "@/types/itinerary";
import type { Json } from "@/lib/database.types";
import { logError } from "@/lib/observability/logger";

interface SaveItineraryButtonProps {
    itineraryData: ItineraryResult;
    destination: string;
    days: number;
    budget: string;
    interests: string[];
    itineraryId?: string;
    templateId?: string;
    onSaved?: (payload: { itineraryId: string; tripId: string | null }) => void;
}

export default function SaveItineraryButton({
    itineraryData,
    destination,
    days,
    budget,
    interests,
    itineraryId,
    templateId = "safari_story",
    onSaved,
}: SaveItineraryButtonProps) {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [savedTripId, setSavedTripId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setSaving(true);
        setError("");

        try {
            // Check if user is authenticated
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = "/auth?next=/planner";
                return;
            }

            // Get user profile for organization_id
            const { data: profile } = await supabase
                .from("profiles")
                .select("organization_id")
                .eq("id", user.id)
                .single();

            // Save itinerary to database
            const itineraryRow = {
                user_id: user.id,
                trip_title: itineraryData.trip_title,
                destination: itineraryData.destination || destination,
                summary: itineraryData.summary || "",
                duration_days: days,
                budget: budget,
                interests: interests,
                raw_data: itineraryData as unknown as Json,
                template_id: templateId,
            };

            let insertedItinerary: { id: string } | null = null;

            if (itineraryId) {
                const { data: updateData, error: updateError } = await supabase
                    .from("itineraries")
                    .update(itineraryRow)
                    .eq("id", itineraryId)
                    .select("id")
                    .single();

                if (updateError) {
                    // If template_id column doesn't exist, retry without it
                    if (updateError.message?.includes("template_id") || updateError.code === "PGRST204") {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { template_id: _templateId, ...rowWithoutTemplate } = itineraryRow;
                        const { data: retryData, error: retryError } = await supabase
                            .from("itineraries")
                            .update(rowWithoutTemplate)
                            .eq("id", itineraryId)
                            .select("id")
                            .single();
                        if (retryError) throw retryError;
                        insertedItinerary = retryData;
                    } else {
                        throw updateError;
                    }
                } else {
                    insertedItinerary = updateData;
                }
            } else {
                const { data: insertData, error: insertError } = await supabase
                    .from("itineraries")
                    .insert(itineraryRow)
                    .select("id")
                    .single();

                if (insertError) {
                    // If template_id column doesn't exist, retry without it
                    if (insertError.message?.includes("template_id") || insertError.code === "PGRST204") {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { template_id: _templateId, ...rowWithoutTemplate } = itineraryRow;
                        const { data: retryData, error: retryError } = await supabase
                            .from("itineraries")
                            .insert(rowWithoutTemplate)
                            .select("id")
                            .single();
                        if (retryError) throw retryError;
                        insertedItinerary = retryData;
                    } else {
                        throw insertError;
                    }
                } else {
                    insertedItinerary = insertData;
                }
            }

            if (!insertedItinerary) throw new Error("Insert succeeded but returned no data");

            let tripId: string | null = null;
            const { data: existingTrip } = await supabase
                .from("trips")
                .select("id")
                .eq("itinerary_id", insertedItinerary.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingTrip?.id) {
                tripId = existingTrip.id;
            } else {
                // Also create a trip record so it shows up on the Trips page
                const { data: insertedTrip, error: tripError } = await supabase
                    .from("trips")
                    .insert({
                        itinerary_id: insertedItinerary.id,
                        client_id: user.id,
                        organization_id: profile?.organization_id ?? null,
                        status: "draft",
                        destination: itineraryData.destination || destination,
                    })
                    .select("id")
                    .single();

                if (tripError) {
                    logError("Trip record creation failed (itinerary saved)", tripError);
                    // Itinerary still saved — show success and refresh list
                    setSaved(true);
                    queryClient.invalidateQueries({ queryKey: itinerariesKeys.all });
                    onSaved?.({ itineraryId: insertedItinerary.id, tripId: null });
                    return;
                }

                tripId = insertedTrip.id;
            }

            // Stay on page, refresh itinerary list, show success
            setSaved(true);
            setSavedTripId(tripId);
            // Invalidate the query so the saved list re-fetches and shows this new itinerary
            queryClient.invalidateQueries({ queryKey: itinerariesKeys.all });
            onSaved?.({ itineraryId: insertedItinerary.id, tripId });

            // Smooth scroll to the saved section
            setTimeout(() => {
                const el = document.getElementById("saved-itineraries-section");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 400);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save";
            logError("Save error", err);
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (saved) {
        return (
            <div className="flex items-center gap-1.5 md:gap-2">
                <span className="flex items-center gap-1.5 px-2 md:px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 font-bold text-xs md:text-sm">
                    <Check className="w-4 h-4" />
                    <span className="hidden md:inline">Saved! ↓ Scroll down</span>
                    <span className="md:hidden">Saved!</span>
                </span>
                {savedTripId && (
                    <Link
                        href={`/trips/${savedTripId}`}
                        className="flex items-center gap-1 px-2 md:px-3 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                        <span className="hidden md:inline">View Trip</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end">
            <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 md:h-10 px-2 md:px-5 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 font-bold text-xs md:text-sm"
            >
                {saving ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden md:inline">Saving...</span>
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        <span className="hidden md:inline">Save Trip</span>
                    </>
                )}
            </button>
            {error && (
                <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
        </div>
    );
}
