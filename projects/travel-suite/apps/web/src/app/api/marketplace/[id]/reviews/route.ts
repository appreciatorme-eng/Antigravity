import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getAuthContext(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("role, organization_id")
                .eq("id", authData.user.id)
                .single();
            return { user: authData.user, profile };
        }
    }

    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (user) {
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();
        return { user, profile };
    }
    return { user: null, profile: null };
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetOrgId } = await context.params;

        const { data, error } = await supabaseAdmin
            .from("marketplace_reviews")
            .select(`
                *,
                reviewer:organizations!reviewer_org_id(name, logo_url)
            `)
            .eq("target_org_id", targetOrgId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Marketplace Review GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const targetOrgId = id;
        const { user, profile } = await getAuthContext(req);
        if (!user || !profile) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const reviewerOrgId = profile.organization_id;

        if (!reviewerOrgId) {
            return NextResponse.json({ error: "Reviewer must belong to an organization" }, { status: 400 });
        }

        if (reviewerOrgId === targetOrgId) {
            return NextResponse.json({ error: "You cannot review your own organization" }, { status: 400 });
        }

        const body = await req.json();
        const { rating, comment } = body;

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("marketplace_reviews")
            .insert({
                reviewer_org_id: reviewerOrgId,
                target_org_id: targetOrgId,
                rating,
                comment,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Marketplace Review POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
