import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: "No organization" }, { status: 403 });
        }

        const orgId = profile.organization_id;

        // Fetch received inquiries
        const { data: received } = await (supabase as any)
            .from("marketplace_inquiries")
            .select(`
                *,
                sender:organizations!sender_org_id(name, logo_url)
            `)
            .eq("receiver_org_id", orgId)
            .order("created_at", { ascending: false });

        // Fetch sent inquiries
        const { data: sent } = await (supabase as any)
            .from("marketplace_inquiries")
            .select(`
                *,
                receiver:organizations!receiver_org_id(name, logo_url)
            `)
            .eq("sender_org_id", orgId)
            .order("created_at", { ascending: false });

        return NextResponse.json({ received, sent });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, status, mark_read } = await request.json();

        const updates: any = {};
        if (status) updates.status = status;
        if (mark_read) updates.read_at = new Date().toISOString();

        const { data, error } = await (supabase as any)
            .from("marketplace_inquiries")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
