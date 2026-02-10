import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getAdminUserId(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && authData?.user) {
            return authData.user.id;
        }
    }

    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    return user?.id || null;
}

async function requireAdmin(req: NextRequest) {
    const adminUserId = await getAdminUserId(req);
    if (!adminUserId) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: adminProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .single();

    if (!adminProfile || adminProfile.role !== "admin") {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { userId: adminUserId };
}

export async function GET(req: NextRequest) {
    try {
        const admin = await requireAdmin(req);
        if ("error" in admin) return admin.error;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all";
        const search = searchParams.get("search") || "";

        let query = supabaseAdmin
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                created_at,
                profiles:client_id (
                    full_name,
                    email
                ),
                itineraries:itinerary_id (
                    trip_title,
                    duration_days,
                    destination
                )
            `);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        if (search) {
            query = query.or(`itineraries.trip_title.ilike.%${search}%,profiles.full_name.ilike.%${search}%,itineraries.destination.ilike.%${search}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const trips = (data || []).map((trip: any) => ({
            ...trip,
            destination: trip.itineraries?.destination || "TBD",
        }));

        return NextResponse.json({ trips });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin(req);
        if ("error" in admin) return admin.error;

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
