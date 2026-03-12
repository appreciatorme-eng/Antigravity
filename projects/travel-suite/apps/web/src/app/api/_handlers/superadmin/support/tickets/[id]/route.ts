// GET /api/superadmin/support/tickets/:id -- full ticket detail with user and org info.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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
                "organization_id, organizations(id, name, slug, subscription_tier))"
            )
            .eq("id", id)
            .single();

        if (!result.data) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        const t = result.data as unknown as TicketDetailRow;
        const profile = t.profiles;

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
            organization: profile?.organizations ? {
                id: profile.organizations.id,
                name: profile.organizations.name,
                slug: profile.organizations.slug,
                tier: profile.organizations.subscription_tier,
            } : null,
        });
    } catch (err) {
        console.error(`[superadmin/support/tickets/${id}]`, err);
        return NextResponse.json({ error: "Failed to load ticket" }, { status: 500 });
    }
}
