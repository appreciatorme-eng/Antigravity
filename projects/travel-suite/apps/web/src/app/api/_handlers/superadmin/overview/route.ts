// GET /api/superadmin/overview — platform KPI summary for the command center.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

function monthStart(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;

    try {
        const [
            { count: totalUsers },
            { count: totalOrgs },
            { count: tripsThisMonth },
            { count: totalProposals },
            { count: openTickets },
            { data: subscriptions },
            signupTrendResult,
        ] = await Promise.all([
            adminClient.from("profiles").select("id", { count: "exact", head: true }),
            adminClient.from("organizations").select("id", { count: "exact", head: true }),
            adminClient.from("trips").select("id", { count: "exact", head: true })
                .gte("created_at", monthStart()),
            adminClient.from("proposals").select("id", { count: "exact", head: true }),
            adminClient.from("support_tickets").select("id", { count: "exact", head: true })
                .eq("status", "open"),
            adminClient.from("subscriptions").select("amount").eq("status", "active"),
            adminClient.from("profiles").select("created_at")
                .gte("created_at", daysAgo(30))
                .order("created_at", { ascending: true }),
        ]);

        const mrr = (subscriptions ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0);

        const signupByDay: Record<string, number> = {};
        for (const row of (signupTrendResult.data ?? [])) {
            const day = (row.created_at as string).slice(0, 10);
            signupByDay[day] = (signupByDay[day] ?? 0) + 1;
        }

        const trend30d = Array.from({ length: 30 }, (_, i) => {
            const d = new Date(Date.now() - (29 - i) * 86_400_000);
            const key = d.toISOString().slice(0, 10);
            return { date: key, signups: signupByDay[key] ?? 0 };
        });

        const signupSparkline = trend30d.slice(-7).map((r) => r.signups);

        return NextResponse.json({
            kpis: {
                total_users: totalUsers ?? 0,
                total_orgs: totalOrgs ?? 0,
                trips_this_month: tripsThisMonth ?? 0,
                total_proposals: totalProposals ?? 0,
                mrr_inr: mrr,
                open_tickets: openTickets ?? 0,
            },
            signup_trend_30d: trend30d,
            signup_sparkline_7d: signupSparkline,
            hrefs: {
                total_users: "/god/signups",
                total_orgs: "/god/directory?role=admin",
                trips_this_month: "/god/analytics?feature=trips",
                mrr_inr: "/god/costs",
                open_tickets: "/god/support",
            },
        });
    } catch (err) {
        console.error("[superadmin/overview]", err);
        return apiError("Failed to load overview", 500);
    }
}
