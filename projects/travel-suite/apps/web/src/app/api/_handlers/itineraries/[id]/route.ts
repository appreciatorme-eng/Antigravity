import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";

const ITINERARY_DETAIL_SELECT = "id, user_id, client_id, trip_title, destination, duration_days, budget, raw_data, created_at, updated_at";
const supabaseAdmin = createAdminClient();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", 401);
        }

        const { id } = await params;

        if (!id) {
            return apiError("Missing itinerary id", 400);
        }

        const { data, error } = await supabase
            .from("itineraries")
            .select(ITINERARY_DETAIL_SELECT)
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            logError("Error fetching itinerary", error);
            return apiError("Failed to fetch itinerary", 500);
        }

        if (!data) {
            return apiError("Itinerary not found", 404);
        }

        return NextResponse.json({ itinerary: data });
    } catch (error) {
        logError("Internal Error fetching itinerary", error);
        return apiError("Failed to fetch itinerary", 500);
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", 401);
        }

        const { id } = await params;

        if (!id) {
            return apiError("Missing itinerary id", 400);
        }

        const body = await request.json();

        // Create an update object containing only fields we expect
        const updates: { client_id?: string | null; budget?: string } = {};

        if (body.client_id !== undefined) {
            updates.client_id = body.client_id;
        }

        if (body.budget !== undefined) {
            updates.budget = body.budget;
        }

        if (Object.keys(updates).length === 0) {
            return apiError("No fields to update provided.", 400);
        }

        const { data, error } = await supabase
            .from("itineraries")
            .update(updates)
            .eq("id", id)
            .eq("user_id", user.id) // Ensure user owns the itinerary
            .select(ITINERARY_DETAIL_SELECT)
            .single();

        if (error) {
            logError("Error updating itinerary", error);
            return apiError("Failed to update itinerary", 400);
        }

        return NextResponse.json({ itinerary: data });
    } catch (error) {
        logError("Internal Error updating itinerary", error);
        return apiError("Failed to update itinerary", 500);
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", 401);
        }

        const { id } = await params;

        if (!id) {
            return apiError("Missing itinerary id", 400);
        }

        const { data: itinerary, error: itineraryError } = await supabaseAdmin
            .from("itineraries")
            .select("id, user_id")
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (itineraryError) {
            logError("Error looking up itinerary for delete", itineraryError);
            return apiError("Failed to delete itinerary", 500);
        }

        if (!itinerary) {
            return apiError("Itinerary not found", 404);
        }

        const { data: linkedTrips, error: linkedTripsError } = await supabaseAdmin
            .from("trips")
            .select("id")
            .eq("itinerary_id", id);

        if (linkedTripsError) {
            logError("Error fetching linked trips for itinerary delete", linkedTripsError);
            return apiError("Failed to delete itinerary", 500);
        }

        const tripIds = (linkedTrips ?? []).map((trip) => trip.id).filter(Boolean);

        if (tripIds.length > 0) {
            const cleanupTargets = [
                "trip_driver_assignments",
                "trip_accommodations",
                "driver_locations",
                "trip_location_shares",
                "travel_documents",
                "notification_queue",
                "notification_logs",
            ] as const;

            for (const table of cleanupTargets) {
                const { error } = await supabaseAdmin.from(table).delete().in("trip_id", tripIds);
                if (error) {
                    logError(`Error cleaning up ${table} during itinerary delete`, error);
                    return apiError(`Failed to clean up ${table}`, 500);
                }
            }

            const { error: deleteTripsError } = await supabaseAdmin
                .from("trips")
                .delete()
                .in("id", tripIds);

            if (deleteTripsError) {
                logError("Error deleting linked trips", deleteTripsError);
                return apiError("Failed to delete linked trips", 500);
            }
        }

        const { error: deleteSharesError } = await supabaseAdmin
            .from("shared_itineraries")
            .delete()
            .eq("itinerary_id", id);

        if (deleteSharesError) {
            logError("Error deleting shared itinerary rows", deleteSharesError);
            return apiError("Failed to delete itinerary share", 500);
        }

        const { error: deleteItineraryError } = await supabaseAdmin
            .from("itineraries")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (deleteItineraryError) {
            logError("Error deleting itinerary", deleteItineraryError);
            return apiError("Failed to delete itinerary", 500);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logError("Internal Error deleting itinerary", error);
        return apiError("Failed to delete itinerary", 500);
    }
}
