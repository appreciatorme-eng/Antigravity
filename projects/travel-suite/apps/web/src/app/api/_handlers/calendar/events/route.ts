// Calendar events summary — returns event counts by type for a given month.
// The calendar UI uses direct Supabase queries; this endpoint serves API consumers.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";

function getMonthWindow(year: number, month: number) {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const last = new Date(Date.UTC(year, month, 1));
    return { from: first.toISOString(), to: last.toISOString() };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return apiError("Unauthorized", 401);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile?.organization_id) {
            return apiError("Organization not configured", 400);
        }

        const params = request.nextUrl.searchParams;
        const now = new Date();
        const year = Number(params.get("year") ?? now.getFullYear());
        const month = Number(params.get("month") ?? now.getMonth() + 1);

        if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
            return apiError("Invalid year or month", 400);
        }

        const { from, to } = getMonthWindow(year, month);
        const orgId = profile.organization_id;

        const [tripsResult, proposalsResult, invoicesResult] = await Promise.all([
            supabase
                .from("itineraries")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", orgId)
                .gte("start_date", from.slice(0, 10))
                .lt("start_date", to.slice(0, 10)),
            supabase
                .from("proposals")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", orgId)
                .gte("created_at", from)
                .lt("created_at", to),
            supabase
                .from("invoices")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", orgId)
                .gte("created_at", from)
                .lt("created_at", to),
        ]);

        return NextResponse.json({
            year,
            month,
            summary: {
                trips: tripsResult.count ?? 0,
                proposals: proposalsResult.count ?? 0,
                invoices: invoicesResult.count ?? 0,
            },
        });
    } catch (error) {
        console.error("[/api/calendar/events:GET] Unhandled error:", error);
        return NextResponse.json(
            { data: null, error: "An unexpected error occurred. Please try again." },
            { status: 500 },
        );
    }
}
