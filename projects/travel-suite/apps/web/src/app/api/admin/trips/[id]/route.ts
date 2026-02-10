import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function requireAdmin(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
        return { error: NextResponse.json({ error: "Missing auth token" }, { status: 401 }) };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: adminProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

    if (!adminProfile || adminProfile.role !== "admin") {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { userId: authData.user.id };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await requireAdmin(req);
        if ("error" in admin) return admin.error;

        const tripId = params.id;

        const { data: tripData, error: tripError } = await supabaseAdmin
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                profiles:client_id (
                    id,
                    full_name,
                    email
                ),
                itineraries (
                    id,
                    trip_title,
                    duration_days,
                    destination,
                    raw_data
                )
            `)
            .eq("id", tripId)
            .single();

        if (tripError || !tripData) {
            return NextResponse.json({ error: tripError?.message || "Trip not found" }, { status: 404 });
        }

        const mappedTrip = {
            ...tripData,
            destination: tripData.itineraries?.destination || "TBD",
            itineraries: tripData.itineraries
                ? {
                    ...tripData.itineraries,
                    raw_data: {
                        days: tripData.itineraries.raw_data?.days || [],
                    },
                }
                : null,
        };

        const { data: driversData } = await supabaseAdmin
            .from("external_drivers")
            .select("*")
            .eq("is_active", true)
            .order("full_name");

        const { data: assignmentsData } = await supabaseAdmin
            .from("trip_driver_assignments")
            .select("*")
            .eq("trip_id", tripId);

        const assignmentsMap: Record<number, any> = {};
        (assignmentsData || []).forEach((a: any) => {
            assignmentsMap[a.day_number] = {
                id: a.id,
                day_number: a.day_number,
                external_driver_id: a.external_driver_id,
                pickup_time: a.pickup_time || "",
                pickup_location: a.pickup_location || "",
                notes: a.notes || "",
            };
        });

        const { data: accommodationsData } = await supabaseAdmin
            .from("trip_accommodations")
            .select("*")
            .eq("trip_id", tripId);

        const accommodationsMap: Record<number, any> = {};
        (accommodationsData || []).forEach((a: any) => {
            accommodationsMap[a.day_number] = {
                id: a.id,
                day_number: a.day_number,
                hotel_name: a.hotel_name || "",
                address: a.address || "",
                check_in_time: a.check_in_time || "15:00",
                contact_phone: a.contact_phone || "",
            };
        });

        return NextResponse.json({
            trip: mappedTrip,
            drivers: driversData || [],
            assignments: assignmentsMap,
            accommodations: accommodationsMap,
        });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
