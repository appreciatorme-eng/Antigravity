import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Define strict types for the database entities we're working with
type ProposalDay = {
    id: string;
    day_number: number;
    title: string;
    description: string;
};

type ProposalActivity = {
    proposal_day_id: string;
    time: string;
    title: string;
    description: string;
    location: string;
    image_url: string;
    price: number;
    is_selected: boolean;
};

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

async function requireAdmin(req: NextRequest) {
    const adminUserId = await getAdminUserId(req);
    if (!adminUserId) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: adminProfile } = await supabaseAdmin
        .from("profiles")
        .select("role, organization_id")
        .eq("id", adminUserId)
        .single();

    if (!adminProfile || adminProfile.role !== "admin") {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    if (!adminProfile.organization_id) {
        return { error: NextResponse.json({ error: "Admin organization not configured" }, { status: 400 }) };
    }

    return { userId: adminUserId, organizationId: adminProfile.organization_id };
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: proposalId } = await params;
        const admin = await requireAdmin(req);
        if ("error" in admin) return admin.error;
        const body = await req.json();
        const startDateStr = String(body.startDate || "");

        if (!startDateStr) {
            return NextResponse.json({ error: "Start date is required" }, { status: 400 });
        }

        // 1. Fetch Proposal with all related data
        const { data: proposal, error: proposalError } = await supabaseAdmin
            .from("proposals")
            .select(`
                *,
                tour_templates(destination)
            `)
            .eq("id", proposalId)
            .eq("organization_id", admin.organizationId)
            .single();

        if (proposalError || !proposal) {
            return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
        }

        // 2. Fetch Days and Activities
        // We fetch days separately to sort them easily
        const { data: daysData, error: daysError } = await supabaseAdmin
            .from("proposal_days")
            .select("*")
            .eq("proposal_id", proposalId)
            .order("day_number", { ascending: true });

        if (daysError) throw daysError;
        const days = (daysData || []) as ProposalDay[];

        // Fetch ALL activities for this proposal in one query
        const dayIds = days.map(d => d.id);
        const { data: activitiesData, error: activitiesError } = await supabaseAdmin
            .from("proposal_activities")
            .select("*")
            .in("proposal_day_id", dayIds)
            .eq("is_selected", true) // Only include selected activities
            .order("display_order", { ascending: true });

        if (activitiesError) throw activitiesError;
        const allActivities = (activitiesData || []) as ProposalActivity[];

        // 3. Construct Itinerary JSON Structure
        const itineraryDays = days.map(day => {
            const dayActivities = allActivities
                .filter(a => a.proposal_day_id === day.id)
                .map(a => ({
                    time: a.time || "TBD",
                    title: a.title,
                    description: a.description || "",
                    location: a.location || "",
                    cost: a.price ? `$${a.price}` : undefined,
                    image: a.image_url
                }));

            return {
                day_number: day.day_number,
                theme: day.title || `Day ${day.day_number}`,
                activities: dayActivities
            };
        });

        const durationDays = days.length;
        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays - 1); // e.g. 1 day trip starts/ends same day

        // 4. Create Itinerary Record
        const itineraryPayload = {
            user_id: proposal.client_id,
            trip_title: proposal.title,
            destination: proposal.tour_templates?.destination || "Unknown Destination",
            summary: `Created from proposal: ${proposal.title}`,
            duration_days: durationDays,
            raw_data: {
                trip_title: proposal.title,
                destination: proposal.tour_templates?.destination || "Unknown Destination",
                days: itineraryDays,
                duration_days: durationDays,
                summary: `Created from proposal: ${proposal.title}`
            },
        };

        const { data: itineraryData, error: insertItineraryError } = await supabaseAdmin
            .from("itineraries")
            .insert(itineraryPayload)
            .select()
            .single();

        if (insertItineraryError || !itineraryData) {
            throw new Error(insertItineraryError?.message || "Failed to create itinerary");
        }

        // 5. Create Trip Record
        const { data: tripData, error: insertTripError } = await supabaseAdmin
            .from("trips")
            .insert({
                client_id: proposal.client_id,
                organization_id: admin.organizationId,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                status: "confirmed", // Auto-confirm since it came from an approved proposal
                itinerary_id: itineraryData.id,
            })
            .select()
            .single();

        if (insertTripError || !tripData) {
            throw new Error(insertTripError?.message || "Failed to create trip");
        }

        // 6. Update Proposal Status
        await supabaseAdmin
            .from("proposals")
            .update({ status: "converted" })
            .eq("id", proposalId);

        return NextResponse.json({
            success: true,
            tripId: tripData.id,
            message: "Proposal successfully converted to trip"
        });

    } catch (error) {
        console.error("Convert proposal error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
