// GET /api/superadmin/users/directory — searchable paginated directory of all users across orgs.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError, logEvent } from "@/lib/observability/logger";
import { buildGodDataQuality } from "@/lib/platform/god-kpi";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;
    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const role = params.get("role") ?? "all";
    const tier = params.get("tier") ?? "all";
    const page = Math.max(0, Number(params.get("page") || 0));
    const limit = Math.min(100, Math.max(10, Number(params.get("limit") || 50)));

    try {
        let allowedOrgIds: string[] | null = null;
        if (tier !== "all") {
            const orgsResult = await db
                .from("organizations")
                .select("id")
                .eq("subscription_tier", tier);

            if (orgsResult.error) {
                logError("[superadmin/users/directory] tier org lookup failed", orgsResult.error);
                return apiError("Failed to load directory", 500);
            }

            const scopedOrgIds = (orgsResult.data ?? []).map((org: { id: string }) => org.id);
            allowedOrgIds = scopedOrgIds;
            if (scopedOrgIds.length === 0) {
                return NextResponse.json({
                    users: [],
                    total: 0,
                    page,
                    pages: 1,
                    meta: {
                        data_quality: buildGodDataQuality(["profiles", "organizations"]),
                    },
                });
            }
        }

        // Step 1: query profiles with all filters applied before pagination
        let profileQuery = db
            .from("profiles")
            .select("id, full_name, email, phone, role, avatar_url, organization_id, created_at, is_suspended", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (search) {
            profileQuery = profileQuery.or(
                `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
            );
        }
        if (role !== "all") profileQuery = profileQuery.eq("role", role);
        if (allowedOrgIds) profileQuery = profileQuery.in("organization_id", allowedOrgIds);

        const profileResult = await profileQuery;

        if (profileResult.error) {
            logError("[superadmin/users/directory] profiles query failed", profileResult.error);
            return apiError("Failed to load directory", 500);
        }

        const profiles = profileResult.data ?? [];
        const total = profileResult.count ?? 0;

        // Step 2: fetch org details for the returned profiles
        const orgIds = [...new Set(profiles.map((p: { organization_id: string | null }) => p.organization_id).filter(Boolean))] as string[];

        let orgMap: Record<string, { name: string; slug: string; subscription_tier: string | null }> = {};

        if (orgIds.length > 0) {
            let orgQuery = db
                .from("organizations")
                .select("id, name, slug, subscription_tier")
                .in("id", orgIds);

            const orgResult = await orgQuery;
            if (orgResult.error) {
                logEvent("warn", "[superadmin/users/directory] orgs query failed", { error: orgResult.error });
                // Continue — org data is non-critical
            } else {
                for (const org of orgResult.data ?? []) {
                    orgMap[org.id] = { name: org.name, slug: org.slug ?? "", subscription_tier: org.subscription_tier ?? null };
                }
            }
        }

        const rows = profiles.map((p: {
            id: string;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            role: string | null;
            avatar_url: string | null;
            organization_id: string | null;
            created_at: string | null;
            is_suspended?: boolean | null;
        }) => {
            const org = p.organization_id ? orgMap[p.organization_id] ?? null : null;
            return {
                id: p.id,
                full_name: p.full_name,
                email: p.email,
                phone: p.phone,
                role: p.role,
                avatar_url: p.avatar_url,
                org_id: p.organization_id,
                org_name: org?.name ?? null,
                org_slug: org?.slug ?? null,
                org_tier: org?.subscription_tier ?? null,
                created_at: p.created_at,
                is_suspended: Boolean(p.is_suspended),
            };
        });

        return NextResponse.json({
            users: rows,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
            meta: {
                data_quality: buildGodDataQuality(["profiles", "organizations"]),
            },
        });
    } catch (err) {
        logError("[superadmin/users/directory]", err);
        return apiError("Failed to load directory", 500);
    }
}
