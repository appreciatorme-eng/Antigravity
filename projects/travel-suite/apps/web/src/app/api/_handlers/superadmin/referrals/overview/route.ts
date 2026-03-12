// GET /api/superadmin/referrals/overview -- B2B + client flywheel referral summary.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The live DB schema for referrals and client_referral_incentives has columns
 * (referrer_org_id, amount, currency, event_id) and FK hints that differ from
 * the generated Database types. We use an untyped SupabaseClient for these queries.
 */
type UntypedClient = SupabaseClient;

type B2bReferralTopRow = {
    referrer_org_id: string;
    organizations: { name?: string } | null;
    status: string;
};

type ClientEventRow = {
    id: string;
    status: string;
    created_at: string;
    referrer_id: string;
    referred_email: string;
};

type IncentiveRow = {
    amount: number | null;
    currency: string | null;
    tds_applicable: boolean;
    created_at: string;
};

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const db = auth.adminClient as unknown as UntypedClient;

    try {
        const [
            b2bResult,
            b2bConvertedResult,
            clientEventsResult,
            clientConvertedResult,
            incentivesResult,
        ] = await Promise.all([
            // B2B referrals total
            db.from("referrals").select("id", { count: "exact", head: true }),
            db.from("referrals").select("id", { count: "exact", head: true }).eq("status", "converted"),
            // Client flywheel events
            db
                .from("client_referral_events")
                .select("id, status, created_at, referrer_id, referred_email")
                .order("created_at", { ascending: false })
                .limit(200),
            db
                .from("client_referral_events")
                .select("id", { count: "exact", head: true })
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
        for (const row of ((b2bTopResult.data ?? []) as unknown as B2bReferralTopRow[])) {
            const orgId = row.referrer_org_id;
            const org = row.organizations;
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
        const clientEvents = (clientEventsResult.data ?? []) as unknown as ClientEventRow[];
        const totalClientEvents = clientEvents.length;
        const clientConvertedCount = clientConvertedResult.count ?? 0;

        const recentClientEvents = clientEvents.slice(0, 20).map((e) => ({
            id: e.id,
            status: e.status,
            created_at: e.created_at,
            referred_email: e.referred_email,
        }));

        const incentiveRows = (incentivesResult.data ?? []) as unknown as IncentiveRow[];
        let totalRewardsInr = 0;
        let tdsObligationInr = 0;
        for (const i of incentiveRows) {
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
                total_incentives_issued: incentiveRows.length,
                total_rewards_inr: Number(totalRewardsInr.toFixed(2)),
                tds_obligation_inr: Number(tdsObligationInr.toFixed(2)),
                recent_events: recentClientEvents,
            },
        });
    } catch (err) {
        console.error("[superadmin/referrals/overview]", err);
        return apiError("Failed to load referrals overview", 500);
    }
}
