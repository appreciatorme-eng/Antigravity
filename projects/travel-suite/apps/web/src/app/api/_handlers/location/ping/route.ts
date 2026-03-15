import { NextRequest, NextResponse } from "next/server";
import { parseRole } from "@/lib/auth/admin-helpers";
import { apiError } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

const supabaseAdmin = createAdminClient();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function inRange(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

async function isDriverAssignedToTrip(params: {
  profileId: string;
  primaryDriverId: string | null;
  assignmentDriverIds: string[];
}): Promise<boolean> {
  if (params.primaryDriverId === params.profileId) {
    return true;
  }

  if (params.assignmentDriverIds.length === 0) {
    return false;
  }

  const { data: driverAccount } = await supabaseAdmin
    .from("driver_accounts")
    .select("id")
    .eq("profile_id", params.profileId)
    .eq("is_active", true)
    .in("external_driver_id", params.assignmentDriverIds)
    .maybeSingle();

  return Boolean(driverAccount);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiError("Unauthorized", 401);
    }

    const token = authHeader.substring(7);
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return apiError("Invalid token", 401);
    }

    const rateLimit = await enforceRateLimit({
      identifier: authData.user.id,
      limit: 120,
      windowMs: 60_000,
      prefix: "api:location:ping",
    });

    if (!rateLimit.success) {
      return apiError("Rate limit exceeded", 429);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON in request body", 400);
    }

    if (!body || typeof body !== "object") {
      return apiError("Invalid request payload", 400);
    }

    const payload = body as Record<string, unknown>;
    const tripId = String(payload.tripId || "").trim();
    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    const heading =
      payload.heading !== null && payload.heading !== undefined
        ? Number(payload.heading)
        : null;
    const speed =
      payload.speed !== null && payload.speed !== undefined
        ? Number(payload.speed)
        : null;
    const accuracy =
      payload.accuracy !== null && payload.accuracy !== undefined
        ? Number(payload.accuracy)
        : null;
    const explicitDriverId = payload.driverId ? String(payload.driverId).trim() : null;

    if (!tripId || !UUID_REGEX.test(tripId)) {
      return apiError("tripId is required", 400);
    }

    if (!inRange(latitude, -90, 90) || !inRange(longitude, -180, 180)) {
      return apiError("Invalid coordinates", 400);
    }

    if (explicitDriverId && !UUID_REGEX.test(explicitDriverId)) {
      return apiError("Invalid driverId", 400);
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return apiError("Profile not found", 403);
    }

    const role = parseRole(profile.role);
    const isAdmin = role === "admin" || role === "super_admin";
    const isSuperAdmin = role === "super_admin";

    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("id,organization_id,driver_id")
      .eq("id", tripId)
      .maybeSingle();

    if (tripError || !trip) {
      return apiError("Trip not found", 404);
    }

    if (!isSuperAdmin) {
      if (!profile.organization_id || !trip.organization_id || profile.organization_id !== trip.organization_id) {
        return apiError("Forbidden", 403);
      }
    }

    const { data: assignmentRows } = await supabaseAdmin
      .from("trip_driver_assignments")
      .select("external_driver_id")
      .eq("trip_id", tripId);

    const assignmentDriverIds = (assignmentRows || [])
      .map((row: { external_driver_id: string | null }) => row.external_driver_id)
      .filter((id: string | null): id is string => Boolean(id));

    const callerIsAssignedDriver = await isDriverAssignedToTrip({
      profileId: userId,
      primaryDriverId: trip.driver_id,
      assignmentDriverIds,
    });

    if (!isAdmin && !callerIsAssignedDriver) {
      return apiError("Driver access required", 403);
    }

    let resolvedDriverId = userId;

    if (explicitDriverId) {
      if (!isAdmin) {
        return apiError("Only admins can override driverId", 403);
      }

      const explicitDriverIsAssigned = await isDriverAssignedToTrip({
        profileId: explicitDriverId,
        primaryDriverId: trip.driver_id,
        assignmentDriverIds,
      });

      if (!explicitDriverIsAssigned) {
        return apiError("driverId is not assigned to this trip", 403);
      }

      resolvedDriverId = explicitDriverId;
    }

    const { data: latestPing } = await supabaseAdmin
      .from("driver_locations")
      .select("recorded_at")
      .eq("trip_id", tripId)
      .eq("driver_id", resolvedDriverId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPing?.recorded_at) {
      const sinceMs = Date.now() - new Date(latestPing.recorded_at).getTime();
      if (sinceMs < 5000) {
        return NextResponse.json({ ok: true, throttled: true });
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from("driver_locations")
      .insert({
        trip_id: tripId,
        driver_id: resolvedDriverId,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        recorded_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Location ping insert error:", insertError);
      return apiError("Failed to record location", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(safeErrorMessage(error, "Failed to process location ping"), 500);
  }
}
