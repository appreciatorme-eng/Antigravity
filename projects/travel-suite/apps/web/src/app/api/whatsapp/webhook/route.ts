import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseWhatsAppLocationMessages } from "@/lib/whatsapp.server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function toIsoFromUnixSeconds(value: string): string {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return new Date().toISOString();
    }
    return new Date(parsed * 1000).toISOString();
}

async function resolveCurrentTripId(driverId: string): Promise<string | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
        .from("trips")
        .select("id, start_date, end_date")
        .eq("driver_id", driverId)
        .in("status", ["in_progress", "confirmed"])
        .lte("start_date", today)
        .order("updated_at", { ascending: false })
        .limit(10);

    const active = (data || []).find((trip) => {
        const start = trip.start_date || today;
        const end = trip.end_date || start;
        return start <= today && end >= today;
    });

    return active?.id || null;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
        return new NextResponse(challenge ?? "", { status: 200 });
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const locations = parseWhatsAppLocationMessages(payload);
        let stored = 0;

        for (const location of locations) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("id, role")
                .eq("phone_normalized", location.waId)
                .maybeSingle();

            if (!profile || profile.role !== "driver") {
                continue;
            }

            const tripId = await resolveCurrentTripId(profile.id);
            const { error } = await supabaseAdmin.from("driver_locations").insert({
                driver_id: profile.id,
                trip_id: tripId,
                latitude: location.latitude,
                longitude: location.longitude,
                recorded_at: toIsoFromUnixSeconds(location.timestamp),
            });

            if (!error) {
                stored += 1;
            }
        }

        return NextResponse.json({
            ok: true,
            location_messages: locations.length,
            stored_locations: stored,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
