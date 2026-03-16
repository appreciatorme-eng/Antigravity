import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/sanitize";
import { logError } from "@/lib/observability/logger";

const supabaseAdmin = createAdminClient();

function sanitizeSearchTerm(input: string): string {
    const safe = sanitizeText(input, { maxLength: 80 });
    if (!safe) return "";
    return safe.replace(/[%,().:`"']/g, " ").replace(/\s+/g, " ").trim();
}

function parseRole(role: string | null | undefined): "admin" | "super_admin" | null {
    const normalized = (role || "").trim().toLowerCase();
    if (normalized === "admin" || normalized === "super_admin") {
        return normalized;
    }
    return null;
}

interface InvoiceRow {
    trip_id: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    status: string;
}

interface DriverRow {
    trip_id: string;
    day_number: number;
}

interface AccommodationRow {
    trip_id: string;
    day_number: number;
}

interface TripEnrichment {
    invoice: { total_amount: number; paid_amount: number; balance_amount: number; payment_status: string };
    driver_coverage: { covered_days: number; total_days: number };
    accommodation_coverage: { covered_days: number; total_days: number };
    has_itinerary: boolean;
    days_until_departure: number | null;
}

function derivePaymentStatus(invoices: InvoiceRow[]): string {
    if (invoices.length === 0) return "none";
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
    const totalBalance = invoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0);
    if (totalBalance <= 0) return "paid";
    if (totalPaid > 0) return "partial";
    return "unpaid";
}

function computeDaysUntilDeparture(startDate: string | null): number | null {
    if (!startDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const departure = new Date(startDate);
    departure.setHours(0, 0, 0, 0);
    return Math.ceil((departure.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

async function enrichTrips(
    tripIds: string[],
    tripsData: Array<{ id: string; start_date: string | null; itineraries: { duration_days: number | null } | null; has_itinerary: boolean }>
): Promise<Map<string, TripEnrichment>> {
    const enrichmentMap = new Map<string, TripEnrichment>();

    if (tripIds.length === 0) return enrichmentMap;

    const [invoiceResult, driverResult, accommodationResult] = await Promise.all([
        supabaseAdmin.from("invoices")
            .select("trip_id, total_amount, paid_amount, balance_amount, status")
            .in("trip_id", tripIds),
        supabaseAdmin.from("trip_driver_assignments")
            .select("trip_id, day_number")
            .in("trip_id", tripIds),
        supabaseAdmin.from("trip_accommodations")
            .select("trip_id, day_number")
            .in("trip_id", tripIds),
    ]);

    const invoicesByTrip = new Map<string, InvoiceRow[]>();
    for (const row of (invoiceResult.data || []) as InvoiceRow[]) {
        const existing = invoicesByTrip.get(row.trip_id) || [];
        invoicesByTrip.set(row.trip_id, [...existing, row]);
    }

    const driverDaysByTrip = new Map<string, Set<number>>();
    for (const row of (driverResult.data || []) as DriverRow[]) {
        const existing = driverDaysByTrip.get(row.trip_id) || new Set();
        existing.add(row.day_number);
        driverDaysByTrip.set(row.trip_id, existing);
    }

    const accommodationDaysByTrip = new Map<string, Set<number>>();
    for (const row of (accommodationResult.data || []) as AccommodationRow[]) {
        const existing = accommodationDaysByTrip.get(row.trip_id) || new Set();
        existing.add(row.day_number);
        accommodationDaysByTrip.set(row.trip_id, existing);
    }

    for (const trip of tripsData) {
        const invoices = invoicesByTrip.get(trip.id) || [];
        const driverDays = driverDaysByTrip.get(trip.id) || new Set();
        const accommodationDays = accommodationDaysByTrip.get(trip.id) || new Set();
        const totalDays = trip.itineraries?.duration_days || 0;

        enrichmentMap.set(trip.id, {
            invoice: {
                total_amount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
                paid_amount: invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
                balance_amount: invoices.reduce((sum, inv) => sum + (inv.balance_amount || 0), 0),
                payment_status: derivePaymentStatus(invoices),
            },
            driver_coverage: { covered_days: driverDays.size, total_days: totalDays },
            accommodation_coverage: { covered_days: accommodationDays.size, total_days: totalDays },
            has_itinerary: trip.has_itinerary,
            days_until_departure: computeDaysUntilDeparture(trip.start_date),
        });
    }

    return enrichmentMap;
}

interface TripListRow {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    organization_id: string;
    profiles:
    | {
        full_name: string | null;
        email: string | null;
    }
    | Array<{
        full_name: string | null;
        email: string | null;
    }>
    | null;
    itineraries:
    | {
        id: string | null;
        trip_title: string | null;
        duration_days: number | null;
        destination: string | null;
    }
    | Array<{
        id: string | null;
        trip_title: string | null;
        duration_days: number | null;
        destination: string | null;
    }>
    | null;
}

export async function GET(req: NextRequest) {
    try {
        const serverClient = await createServerClient();
        const { data: { user } } = await serverClient.auth.getUser();

        if (!user) {
            return apiError("Unauthorized", 401);
        }

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .maybeSingle();

        const role = parseRole(profile?.role);
        const isStaff = role === "admin" || role === "super_admin";
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all";
        const search = sanitizeSearchTerm(searchParams.get("search") || "");
        const cursor = searchParams.get("cursor") || null;
        const limitRaw = Number(searchParams.get("limit") || "50");
        const limit = Math.min(Math.max(1, Number.isNaN(limitRaw) ? 50 : limitRaw), 100);

        if (!isStaff) {
            // Client/driver users can only view their own trips.

            let query = supabaseAdmin
                .from("trips")
                .select(`
                    id,
                    status,
                    start_date,
                    end_date,
                    created_at,
                    organization_id,
                    itineraries:itinerary_id (
                        id,
                        trip_title,
                        duration_days,
                        destination
                    )
                `)
                .eq("client_id", user.id);

            if (status !== "all") {
                query = query.eq("status", status);
            }
            if (search) {
                query = query.or(`itineraries.trip_title.ilike.%${search}%,itineraries.destination.ilike.%${search}%`);
            }
            if (cursor) {
                query = query.lt("created_at", cursor);
            }

            const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);

            if (error) return apiError("Failed to process trip", 400);

            const rawTrips = ((data || []) as unknown as TripListRow[]).map((t) => {
                const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;
                return {
                    id: t.id,
                    start_date: t.start_date,
                    itineraries: itinerary ? { duration_days: itinerary.duration_days } : null,
                    has_itinerary: !!itinerary?.id,
                };
            });

            const tripIds = rawTrips.map((t) => t.id);
            const enrichmentMap = await enrichTrips(tripIds, rawTrips);

            const enrichedTrips = ((data || []) as unknown as TripListRow[]).map((t) => {
                const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;
                const enrichment = enrichmentMap.get(t.id);
                const defaults = {
                    invoice: { total_amount: 0, paid_amount: 0, balance_amount: 0, payment_status: "none" },
                    driver_coverage: { covered_days: 0, total_days: 0 },
                    accommodation_coverage: { covered_days: 0, total_days: 0 },
                    has_itinerary: false,
                    days_until_departure: null,
                };

                return {
                    id: t.id,
                    status: t.status,
                    start_date: t.start_date,
                    end_date: t.end_date,
                    created_at: t.created_at,
                    organization_id: t.organization_id,
                    profiles: null,
                    itineraries: itinerary ? {
                        id: itinerary.id,
                        trip_title: itinerary.trip_title,
                        duration_days: itinerary.duration_days,
                        destination: itinerary.destination,
                    } : null,
                    itinerary_id: itinerary?.id || null,
                    destination: itinerary?.destination || "TBD",
                    ...(enrichment || defaults),
                };
            });

            const nextCursor = enrichedTrips.length === limit
                ? (enrichedTrips[enrichedTrips.length - 1]?.created_at ?? null)
                : null;
            return NextResponse.json({ trips: enrichedTrips, nextCursor, hasMore: nextCursor !== null });
        }

        // Staff/Admin access - show organization-scoped trips only.
        const requestedOrganizationId = sanitizeText(searchParams.get("organization_id"), { maxLength: 80 });
        const scopedOrganizationId =
            role === "super_admin" && requestedOrganizationId
                ? requestedOrganizationId
                : profile?.organization_id || null;

        if (!scopedOrganizationId) {
            return apiError("Admin organization not configured. Super admins must provide organization_id.", 400);
        }

        let query = supabaseAdmin
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                created_at,
                organization_id,
                profiles:client_id (
                    full_name,
                    email
                ),
                itineraries:itinerary_id (
                    id,
                    trip_title,
                    duration_days,
                    destination
                )
            `)
            .eq("organization_id", scopedOrganizationId);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        if (search) {
            query = query.or(`itineraries.trip_title.ilike.%${search}%,profiles.full_name.ilike.%${search}%,itineraries.destination.ilike.%${search}%`);
        }
        if (cursor) {
            query = query.lt("created_at", cursor);
        }

        const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);

        if (error) {
            return apiError("Failed to process trip", 400);
        }

        const rawTrips = ((data || []) as unknown as TripListRow[]).map((t) => {
            const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;
            return {
                id: t.id,
                start_date: t.start_date,
                itineraries: itinerary ? { duration_days: itinerary.duration_days } : null,
                has_itinerary: !!itinerary?.id,
            };
        });

        const tripIds = rawTrips.map((t) => t.id);
        const enrichmentMap = await enrichTrips(tripIds, rawTrips);

        const trips = ((data || []) as unknown as TripListRow[]).map((t) => {
            const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
            const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;
            const enrichment = enrichmentMap.get(t.id);
            const defaults = {
                invoice: { total_amount: 0, paid_amount: 0, balance_amount: 0, payment_status: "none" },
                driver_coverage: { covered_days: 0, total_days: 0 },
                accommodation_coverage: { covered_days: 0, total_days: 0 },
                has_itinerary: false,
                days_until_departure: null,
            };

            return {
                id: t.id,
                status: t.status,
                start_date: t.start_date,
                end_date: t.end_date,
                created_at: t.created_at,
                organization_id: t.organization_id,
                profiles: profile ? {
                    full_name: profile.full_name,
                    email: profile.email,
                } : null,
                itineraries: itinerary ? {
                    id: itinerary.id,
                    trip_title: itinerary.trip_title,
                    duration_days: itinerary.duration_days,
                    destination: itinerary.destination,
                } : null,
                itinerary_id: itinerary?.id || null,
                destination: itinerary?.destination || "TBD",
                ...(enrichment || defaults),
            };
        });

        const nextCursor = trips.length === limit
            ? (trips[trips.length - 1]?.created_at ?? null)
            : null;
        return NextResponse.json({ trips, nextCursor, hasMore: nextCursor !== null });
    } catch (error) {
        logError("Error fetching trips", error);
        return apiError("Failed to process trip", 500);
    }
}
