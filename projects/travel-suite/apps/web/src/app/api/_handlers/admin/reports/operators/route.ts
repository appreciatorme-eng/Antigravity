// Reports — operator bookings.
// Returns trip counts grouped by assigned external driver (operator) in a date range.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { resolveAdminDateRange } from "@/lib/admin/date-range";

interface TripDriverRow {
    external_drivers: { id: string; name: string } | Array<{ id: string; name: string }> | null;
}

function normalizeDriver(
    relation: TripDriverRow["external_drivers"],
): { id: string; name: string } | null {
    if (Array.isArray(relation)) return relation[0] ?? null;
    return relation ?? null;
}

export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        if (!admin.ok) return admin.response;
        if (!admin.organizationId) {
            return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
        }

        const organizationId = resolveScopedOrgWithDemo(request, admin.organizationId);
        if (!organizationId) {
            return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
        }

        const range = resolveAdminDateRange(request.nextUrl.searchParams);

        const { data, error } = await admin.adminClient
            .from("itineraries")
            .select("external_drivers(id, name)")
            .eq("organization_id", organizationId)
            .gte("created_at", range.fromISO)
            .lt("created_at", range.toExclusiveISO);

        if (error) throw error;

        const counts = new Map<string, { name: string; trips: number }>();
        let unassigned = 0;

        for (const row of (data || []) as TripDriverRow[]) {
            const driver = normalizeDriver(row.external_drivers);
            if (!driver) {
                unassigned += 1;
                continue;
            }
            const existing = counts.get(driver.id);
            if (existing) {
                existing.trips += 1;
            } else {
                counts.set(driver.id, { name: driver.name, trips: 1 });
            }
        }

        const operators = Array.from(counts.entries())
            .map(([id, { name, trips }]) => ({ id, name, trips }))
            .sort((a, b) => b.trips - a.trips)
            .slice(0, 20);

        return NextResponse.json({
            operators,
            unassigned,
            range: { from: range.from, to: range.to, label: range.label },
        });
    } catch (error) {
        console.error("[/api/admin/reports/operators:GET] Unhandled error:", error);
        return NextResponse.json(
            { data: null, error: "An unexpected error occurred. Please try again." },
            { status: 500 },
        );
    }
}
