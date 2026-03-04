import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getFeatureLimitStatus } from "@/lib/subscriptions/limits";
import { sanitizeText } from "@/lib/security/sanitize";

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

function attachRateLimitHeaders(
    response: NextResponse,
    rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
): NextResponse {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    response.headers.set("retry-after", String(retryAfterSeconds));
    response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
    response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
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
            .eq("organization_id", scopedOrg.organizationId);

        if (status !== "all") {
            query = query.eq("status", status);
        }

        if (search) {
            query = query.or(`itineraries.trip_title.ilike.%${search}%,profiles.full_name.ilike.%${search}%,itineraries.destination.ilike.%${search}%`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
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

        return NextResponse.json({ trips });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
        }

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

        if (!clientId || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
            trip_title: itinerary.trip_title || "New Trip",
            destination: itinerary.destination || "TBD",
            summary: itinerary.summary || "",
            duration_days: itinerary.duration_days || 1,
            raw_data: itinerary.raw_data || { days: [] },
        };

        const { data: itineraryData, error: itineraryError } = await admin.adminClient
            .from("itineraries")
            .insert(itineraryPayload)
            .select()
            .single();

        if (itineraryError || !itineraryData) {
            return NextResponse.json({ error: itineraryError?.message || "Failed to create itinerary" }, { status: 400 });
        }

        const { error: tripError, data: tripData } = await admin.adminClient
            .from("trips")
            .insert({
                client_id: clientId,
                organization_id: clientProfile.organization_id,
                start_date: startDate,
                end_date: endDate,
                status: "pending",
                itinerary_id: itineraryData.id,
            })
            .select()
            .single();

        if (tripError || !tripData) {
            return NextResponse.json({ error: tripError?.message || "Failed to create trip" }, { status: 400 });
        }

        return NextResponse.json({ success: true, tripId: tripData.id, itineraryId: itineraryData.id });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
