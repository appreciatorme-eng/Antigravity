import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sanitizeText } from "@/lib/security/sanitize";

const InquiryCreateSchema = z.object({
    subject: z.string().max(160).optional(),
    message: z.string().min(1).max(5000),
});

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] || null : value;
}

type ReceiverOrgWithOwner = {
    name: string;
    profiles: { email: string | null } | { email: string | null }[] | null;
};

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

        const { data: targetProfile } = await supabase
            .from("marketplace_profiles")
            .select("organization_id")
            .eq("organization_id", targetOrgId)
            .eq("is_verified", true)
            .eq("verification_status", "verified")
            .maybeSingle();

        if (!targetProfile) {
            return NextResponse.json({ error: "Operator not available in marketplace" }, { status: 404 });
        }

        const payloadRaw = await request.json().catch(() => null);
        const parsed = InquiryCreateSchema.safeParse(payloadRaw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid inquiry payload", details: parsed.error.flatten() }, { status: 400 });
        }

        const subject = sanitizeText(parsed.data.subject, { maxLength: 160 }) || "Partnership Inquiry";
        const message = sanitizeText(parsed.data.message, {
            maxLength: 5000,
            preserveNewlines: true,
        });
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("marketplace_inquiries")
            .insert({
                sender_org_id: senderOrgId,
                receiver_org_id: targetOrgId,
                subject,
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
                const { data: receiverInfoData } = await supabase
                    .from("organizations")
                    .select("name, profiles!owner_id(email)")
                    .eq("id", targetOrgId)
                    .single();

                const receiverInfo = (receiverInfoData as ReceiverOrgWithOwner | null) || null;
                const receiverOwner = normalizeRelation(receiverInfo?.profiles || null);
                const receiverEmail = receiverOwner?.email || null;

                if (receiverEmail && senderOrg) {
                    const { sendInquiryNotification } = await import("@/lib/marketplace-emails");
                    await sendInquiryNotification({
                        receiverEmail,
                        senderOrgName: senderOrg.name,
                        subject,
                        message,
                        inquiryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/marketplace/inquiries`
                    });
                }
            } catch (notifyError) {
                console.error("Notification failed:", notifyError);
            }
        })();

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Error creating inquiry:", error);
        const message = error instanceof Error ? error.message : "Failed to create inquiry";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
