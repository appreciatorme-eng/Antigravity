import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "node:crypto";
import { safeErrorMessage } from "@/lib/security/safe-error";

const supabaseAdmin = createAdminClient();
const SHARE_RATE_LIMIT_WINDOW_MS = 60_000;
const SHARE_RATE_LIMIT_MAX_REQUESTS = 40;

function sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

function getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0]?.trim() || "unknown";
    }
    return req.headers.get("x-real-ip") || "unknown";
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        if (!/^[a-f0-9]{32}$/i.test(token)) {
            return apiError("Invalid share token format", 400);
        }

        const ipHash = sha256(getClientIp(req));
        const tokenHash = sha256(token);
        const windowStartIso = new Date(Date.now() - SHARE_RATE_LIMIT_WINDOW_MS).toISOString();

        const { count: recentCount, error: rateLimitError } = await supabaseAdmin
            .from("trip_location_share_access_logs")
            .select("id", { count: "exact", head: true })
            .eq("share_token_hash", tokenHash)
            .eq("ip_hash", ipHash)
            .gte("created_at", windowStartIso);

        if (rateLimitError) {
            return apiError("Location share is temporarily unavailable", 503);
        }

        if ((recentCount || 0) >= SHARE_RATE_LIMIT_MAX_REQUESTS) {
            return apiError("Rate limit exceeded", 429);
        }

        const { error: accessLogError } = await supabaseAdmin.from("trip_location_share_access_logs").insert({
            share_token_hash: tokenHash,
            ip_hash: ipHash,
        });

        if (accessLogError) {
            return apiError("Location share is temporarily unavailable", 503);
        }

        const { data: share, error: shareError } = await supabaseAdmin
            .from("trip_location_shares")
            .select(`
                id,
                trip_id,
                day_number,
                expires_at,
                is_active,
                trips (
                    id,
                    destination,
                    start_date,
                    end_date,
                    profiles:client_id (
                        full_name
                    )
                )
            `)
            .eq("share_token", token)
            .eq("is_active", true)
            .single();

        if (shareError || !share) {
            return apiError("Invalid share token", 404);
        }

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return apiError("Share link expired", 410);
        }

        const { data: latestLocation } = await supabaseAdmin
            .from("driver_locations")
            .select("latitude,longitude,heading,speed,accuracy,recorded_at,driver_id")
            .eq("trip_id", share.trip_id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const assignmentQuery = supabaseAdmin
            .from("trip_driver_assignments")
            .select(`
                day_number,
                pickup_time,
                pickup_location,
                external_drivers (
                    full_name,
                    phone,
                    vehicle_type,
                    vehicle_plate
                )
            `)
            .eq("trip_id", share.trip_id)
            .order("day_number", { ascending: true })
            .limit(1);

        const { data: assignment } = share.day_number
            ? await assignmentQuery.eq("day_number", share.day_number).maybeSingle()
            : await assignmentQuery.maybeSingle();

        const tripData = Array.isArray(share.trips) ? share.trips[0] : share.trips;
        const profileData = tripData?.profiles;
        // Handle profiles if it's an array (it might be depending on relationship)
        const clientProfile = Array.isArray(profileData) ? profileData[0] : profileData;

        return NextResponse.json({
            share: {
                trip_id: share.trip_id,
                day_number: share.day_number,
                expires_at: share.expires_at,
            },
            trip: {
                destination: tripData?.destination || "Trip",
                start_date: tripData?.start_date,
                end_date: tripData?.end_date,
                client_name: clientProfile?.full_name || null,
            },
            assignment: assignment || null,
            location: latestLocation || null,
        });
    } catch (error) {
        return apiError(safeErrorMessage(error, "Failed to fetch location data"), 500);
    }
}
