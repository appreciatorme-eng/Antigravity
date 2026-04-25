// GET /api/superadmin/users/signups — signup trend and recent signups list.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { buildGodDataQuality, detectEmptyDrillthrough, pickGodKpiContracts } from "@/lib/platform/god-kpi";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";

function monthStart(): string {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function rangeStart(range: string): string | null {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : null;
    if (!days) return null;
    return new Date(Date.now() - days * 86_400_000).toISOString();
}

const ACCOUNT_SIGNUP_ROLES = ["super_admin", "admin", "team_member", "driver"];

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const params = request.nextUrl.searchParams;
    const range = params.get("range") || "30d";
    const date = params.get("date");
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));
    const since = rangeStart(range);
    const dateStart = date ? `${date}T00:00:00.000Z` : null;
    const dateEnd = date ? `${date}T23:59:59.999Z` : null;

    try {
        type ProfileRow = {
            id: string;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            role: string | null;
            avatar_url: string | null;
            organization_id: string | null;
            created_at: string | null;
        };
        type OrganizationRow = {
            id: string;
            name: string | null;
            subscription_tier: string | null;
        };

        let profilesQuery = adminClient
            .from("profiles")
            .select("id, full_name, email, phone, role, avatar_url, organization_id, created_at", { count: "exact" })
            .in("role", ACCOUNT_SIGNUP_ROLES)
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (since) profilesQuery = profilesQuery.gte("created_at", since);
        if (dateStart && dateEnd) profilesQuery = profilesQuery.gte("created_at", dateStart).lte("created_at", dateEnd);

        const [profilesResult, totalResult, monthResult, orgResult] = await Promise.all([
            profilesQuery,
            adminClient.from("profiles").select("id", { count: "exact", head: true }).in("role", ACCOUNT_SIGNUP_ROLES),
            adminClient.from("profiles").select("id", { count: "exact", head: true }).in("role", ACCOUNT_SIGNUP_ROLES).gte("created_at", monthStart()),
            since
                ? adminClient.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", since)
                : adminClient.from("organizations").select("id", { count: "exact", head: true }),
        ]);

        const profileRows = (profilesResult.data ?? []) as ProfileRow[];
        const organizationIds = Array.from(new Set(
            profileRows
                .map((row) => row.organization_id)
                .filter((value): value is string => Boolean(value)),
        ));
        let organizationLookup = new Map<string, { name: string | null; tier: string | null }>();
        if (organizationIds.length > 0) {
            const orgsResult = await adminClient
                .from("organizations")
                .select("id, name, subscription_tier")
                .in("id", organizationIds);
            organizationLookup = new Map(
                ((orgsResult.data ?? []) as OrganizationRow[]).map((org) => [
                    org.id,
                    { name: org.name, tier: org.subscription_tier },
                ]),
            );
        }

        const recentRows = profileRows.map((p) => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            phone: p.phone,
            role: p.role,
            avatar_url: p.avatar_url,
            org_id: p.organization_id,
            org_name: p.organization_id ? (organizationLookup.get(p.organization_id)?.name ?? null) : null,
            org_tier: p.organization_id ? (organizationLookup.get(p.organization_id)?.tier ?? null) : null,
            created_at: p.created_at,
        }));

        const trendQuery = adminClient
            .from("profiles")
            .select("created_at")
            .in("role", ACCOUNT_SIGNUP_ROLES);
        const trendResult = since
            ? await trendQuery.gte("created_at", since)
            : await trendQuery;

        const byDay: Record<string, number> = {};
        for (const r of (trendResult.data ?? [])) {
            const day = (r.created_at as string).slice(0, 10);
            byDay[day] = (byDay[day] ?? 0) + 1;
        }

        const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 90;
        const trend = Array.from({ length: days }, (_, i) => {
            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
            const key = d.toISOString().slice(0, 10);
            return { date: key, count: byDay[key] ?? 0 };
        });

        const totalInRange = trend.reduce((s, r) => s + r.count, 0);
        const avgDaily = days > 0 ? Number((totalInRange / days).toFixed(1)) : 0;
        const integrityWarnings = [
            detectEmptyDrillthrough({
                kpiId: "signups_in_range",
                label: "Signups in selected range",
                total: totalInRange,
                rows: recentRows.length,
                page,
                filtersApplied: Boolean(date),
            }),
        ].filter((warning) => Boolean(warning));

        if (integrityWarnings.length > 0) {
            await logPlatformAction(
                auth.userId,
                "God mode signups drill-through parity warning",
                "settings",
                {
                    route: "/api/superadmin/users/signups",
                    warnings: integrityWarnings,
                    filters: { range, date, page, limit },
                },
                getClientIpFromRequest(request),
            );
        }

        return NextResponse.json({
            trend,
            recent: recentRows,
            totals: {
                total_users: totalResult.count ?? 0,
                users_in_range: totalInRange,
                orgs_in_range: orgResult.count ?? 0,
                users_this_month: monthResult.count ?? 0,
                avg_daily_signups: avgDaily,
            },
            pagination: {
                page,
                limit,
                total: profilesResult.count ?? 0,
            },
            meta: {
                data_quality: buildGodDataQuality(["profiles", "organizations"]),
                kpi_contracts: pickGodKpiContracts(["total_users", "signups_in_range"]),
                integrity_warnings: integrityWarnings,
            },
        });
    } catch (err) {
        logError("[superadmin/users/signups]", err);
        return apiError("Failed to load signups", 500);
    }
}
