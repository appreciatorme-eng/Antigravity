import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";
import { EXTERNAL_DRIVER_SELECT } from "@/lib/travel/selects";
import { logError } from "@/lib/observability/logger";
import { createLinkedProposalFromItinerary } from "@/lib/proposals/trip-linking";

const TRIP_DETAILS_RATE_LIMIT_MAX = 120;
const TRIP_DETAILS_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

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

interface LinkedProposalRow {
    id: string;
    title: string | null;
    status: string | null;
    share_token: string | null;
    total_price: number | null;
    client_selected_price: number | null;
}

function attachRateLimitHeaders(
    response: NextResponse,
    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
): NextResponse {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    response.headers.set("retry-after", String(retryAfterSeconds));
    response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
    response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
    return response;
}

export async function GET(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: TRIP_DETAILS_RATE_LIMIT_MAX,
            windowMs: TRIP_DETAILS_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:trips:details",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many admin trip detail requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const { pathname } = new URL(req.url);
        const pathId = pathname.split("/").pop();
        const { id: paramId } = await params;
        const tripId = (paramId || pathId || "").trim();

        if (!tripId || tripId === "undefined") {
            return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
        }

        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        if (!uuidRegex.test(tripId)) {
            return NextResponse.json({ error: "Invalid trip id" }, { status: 400 });
        }

        let tripQuery = admin.adminClient
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                organization_id,
                profiles:client_id (
                    id,
                    full_name,
                    email,
                    phone
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

        if (!admin.isSuperAdmin) {
            if (!admin.organizationId) {
                return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
            }
            tripQuery = tripQuery.eq("organization_id", admin.organizationId);
        }

        const { data: tripData, error: tripError } = await tripQuery.single();

        if (tripError || !tripData) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }
        if (!tripData.organization_id) {
            return NextResponse.json({ error: "Trip organization is not configured" }, { status: 400 });
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
                        ...(itinerary.raw_data || {}),
                        days: itinerary.raw_data?.days || [],
                    },
                }
                : null,
        };

        const { data: linkedProposalData } = await admin.adminClient
            .from("proposals")
            .select("id, title, status, share_token, total_price, client_selected_price")
            .eq("trip_id", tripId)
            .eq("organization_id", tripData.organization_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        const linkedProposal = (linkedProposalData as LinkedProposalRow | null) ?? null;

        const { data: driversData } = await admin.adminClient
            .from("external_drivers")
            .select(EXTERNAL_DRIVER_SELECT)
            .eq("is_active", true)
            .eq("organization_id", tripData.organization_id)
            .order("full_name");

        const { data: assignmentsData } = await admin.adminClient
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

        const { data: accommodationsData } = await admin.adminClient
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

        const { data: reminderRows } = await admin.adminClient
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

        const { data: latestLocation } = await admin.adminClient
            .from("driver_locations")
            .select("latitude,longitude,recorded_at,speed,heading,accuracy")
            .eq("trip_id", tripId)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        // --- Conflict Detection Logic ---
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

            // Fetch other trips that overlap with this trip's date range
            const { data: overlappingTrips } = await admin.adminClient
                .from("trips")
                .select("id, start_date, itineraries(duration_days)") // duration needed to check exact overlap
                .neq("id", tripId)
                .eq("organization_id", tripData.organization_id)
                .or(`start_date.lte.${tripEndDate.toISOString().split('T')[0]},end_date.gte.${tripStartDate.toISOString().split('T')[0]}`);

            if (overlappingTrips && overlappingTrips.length > 0) {
                const tripIds = overlappingTrips.map(t => t.id);

                // Fetch assignments for those overlapping trips
                const { data: remoteAssignments } = await admin.adminClient
                    .from("trip_driver_assignments")
                    .select("trip_id, day_number, external_driver_id")
                    .in("trip_id", tripIds)
                    .not("external_driver_id", "is", null);

                if (remoteAssignments) {
                    // Map current trip's dates to day numbers
                    // For each day `d` in current trip (1..tripDuration):
                    //   TargetDate = tripStartDate + (d-1) days
                    //   Check if any remoteAssignment falls on TargetDate effectively

                    for (let day = 1; day <= tripDuration; day++) {
                        const targetDate = new Date(tripStartDate);
                        targetDate.setDate(targetDate.getDate() + (day - 1));
                        const targetDateStr = targetDate.toISOString().split('T')[0]; // simple YYYY-MM-DD compare

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

        return NextResponse.json({
            trip: mappedTrip,
            linkedProposal,
            drivers: driversData || [],
            assignments: assignmentsMap,
            accommodations: accommodationsMap,
            reminderStatusByDay,
            busyDriversByDay,
            latestDriverLocation: latestLocation || null,
        });
    } catch (error) {
        logError("Error fetching trip details", error);
        return NextResponse.json({ error: safeErrorMessage(error, "Request failed") }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const { id: tripId } = await params;
        if (!tripId || tripId === "undefined") {
            return NextResponse.json({ error: "Missing trip id" }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const action = String(body.action || "");

        if (action !== "create_linked_proposal") {
            return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
        }

        let tripQuery = admin.adminClient
            .from("trips")
            .select("id, client_id, itinerary_id, organization_id, itineraries(raw_data)")
            .eq("id", tripId);

        if (!admin.isSuperAdmin) {
            if (!admin.organizationId) {
                return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
            }
            tripQuery = tripQuery.eq("organization_id", admin.organizationId);
        }

        const { data: trip } = await tripQuery.maybeSingle();
        const itinerary = Array.isArray(trip?.itineraries) ? trip?.itineraries[0] : trip?.itineraries;

        if (!trip?.client_id || !trip.itinerary_id || !trip.organization_id) {
            return NextResponse.json({ error: "Trip is missing client or itinerary linkage" }, { status: 400 });
        }

        const createdProposal = await createLinkedProposalFromItinerary({
            adminClient: admin.adminClient,
            organizationId: trip.organization_id,
            userId: admin.userId,
            itineraryId: trip.itinerary_id,
            clientId: trip.client_id,
            tripId: trip.id,
            basePrice: Number((itinerary?.raw_data as { pricing?: { total_cost?: number } } | null)?.pricing?.total_cost || 0),
        });

        return NextResponse.json({
            success: true,
            proposalId: createdProposal.proposalId,
            reused: createdProposal.reused,
        });
    } catch (error) {
        logError("Create linked proposal error", error);
        return NextResponse.json({ error: safeErrorMessage(error, "Request failed") }, { status: 500 });
    }
}
