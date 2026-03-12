// GET /api/superadmin/users/:id — full profile detail with org, trips, proposals, tickets.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
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
        const [profileResult, tripsResult, proposalsResult, ticketsResult] = await Promise.all([
            adminClient
                .from("profiles")
                .select("*, organizations(id, name, slug, subscription_tier, created_at)")
                .eq("id", id)
                .single(),
            adminClient.from("trips").select("id", { count: "exact", head: true }).eq("created_by", id),
            adminClient.from("proposals").select("id", { count: "exact", head: true }).eq("created_by", id),
            adminClient
                .from("support_tickets")
                .select("id, title, status, priority, created_at")
                .eq("user_id", id)
                .order("created_at", { ascending: false })
                .limit(10),
        ]);

        if (!profileResult.data) {
            return apiError("User not found", 404);
        }

        const profile = profileResult.data;
        const org = profile.organizations as {
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
        console.error("[superadmin/users/:id]", err);
        return apiError("Failed to load user", 500);
    }
}
