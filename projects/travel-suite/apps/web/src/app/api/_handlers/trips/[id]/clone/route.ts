import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { Database } from "@/lib/supabase/database.types";
import { ITINERARY_SELECT, TRIP_SELECT } from "@/lib/travel/selects";

function omitFields<T extends Record<string, unknown>, K extends keyof T>(
    value: T,
    keys: readonly K[]
): Omit<T, K> {
    const clone: Partial<T> = { ...value };
    for (const key of keys) {
        delete clone[key];
    }
    return clone as Omit<T, K>;
}

type ItineraryRow = Database["public"]["Tables"]["itineraries"]["Row"];
type ItineraryInsert = Database["public"]["Tables"]["itineraries"]["Insert"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];

export async function POST(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    try {
        const { id: tripId } = await params;

        if (!tripId || tripId === "undefined") {
            return apiError("Missing trip id", 400);
        }

        const supabase = await createServerClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return apiError("Unauthorized", 401);
        }

        const supabaseAdmin = createAdminClient();

        // Ensure the user is part of the organization that owns this trip
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("organization_id, role")
            .eq("id", user.id)
            .maybeSingle();

        const role = (profile?.role || "").toLowerCase();
        const isStaff = role === "admin" || role === "super_admin";

        if (!profile || !isStaff) {
            return apiError("Forbidden - Administrator Access Required", 403);
        }
        // Fetch original trip
        let tripQuery = supabaseAdmin
            .from("trips")
            .select(TRIP_SELECT)
            .eq("id", tripId);

        if (role !== "super_admin") {
            const adminOrganizationId =
                typeof profile.organization_id === "string" ? profile.organization_id : null;
            if (!adminOrganizationId) {
                return apiError("Admin organization not configured", 400);
            }
            tripQuery = tripQuery.eq("organization_id", adminOrganizationId);
        }

        const { data: originalTrip, error: tripError } = await tripQuery.single();
        const originalTripRow = originalTrip as unknown as TripRow | null;

        if (tripError || !originalTripRow) {
            return apiError("Trip not found or access denied.", 404);
        }

        let newItineraryId: string | null = null;

        // Fetch and clone the original itinerary
        if (originalTripRow.itinerary_id) {
            const { data: originalItinerary, error: itinError } = await supabaseAdmin
                .from("itineraries")
                .select(ITINERARY_SELECT)
                .eq("id", originalTripRow.itinerary_id)
                .single();
            const originalItineraryRow = originalItinerary as unknown as ItineraryRow | null;

            if (!itinError && originalItineraryRow) {
                // Strip the exact matched ID to force an insert
                const clonedItineraryData = omitFields<
                    ItineraryRow,
                    "id" | "created_at" | "updated_at"
                >(originalItineraryRow, ["id", "created_at", "updated_at"]);

                clonedItineraryData.trip_title = `Copy of ${clonedItineraryData.trip_title}`;
                const itineraryInsert: ItineraryInsert = clonedItineraryData;

                const { data: newItinerary, error: insertItinError } = await supabaseAdmin
                    .from("itineraries")
                    .insert(itineraryInsert)
                    .select("id")
                    .single();

                if (!insertItinError && newItinerary) {
                    newItineraryId = newItinerary.id;
                }
            }
        }

        // Create the new trip
        const clonedTripData = omitFields<
            TripRow,
            "id" | "created_at" | "updated_at"
        >(originalTripRow, ["id", "created_at", "updated_at"]);

        clonedTripData.itinerary_id = newItineraryId;
        clonedTripData.status = "pending"; // Reset to initial status for the cloned trip
        const tripInsert: TripInsert = clonedTripData;

        // Optionally clear dates to avoid conflicts or let them reset
        // clonedTripData.start_date = null;
        // clonedTripData.end_date = null;

        const { data: newTrip, error: insertTripError } = await supabaseAdmin
            .from("trips")
            .insert(tripInsert)
            .select("id")
            .single();

        if (insertTripError || !newTrip) {
            throw new Error(insertTripError?.message || "Failed to clone trip");
        }

        return NextResponse.json({
            success: true,
            tripId: newTrip.id,
            message: "Trip duplicated successfully."
        });
    } catch (error) {
        return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
}
