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

export async function GET(req: Request) {
    try {
        const { user } = await getAuthContext(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const region = url.searchParams.get("region");
        const specialty = url.searchParams.get("specialty");
        const query = url.searchParams.get("q");

        let supabaseQuery = supabaseAdmin
            .from("marketplace_profiles")
            .select(`
                *,
                organization:organizations!inner(name, logo_url),
                reviews:marketplace_reviews(rating)
            `);

        if (region) {
            supabaseQuery = supabaseQuery.contains("service_regions", [region]);
        }
        if (specialty) {
            supabaseQuery = supabaseQuery.contains("specialties", [specialty]);
        }
        if (query) {
            // Use full-text search on description and ILIKE on organization name
            supabaseQuery = (supabaseQuery as any).or(`organization.name.ilike.%${query}%,search_vector.fts.${query}`);
        }

        const { data, error } = await supabaseQuery;

        if (error) throw error;

        // Process data to include average rating and flatten organization info
        const results = data.map((item: any) => {
            const ratings = item.reviews?.map((r: any) => r.rating) || [];
            const avgRating = ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                : 0;
            return {
                ...item,
                organization_name: item.organization?.name,
                organization_logo: item.organization?.logo_url,
                average_rating: avgRating,
                review_count: ratings.length
            };
        });

        return NextResponse.json(results);
    } catch (error: any) {
        console.error("Marketplace GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { user, profile } = await getAuthContext(req);
        if (!user || !profile) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!profile.organization_id) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 });
        }

        const body = await req.json();
        const { description, service_regions, specialties, margin_rate, request_verification, rate_card, gallery_urls } = body;

        const updates: any = {
            organization_id: profile.organization_id,
            description,
            service_regions: Array.isArray(service_regions) ? service_regions : [],
            specialties: Array.isArray(specialties) ? specialties : [],
            margin_rate: typeof margin_rate === "number" ? margin_rate : null,
            rate_card: Array.isArray(rate_card) ? rate_card : [],
            gallery_urls: Array.isArray(gallery_urls) ? gallery_urls : [],
            updated_at: new Date().toISOString()
        };

        if (request_verification) {
            updates.verification_status = 'pending';
        }

        const { data, error } = await supabaseAdmin
            .from("marketplace_profiles")
            .upsert(updates, { onConflict: "organization_id" })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Marketplace PATCH error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
