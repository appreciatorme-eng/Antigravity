import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/sanitize";

const supabaseAdmin = createAdminClient();

function sanitizeSearchTerm(input: string): string {
    const safe = sanitizeText(input, { maxLength: 80 });
    if (!safe) return "";
    return safe.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function parseRole(role: string | null | undefined): "admin" | "super_admin" | null {
    const normalized = (role || "").trim().toLowerCase();
    if (normalized === "admin" || normalized === "super_admin") {
        return normalized;
    }
    return null;
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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

            const { data, error } = await query.order("created_at", { ascending: false });

            if (error) return NextResponse.json({ error: error.message }, { status: 400 });

            return NextResponse.json({ trips: data || [] });
        }

        // Staff/Admin access - show organization-scoped trips only.
        const requestedOrganizationId = sanitizeText(searchParams.get("organization_id"), { maxLength: 80 });
        const scopedOrganizationId =
            role === "super_admin" && requestedOrganizationId
                ? requestedOrganizationId
                : profile?.organization_id || null;

        if (!scopedOrganizationId) {
            return NextResponse.json(
                { error: "Admin organization not configured. Super admins must provide organization_id." },
                { status: 400 }
            );
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
