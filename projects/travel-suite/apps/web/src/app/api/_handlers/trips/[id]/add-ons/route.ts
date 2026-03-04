import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createAdminClient();

async function getAuthUserId(req: Request): Promise<string | null> {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && data?.user) return data.user.id;
    } else {
        const serverClient = await createServerClient();
        const {
            data: { user },
        } = await serverClient.auth.getUser();
        return user?.id || null;
    }
    return null;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id?: string }> },
) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id: tripId } = await params;
        if (!tripId) {
            return NextResponse.json(
                { error: "Missing trip id" },
                { status: 400 },
            );
        }

        // Find proposals linked to this trip
        const { data: proposals } = await supabaseAdmin
            .from("proposals")
            .select("id")
            .eq("trip_id", tripId)
            .limit(10);

        if (!proposals || proposals.length === 0) {
            return NextResponse.json({ addOns: [] });
        }

        const proposalIds = proposals.map((p) => p.id);

        // Fetch add-ons for these proposals
        const { data: addOns, error } = await supabaseAdmin
            .from("proposal_add_ons")
            .select(
                "id, name, category, unit_price, quantity, is_selected, description, image_url",
            )
            .in("proposal_id", proposalIds)
            .order("category", { ascending: true });

        if (error) {
            console.error("Failed to fetch trip add-ons:", error);
            return NextResponse.json(
                { error: "Failed to fetch add-ons" },
                { status: 500 },
            );
        }

        return NextResponse.json({ addOns: addOns || [] });
    } catch (error) {
        console.error("Trip add-ons error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id?: string }> },
) {
    try {
        const userId = await getAuthUserId(req);
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        await params; // Consume params

        const body = await req.json().catch(() => null);
        if (!body || !body.addOnId) {
            return NextResponse.json(
                { error: "Missing addOnId" },
                { status: 400 },
            );
        }

        const updates: Record<string, unknown> = {};
        if (body.quantity !== undefined) updates.quantity = Number(body.quantity);
        if (body.unit_price !== undefined)
            updates.unit_price = Number(body.unit_price);
        if (body.is_selected !== undefined)
            updates.is_selected = Boolean(body.is_selected);

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "No updates provided" },
                { status: 400 },
            );
        }

        const { data: updated, error } = await supabaseAdmin
            .from("proposal_add_ons")
            .update(updates)
            .eq("id", body.addOnId)
            .select(
                "id, name, category, unit_price, quantity, is_selected, description, image_url",
            )
            .single();

        if (error) {
            console.error("Failed to update add-on:", error);
            return NextResponse.json(
                { error: "Failed to update add-on" },
                { status: 500 },
            );
        }

        return NextResponse.json({ addOn: updated });
    } catch (error) {
        console.error("Trip add-on update error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
