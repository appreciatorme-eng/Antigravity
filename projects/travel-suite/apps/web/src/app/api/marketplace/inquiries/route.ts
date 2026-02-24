import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sanitizeText } from "@/lib/security/sanitize";
import type { Database } from "@/lib/database.types";

const UpdateInquirySchema = z.object({
    id: z.string().min(6).max(80),
    status: z.string().min(2).max(30).optional(),
    mark_read: z.boolean().optional(),
});

type OrganizationSummary = Pick<Database["public"]["Tables"]["organizations"]["Row"], "name" | "logo_url">;

type MarketplaceInquiryWithOrg = Database["public"]["Tables"]["marketplace_inquiries"]["Row"] & {
    sender?: OrganizationSummary | OrganizationSummary[] | null;
    receiver?: OrganizationSummary | OrganizationSummary[] | null;
};

export async function GET(_request: Request) {
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
        const { data: receivedData, error: receivedError } = await supabase
            .from("marketplace_inquiries")
            .select(`
                *,
                sender:organizations!sender_org_id(name, logo_url)
            `)
            .eq("receiver_org_id", orgId)
            .order("created_at", { ascending: false });
        if (receivedError) throw receivedError;

        // Fetch sent inquiries
        const { data: sentData, error: sentError } = await supabase
            .from("marketplace_inquiries")
            .select(`
                *,
                receiver:organizations!receiver_org_id(name, logo_url)
            `)
            .eq("sender_org_id", orgId)
            .order("created_at", { ascending: false });
        if (sentError) throw sentError;

        const received = (receivedData || []) as MarketplaceInquiryWithOrg[];
        const sent = (sentData || []) as MarketplaceInquiryWithOrg[];
        return NextResponse.json({ received, sent });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load marketplace inquiries";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
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
            return NextResponse.json({ error: "Organization not configured" }, { status: 403 });
        }

        const payloadRaw = await request.json().catch(() => null);
        const parsed = UpdateInquirySchema.safeParse(payloadRaw);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid update payload", details: parsed.error.flatten() }, { status: 400 });
        }

        const updates: Database["public"]["Tables"]["marketplace_inquiries"]["Update"] = {};
        const status = sanitizeText(parsed.data.status, { maxLength: 30 });
        if (status) updates.status = status;
        if (parsed.data.mark_read) updates.read_at = new Date().toISOString();
        updates.updated_at = new Date().toISOString();

        if (!updates.status && !updates.read_at) {
            return NextResponse.json({ error: "No changes requested" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("marketplace_inquiries")
            .update(updates)
            .eq("id", parsed.data.id)
            .or(`receiver_org_id.eq.${profile.organization_id},sender_org_id.eq.${profile.organization_id}`)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update marketplace inquiry";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
