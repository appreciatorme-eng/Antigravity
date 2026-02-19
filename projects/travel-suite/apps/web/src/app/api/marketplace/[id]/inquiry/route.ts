import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: targetOrgId } = await context.params;

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

        const { data: targetProfile } = await (supabase as any)
            .from("marketplace_profiles")
            .select("organization_id")
            .eq("organization_id", targetOrgId)
            .eq("is_verified", true)
            .eq("verification_status", "verified")
            .maybeSingle();

        if (!targetProfile) {
            return NextResponse.json({ error: "Operator not available in marketplace" }, { status: 404 });
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

        // --- ASYNC NOTIFICATION ---
        // Fire and forget (don't block the response)
        void (async () => {
            try {
                // Fetch sender info
                const { data: senderOrg } = await supabase
                    .from("organizations")
                    .select("name")
                    .eq("id", senderOrgId)
                    .single();

                // Fetch receiver owner email
                // Join organizations with profiles via owner_id
                const { data: receiverInfo } = await supabase
                    .from("organizations")
                    .select("name, profiles!owner_id(email)")
                    .eq("id", targetOrgId)
                    .single();

                const receiverEmail = (receiverInfo as any)?.profiles?.email;

                if (receiverEmail && senderOrg) {
                    const { sendInquiryNotification } = await import("@/lib/marketplace-emails");
                    await sendInquiryNotification({
                        receiverEmail,
                        senderOrgName: senderOrg.name,
                        subject: subject || "Partnership Inquiry",
                        message,
                        inquiryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/marketplace/inquiries`
                    });
                }
            } catch (notifyError) {
                console.error("Notification failed:", notifyError);
            }
        })();

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error creating inquiry:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
