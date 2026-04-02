import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

const ITINERARY_DETAIL_SELECT = "id, user_id, client_id, trip_title, destination, duration_days, budget, raw_data, created_at, updated_at";

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
