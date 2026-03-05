/* eslint-disable @typescript-eslint/no-explicit-any */
// GET /api/superadmin/referrals/overview — B2B + client flywheel referral summary.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;

    try {
        const db = adminClient as any;
        const [
            b2bResult,
            b2bConvertedResult,
            clientEventsResult,
            clientConvertedResult,
            incentivesResult,
        ] = await Promise.all([
            // B2B referrals total
            db.from("referrals").select("*", { count: "exact", head: true }),
            db.from("referrals").select("*", { count: "exact", head: true }).eq("status", "converted"),
            // Client flywheel events
            db
                .from("client_referral_events")
                .select("id, status, created_at, referrer_id, referred_email")
                .order("created_at", { ascending: false })
                .limit(200),
            db
                .from("client_referral_events")
                .select("*", { count: "exact", head: true })
                .eq("status", "converted"),
            // Incentives issued
            db
                .from("client_referral_incentives")
                .select("amount, currency, tds_applicable, created_at")
                .order("created_at", { ascending: false })
                .limit(500),
        ]);

        // B2B top referrers
        const b2bTopResult = await db
            .from("referrals")
            .select("referrer_org_id, organizations!referrals_referrer_org_id_fkey(name), status")
            .limit(500);

        const referrerMap: Record<string, { name: string; total: number; converted: number }> = {};
        for (const row of (b2bTopResult.data ?? [])) {
            const orgId = row.referrer_org_id as string;
            const org = row.organizations as { name?: string } | null;
            if (!referrerMap[orgId]) {
                referrerMap[orgId] = { name: org?.name ?? orgId, total: 0, converted: 0 };
            }
            referrerMap[orgId].total++;
            if (row.status === "converted") referrerMap[orgId].converted++;
        }

        const topB2bReferrers = Object.entries(referrerMap)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 10)
            .map(([org_id, v]) => ({ org_id, ...v }));

        // Client flywheel aggregation
        const totalClientEvents = (clientEventsResult.data ?? []).length;
        const clientConvertedCount = clientConvertedResult.count ?? 0;

        const recentClientEvents = (clientEventsResult.data ?? []).slice(0, 20).map((e: any) => ({
            id: e.id,
            status: e.status,
            created_at: e.created_at,
            referred_email: e.referred_email,
        }));

        let totalRewardsInr = 0;
        let tdsObligationInr = 0;
        for (const i of (incentivesResult.data ?? [])) {
            const amt = Number(i.amount ?? 0);
            totalRewardsInr += amt;
            if (i.tds_applicable) tdsObligationInr += amt * 0.1;
        }

        const b2bTotal = b2bResult.count ?? 0;
        const b2bConverted = b2bConvertedResult.count ?? 0;

        return NextResponse.json({
            b2b: {
                total: b2bTotal,
                converted: b2bConverted,
                conversion_pct: b2bTotal > 0 ? Number(((b2bConverted / b2bTotal) * 100).toFixed(1)) : 0,
                top_referrers: topB2bReferrers,
            },
            client_flywheel: {
                total_events: totalClientEvents,
                converted_events: clientConvertedCount,
                conversion_pct: totalClientEvents > 0
                    ? Number(((clientConvertedCount / totalClientEvents) * 100).toFixed(1))
                    : 0,
                total_incentives_issued: incentivesResult.data?.length ?? 0,
                total_rewards_inr: Number(totalRewardsInr.toFixed(2)),
                tds_obligation_inr: Number(tdsObligationInr.toFixed(2)),
                recent_events: recentClientEvents,
            },
        });
    } catch (err) {
        console.error("[superadmin/referrals/overview]", err);
        return NextResponse.json({ error: "Failed to load referrals overview" }, { status: 500 });
    }
}
