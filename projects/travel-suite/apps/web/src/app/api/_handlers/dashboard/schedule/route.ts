import "server-only";

import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { logError } from "@/lib/observability/logger";

const supabaseAdmin = createAdminClient();

interface ScheduleEvent {
    id: string;
    tripId: string;
    time: string;
    title: string;
    location: string;
    clientName: string;
    clientPhone: string | null;
    driverName: string | null;
    driverPhone: string | null;
    driverVehicle: string | null;
    status: "completed" | "active" | "upcoming" | "alert";
    passengerCount: number | null;
}

type TripRow = {
    id: string;
    start_date: string | null;
    status: string | null;
    client_id: string | null;
    itineraries: {
        destination: string;
        trip_title: string;
    } | Array<{
        destination: string;
        trip_title: string;
    }> | null;
    profiles: {
        full_name: string | null;
        phone: string | null;
        travelers_count: number | null;
    } | Array<{
        full_name: string | null;
        phone: string | null;
        travelers_count: number | null;
    }> | null;
    trip_driver_assignments: Array<{
        id: string;
        pickup_time: string | null;
        pickup_location: string | null;
        external_driver_id: string | null;
        external_drivers: {
            full_name: string;
            phone: string;
            vehicle_type: string | null;
            vehicle_plate: string | null;
        } | Array<{
            full_name: string;
            phone: string;
            vehicle_type: string | null;
            vehicle_plate: string | null;
        }> | null;
    }> | null;
};

function mapTripStatus(
    status: string | null
): "completed" | "active" | "upcoming" | "alert" {
    const normalized = (status ?? "").toLowerCase();
    if (normalized === "completed") return "completed";
    if (normalized === "active" || normalized === "in_progress") return "active";
    return "upcoming";
}

function resolveFirst<T>(
    value: T | T[] | null | undefined
): T | null {
    if (!value) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
}

function buildVehicleDescription(
    vehicleType: string | null,
    vehiclePlate: string | null
): string | null {
    if (!vehicleType && !vehiclePlate) return null;
    const parts = [vehicleType, vehiclePlate].filter(Boolean);
    return parts.join(" - ");
}

export async function GET(request: Request) {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const today = new Date().toISOString().slice(0, 10);

        const { data: trips, error } = await supabaseAdmin
            .from("trips")
            .select(`
                id,
                start_date,
                status,
                client_id,
                itineraries:itinerary_id (
                    destination,
                    trip_title
                ),
                profiles:client_id (
                    full_name,
                    phone,
                    travelers_count
                ),
                trip_driver_assignments (
                    id,
                    pickup_time,
                    pickup_location,
                    external_driver_id,
                    external_drivers:external_driver_id (
                        full_name,
                        phone,
                        vehicle_type,
                        vehicle_plate
                    )
                )
            `)
            .eq("organization_id", orgId)
            .eq("start_date", today)
            .in("status", ["confirmed", "active", "in_progress", "completed"]);

        if (error) {
            logError("Schedule query error", error);
            return apiError("Failed to fetch schedule", 500);
        }

        const tripRows = (trips ?? []) as unknown as TripRow[];
        let completedCount = 0;
        const events: ScheduleEvent[] = [];

        for (const trip of tripRows) {
            const itinerary = resolveFirst(trip.itineraries);
            const clientProfile = resolveFirst(trip.profiles);
            const assignment =
                trip.trip_driver_assignments?.[0] ?? null;
            const driver = assignment
                ? resolveFirst(assignment.external_drivers)
                : null;

            const eventStatus = mapTripStatus(trip.status);
            if (eventStatus === "completed") {
                completedCount += 1;
            }

            events.push({
                id: `schedule:${trip.id}`,
                tripId: trip.id,
                time:
                    assignment?.pickup_time ??
                    trip.start_date ??
                    today,
                title:
                    itinerary?.trip_title ??
                    itinerary?.destination ??
                    "Untitled Trip",
                location:
                    assignment?.pickup_location ??
                    itinerary?.destination ??
                    "",
                clientName:
                    clientProfile?.full_name ?? "Unknown client",
                clientPhone: clientProfile?.phone ?? null,
                driverName: driver?.full_name ?? null,
                driverPhone: driver?.phone ?? null,
                driverVehicle: driver
                    ? buildVehicleDescription(
                          driver.vehicle_type,
                          driver.vehicle_plate
                      )
                    : null,
                status: eventStatus,
                passengerCount:
                    clientProfile?.travelers_count ?? null,
            });
        }

        events.sort((a, b) => a.time.localeCompare(b.time));

        return NextResponse.json({ events, completedCount });
    } catch (error) {
        logError("Dashboard schedule error", error);
        return NextResponse.json(
            {
                error: safeErrorMessage(error, "Request failed"),
            },
            { status: 500 }
        );
    }
}
