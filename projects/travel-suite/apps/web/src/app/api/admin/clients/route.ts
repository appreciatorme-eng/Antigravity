import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function getAdminUserId(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && authData?.user) {
            return authData.user.id;
        }
    }

    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    return user?.id || null;
}

export async function POST(req: NextRequest) {
    try {
        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const email = String(body.email || "").trim().toLowerCase();
        const fullName = String(body.full_name || "").trim();
        const phone = String(body.phone || "").trim();
        const normalizedPhone = phone ? phone.replace(/\D/g, "") : "";
        const preferredDestination = String(body.preferredDestination || "").trim();
        const travelStyle = String(body.travelStyle || "").trim();
        const homeAirport = String(body.homeAirport || "").trim();
        const notes = String(body.notes || "").trim();
        const leadStatus = String(body.leadStatus || "").trim();
        const lifecycleStage = String(body.lifecycleStage || "").trim();
        const referralSource = String(body.referralSource || "").trim();
        const sourceChannel = String(body.sourceChannel || "").trim();
        const travelersCount = Number.isFinite(Number(body.travelersCount)) ? Number(body.travelersCount) : null;
        const budgetMin = Number.isFinite(Number(body.budgetMin)) ? Number(body.budgetMin) : null;
        const budgetMax = Number.isFinite(Number(body.budgetMax)) ? Number(body.budgetMax) : null;
        const marketingOptIn = typeof body.marketingOptIn === "boolean" ? body.marketingOptIn : null;
        const interests = Array.isArray(body.interests)
            ? body.interests.map((item: unknown) => String(item).trim()).filter(Boolean)
            : String(body.interests || "")
                .split(",")
                .map((item: string) => item.trim())
                .filter(Boolean);

        if (!email || !fullName) {
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }

        let { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (!existingProfile && normalizedPhone) {
            const { data: phoneProfile } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("phone_normalized", normalizedPhone)
                .maybeSingle();
            existingProfile = phoneProfile ?? null;
        }

        const updates = {
            full_name: fullName,
            phone: phone || null,
            phone_normalized: normalizedPhone || null,
            role: "client",
            organization_id: adminProfile.organization_id ?? null,
            preferred_destination: preferredDestination || null,
            travelers_count: travelersCount,
            budget_min: budgetMin,
            budget_max: budgetMax,
            travel_style: travelStyle || null,
            interests: interests.length ? interests : null,
            home_airport: homeAirport || null,
            notes: notes || null,
            lead_status: leadStatus || "new",
            lifecycle_stage: lifecycleStage || "lead",
            marketing_opt_in: marketingOptIn,
            referral_source: referralSource || null,
            source_channel: sourceChannel || null,
        };

        if (existingProfile?.id) {
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .update(updates)
                .eq("id", existingProfile.id);

            if (profileError) {
                return NextResponse.json({ error: profileError.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, userId: existingProfile.id, status: "updated_existing" });
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
            },
        });

        if (createError || !newUser?.user) {
            return NextResponse.json({ error: createError?.message || "Failed to create user" }, { status: 400 });
        }

        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update(updates)
            .eq("id", newUser.user.id);

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, userId: newUser.user.id });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("id, role, full_name, email, phone, avatar_url, created_at, preferred_destination, travelers_count, budget_min, budget_max, travel_style, interests, home_airport, notes, lead_status, lifecycle_stage, marketing_opt_in, referral_source, source_channel")
            .eq("role", "client")
            .order("created_at", { ascending: false });

        if (profilesError) {
            return NextResponse.json({ error: profilesError.message }, { status: 400 });
        }

        const clientsWithTrips = await Promise.all(
            (profiles || []).map(async (client) => {
                const { count } = await supabaseAdmin
                    .from("trips")
                    .select("*", { count: "exact", head: true })
                    .eq("client_id", client.id);

                return {
                    ...client,
                    trips_count: count || 0,
                };
            })
        );

        return NextResponse.json({ clients: clientsWithTrips });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get("id");

        if (!clientId) {
            return NextResponse.json({ error: "Missing client id" }, { status: 400 });
        }

        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await supabaseAdmin.from("profiles").delete().eq("id", clientId);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(clientId);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const adminUserId = await getAdminUserId(req);
        if (!adminUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", adminUserId)
            .single();

        if (!adminProfile || adminProfile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const profileId = String(body.id || "").trim();
        const role = String(body.role || "").trim();

        if (!profileId) {
            return NextResponse.json({ error: "Profile id is required" }, { status: 400 });
        }

        if (role !== "client" && role !== "driver") {
            return NextResponse.json({ error: "Role must be client or driver" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("profiles")
            .update({ role })
            .eq("id", profileId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, id: profileId, role });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
