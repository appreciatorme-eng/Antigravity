import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authData?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const clientId = String(body.clientId || "");
        const startDate = String(body.startDate || "");
        const endDate = String(body.endDate || "");
        const itinerary = body.itinerary || {};

        if (!clientId || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const itineraryPayload = {
            user_id: clientId,
            trip_title: itinerary.trip_title || "New Trip",
            destination: itinerary.destination || "TBD",
            summary: itinerary.summary || "",
            duration_days: itinerary.duration_days || 1,
            raw_data: itinerary.raw_data || { days: [] },
        };

        const { data: itineraryData, error: itineraryError } = await supabaseAdmin
            .from("itineraries")
            .insert(itineraryPayload)
            .select()
            .single();

        if (itineraryError || !itineraryData) {
            return NextResponse.json({ error: itineraryError?.message || "Failed to create itinerary" }, { status: 400 });
        }

        const { error: tripError, data: tripData } = await supabaseAdmin
            .from("trips")
            .insert({
                client_id: clientId,
                start_date: startDate,
                end_date: endDate,
                status: "pending",
                itinerary_id: itineraryData.id,
            })
            .select()
            .single();

        if (tripError || !tripData) {
            return NextResponse.json({ error: tripError?.message || "Failed to create trip" }, { status: 400 });
        }

        return NextResponse.json({ success: true, tripId: tripData.id });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
