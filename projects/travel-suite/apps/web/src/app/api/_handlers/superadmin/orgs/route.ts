// GET    /api/superadmin/orgs          — list all organizations
// POST   /api/superadmin/orgs          — create new organization
// PATCH  /api/superadmin/orgs/:orgId   — update org tier, name, etc.
// DELETE /api/superadmin/orgs/:orgId   — delete organization (cascade)

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { logPlatformActionWithTarget, getClientIpFromRequest } from "@/lib/platform/audit";

// ---------------------------------------------------------------------------
// GET /api/superadmin/orgs
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;
    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim().toLowerCase() ?? "";
    const limit = Math.min(200, Math.max(10, Number(params.get("limit") || 50)));
    const page = Math.max(0, Number(params.get("page") || 0));

    try {
        let query = db
            .from("organizations")
            .select("id, name, slug, subscription_tier, created_at, updated_at", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        const { data, count, error } = await query;
        if (error) {
            logError("[superadmin/orgs GET]", error);
            return apiError("Failed to load organizations", 500);
        }

        // Get member counts per org
        const orgIds = (data ?? []).map((org: { id: string }) => org.id);
        const memberCounts = new Map<string, number>();
        if (orgIds.length > 0) {
            const { data: profiles } = await db
                .from("profiles")
                .select("organization_id")
                .in("organization_id", orgIds);

            for (const profile of profiles ?? []) {
                const oid = profile.organization_id;
                if (oid) memberCounts.set(oid, (memberCounts.get(oid) ?? 0) + 1);
            }
        }

        const organizations = (data ?? []).map((org: Record<string, unknown>) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            tier: org.subscription_tier ?? "free",
            created_at: org.created_at,
            member_count: memberCounts.get(org.id as string) ?? 0,
        }));

        return NextResponse.json({
            organizations,
            total: count ?? 0,
            page,
            pages: Math.ceil((count ?? 0) / limit),
        });
    } catch (err) {
        logError("[superadmin/orgs GET]", err);
        return apiError("Failed to load organizations", 500);
    }
}

// ---------------------------------------------------------------------------
// POST /api/superadmin/orgs — create new organization
// ---------------------------------------------------------------------------

interface CreateOrgBody {
    name?: string;
    slug?: string;
    subscription_tier?: string;
}

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;

    let body: CreateOrgBody;
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    if (!body.name?.trim()) return apiError("name is required", 400);

    const slug = body.slug?.trim() || body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const tier = body.subscription_tier ?? "free";
    if (!["free", "pro", "enterprise"].includes(tier)) {
        return apiError("Invalid subscription_tier", 400);
    }

    try {
        const { data, error } = await db
            .from("organizations")
            .insert({
                name: body.name.trim(),
                slug,
                subscription_tier: tier,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") return apiError("Organization slug already exists", 409);
            logError("[superadmin/orgs POST]", error);
            return apiError("Failed to create organization", 500);
        }

        await logPlatformActionWithTarget(
            auth.userId,
            `Created organization: ${body.name.trim()}`,
            "org_management",
            "organization",
            data.id,
            { name: body.name, slug, tier },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({ organization: data }, { status: 201 });
    } catch (err) {
        logError("[superadmin/orgs POST]", err);
        return apiError("Failed to create organization", 500);
    }
}

// ---------------------------------------------------------------------------
// PATCH /api/superadmin/orgs/:orgId — update organization
// ---------------------------------------------------------------------------

interface UpdateOrgBody {
    name?: string;
    slug?: string;
    subscription_tier?: string;
}

export async function PATCH(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    const orgId = segments[segments.length - 1];

    if (!orgId || orgId === "orgs") {
        return apiError("Missing org id", 400);
    }

    let body: UpdateOrgBody;
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.slug !== undefined) update.slug = body.slug.trim();
    if (body.subscription_tier !== undefined) {
        if (!["free", "pro", "enterprise"].includes(body.subscription_tier)) {
            return apiError("Invalid subscription_tier", 400);
        }
        update.subscription_tier = body.subscription_tier;
    }

    if (Object.keys(update).length === 0) {
        return apiError("No fields to update", 400);
    }

    try {
        const { data, error } = await db
            .from("organizations")
            .update(update)
            .eq("id", orgId)
            .select()
            .single();

        if (error) {
            if (error.code === "23505") return apiError("Organization slug already exists", 409);
            logError("[superadmin/orgs PATCH]", error);
            return apiError("Failed to update organization", 500);
        }

        await logPlatformActionWithTarget(
            auth.userId,
            `Updated organization: ${data.name}`,
            "org_management",
            "organization",
            orgId,
            { changes: update },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({ organization: data });
    } catch (err) {
        logError("[superadmin/orgs PATCH]", err);
        return apiError("Failed to update organization", 500);
    }
}

// ---------------------------------------------------------------------------
// DELETE /api/superadmin/orgs/:orgId — delete organization
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    const orgId = segments[segments.length - 1];

    if (!orgId || orgId === "orgs") {
        return apiError("Missing org id", 400);
    }

    try {
        // Get org info before deleting
        const { data: org } = await db
            .from("organizations")
            .select("id, name, slug")
            .eq("id", orgId)
            .single();

        if (!org) return apiError("Organization not found", 404);

        // Remove org members' association first
        await db
            .from("profiles")
            .update({ organization_id: null })
            .eq("organization_id", orgId);

        // Delete the organization
        const { error } = await db
            .from("organizations")
            .delete()
            .eq("id", orgId);

        if (error) {
            logError("[superadmin/orgs DELETE]", error);
            return apiError("Failed to delete organization", 500);
        }

        await logPlatformActionWithTarget(
            auth.userId,
            `Deleted organization: ${org.name}`,
            "org_management",
            "organization",
            orgId,
            { name: org.name, slug: org.slug },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({ ok: true, deleted_org: org.name });
    } catch (err) {
        logError("[superadmin/orgs DELETE]", err);
        return apiError("Failed to delete organization", 500);
    }
}
