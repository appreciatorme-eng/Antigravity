import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { EXTERNAL_DRIVER_SELECT } from "@/lib/travel/selects";

const supabaseAdmin = createAdminClient();

interface AssignmentRow {
    id: string;
    day_number: number;
    external_driver_id: string | null;
    pickup_time: string | null;
    pickup_location: string | null;
    notes: string | null;
}

interface AccommodationRow {
    id: string;
    day_number: number;
    hotel_name: string | null;
    address: string | null;
    check_in_time: string | null;
    contact_phone: string | null;
}

interface ReminderQueueRow {
    status: "pending" | "processing" | "sent" | "failed" | string;
    scheduled_for: string | null;
    payload: {
        day_number?: number | string;
    } | null;
}

interface ReminderDayStatus {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    lastScheduledFor: string | null;
}

function parseRole(role: string | null | undefined): "admin" | "super_admin" | null {
    const normalized = (role || "").trim().toLowerCase();
    if (normalized === "admin" || normalized === "super_admin") {
        return normalized;
    }
    return null;
}

async function requireTripReader(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

    if (token) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && authData?.user) {
            userId = authData.user.id;
        }
    } else {
        const serverClient = await createServerClient();
        const { data: { user } } = await serverClient.auth.getUser();
        userId = user?.id || null;
    }

    if (!userId) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, organization_id")
        .eq("id", userId)
        .maybeSingle();

    const role = parseRole(profile?.role);
    const isStaff = role === "admin" || role === "super_admin";

    return {
        userId,
        organizationId: profile?.organization_id || null,
        role,
        isStaff,
    };
}

