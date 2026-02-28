"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ItineraryResult } from "@/types/itinerary";

interface SaveItineraryButtonProps {
    itineraryData: ItineraryResult;
    destination: string;
    days: number;
    budget: string;
    interests: string[];
    templateId?: string;
}

export default function SaveItineraryButton({
    itineraryData,
    destination,
    days,
    budget,
    interests,
    templateId = "safari_story",
}: SaveItineraryButtonProps) {
    const router = useRouter();
    const supabase = createClient();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setSaving(true);
        setError("");

        try {
            // Check if user is authenticated
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/auth?next=/planner");
                return;
            }

            // Get user profile for organization_id
            const { data: profile } = await supabase
                .from("profiles")
                .select("organization_id")
                .eq("id", user.id)
                .single();

            // Save itinerary to database
            const { data: insertedItinerary, error: insertError } = await supabase
                .from("itineraries")
                .insert({
                    user_id: user.id,
                    trip_title: itineraryData.trip_title,
                    destination: itineraryData.destination || destination,
                    summary: itineraryData.summary,
                    duration_days: days,
                    budget: budget,
                    interests: interests,
                    raw_data: itineraryData as any,
                    template_id: templateId,
                })
                .select("id")
                .single();

            if (insertError) throw insertError;

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
                console.warn("Trip record creation failed (itinerary saved):", tripError.message);
                router.push("/planner");
                return;
            }

            // Redirect to the trip page
            router.push(`/trips/${insertedTrip.id}`);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save";
            console.error("Save error:", message);
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (saved) {
        return (
            <button
                disabled
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 border border-green-200"
            >
                <Check className="w-4 h-4" /> Saved!
            </button>
        );
    }

    return (
        <div className="flex flex-col items-end">
            <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 font-bold text-sm animate-pulse-subtle"
            >
                {saving ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" /> 💾 Save Trip
                    </>
                )}
            </button>
            {error && (
                <span className="text-xs text-red-500 mt-1">{error}</span>
            )}
        </div>
    );
}
