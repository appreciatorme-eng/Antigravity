import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing itinerary id" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("itineraries")
            .select("id, user_id, client_id, budget, raw_data, created_at, updated_at")
            .eq("id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching itinerary:", error);
            return NextResponse.json({ error: "Failed to fetch itinerary" }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
        }

        return NextResponse.json({ itinerary: data });
    } catch (error) {
        console.error("Internal Error fetching itinerary:", error);
        return NextResponse.json({ error: "Failed to fetch itinerary" }, { status: 500 });
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing itinerary id" }, { status: 400 });
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
            return NextResponse.json({ error: "No fields to update provided." }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("itineraries")
            .update(updates)
            .eq("id", id)
            .eq("user_id", user.id) // Ensure user owns the itinerary
            .select()
            .single();

        if (error) {
            console.error("Error updating itinerary:", error);
            return NextResponse.json({ error: "Failed to update itinerary" }, { status: 400 });
        }

        return NextResponse.json({ itinerary: data });
    } catch (error) {
        console.error("Internal Error updating itinerary:", error);
        return NextResponse.json({ error: "Failed to update itinerary" }, { status: 500 });
    }
}