export async function GET(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    try {
        const auth = await requireTripReader(req);
        if ("error" in auth) return auth.error;

        const { id: tripId } = await params;

        if (!tripId || tripId === "undefined") {
            return apiError("Missing trip id", 400);
        }

        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        if (!uuidRegex.test(tripId)) {
            return apiError("Invalid trip id", 400);
        }

        let tripQuery = supabaseAdmin
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                organization_id,
                client_id,
                profiles:client_id (
                    id,
                    full_name,
                    email,
                    phone,
                    phone_whatsapp,
                    dietary_requirements,
                    preferred_destination,
                    travel_style,
                    budget_min,
                    budget_max,
                    mobility_needs
                ),
                itineraries (
                    id,
                    trip_title,
                    duration_days,
                    destination,
                    raw_data
                )
            `)
            .eq("id", tripId);

        if (auth.isStaff) {
            if (auth.role !== "super_admin") {
                if (!auth.organizationId) {
                    return apiError("Admin organization not configured", 400);
                }
                tripQuery = tripQuery.eq("organization_id", auth.organizationId);
            }
        } else {
            tripQuery = tripQuery.eq("client_id", auth.userId);
        }

        const { data: tripData, error: tripError } = await tripQuery.single();

        if (tripError || !tripData) {
            return apiError(safeErrorMessage(tripError, "Trip not found"), 404);
        }

        const itinerary = Array.isArray(tripData.itineraries)
            ? tripData.itineraries[0]
            : tripData.itineraries;

        const mappedTrip = {
            ...tripData,
            destination: itinerary?.destination || "TBD",
            itineraries: itinerary
                ? {
                    ...itinerary,
                    raw_data: {
                        days: itinerary.raw_data?.days || [],
                        flights: itinerary.raw_data?.flights || [],
                    },
                }
                : null,
        };

        if (!auth.isStaff) {
            return NextResponse.json({
                trip: mappedTrip,
            });
        }

        if (!tripData.organization_id) {
            return apiError("Trip organization is not configured", 400);
        }

        const { data: driversData } = await supabaseAdmin
            .from("external_drivers")
            .select(EXTERNAL_DRIVER_SELECT)
            .eq("is_active", true)
            .eq("organization_id", tripData.organization_id)
            .order("full_name");

        const { data: assignmentsData } = await supabaseAdmin
            .from("trip_driver_assignments")
            .select("id, day_number, external_driver_id, pickup_time, pickup_location, notes")
            .eq("trip_id", tripId);

        const assignmentsMap: Record<number, AssignmentRow> = {};
        ((assignmentsData || []) as AssignmentRow[]).forEach((a) => {
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
            .select("id, day_number, hotel_name, address, check_in_time, contact_phone")
            .eq("trip_id", tripId);

        const accommodationsMap: Record<number, AccommodationRow> = {};
        ((accommodationsData || []) as AccommodationRow[]).forEach((a) => {
            accommodationsMap[a.day_number] = {
                id: a.id,
                day_number: a.day_number,
                hotel_name: a.hotel_name || "",
                address: a.address || "",
                check_in_time: a.check_in_time || "15:00",
                contact_phone: a.contact_phone || "",
            };
        });

        const { data: reminderRows } = await supabaseAdmin
            .from("notification_queue")
            .select("id,status,scheduled_for,payload,recipient_type")
            .eq("trip_id", tripId)
            .eq("notification_type", "pickup_reminder")
            .order("scheduled_for", { ascending: false });

        const reminderStatusByDay: Record<number, ReminderDayStatus> = {};

        ((reminderRows || []) as ReminderQueueRow[]).forEach((row) => {
            const dayNumber = Number(row?.payload?.day_number || 0);
            if (!dayNumber) return;
            if (!reminderStatusByDay[dayNumber]) {
                reminderStatusByDay[dayNumber] = {
                    pending: 0,
                    processing: 0,
                    sent: 0,
                    failed: 0,
                    lastScheduledFor: null,
                };
            }

            if (row.status === "pending") reminderStatusByDay[dayNumber].pending += 1;
            if (row.status === "processing") reminderStatusByDay[dayNumber].processing += 1;
            if (row.status === "sent") reminderStatusByDay[dayNumber].sent += 1;
            if (row.status === "failed") reminderStatusByDay[dayNumber].failed += 1;

            if (
                row.scheduled_for &&
                (!reminderStatusByDay[dayNumber].lastScheduledFor ||
                    row.scheduled_for > reminderStatusByDay[dayNumber].lastScheduledFor)
            ) {
                reminderStatusByDay[dayNumber].lastScheduledFor = row.scheduled_for;
            }
        });

        const { data: latestLocation } = await supabaseAdmin
            .from("driver_locations")
            .select("latitude,longitude,recorded_at,speed,heading,accuracy")
            .eq("trip_id", tripId)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const busyDriversByDay: Record<number, string[]> = {};

        if (tripData.start_date) {
            const tripStartDate = new Date(tripData.start_date);
            const tripDuration = itinerary?.duration_days || 1;

            let tripEndDate: Date;
            if (tripData.end_date) {
                tripEndDate = new Date(tripData.end_date);
            } else {
                tripEndDate = new Date(tripStartDate);
                tripEndDate.setDate(tripEndDate.getDate() + tripDuration);
            }

            const { data: overlappingTrips } = await supabaseAdmin
                .from("trips")
                .select("id, start_date, itineraries(duration_days)")
                .neq("id", tripId)
                .eq("organization_id", tripData.organization_id)
                .or(`start_date.lte.${tripEndDate.toISOString().split('T')[0]},end_date.gte.${tripStartDate.toISOString().split('T')[0]}`);

            if (overlappingTrips && overlappingTrips.length > 0) {
                const tripIds = overlappingTrips.map(t => t.id);

                const { data: remoteAssignments } = await supabaseAdmin
                    .from("trip_driver_assignments")
                    .select("trip_id, day_number, external_driver_id")
                    .in("trip_id", tripIds)
                    .not("external_driver_id", "is", null);

                if (remoteAssignments) {
                    for (let day = 1; day <= tripDuration; day++) {
                        const targetDate = new Date(tripStartDate);
                        targetDate.setDate(targetDate.getDate() + (day - 1));
                        const targetDateStr = targetDate.toISOString().split('T')[0];

                        const busyDriverIds = new Set<string>();

                        remoteAssignments.forEach(assign => {
                            if (!assign.external_driver_id) return;

                            const remoteTrip = overlappingTrips.find(t => t.id === assign.trip_id);
                            if (!remoteTrip || !remoteTrip.start_date) return;

                            const remoteStartDate = new Date(remoteTrip.start_date);
                            const assignmentDate = new Date(remoteStartDate);
                            assignmentDate.setDate(assignmentDate.getDate() + (assign.day_number - 1));

                            const assignmentDateStr = assignmentDate.toISOString().split('T')[0];

                            if (assignmentDateStr === targetDateStr) {
                                busyDriverIds.add(assign.external_driver_id);
                            }
                        });

                        if (busyDriverIds.size > 0) {
                            busyDriversByDay[day] = Array.from(busyDriverIds);
                        }
                    }
                }
            }
        }

        // Invoice summary
        const { data: invoiceAggData } = await supabaseAdmin
            .from("invoices")
            .select("total_amount, paid_amount, balance_amount")
            .eq("trip_id", tripId);

        const invoiceSummary = invoiceAggData && invoiceAggData.length > 0
            ? {
                total_amount: invoiceAggData.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
                paid_amount: invoiceAggData.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
                balance_amount: invoiceAggData.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0),
                invoice_count: invoiceAggData.length,
            }
            : null;

        return NextResponse.json({
            trip: mappedTrip,
            drivers: driversData || [],
            assignments: assignmentsMap,
            accommodations: accommodationsMap,
            reminderStatusByDay,
            busyDriversByDay,
            latestDriverLocation: latestLocation || null,
            invoiceSummary,
        });
    } catch (error) {
        return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    try {
        const auth = await requireTripReader(req);
        if ("error" in auth) return auth.error;

        if (!auth.isStaff) {
            return apiError("Forbidden", 403);
        }

        const { id: tripId } = await params;
        if (!tripId || tripId === "undefined") {
            return apiError("Missing trip id", 400);
        }

        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        if (!uuidRegex.test(tripId)) {
            return apiError("Invalid trip id", 400);
        }

        let tripLookup = supabaseAdmin
            .from("trips")
            .select("id, organization_id, itinerary_id")
            .eq("id", tripId);

        if (auth.role !== "super_admin") {
            if (!auth.organizationId) {
                return apiError("Admin organization not configured", 400);
            }
            tripLookup = tripLookup.eq("organization_id", auth.organizationId);
        }

        const { data: trip, error: tripError } = await tripLookup.maybeSingle();
        if (tripError || !trip) {
            return apiError("Trip not found", 404);
        }

        const cleanupTargets = [
            "trip_driver_assignments",
            "trip_accommodations",
            "driver_locations",
            "trip_location_shares",
            "travel_documents",
            "notification_queue",
            "notification_logs",
        ] as const;

        const cleanupResults = await Promise.all(
            cleanupTargets.map(async (table) => {
                const { error } = await supabaseAdmin.from(table).delete().eq("trip_id", tripId);
                return { table, error };
            }),
        );

        const cleanupFailure = cleanupResults.find((result) => result.error);
        if (cleanupFailure?.error) {
            return NextResponse.json(
                { error: `Failed to clean up ${cleanupFailure.table}` },
                { status: 500 },
            );
        }

        const { error: deleteTripError } = await supabaseAdmin
            .from("trips")
            .delete()
            .eq("id", tripId);

        if (deleteTripError) {
            return apiError("Failed to delete trip", 500);
        }

        if (trip.itinerary_id) {
            const { count: remainingTrips } = await supabaseAdmin
                .from("trips")
                .select("id", { count: "exact", head: true })
                .eq("itinerary_id", trip.itinerary_id);

            if ((remainingTrips || 0) === 0) {
                await supabaseAdmin
                    .from("itineraries")
                    .delete()
                    .eq("id", trip.itinerary_id);
            }
        }

        return NextResponse.json({ success: true });
    } catch {
        return apiError("Failed to delete trip", 500);
    }
}
