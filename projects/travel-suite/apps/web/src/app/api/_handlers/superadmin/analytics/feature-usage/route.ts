// GET /api/superadmin/analytics/feature-usage — cross-org feature usage aggregate.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

function rangeToMs(range: string): number {
    return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const range = request.nextUrl.searchParams.get("range") || "30d";
    const days = rangeToMs(range);
    const since = daysAgo(days);
    const prevSince = daysAgo(days * 2);

    try {
        const [trips, tripsPrev, proposals, proposalsPrev, aiSessions, aiPrev, socialPosts, socialPrev] =
            await Promise.all([
                adminClient.from("trips").select("*", { count: "exact", head: true }).gte("created_at", since),
                adminClient.from("trips").select("*", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
                adminClient.from("proposals").select("*", { count: "exact", head: true }).gte("created_at", since),
                adminClient.from("proposals").select("*", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
                adminClient.from("assistant_sessions").select("*", { count: "exact", head: true }).gte("created_at", since),
                adminClient.from("assistant_sessions").select("*", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
                adminClient.from("social_posts").select("*", { count: "exact", head: true }).gte("created_at", since),
                adminClient.from("social_posts").select("*", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
            ]);

        function pct(cur: number, prev: number): number {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Number((((cur - prev) / prev) * 100).toFixed(1));
        }

        const [tripsCount, tripsCountPrev] = [trips.count ?? 0, tripsPrev.count ?? 0];
        const [proposalsCount, proposalsCountPrev] = [proposals.count ?? 0, proposalsPrev.count ?? 0];
        const [aiCount, aiCountPrev] = [aiSessions.count ?? 0, aiPrev.count ?? 0];
        const [socialCount, socialCountPrev] = [socialPosts.count ?? 0, socialPrev.count ?? 0];

        const topOrgsResult = await adminClient
            .from("trips")
            .select("organization_id, organizations(name, subscription_tier)", { count: "exact" })
            .gte("created_at", since)
            .limit(500);

        const orgCounts: Record<string, { name: string; tier: string; trips: number }> = {};
        for (const row of (topOrgsResult.data ?? [])) {
            const orgId = row.organization_id as string;
            const org = row.organizations as { name?: string; subscription_tier?: string } | null;
            if (!orgCounts[orgId]) {
                orgCounts[orgId] = { name: org?.name ?? orgId, tier: org?.subscription_tier ?? "free", trips: 0 };
            }
            orgCounts[orgId].trips++;
        }

        const topOrgs = Object.entries(orgCounts)
            .sort(([, a], [, b]) => b.trips - a.trips)
            .slice(0, 10)
            .map(([org_id, v]) => ({ org_id, ...v }));

        return NextResponse.json({
            range,
            features: {
                trips: { total: tripsCount, change_pct: pct(tripsCount, tripsCountPrev) },
                proposals: { total: proposalsCount, change_pct: pct(proposalsCount, proposalsCountPrev) },
                ai_sessions: { total: aiCount, change_pct: pct(aiCount, aiCountPrev) },
                social_posts: { total: socialCount, change_pct: pct(socialCount, socialCountPrev) },
            },
            top_orgs: topOrgs,
        });
    } catch (err) {
        console.error("[superadmin/analytics/feature-usage]", err);
        return NextResponse.json({ error: "Failed to load feature usage" }, { status: 500 });
    }
}
