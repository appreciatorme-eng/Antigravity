import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    sendNotificationToUser,
    getDriverWhatsAppLink,
    formatDriverAssignmentMessage,
} from "@/lib/notifications";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        // Verify user authorization
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const body = await request.json();
        const { tripId } = body;

        if (!tripId) {
            return NextResponse.json({ error: "tripId is required" }, { status: 400 });
        }

        // Get trip details
        const { data: trip, error: tripError } = await supabaseAdmin
            .from("trips")
            .select(`
                *,
                profiles!trips_user_id_fkey(full_name, email)
            `)
            .eq("id", tripId)
            .eq("user_id", user.id)
            .single();

        if (tripError || !trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        // Calculate current day of trip
        const startDate = new Date(trip.start_date);
        const today = new Date();
        const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Get today's driver assignment
        const { data: assignment } = await supabaseAdmin
            .from("trip_driver_assignments")
            .select(`
                *,
                external_drivers(*)
            `)
            .eq("trip_id", tripId)
            .eq("day_number", dayNumber)
            .single();

        // Get today's activities
        const { data: activities } = await supabaseAdmin
            .from("activities")
            .select("*")
            .eq("trip_id", tripId)
            .eq("day_number", dayNumber)
            .order("start_time", { ascending: true });

        // Get today's accommodation
        const { data: accommodation } = await supabaseAdmin
            .from("trip_accommodations")
            .select("*")
            .eq("trip_id", tripId)
            .eq("day_number", dayNumber)
            .single();

        // Send confirmation to client
        let driverInfo = "";
        if (assignment?.external_drivers) {
            const driver = assignment.external_drivers;
            driverInfo = `\n\nYour driver ${driver.full_name} has been notified. Call: ${driver.phone}`;
        }

        await sendNotificationToUser({
            userId: user.id,
            title: "Welcome! You've landed",
            body: `Your trip to ${trip.destination} begins now!${driverInfo}`,
            data: {
                type: "client_landed",
                tripId,
                dayNumber,
            },
        });

        // Generate WhatsApp link for driver (admin can use this)
        let driverWhatsAppLink = null;
        if (assignment?.external_drivers && activities) {
            const driver = assignment.external_drivers;
            const clientName = trip.profiles?.full_name || "Client";

            const message = formatDriverAssignmentMessage({
                clientName,
                pickupTime: assignment.pickup_time || "TBD",
                pickupLocation: assignment.pickup_location || trip.destination,
                activities: activities.map((a: any) => ({
                    title: a.title,
                    duration_minutes: a.duration_minutes,
                })),
                hotelName: accommodation?.hotel_name || "TBD",
            });

            driverWhatsAppLink = getDriverWhatsAppLink(driver.phone, message);
        }

        // Log the landing event
        await supabaseAdmin.from("notification_logs").insert({
            trip_id: tripId,
            recipient_id: user.id,
            notification_type: "client_landed",
            title: "Client Landed",
            body: `${trip.profiles?.full_name || "Client"} has landed for trip to ${trip.destination}`,
            status: "sent",
        });

        return NextResponse.json({
            success: true,
            message: "Landing notification sent",
            driverWhatsAppLink,
            dayNumber,
        });
    } catch (error: any) {
        console.error("Client landed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
