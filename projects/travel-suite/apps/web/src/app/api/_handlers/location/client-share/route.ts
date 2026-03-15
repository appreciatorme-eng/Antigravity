import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

const supabaseAdmin = createAdminClient();

function buildLiveUrl(req: NextRequest, token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    return `${appUrl.replace(/\/$/, "")}/live/${token}`;
}

function parseDayNumber(raw: string | null): number | null {
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseTripId(raw: string | null): string | null {
    if (!raw) return null;
    return /^[0-9a-fA-F-]{36}$/.test(raw) ? raw : null;
}

async function authenticateClient(req: NextRequest): Promise<{ userId: string } | Response> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return apiError("Unauthorized", 401);
    }

    const token = authHeader.substring(7);
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
        return apiError("Invalid token", 401);
    }

    return { userId: authData.user.id };
}

async function resolveAuthorizedTrip(tripId: string, userId: string): Promise<{ id: string; client_id: string } | Response> {
    const { data: trip } = await supabaseAdmin
        .from("trips")
        .select("id,client_id")
        .eq("id", tripId)
        .maybeSingle();

    if (!trip || !trip.client_id) {
        return apiError("Trip not found", 404);
    }

    if (trip.client_id !== userId) {
        return apiError("Forbidden", 403);
    }

    return {
        id: trip.id,
        client_id: trip.client_id,
    };
}

async function findActiveShare(tripId: string, dayNumber: number | null) {
    const nowIso = new Date().toISOString();
    let existingQuery = supabaseAdmin
        .from("trip_location_shares")
        .select("id,share_token,expires_at,is_active,day_number")
        .eq("trip_id", tripId)
        .eq("is_active", true)
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(1);

    if (dayNumber) {
        existingQuery = existingQuery.eq("day_number", dayNumber);
    }

    const { data: existing } = await existingQuery.maybeSingle();
    return existing;
}

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateClient(req);
        if (auth instanceof Response) {
            return auth;
        }

        const tripId = parseTripId(req.nextUrl.searchParams.get("tripId"));
        const dayNumber = parseDayNumber(req.nextUrl.searchParams.get("dayNumber"));
        if (!tripId) {
            return apiError("tripId is required", 400);
        }

        const trip = await resolveAuthorizedTrip(tripId, auth.userId);
        if (trip instanceof Response) {
            return trip;
        }

        const existing = await findActiveShare(trip.id, dayNumber);
        if (!existing?.share_token) {
            return apiError("No active share found", 404);
        }

        return NextResponse.json({
            share: {
                ...existing,
                live_url: buildLiveUrl(req, existing.share_token),
            },
            reused: true,
        });
    } catch (error) {
        return apiError(safeErrorMessage(error, "Failed to fetch location share"), 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateClient(req);
        if (auth instanceof Response) {
            return auth;
        }

        const tripId = parseTripId(req.nextUrl.searchParams.get("tripId"));
        const dayNumber = parseDayNumber(req.nextUrl.searchParams.get("dayNumber"));
        if (!tripId) {
            return apiError("tripId is required", 400);
        }

        const trip = await resolveAuthorizedTrip(tripId, auth.userId);
        if (trip instanceof Response) {
            return trip;
        }

        const existing = await findActiveShare(trip.id, dayNumber);
        if (existing?.share_token) {
            return NextResponse.json({
                share: {
                    ...existing,
                    live_url: buildLiveUrl(req, existing.share_token),
                },
                reused: true,
            });
        }

        const shareToken = crypto.randomUUID().replace(/-/g, "");
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        const { data: inserted, error: insertError } = await supabaseAdmin
            .from("trip_location_shares")
            .insert({
                trip_id: trip.id,
                day_number: dayNumber,
                created_by: auth.userId,
                share_token: shareToken,
                expires_at: expiresAt,
                is_active: true,
            })
            .select("id,share_token,expires_at,is_active,day_number")
            .single();

        if (insertError || !inserted) {
            return apiError("Failed to create share", 500);
        }

        return NextResponse.json({
            share: {
                ...inserted,
                live_url: buildLiveUrl(req, inserted.share_token),
            },
            reused: false,
        });
    } catch (error) {
        return apiError(safeErrorMessage(error, "Failed to process location share"), 500);
    }
}
