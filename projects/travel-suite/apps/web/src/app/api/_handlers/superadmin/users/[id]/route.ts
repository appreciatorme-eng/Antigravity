// GET    /api/superadmin/users/:id — full profile detail with org, trips, proposals, tickets.
// PATCH  /api/superadmin/users/:id — update role, suspended status, org membership.
// DELETE /api/superadmin/users/:id — permanently remove a user.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { logPlatformActionWithTarget, getClientIpFromRequest } from "@/lib/platform/audit";

// ---------------------------------------------------------------------------
// GET /api/superadmin/users/:id
// ---------------------------------------------------------------------------

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;

    try {
        // Step 1: fetch profile on its own (no join that could silently fail)
        const profileResult = await db
            .from("profiles")
            .select("id, full_name, email, phone, role, avatar_url, organization_id, created_at, is_suspended")
            .eq("id", id)
            .single();

        if (profileResult.error) {
            logError("[superadmin/users/:id GET] profile query error", profileResult.error);
            return apiError(`User not found: ${profileResult.error.message}`, 404);
        }

        if (!profileResult.data) {
            return apiError("User not found", 404);
        }

        const profile = profileResult.data;

        // Step 2: fetch org, trips, proposals, tickets in parallel
        const [orgResult, tripsResult, proposalsResult, ticketsResult] = await Promise.all([
            profile.organization_id
                ? db
                    .from("organizations")
                    .select("id, name, slug, subscription_tier, created_at")
                    .eq("id", profile.organization_id)
                    .single()
                : Promise.resolve({ data: null, error: null }),
            db.from("trips").select("id", { count: "exact", head: true }).eq("created_by", id),
            db.from("proposals").select("id", { count: "exact", head: true }).eq("created_by", id),
            db
                .from("support_tickets")
                .select("id, title, status, priority, created_at")
                .eq("user_id", id)
                .order("created_at", { ascending: false })
                .limit(10),
        ]);

        const org = orgResult.data as {
            id?: string; name?: string; slug?: string;
            subscription_tier?: string; created_at?: string;
        } | null;

        return NextResponse.json({
            profile: {
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone,
                role: profile.role,
                avatar_url: profile.avatar_url,
                created_at: profile.created_at,
                organization_id: profile.organization_id,
                suspended: Boolean(profile.is_suspended),
            },
            organization: org ? {
                id: org.id,
                name: org.name,
                slug: org.slug,
                tier: org.subscription_tier,
                created_at: org.created_at,
            } : null,
            activity: {
                trips: tripsResult.count ?? 0,
                proposals: proposalsResult.count ?? 0,
            },
            support_tickets: ticketsResult.data ?? [],
        });
    } catch (err) {
        logError("[superadmin/users/:id]", err);
        return apiError("Failed to load user", 500);
    }
}

// ---------------------------------------------------------------------------
// PATCH /api/superadmin/users/:id — update role, suspended, org_id
// ---------------------------------------------------------------------------

interface PatchUserBody {
    role?: string;
    suspended?: boolean;
    organization_id?: string | null;
    full_name?: string;
}

const VALID_ROLES = ["super_admin", "admin", "team_member", "driver", "client"];

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;

    let body: PatchUserBody;
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

        const update: Record<string, unknown> = {};

        if (body.role !== undefined) {
            if (!VALID_ROLES.includes(body.role)) {
                return apiError(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`, 400);
            }
            update.role = body.role;
        }
        if (body.suspended !== undefined) {
            update.is_suspended = body.suspended;
        }

    if (body.organization_id !== undefined) {
        update.organization_id = body.organization_id;
    }

    if (body.full_name !== undefined) {
        update.full_name = body.full_name.trim();
    }

    if (Object.keys(update).length === 0) {
        return apiError("No fields to update", 400);
    }

    try {
        // Get current profile for audit log context
        const { data: current } = await db
            .from("profiles")
            .select("full_name, email, role, organization_id, is_suspended")
            .eq("id", id)
            .single();

        if (!current) return apiError("User not found", 404);

        const { data, error } = await db
            .from("profiles")
            .update(update)
            .eq("id", id)
            .select("id, full_name, email, role, organization_id, is_suspended")
            .single();

        if (error) {
            logError("[superadmin/users/:id PATCH]", error);
            return apiError("Failed to update user", 500);
        }

        // Build human-readable change description
        const changes: string[] = [];
        if (body.role !== undefined && body.role !== current.role) {
            changes.push(`role: ${current.role} → ${body.role}`);
        }
        if (body.suspended !== undefined && body.suspended !== current.is_suspended) {
            changes.push(body.suspended ? "suspended user" : "unsuspended user");
        }
        if (body.organization_id !== undefined && body.organization_id !== current.organization_id) {
            changes.push(`org: ${current.organization_id ?? "none"} → ${body.organization_id ?? "none"}`);
        }
        if (body.full_name !== undefined && body.full_name.trim() !== current.full_name) {
            changes.push(`name: ${current.full_name} → ${body.full_name.trim()}`);
        }

        await logPlatformActionWithTarget(
            auth.userId,
            `Updated user: ${current.email ?? current.full_name} (${changes.join(", ")})`,
            "org_management",
            "user",
            id,
            { changes: update, previous: { role: current.role, org_id: current.organization_id, suspended: current.is_suspended } },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({
            profile: {
                ...data,
                suspended: Boolean(data?.is_suspended),
            },
        });
    } catch (err) {
        logError("[superadmin/users/:id PATCH]", err);
        return apiError("Failed to update user", 500);
    }
}

// ---------------------------------------------------------------------------
// DELETE /api/superadmin/users/:id — permanently delete a user
// ---------------------------------------------------------------------------

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;

    try {
        // Get user info before deleting
        const { data: profile } = await db
            .from("profiles")
            .select("id, full_name, email, role, organization_id")
            .eq("id", id)
            .single();

        if (!profile) return apiError("User not found", 404);

        // Prevent deleting yourself
        if (id === auth.userId) {
            return apiError("Cannot delete your own account", 400);
        }

        // Delete profile (auth user will remain in Supabase Auth but profile is removed)
        const { error } = await db.from("profiles").delete().eq("id", id);
        if (error) {
            logError("[superadmin/users/:id DELETE]", error);
            return apiError("Failed to delete user", 500);
        }

        await logPlatformActionWithTarget(
            auth.userId,
            `Deleted user: ${profile.email ?? profile.full_name}`,
            "org_management",
            "user",
            id,
            { email: profile.email, full_name: profile.full_name, role: profile.role },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({ ok: true, deleted_user: profile.email ?? profile.full_name });
    } catch (err) {
        logError("[superadmin/users/:id DELETE]", err);
        return apiError("Failed to delete user", 500);
    }
}
