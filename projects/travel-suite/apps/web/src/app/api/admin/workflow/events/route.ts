import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getAdminUserId(req: NextRequest): Promise<string | null> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.substring(7);
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) return null;

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

    return profile?.role === "admin" ? authData.user.id : null;
}

export async function GET(req: NextRequest) {
    try {
        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("organization_id")
            .eq("id", adminUserId)
            .maybeSingle();
        if (!adminProfile?.organization_id) {
            return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Math.min(Number(searchParams.get("limit") || 30), 100);

        const { data, error } = await supabaseAdmin
            .from("workflow_stage_events")
            .select("id,profile_id,from_stage,to_stage,changed_by,created_at,organization_id")
            .eq("organization_id", adminProfile.organization_id)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const rows = data || [];
        const profileIds = Array.from(
            new Set(
                rows.flatMap((row) => [row.profile_id, row.changed_by].filter(Boolean))
            )
        );

        let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
        if (profileIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
                .from("profiles")
                .select("id,full_name,email")
                .in("id", profileIds);
            profileMap = new Map(
                (profiles || []).map((profile) => [profile.id, { full_name: profile.full_name, email: profile.email }])
            );
        }

        const events = rows.map((row) => ({
            id: row.id,
            profile_id: row.profile_id,
            from_stage: row.from_stage,
            to_stage: row.to_stage,
            created_at: row.created_at,
            profile: row.profile_id ? profileMap.get(row.profile_id) || null : null,
            changed_by_profile: row.changed_by ? profileMap.get(row.changed_by) || null : null,
        }));

        return NextResponse.json({ events });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
