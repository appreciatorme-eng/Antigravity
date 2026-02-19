import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

async function requireAdminUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    if (!profile.organization_id) {
        return {
            error: NextResponse.json(
                { error: "Admin organization not configured" },
                { status: 400 }
            ),
        };
    }

    return { user, profile };
}

export async function GET(request: Request) {
    try {
        const auth = await requireAdminUser();
        if ("error" in auth) return auth.error;

        const { data, error } = await (supabaseAdmin as any)
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
    try {
        const auth = await requireAdminUser();
        if ("error" in auth) return auth.error;

        const { orgId, status } = await request.json();
        if (!orgId || (status !== "verified" && status !== "rejected")) {
            return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
        }

        const { data, error } = await (supabaseAdmin as any)
            .from("marketplace_profiles")
            .update({
                verification_status: status,
                is_verified: status === "verified",
            })
            .eq("organization_id", orgId)
            .select()
            .single();

        if (error) throw error;

        // --- ASYNC NOTIFICATION ---
        void (async () => {
            try {
                const { data: orgInfo } = await supabaseAdmin
                    .from("organizations")
                    .select("name, profiles!owner_id(email)")
                    .eq("id", orgId)
                    .single();

                const receiverEmail = (orgInfo as any)?.profiles?.email;

                if (receiverEmail && orgInfo) {
                    const { sendVerificationNotification } = await import("@/lib/marketplace-emails");
                    await sendVerificationNotification({
                        receiverEmail,
                        orgName: orgInfo.name,
                        status: status as 'verified' | 'rejected',
                        settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://itinerary-ai.vercel.app"}/admin/settings/marketplace`
                    });
                }
            } catch (notifyError) {
                console.error("Verification notification failed:", notifyError);
            }
        })();

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
