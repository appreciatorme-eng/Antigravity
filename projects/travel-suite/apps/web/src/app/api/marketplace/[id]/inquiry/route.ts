import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const targetOrgId = params.id;

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id, role")
            .eq("id", user.id)
            .single();

        if (!profile || !profile.organization_id) {
            return NextResponse.json({ error: "User has no organization" }, { status: 403 });
        }

        const senderOrgId = profile.organization_id;

        if (senderOrgId === targetOrgId) {
            return NextResponse.json({ error: "Cannot send inquiry to your own organization" }, { status: 400 });
        }

        const { subject, message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const { data, error } = await (supabase as any)
            .from("marketplace_inquiries")
            .insert({
                sender_org_id: senderOrgId,
                receiver_org_id: targetOrgId,
                subject: subject || "Partnership Inquiry",
                message,
                status: "pending"
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error creating inquiry:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
