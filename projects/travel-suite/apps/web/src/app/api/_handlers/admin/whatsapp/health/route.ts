import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

const WHATSAPP_HEALTH_RATE_LIMIT_MAX = 60;
const WHATSAPP_HEALTH_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function minutesSince(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 60000));
}

function resolveScopedOrganizationId(
  admin: Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>,
  request: NextRequest,
): { organizationId: string | null } | { error: NextResponse } {
  const requestedOrganizationId = sanitizeText(
    request.nextUrl.searchParams.get("organization_id"),
    { maxLength: 80 },
  );

  if (admin.isSuperAdmin) {
    return { organizationId: requestedOrganizationId || null };
  }

  if (!admin.organizationId) {
    return {
      error: NextResponse.json(
        { error: "Admin organization not configured" },
        { status: 400 },
      ),
    };
  }

  if (
    requestedOrganizationId &&
    requestedOrganizationId !== admin.organizationId
  ) {
    return {
      error: NextResponse.json(
        { error: "Cannot access another organization scope" },
        { status: 403 },
      ),
    };
  }

  return { organizationId: admin.organizationId };
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.response.status || 401 },
      );
    }

    const scopedOrg = resolveScopedOrganizationId(admin, req);
    if ("error" in scopedOrg) return scopedOrg.error;

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: WHATSAPP_HEALTH_RATE_LIMIT_MAX,
      windowMs: WHATSAPP_HEALTH_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:whatsapp:health",
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many WhatsApp health requests. Please retry later." },
        { status: 429 },
      );
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    let driverProfilesQuery = admin.adminClient
      .from("profiles")
      .select("id,full_name,email,phone,phone_normalized")
      .eq("role", "driver");
    let activeTripsQuery = admin.adminClient
      .from("trips")
      .select("id,driver_id,status,organization_id")
      .in("status", ["confirmed", "in_progress"])
      .not("driver_id", "is", null);
    let externalDriversQuery = admin.adminClient
      .from("external_drivers")
      .select("id")
      .eq("is_active", true);

    if (scopedOrg.organizationId) {
      driverProfilesQuery = driverProfilesQuery.eq(
        "organization_id",
        scopedOrg.organizationId,
      );
      activeTripsQuery = activeTripsQuery.eq(
        "organization_id",
        scopedOrg.organizationId,
      );
      externalDriversQuery = externalDriversQuery.eq(
        "organization_id",
        scopedOrg.organizationId,
      );
    }

    const [
      { data: driverProfiles = [] },
      { data: activeTrips = [] },
      { data: externalDrivers = [] },
    ] = await Promise.all([
      driverProfilesQuery,
      activeTripsQuery,
      externalDriversQuery,
    ]);

    const scopedDriverIds = Array.from(
      new Set(
        (driverProfiles || [])
          .map((driver) => driver.id)
          .filter((driverId): driverId is string => Boolean(driverId)),
      ),
    );

    let location1h = 0;
    let location24h = 0;
    if (scopedOrg.organizationId) {
      if (scopedDriverIds.length > 0) {
        const [{ count: location1hCount = 0 }, { count: location24hCount = 0 }] =
          await Promise.all([
            admin.adminClient
              .from("driver_locations")
              .select("*", { count: "exact", head: true })
              .in("driver_id", scopedDriverIds)
              .gte("recorded_at", oneHourAgo),
            admin.adminClient
              .from("driver_locations")
              .select("*", { count: "exact", head: true })
              .in("driver_id", scopedDriverIds)
              .gte("recorded_at", dayAgo),
          ]);
        location1h = Number(location1hCount || 0);
        location24h = Number(location24hCount || 0);
      }
    } else {
      const [{ count: location1hCount = 0 }, { count: location24hCount = 0 }] =
        await Promise.all([
          admin.adminClient
            .from("driver_locations")
            .select("*", { count: "exact", head: true })
            .gte("recorded_at", oneHourAgo),
          admin.adminClient
            .from("driver_locations")
            .select("*", { count: "exact", head: true })
            .gte("recorded_at", dayAgo),
        ]);
      location1h = Number(location1hCount || 0);
      location24h = Number(location24hCount || 0);
    }

    const externalDriverIds = (externalDrivers || [])
      .map((driver) => driver.id)
      .filter((id): id is string => Boolean(id));

    const { data: driverLinks = [] } =
      externalDriverIds.length > 0
        ? await admin.adminClient
            .from("driver_accounts")
            .select("external_driver_id,is_active")
            .eq("is_active", true)
            .in("external_driver_id", externalDriverIds)
        : { data: [] };

    const driverIds = Array.from(
      new Set(
        (activeTrips || [])
          .map((trip) => trip.driver_id)
          .filter(
            (driverId): driverId is string =>
              typeof driverId === "string" && driverId.length > 0,
          ),
      ),
    );

    const latestByDriver = new Map<
      string,
      { recorded_at: string | null; trip_id: string | null }
    >();
    if (driverIds.length > 0) {
      const { data: locationData } = await admin.adminClient
        .from("driver_locations")
        .select("driver_id,trip_id,recorded_at")
        .in("driver_id", driverIds)
        .order("recorded_at", { ascending: false })
        .limit(1000);

      const locationRows = locationData || [];
      for (const row of locationRows) {
        if (!row.driver_id) continue;
        if (!latestByDriver.has(row.driver_id)) {
          latestByDriver.set(row.driver_id, {
            recorded_at: row.recorded_at,
            trip_id: row.trip_id,
          });
        }
      }
    }

    const staleThresholdMinutes = 15;
    let staleActiveDriverTrips = 0;
    for (const trip of activeTrips || []) {
      if (!trip.driver_id) continue;
      const latest = latestByDriver.get(trip.driver_id);
      const ageMin = minutesSince(latest?.recorded_at || null);
      if (ageMin == null || ageMin > staleThresholdMinutes) {
        staleActiveDriverTrips += 1;
      }
    }

    const driverById = new Map(
      (driverProfiles || []).map((item) => [item.id, item]),
    );
    const latestPings = driverIds
      .map((driverId) => {
        const latest = latestByDriver.get(driverId);
        const profile = driverById.get(driverId);
        const ageMinutes = minutesSince(latest?.recorded_at || null);
        return {
          driver_id: driverId,
          driver_name: profile?.full_name || profile?.email || "Unknown driver",
          trip_id: latest?.trip_id || null,
          recorded_at: latest?.recorded_at || null,
          age_minutes: ageMinutes,
          status:
            ageMinutes != null && ageMinutes <= staleThresholdMinutes
              ? "fresh"
              : "stale",
        };
      })
      .sort((a, b) => {
        const at = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
        const bt = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
        return bt - at;
      })
      .slice(0, 8);

    const missingPhoneDrivers = (driverProfiles || [])
      .filter((driver) => !driver.phone_normalized)
      .map((driver) => ({
        id: driver.id,
        full_name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
      }))
      .slice(0, 8);

    const linkedExternalIds = new Set(
      (driverLinks || []).map((item) => item.external_driver_id),
    );
    const unmappedExternalDrivers = (externalDrivers || []).filter(
      (driver) => !linkedExternalIds.has(driver.id),
    ).length;

    return NextResponse.json({
      ok: true,
      summary: {
        total_driver_profiles: (driverProfiles || []).length,
        drivers_with_phone: (driverProfiles || []).filter(
          (driver) => !!driver.phone_normalized,
        ).length,
        drivers_missing_phone: (driverProfiles || []).filter(
          (driver) => !driver.phone_normalized,
        ).length,
        active_trips_with_driver: (activeTrips || []).length,
        stale_active_driver_trips: staleActiveDriverTrips,
        location_pings_last_1h: location1h,
        location_pings_last_24h: location24h,
        unmapped_external_drivers: unmappedExternalDrivers,
      },
      latest_pings: latestPings,
      drivers_missing_phone_list: missingPhoneDrivers,
      organization_id: scopedOrg.organizationId,
      scope: scopedOrg.organizationId ? "organization" : "global",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
