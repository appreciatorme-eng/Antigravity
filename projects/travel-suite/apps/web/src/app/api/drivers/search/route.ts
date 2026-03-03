import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/sanitize";

const supabaseAdmin = createAdminClient();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface DriverSearchResult {
    id: string;
    fullName: string;
    phone: string;
    vehicleType: string | null;
    vehiclePlate: string | null;
    photoUrl: string | null;
    todayTripCount: number;
}

function sanitizeSearchTerm(input: string): string {
    const safe = sanitizeText(input, { maxLength: 80 });
    if (!safe) return "";
    return safe.replace(/[%_\\]/g, "").trim();
}

export async function GET(request: NextRequest) {
    try {
        const serverClient = await createServerClient();
        const {
            data: { user },
        } = await serverClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile?.organization_id) {
            return NextResponse.json(
                { error: "No organization" },
                { status: 403 }
            );
        }

        const orgId = profile.organization_id;
        const { searchParams } = new URL(request.url);
        const rawQuery = searchParams.get("q") ?? "";
        const searchTerm = sanitizeSearchTerm(rawQuery);
        const rawLimit = parseInt(searchParams.get("limit") ?? "", 10);
        const limit = Number.isFinite(rawLimit)
            ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
            : DEFAULT_LIMIT;

        let query = supabaseAdmin
            .from("external_drivers")
            .select("id, full_name, phone, vehicle_type, vehicle_plate, photo_url")
            .eq("organization_id", orgId)
            .eq("is_active", true)
            .order("full_name", { ascending: true })
            .limit(limit);

        if (searchTerm) {
            query = query.ilike("full_name", `%${searchTerm}%`);
        }

        const { data: drivers, error } = await query;

        if (error) {
            console.error("Driver search error:", error);
            return NextResponse.json(
                { error: "Failed to search drivers" },
                { status: 500 }
            );
        }

        if (!drivers || drivers.length === 0) {
            return NextResponse.json({ drivers: [] });
        }

        const today = new Date().toISOString().slice(0, 10);
        const driverIds = drivers.map((d) => d.id);

        const { data: assignments, error: assignError } = await supabaseAdmin
            .from("trip_driver_assignments")
            .select(`
                external_driver_id,
                trips:trip_id (
                    start_date
                )
            `)
            .in("external_driver_id", driverIds);

        if (assignError) {
            console.error("Assignment count error:", assignError);
        }

        const todayCountMap = new Map<string, number>();

        if (assignments) {
            for (const assignment of assignments as unknown as Array<{
                external_driver_id: string | null;
                trips: { start_date: string | null } | Array<{ start_date: string | null }> | null;
            }>) {
                if (!assignment.external_driver_id) continue;
                const trip = Array.isArray(assignment.trips)
                    ? assignment.trips[0]
                    : assignment.trips;
                if (trip?.start_date === today) {
                    const current = todayCountMap.get(assignment.external_driver_id) ?? 0;
                    todayCountMap.set(assignment.external_driver_id, current + 1);
                }
            }
        }

        const results: DriverSearchResult[] = drivers.map((driver) => ({
            id: driver.id,
            fullName: driver.full_name,
            phone: driver.phone,
            vehicleType: driver.vehicle_type,
            vehiclePlate: driver.vehicle_plate,
            photoUrl: driver.photo_url,
            todayTripCount: todayCountMap.get(driver.id) ?? 0,
        }));

        return NextResponse.json({ drivers: results });
    } catch (error) {
        console.error("Driver search error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to search drivers",
            },
            { status: 500 }
        );
    }
}
