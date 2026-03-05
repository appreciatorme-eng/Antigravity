/* eslint-disable @typescript-eslint/no-explicit-any */
// GET /api/superadmin/support/tickets/:id — full ticket detail with user and org info.

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const { adminClient } = auth;

    try {
        const result = await (adminClient as any)
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

        const t = result.data;
        const profile = t.profiles as {
            full_name?: string; email?: string; phone?: string; role?: string;
            organization_id?: string;
            organizations?: { id?: string; name?: string; slug?: string; subscription_tier?: string } | null;
        } | null;

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
