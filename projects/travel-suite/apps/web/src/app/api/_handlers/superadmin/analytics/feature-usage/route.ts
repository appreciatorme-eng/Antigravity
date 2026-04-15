// GET /api/superadmin/analytics/feature-usage -- cross-org feature usage aggregate.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages";
import { buildGodDataQuality } from "@/lib/platform/god-kpi";

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
    const db = adminClient;
    const range = request.nextUrl.searchParams.get("range") || "30d";
    const days = rangeToMs(range);
    const since = daysAgo(days);
    const prevSince = daysAgo(days * 2);

    try {
        const [trips, tripsPrev, proposals, proposalsPrev, aiSessions, aiPrev, socialPosts, socialPrev] =
            await Promise.all([
                db.from("trips").select("id", { count: "exact", head: true }).gte("created_at", since),
                db.from("trips").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
                db.from("proposals").select("id", { count: "exact", head: true }).gte("created_at", since),
                db.from("proposals").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
                db.from("assistant_sessions").select("id", { count: "exact", head: true }).gte("created_at", since),
                db.from("assistant_sessions").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
                db.from("social_posts").select("id", { count: "exact", head: true }).gte("created_at", since),
                db.from("social_posts").select("id", { count: "exact", head: true }).gte("created_at", prevSince).lt("created_at", since),
            ]);

        function pct(cur: number, prev: number): number {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Number((((cur - prev) / prev) * 100).toFixed(1));
        }

        const [tripsCount, tripsCountPrev] = [trips.count ?? 0, tripsPrev.count ?? 0];
        const [proposalsCount, proposalsCountPrev] = [proposals.count ?? 0, proposalsPrev.count ?? 0];
        const [aiCount, aiCountPrev] = [aiSessions.count ?? 0, aiPrev.count ?? 0];
        const [socialCount, socialCountPrev] = [socialPosts.count ?? 0, socialPrev.count ?? 0];

        type OrgJoinRow = { organization_id: string | null; organizations: { name?: string; subscription_tier?: string | null } | null };
        const topOrgRows = await fetchAllPages<OrgJoinRow>(async (from, to) => {
            const result = await adminClient
                .from("trips")
                .select("organization_id, organizations(name, subscription_tier)")
                .gte("created_at", since)
                .order("created_at", { ascending: false })
                .range(from, to);
            return {
                data: (result.data ?? []) as OrgJoinRow[],
                error: result.error,
            };
        });

        const orgCounts: Record<string, { name: string; tier: string; trips: number }> = {};
        for (const row of topOrgRows) {
            const orgId = row.organization_id as string;
            if (!orgId) continue;
            const org = row.organizations;
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
            meta: {
                data_quality: buildGodDataQuality(["trips", "proposals", "assistant_sessions", "social_posts"]),
            },
        });
    } catch (err) {
        logError("[superadmin/analytics/feature-usage]", err);
        return apiError("Failed to load feature usage", 500);
    }
}
