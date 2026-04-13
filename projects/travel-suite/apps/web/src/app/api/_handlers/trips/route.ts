import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/sanitize";
import { logError } from "@/lib/observability/logger";
import { getDeterministicFallback } from "@/lib/image-search";
import type { SharePaymentSummary } from "@/lib/share/payment-config";
import { normalizeSharePaymentConfig } from "@/lib/share/payment-config";
import { withOptionalSharedItineraryPaymentConfig } from "@/lib/share/payment-config-compat";
import { getHolidayOverlapSummary } from "@/lib/external/holidays";
import {
    buildCommercialPaymentSummaryByTrip,
    type CommercialPaymentRow,
} from "@/lib/payments/commercial-payments";

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

interface TripFinancialSummarySnapshot {
    payment_source?: string | null;
    payment_status?: string | null;
    manual_paid_amount?: number | null;
}

function normalizeFinancialInvoiceStatus(status: string | null | undefined): "paid" | "partial" | "unpaid" | "none" {
    const normalized = (status || "").trim().toLowerCase();
    if (normalized === "paid") return "paid";
    if (normalized === "partially_paid") return "partial";
    if (normalized === "approved" || normalized === "unpaid") return "unpaid";
    return "none";
}

function computeDaysUntilDeparture(startDate: string | null): number | null {
    if (!startDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const departure = new Date(startDate);
    departure.setHours(0, 0, 0, 0);
    return Math.ceil((departure.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface SharedItineraryRow {
    itinerary_id: string;
    share_code: string | null;
    status: string | null;
    payment_config: unknown;
    client_comments: unknown;
    client_preferences: unknown;
    wishlist_items: unknown;
    viewed_at: string | null;
    approved_at: string | null;
    approved_by: string | null;
    self_service_status: string | null;
}

interface ProposalRow {
    id: string;
    trip_id: string | null;
    status: string | null;
    share_token: string | null;
    title: string | null;
    created_at: string;
}

interface PaymentLinkSummaryRow {
    booking_id: string | null;
    status: "pending" | "viewed" | "paid" | "expired" | "cancelled" | null;
    paid_at: string | null;
    created_at: string;
}

interface TripPresentationMetadata {
    hero_image: string;
    share_code: string | null;
    share_status: string | null;
    viewed_at: string | null;
    approved_at: string | null;
    approved_by: string | null;
    self_service_status: string | null;
    client_comments: unknown[];
    client_preferences: unknown | null;
    wishlist_items: string[];
    share_payment_summary: SharePaymentSummary | null;
    proposal_id: string | null;
    proposal_status: string | null;
    proposal_share_token: string | null;
    proposal_title: string | null;
    holiday_summary: {
        holidayName: string;
        date: string;
        country: string;
        countryCode: string;
    } | null;
}

function extractHeroImage(rawData: unknown, destination: string | null | undefined): string {
    const data = rawData as {
        hero_image?: string;
        heroImage?: string;
        days?: Array<{
            activities?: Array<{
                image?: string;
                imageUrl?: string;
            }>;
        }>;
    } | null;

    if (typeof data?.hero_image === "string" && data.hero_image.trim()) {
        return data.hero_image;
    }

    if (typeof data?.heroImage === "string" && data.heroImage.trim()) {
        return data.heroImage;
    }

    if (Array.isArray(data?.days)) {
        for (const day of data.days) {
            for (const activity of day.activities ?? []) {
                if (activity.image?.trim()) return activity.image;
                if (activity.imageUrl?.trim()) return activity.imageUrl;
            }
        }
    }

    return getDeterministicFallback(destination || "travel");
}

async function loadTripPresentationMetadata(
    rows: TripListRow[]
): Promise<Map<string, TripPresentationMetadata>> {
    const itineraryIds = [...new Set(
        rows
            .map((row) => {
                const itinerary = Array.isArray(row.itineraries) ? row.itineraries[0] : row.itineraries;
                return itinerary?.id ?? null;
            })
            .filter((value): value is string => Boolean(value))
    )];

    const tripIds = rows.map((row) => row.id);

    const [sharesResult, proposalsResult, paymentLinksResult] = await Promise.all([
        itineraryIds.length > 0
            ? withOptionalSharedItineraryPaymentConfig<SharedItineraryRow[]>(
                async () =>
                    supabaseAdmin
                        .from("shared_itineraries")
                        .select("itinerary_id, share_code, status, payment_config, client_comments, client_preferences, wishlist_items, viewed_at, approved_at, approved_by, self_service_status")
                        .in("itinerary_id", itineraryIds),
                async () =>
                    supabaseAdmin
                        .from("shared_itineraries")
                        .select("itinerary_id, share_code, status, client_comments, client_preferences, wishlist_items, viewed_at, approved_at, approved_by, self_service_status")
                        .in("itinerary_id", itineraryIds),
            )
            : Promise.resolve({ data: [] as SharedItineraryRow[], error: null, paymentConfigSupported: false }),
        tripIds.length > 0
            ? supabaseAdmin
                .from("proposals")
                .select("id, trip_id, status, share_token, title, created_at")
                .in("trip_id", tripIds)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        tripIds.length > 0
            ? supabaseAdmin
                .from("payment_links")
                .select("booking_id, status, paid_at, created_at")
                .in("booking_id", tripIds)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
    ]);

    const shareMap = new Map<string, SharedItineraryRow>();
    for (const share of (sharesResult.data || []) as SharedItineraryRow[]) {
        if (!share.itinerary_id || shareMap.has(share.itinerary_id)) continue;
        shareMap.set(share.itinerary_id, {
            ...share,
            payment_config:
                sharesResult.paymentConfigSupported && "payment_config" in share
                    ? share.payment_config ?? null
                    : null,
        });
    }

    const proposalMap = new Map<string, ProposalRow>();
    for (const proposal of (proposalsResult.data || []) as ProposalRow[]) {
        if (!proposal.trip_id || proposalMap.has(proposal.trip_id)) continue;
        proposalMap.set(proposal.trip_id, proposal);
    }

    const paymentLinkMap = new Map<string, PaymentLinkSummaryRow>();
    for (const paymentLink of (paymentLinksResult.data || []) as PaymentLinkSummaryRow[]) {
        if (!paymentLink.booking_id || paymentLinkMap.has(paymentLink.booking_id)) continue;
        paymentLinkMap.set(paymentLink.booking_id, paymentLink);
    }

    const holidaySummaries = await Promise.all(
        rows.map(async (row) => {
            const itinerary = Array.isArray(row.itineraries) ? row.itineraries[0] : row.itineraries;
            return [
                row.id,
                await getHolidayOverlapSummary({
                    destination: itinerary?.destination ?? null,
                    startDate: row.start_date,
                    endDate: row.end_date ?? row.start_date,
                }),
            ] as const;
        }),
    );
    const holidaySummaryMap = new Map(holidaySummaries);

    const metadataMap = new Map<string, TripPresentationMetadata>();
    for (const row of rows) {
        const itinerary = Array.isArray(row.itineraries) ? row.itineraries[0] : row.itineraries;
        const share = itinerary?.id ? shareMap.get(itinerary.id) : undefined;
        const proposal = proposalMap.get(row.id);
        const latestPaymentLink = paymentLinkMap.get(row.id);
        const paymentConfig = normalizeSharePaymentConfig(share?.payment_config ?? null);

        metadataMap.set(row.id, {
            hero_image: extractHeroImage(itinerary?.raw_data, itinerary?.destination),
            share_code: share?.share_code ?? null,
            share_status: share?.status ?? null,
            viewed_at: share?.viewed_at ?? null,
            approved_at: share?.approved_at ?? null,
            approved_by: share?.approved_by ?? null,
            self_service_status: share?.self_service_status ?? null,
            client_comments: Array.isArray(share?.client_comments) ? share.client_comments : [],
            client_preferences: share?.client_preferences ?? null,
            wishlist_items: Array.isArray(share?.wishlist_items) ? (share.wishlist_items as string[]) : [],
            share_payment_summary: paymentConfig ? {
                config: paymentConfig,
                latest_status: latestPaymentLink?.status ?? null,
                latest_paid_at: latestPaymentLink?.paid_at ?? null,
            } : null,
            proposal_id: proposal?.id ?? null,
            proposal_status: proposal?.status ?? null,
            proposal_share_token: proposal?.share_token ?? null,
            proposal_title: proposal?.title ?? null,
            holiday_summary: holidaySummaryMap.get(row.id) ?? null,
        });
    }

    return metadataMap;
}

async function enrichTrips(
    tripIds: string[],
    tripsData: Array<{
        id: string;
        start_date: string | null;
        itineraries: { duration_days: number | null } | null;
        has_itinerary: boolean;
        quoted_total: number | null;
        financial_summary: TripFinancialSummarySnapshot | null;
    }>
): Promise<Map<string, TripEnrichment>> {
    const enrichmentMap = new Map<string, TripEnrichment>();

    if (tripIds.length === 0) return enrichmentMap;

    const [invoiceResult, driverResult, accommodationResult, commercialPaymentsResult] = await Promise.all([
        supabaseAdmin.from("invoices")
            .select("trip_id, total_amount, paid_amount, balance_amount, status")
            .in("trip_id", tripIds),
        supabaseAdmin.from("trip_driver_assignments")
            .select("trip_id, day_number")
            .in("trip_id", tripIds),
        supabaseAdmin.from("trip_accommodations")
            .select("trip_id, day_number")
            .in("trip_id", tripIds),
        supabaseAdmin.from("commercial_payments")
            .select("*")
            .in("trip_id", tripIds)
            .is("deleted_at", null),
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

    const commercialPaymentSummaryByTrip = buildCommercialPaymentSummaryByTrip(
        ((commercialPaymentsResult.data || []) as CommercialPaymentRow[]),
    );

    for (const trip of tripsData) {
        const invoices = invoicesByTrip.get(trip.id) || [];
        const commercialSummary = commercialPaymentSummaryByTrip.get(trip.id) || null;
        const driverDays = driverDaysByTrip.get(trip.id) || new Set();
        const accommodationDays = accommodationDaysByTrip.get(trip.id) || new Set();
        const totalDays = trip.itineraries?.duration_days || 0;
        const invoiceTotal = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const legacyPaidAmount = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
        const canonicalPaidAmount = commercialSummary?.totalPaid || 0;
        const financialSummary = trip.financial_summary;
        const manualCashMode = (financialSummary?.payment_source || "").trim().toLowerCase() === "manual_cash";
        const manualPaidAmount = Number(financialSummary?.manual_paid_amount || 0);

        const paidAmount = manualCashMode
            ? manualPaidAmount
            : (canonicalPaidAmount > 0 ? canonicalPaidAmount : legacyPaidAmount);
        const totalAmount = invoiceTotal > 0
            ? invoiceTotal
            : Math.max(Number(trip.quoted_total || 0), paidAmount);
        const balanceAmount = Math.max(totalAmount - paidAmount, 0);
        const paymentStatus = manualCashMode
            ? normalizeFinancialInvoiceStatus(financialSummary?.payment_status)
            : (
                totalAmount <= 0
                    ? "none"
                    : balanceAmount <= 0
                        ? "paid"
                        : paidAmount > 0
                            ? "partial"
                            : "unpaid"
            );

        enrichmentMap.set(trip.id, {
            invoice: {
                total_amount: totalAmount,
                paid_amount: paidAmount,
                balance_amount: balanceAmount,
                payment_status: paymentStatus,
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
    client_id: string | null;
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
        raw_data?: unknown;
    }
    | Array<{
        id: string | null;
        trip_title: string | null;
        duration_days: number | null;
        destination: string | null;
        raw_data?: unknown;
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
                    client_id,
                    status,
                    start_date,
                    end_date,
                    created_at,
                    organization_id,
                    itineraries:itinerary_id (
                        id,
                        trip_title,
                        duration_days,
                        destination,
                        raw_data
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
                    quoted_total: Number(
                        (itinerary?.raw_data as { pricing?: { total_cost?: number | null } } | null)?.pricing?.total_cost || 0,
                    ) || null,
                    financial_summary:
                        ((itinerary?.raw_data as { financial_summary?: TripFinancialSummarySnapshot | null } | null)
                            ?.financial_summary) ?? null,
                };
            });

            const tripIds = rawTrips.map((t) => t.id);
            const enrichmentMap = await enrichTrips(tripIds, rawTrips);
            const presentationMap = await loadTripPresentationMetadata((data || []) as unknown as TripListRow[]);

            const enrichedTrips = ((data || []) as unknown as TripListRow[]).map((t) => {
                const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;
                const enrichment = enrichmentMap.get(t.id);
                const presentation = presentationMap.get(t.id);
                const defaults = {
                    invoice: { total_amount: 0, paid_amount: 0, balance_amount: 0, payment_status: "none" },
                    driver_coverage: { covered_days: 0, total_days: 0 },
                    accommodation_coverage: { covered_days: 0, total_days: 0 },
                    has_itinerary: false,
                    days_until_departure: null,
                };

                return {
                    id: t.id,
                    client_id: t.client_id,
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
                    hero_image: presentation?.hero_image ?? getDeterministicFallback(itinerary?.destination || "travel"),
                    share_code: presentation?.share_code ?? null,
                    share_status: presentation?.share_status ?? null,
                    viewed_at: presentation?.viewed_at ?? null,
                    approved_at: presentation?.approved_at ?? null,
                    approved_by: presentation?.approved_by ?? null,
                    self_service_status: presentation?.self_service_status ?? null,
                    client_comments: presentation?.client_comments ?? [],
                    client_preferences: presentation?.client_preferences ?? null,
                    wishlist_items: presentation?.wishlist_items ?? [],
                    share_payment_summary: presentation?.share_payment_summary ?? null,
                    proposal_id: presentation?.proposal_id ?? null,
                    proposal_status: presentation?.proposal_status ?? null,
                    proposal_share_token: presentation?.proposal_share_token ?? null,
                    proposal_title: presentation?.proposal_title ?? null,
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
                client_id,
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
                    destination,
                    raw_data
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
                quoted_total: Number(
                    (itinerary?.raw_data as { pricing?: { total_cost?: number | null } } | null)?.pricing?.total_cost || 0,
                ) || null,
                financial_summary:
                    ((itinerary?.raw_data as { financial_summary?: TripFinancialSummarySnapshot | null } | null)
                        ?.financial_summary) ?? null,
            };
        });

        const tripIds = rawTrips.map((t) => t.id);
        const enrichmentMap = await enrichTrips(tripIds, rawTrips);
        const presentationMap = await loadTripPresentationMetadata((data || []) as unknown as TripListRow[]);

        const trips = ((data || []) as unknown as TripListRow[]).map((t) => {
            const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
            const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;
            const enrichment = enrichmentMap.get(t.id);
            const presentation = presentationMap.get(t.id);
            const defaults = {
                invoice: { total_amount: 0, paid_amount: 0, balance_amount: 0, payment_status: "none" },
                driver_coverage: { covered_days: 0, total_days: 0 },
                accommodation_coverage: { covered_days: 0, total_days: 0 },
                has_itinerary: false,
                days_until_departure: null,
            };

            return {
                id: t.id,
                client_id: t.client_id,
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
                hero_image: presentation?.hero_image ?? getDeterministicFallback(itinerary?.destination || "travel"),
                share_code: presentation?.share_code ?? null,
                share_status: presentation?.share_status ?? null,
                viewed_at: presentation?.viewed_at ?? null,
                approved_at: presentation?.approved_at ?? null,
                approved_by: presentation?.approved_by ?? null,
                self_service_status: presentation?.self_service_status ?? null,
                client_comments: presentation?.client_comments ?? [],
                client_preferences: presentation?.client_preferences ?? null,
                wishlist_items: presentation?.wishlist_items ?? [],
                share_payment_summary: presentation?.share_payment_summary ?? null,
                proposal_id: presentation?.proposal_id ?? null,
                proposal_status: presentation?.proposal_status ?? null,
                proposal_share_token: presentation?.proposal_share_token ?? null,
                proposal_title: presentation?.proposal_title ?? null,
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
