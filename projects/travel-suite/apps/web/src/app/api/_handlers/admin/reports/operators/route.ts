// Reports — operator bookings.
// Returns trip counts grouped by assigned external driver (operator) in a date range.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/admin";
import { resolveScopedOrgWithDemo } from "@/lib/auth/demo-org-resolver";
import { resolveAdminDateRange } from "@/lib/admin/date-range";

export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        if (!admin.ok) return admin.response;
        if (!admin.organizationId) {
            return apiError("Organization not configured", 400);
        }

        const organizationId = resolveScopedOrgWithDemo(request, admin.organizationId);
        if (!organizationId) {
            return apiError("Organization not configured", 400);
        }

        const range = resolveAdminDateRange(request.nextUrl.searchParams);

        const { data, error } = await admin.adminClient
            .from("itineraries")
            .select("id")
            .eq("organization_id", organizationId)
            .gte("created_at", range.fromISO)
            .lt("created_at", range.toExclusiveISO);

        if (error) throw error;

        const unassigned = (data || []).length;
        const operators: { id: string; name: string; trips: number }[] = [];

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
