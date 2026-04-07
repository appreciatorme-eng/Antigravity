import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getFeatureLimitStatus } from "@/lib/subscriptions/limits";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolveDemoOrg, blockDemoMutation } from "@/lib/auth/demo-org-resolver";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import type { Database } from "@/lib/database.types";
import { ITINERARY_SELECT, TRIP_SELECT } from "@/lib/travel/selects";
import { createLinkedProposalFromItinerary } from "@/lib/proposals/trip-linking";

const TRIPS_READ_RATE_LIMIT_MAX = 120;
const TRIPS_READ_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const TRIPS_WRITE_RATE_LIMIT_MAX = 60;
const TRIPS_WRITE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function sanitizeSearchTerm(input: string): string {
    const safe = sanitizeText(input, { maxLength: 80 });
    if (!safe) return "";
    // Defang PostgREST filter separators/operators in interpolated search strings.
    return safe.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

interface TripListRow {
    id: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    organization_id: string;
    pax_count: number | null;
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

function featureLimitExceededResponse(limitStatus: Awaited<ReturnType<typeof getFeatureLimitStatus>>) {
    return NextResponse.json(
        {
            error: `You've reached your ${limitStatus.limit} ${limitStatus.label} on the ${limitStatus.tier} plan.`,
            code: "FEATURE_LIMIT_EXCEEDED",
            feature: limitStatus.feature,
            tier: limitStatus.tier,
            used: limitStatus.used,
            limit: limitStatus.limit,
            remaining: limitStatus.remaining,
            reset_at: limitStatus.resetAt,
            upgrade_plan: limitStatus.upgradePlan,
            billing_path: "/admin/billing",
        },
        { status: 402 }
    );
}

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;
type ItineraryRow = Database["public"]["Tables"]["itineraries"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];

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

function resolveScopedOrgForRead(
    admin: AdminContext,
    req: NextRequest
): { organizationId: string } | { error: NextResponse } {
    const { searchParams } = new URL(req.url);
    const requestedOrganizationId = sanitizeText(searchParams.get("organization_id"), { maxLength: 80 });

    if (admin.isSuperAdmin) {
        if (!requestedOrganizationId) {
            return {
                error: NextResponse.json(
                    { error: "organization_id query param is required for super admin" },
                    { status: 400 }
                ),
            };
        }
        return { organizationId: requestedOrganizationId };
    }

    if (!admin.organizationId) {
        return { error: NextResponse.json({ error: "Admin organization not configured" }, { status: 400 }) };
    }

    if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
        return { error: NextResponse.json({ error: "Cannot access another organization scope" }, { status: 403 }) };
    }

    return { organizationId: admin.organizationId };
}

export async function GET(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

        const scopedOrg = resolveScopedOrgForRead(admin, req);
        if ("error" in scopedOrg) {
            return scopedOrg.error;
        }

        const demoOverride = resolveDemoOrg(req);
        const effectiveOrgId = demoOverride.isDemoMode && demoOverride.demoOrgId
            ? demoOverride.demoOrgId
            : scopedOrg.organizationId;

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: TRIPS_READ_RATE_LIMIT_MAX,
            windowMs: TRIPS_READ_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:trips:list",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many admin trip list requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all";
        const search = sanitizeSearchTerm(searchParams.get("search") || "");

        let query = admin.adminClient
            .from("trips")
            .select(`
                id,
                status,
                start_date,
                end_date,
                created_at,
                organization_id,
                pax_count,
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
            .eq("organization_id", effectiveOrgId);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        // Note: PostgREST does not support .or() filtering on embedded resource columns.
        // Search is applied client-side after the fetch instead.
        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: "Failed to process trip" }, { status: 400 });
        }

        const trips = ((data || []) as unknown as TripListRow[]).map((t) => {
            const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
            const itinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : t.itineraries;

            return {
                id: t.id,
                status: t.status,
                start_date: t.start_date,
                end_date: t.end_date,
                created_at: t.created_at,
                organization_id: t.organization_id,
                pax_count: t.pax_count,
                profiles: profile ? {
                    full_name: profile.full_name,
                    email: profile.email
                } : null,
                itineraries: itinerary ? {
                    id: itinerary.id,
                    trip_title: itinerary.trip_title,
                    duration_days: itinerary.duration_days,
                    destination: itinerary.destination
                } : null,
                itinerary_id: itinerary?.id || null,
                destination: itinerary?.destination || "TBD",
            };
        });

        const filtered = search
            ? trips.filter((t) => {
                const lc = search.toLowerCase();
                return (
                    (t.itineraries?.trip_title || "").toLowerCase().includes(lc) ||
                    (t.itineraries?.destination || "").toLowerCase().includes(lc) ||
                    (t.profiles?.full_name || "").toLowerCase().includes(lc)
                );
            })
            : trips;

        return NextResponse.json({ trips: filtered });
    } catch {
        return NextResponse.json({ error: "Failed to process trip" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }
        if (!passesMutationCsrfGuard(req)) {
            return NextResponse.json(
                { error: "CSRF validation failed for admin mutation" },
                { status: 403 }
            );
        }

        const demoBlocked = blockDemoMutation(req);
        if (demoBlocked) return demoBlocked;

        const rateLimit = await enforceRateLimit({
            identifier: admin.userId,
            limit: TRIPS_WRITE_RATE_LIMIT_MAX,
            windowMs: TRIPS_WRITE_RATE_LIMIT_WINDOW_MS,
            prefix: "api:admin:trips:write",
        });
        if (!rateLimit.success) {
            const response = NextResponse.json(
                { error: "Too many admin trip mutation requests. Please retry later." },
                { status: 429 }
            );
            return attachRateLimitHeaders(response, rateLimit);
        }

        const body = await req.json();
        const clientId = String(body.clientId || "");
        const startDate = String(body.startDate || "");
        const endDate = String(body.endDate || "");
        const itinerary = body.itinerary || {};
        const createLinkedProposal = body.createLinkedProposal !== false;

        if (!clientId || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (new Date(startDate) > new Date(endDate)) {
            return NextResponse.json({ error: "startDate must be before or equal to endDate" }, { status: 400 });
        }

        const { data: clientProfile } = await admin.adminClient
            .from("profiles")
            .select("organization_id")
            .eq("id", clientId)
            .maybeSingle();

        if (!clientProfile) {
            return NextResponse.json({ error: "Client not found in your organization" }, { status: 404 });
        }
        if (!clientProfile.organization_id) {
            return NextResponse.json({ error: "Client organization is not configured" }, { status: 400 });
        }

        if (!admin.isSuperAdmin) {
            if (!admin.organizationId) {
                return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
            }
            if (clientProfile.organization_id !== admin.organizationId) {
                return NextResponse.json({ error: "Client not found in your organization" }, { status: 404 });
            }
        }

        const tripLimitStatus = await getFeatureLimitStatus(
            admin.adminClient,
            clientProfile.organization_id,
            "trips"
        );
        if (!tripLimitStatus.allowed) {
            return featureLimitExceededResponse(tripLimitStatus);
        }

        const itineraryPayload = {
            user_id: clientId,
            trip_title: itinerary.trip_title || body.title || "New Trip",
            destination: itinerary.destination || body.destination || "TBD",
            summary: itinerary.summary || "",
            duration_days: itinerary.duration_days || 1,
            raw_data: itinerary.raw_data || { days: [] },
        };

        const { data: itineraryData, error: itineraryError } = await admin.adminClient
            .from("itineraries")
            .insert(itineraryPayload)
            .select(ITINERARY_SELECT)
            .single();
        const itineraryRow = itineraryData as unknown as ItineraryRow | null;

        if (itineraryError || !itineraryRow) {
            return NextResponse.json({ error: "Failed to create itinerary" }, { status: 400 });
        }

        const { error: tripError, data: tripData } = await admin.adminClient
            .from("trips")
            .insert({
                client_id: clientId,
                organization_id: clientProfile.organization_id,
                start_date: startDate,
                end_date: endDate,
                status: "pending",
                itinerary_id: itineraryRow.id,
            })
            .select(TRIP_SELECT)
            .single();
        const tripRow = tripData as unknown as TripRow | null;

        if (tripError || !tripRow) {
            return NextResponse.json({ error: "Failed to create trip" }, { status: 400 });
        }

        let proposalId: string | null = null;
        let proposalError: string | null = null;

        if (createLinkedProposal) {
            try {
                const createdProposal = await createLinkedProposalFromItinerary({
                    adminClient: admin.adminClient,
                    organizationId: clientProfile.organization_id,
                    userId: admin.userId,
                    itineraryId: itineraryRow.id,
                    clientId,
                    tripId: tripRow.id,
                    proposalTitle: itineraryPayload.trip_title,
                    basePrice: Number(itineraryPayload.raw_data?.pricing?.total_cost || 0),
                });
                proposalId = createdProposal.proposalId;
            } catch (error) {
                proposalError = error instanceof Error ? error.message : "Failed to create linked proposal";
            }
        }

        return NextResponse.json({
            success: true,
            tripId: tripRow.id,
            itineraryId: itineraryRow.id,
            proposalId,
            proposalError,
        });
    } catch {
        return NextResponse.json({ error: "Failed to process trip" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }
        if (!passesMutationCsrfGuard(req)) {
            return NextResponse.json(
                { error: "CSRF validation failed for admin mutation" },
                { status: 403 }
            );
        }

        const demoBlocked = blockDemoMutation(req);
        if (demoBlocked) return demoBlocked;

        const body = await req.json().catch(() => ({}));
        const action = String(body.action || "");

        if (action !== "backfill_linked_proposals") {
            return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
        }

        if (!admin.organizationId && !admin.isSuperAdmin) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        const requestedTripIds = Array.isArray(body.tripIds)
            ? body.tripIds.map((id: unknown) => String(id)).filter(Boolean)
            : [];

        let query = admin.adminClient
            .from("trips")
            .select("id, client_id, itinerary_id, organization_id");

        if (!admin.isSuperAdmin) {
            query = query.eq("organization_id", admin.organizationId!);
        }

        if (requestedTripIds.length > 0) {
            query = query.in("id", requestedTripIds);
        }

        const { data: trips, error: tripsError } = await query.order("created_at", { ascending: false });
        if (tripsError) {
            return NextResponse.json({ error: "Failed to load trips" }, { status: 500 });
        }

        const results: Array<{ tripId: string; proposalId?: string; status: "created" | "skipped" | "failed"; reason?: string }> = [];

        for (const trip of trips || []) {
            if (!trip.id || !trip.client_id || !trip.itinerary_id || !trip.organization_id) {
                results.push({ tripId: trip.id, status: "skipped", reason: "Missing itinerary or client" });
                continue;
            }

            const { data: existingProposal } = await admin.adminClient
                .from("proposals")
                .select("id")
                .eq("trip_id", trip.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingProposal?.id) {
                results.push({ tripId: trip.id, proposalId: existingProposal.id, status: "skipped", reason: "Already linked" });
                continue;
            }

            try {
                const createdProposal = await createLinkedProposalFromItinerary({
                    adminClient: admin.adminClient,
                    organizationId: trip.organization_id,
                    userId: admin.userId,
                    itineraryId: trip.itinerary_id,
                    clientId: trip.client_id,
                    tripId: trip.id,
                });

                results.push({ tripId: trip.id, proposalId: createdProposal.proposalId, status: "created" });
            } catch (error) {
                results.push({
                    tripId: trip.id,
                    status: "failed",
                    reason: error instanceof Error ? error.message : "Failed to create proposal",
                });
            }
        }

        return NextResponse.json({
            success: true,
            created: results.filter((result) => result.status === "created").length,
            skipped: results.filter((result) => result.status === "skipped").length,
            failed: results.filter((result) => result.status === "failed").length,
            results,
        });
    } catch {
        return NextResponse.json({ error: "Failed to backfill linked proposals" }, { status: 500 });
    }
}
