import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check if user is an admin (simplified check - in real app would use roles)
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        // if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { data, error } = await (supabase as any)
            .from("marketplace_profiles")
            .select(`
                *,
                organization:organizations(name, logo_url)
            `)
            .eq("verification_status", "pending");

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { orgId, status } = await request.json();

        const { data, error } = await (supabase as any)
            .from("marketplace_profiles")
            .update({
                verification_status: status,
                is_verified: status === 'verified'
            })
            .eq("organization_id", orgId)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
