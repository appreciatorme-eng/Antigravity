import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    try {
        const { id: tripId } = await params;

        if (!tripId || tripId === "undefined") {
            return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
        }

        const supabase = await createServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient();

        // Ensure the user is part of the organization that owns this trip
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("organization_id, role")
            .eq("id", user.id)
            .single();

        if (!profile || !profile.organization_id || profile.role !== "admin") {
            // Note: Currently restricting clones to admins/staff of the org
            return NextResponse.json({ error: "Forbidden - Administrator Access Required" }, { status: 403 });
        }

        // Fetch original trip
        const { data: originalTrip, error: tripError } = await supabaseAdmin
            .from("trips")
            .select("*")
            .eq("id", tripId)
            .eq("organization_id", profile.organization_id)
            .single();

        if (tripError || !originalTrip) {
            return NextResponse.json({ error: "Trip not found or access denied." }, { status: 404 });
        }

        let newItineraryId: string | null = null;

        // Fetch and clone the original itinerary
        if (originalTrip.itinerary_id) {
            const { data: originalItinerary, error: itinError } = await supabaseAdmin
                .from("itineraries")
                .select("*")
                .eq("id", originalTrip.itinerary_id)
                .single();

            if (!itinError && originalItinerary) {
                // Strip the exact matched ID to force an insert
                const { id: _oldId, timestamp: _ts, created_at: _ca, updated_at: _ua, ...clonedItineraryData } = originalItinerary as any;

                clonedItineraryData.trip_title = `Copy of ${clonedItineraryData.trip_title}`;

                const { data: newItinerary, error: insertItinError } = await supabaseAdmin
                    .from("itineraries")
                    .insert(clonedItineraryData)
                    .select("id")
                    .single();

                if (!insertItinError && newItinerary) {
                    newItineraryId = newItinerary.id;
                }
            }
        }

        // Create the new trip
        const { id: _oldTripId, created_at: _tripCa, updated_at: _tripUa, ...clonedTripData } = originalTrip as any;

        clonedTripData.itinerary_id = newItineraryId;
        clonedTripData.status = "draft"; // Reset the status for the new cloned trip

        // Optionally clear dates to avoid conflicts or let them reset
        // clonedTripData.start_date = null;
        // clonedTripData.end_date = null;

        const { data: newTrip, error: insertTripError } = await supabaseAdmin
            .from("trips")
            .insert(clonedTripData)
            .select("id")
            .single();

        if (insertTripError || !newTrip) {
            throw new Error(insertTripError?.message || "Failed to clone trip");
        }

        return NextResponse.json({
            success: true,
            tripId: newTrip.id,
            message: "Mission successfully cloned."
        });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
