// GET /api/superadmin/support/tickets/:id -- full ticket detail with user and org info.
// PATCH /api/superadmin/support/tickets/:id -- manager controls (ownership/escalation/SLA).

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/observability/logger";
import { getClientIpFromRequest, logPlatformAction } from "@/lib/platform/audit";
import { type EscalationLevel, loadWorkItemMeta, saveWorkItemMeta } from "@/lib/platform/god-mode";

/**
 * The live DB has a support_tickets_user_id_fkey relationship that is not present
 * in the generated Database types. We use an untyped SupabaseClient for the join query.
 */
type UntypedClient = SupabaseClient;

type TicketDetailRow = {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    admin_response: string | null;
    responded_at: string | null;
    responded_by: string | null;
    created_at: string;
    updated_at: string;
    user_id: string;
    profiles: {
        full_name?: string;
        email?: string;
        phone?: string;
        role?: string;
        organization_id?: string;
        organizations?: { id?: string; name?: string; slug?: string; subscription_tier?: string } | null;
    } | null;
};

type OwnerProfileRow = {
    id: string;
    full_name: string | null;
    email: string | null;
};

type PatchBody = {
    claim?: boolean;
    release?: boolean;
    owner_id?: string | null;
    escalation_level?: EscalationLevel;
    sla_due_at?: string | null;
    ops_note?: string | null;
};

const ESCALATION_LEVELS = new Set(["normal", "elevated", "critical"]);

async function readOwnerProfile(db: UntypedClient, ownerId: string | null): Promise<{ id: string; name: string; email: string | null } | null> {
    if (!ownerId) return null;
    const ownerResult = await db
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", ownerId)
        .maybeSingle();
    if (!ownerResult.data) return null;
    const owner = ownerResult.data as OwnerProfileRow;
    return {
        id: owner.id,
        name: owner.full_name?.trim() || owner.email?.trim() || "Unknown",
        email: owner.email,
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const db = auth.adminClient as unknown as UntypedClient;

    try {
        const result = await db
            .from("support_tickets")
            .select(
                "*, profiles!support_tickets_user_id_fkey(full_name, email, phone, role, " +
                "organization_id, organizations(id, name, slug, subscription_tier))",
            )
            .eq("id", id)
            .single();

        if (!result.data) {
            return apiError("Ticket not found", 404);
        }

        const t = result.data as unknown as TicketDetailRow;
        const profile = t.profiles;
        const management = await loadWorkItemMeta(db, "support_ticket", id);
        const owner = await readOwnerProfile(db, management.owner_id);

        return NextResponse.json({
            ticket: {
                id: t.id,
                title: t.title,
                description: t.description,
                category: t.category,
                priority: t.priority,
                status: t.status,
                admin_response: t.admin_response,
                responded_at: t.responded_at,
                responded_by: t.responded_by,
                created_at: t.created_at,
                updated_at: t.updated_at,
            },
            user: {
                id: t.user_id,
                full_name: profile?.full_name ?? null,
                email: profile?.email ?? null,
                phone: profile?.phone ?? null,
                role: profile?.role ?? null,
            },
            organization: profile?.organizations
                ? {
                    id: profile.organizations.id,
                    name: profile.organizations.name,
                    slug: profile.organizations.slug,
                    tier: profile.organizations.subscription_tier,
                }
                : null,
            management: {
                ...management,
                owner,
            },
        });
    } catch (err) {
        logError(`[superadmin/support/tickets/${id}]`, err);
        return apiError("Failed to load ticket", 500);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const db = auth.adminClient as unknown as UntypedClient;

    let body: PatchBody;
    try {
        body = await request.json() as PatchBody;
    } catch {
        return apiError("Invalid JSON body", 400);
    }

    if (body.escalation_level !== undefined && !ESCALATION_LEVELS.has(body.escalation_level)) {
        return apiError("Invalid escalation_level", 400);
    }

    const hasMutableField = [
        body.claim,
        body.release,
        body.owner_id,
        body.escalation_level,
        body.sla_due_at,
        body.ops_note,
    ].some((value) => value !== undefined);

    if (!hasMutableField) return apiError("No fields to update", 400);

    const nextOwnerId = body.claim
        ? auth.userId
        : body.release
            ? null
            : body.owner_id === undefined
                ? undefined
                : (body.owner_id ?? null);

    try {
        if (body.claim) {
            await db
                .from("support_tickets")
                .update({
                    status: "in_progress",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id)
                .eq("status", "open");
        }

        const management = await saveWorkItemMeta(
            db,
            "support_ticket",
            id,
            {
                owner_id: nextOwnerId,
                escalation_level: body.escalation_level,
                sla_due_at: body.sla_due_at,
                ops_note: body.ops_note,
            },
            auth.userId,
        );

        const owner = await readOwnerProfile(db, management.owner_id);
        await logPlatformAction(
            auth.userId,
            "Updated support ticket controls",
            "support",
            {
                ticket_id: id,
                owner_id: management.owner_id,
                escalation_level: management.escalation_level,
                sla_due_at: management.sla_due_at,
            },
            getClientIpFromRequest(request),
        );

        return NextResponse.json({
            ok: true,
            management: {
                ...management,
                owner,
            },
        });
    } catch (err) {
        logError(`[superadmin/support/tickets/${id} PATCH]`, err);
        return apiError("Failed to update ticket controls", 500);
    }
}
