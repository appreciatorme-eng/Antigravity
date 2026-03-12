import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/email/notifications";
import { getNextInvoiceNumber } from "@/lib/invoices/module";
import { safeErrorMessage } from "@/lib/security/safe-error";

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

const supabaseAdmin = createAdminClient();

function normalizeTemplateDestination(
    tourTemplates: { destination?: string | null } | { destination?: string | null }[] | null
): string {
    if (Array.isArray(tourTemplates)) {
        const firstDestination = tourTemplates[0]?.destination;
        return typeof firstDestination === "string" && firstDestination.trim().length > 0
            ? firstDestination.trim()
            : "Unknown Destination";
    }

    if (tourTemplates && typeof tourTemplates.destination === "string" && tourTemplates.destination.trim().length > 0) {
        return tourTemplates.destination.trim();
    }

    return "Unknown Destination";
}

async function getAdminUserId(req: Request) {
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

async function requireAdmin(req: Request) {
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
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: proposalId } = await params;
        const admin = await requireAdmin(req);
        if ("error" in admin) return admin.error;
        const body = await req.json();
        const startDateStr = String(body.startDate || "");

        if (!startDateStr) {
            return apiError("Start date is required", 400);
        }
        const startDate = new Date(startDateStr);
        if (Number.isNaN(startDate.getTime())) {
            return apiError("Invalid start date", 400);
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
            return apiError("Proposal not found", 404);
        }

        // 2. Fetch Days and Activities
        // We fetch days separately to sort them easily
        const { data: daysData, error: daysError } = await supabaseAdmin
            .from("proposal_days")
            .select("id, day_number, title, description")
            .eq("proposal_id", proposalId)
            .order("day_number", { ascending: true });

        if (daysError) throw daysError;
        const days = (daysData || []) as ProposalDay[];
        if (days.length === 0) {
            return apiError("Proposal has no day plan to convert", 400);
        }

        // Fetch ALL activities for this proposal in one query
        const dayIds = days.map(d => d.id);
        let activitiesData: ProposalActivity[] = [];
        if (dayIds.length > 0) {
            const { data, error: activitiesError } = await supabaseAdmin
                .from("proposal_activities")
                .select("proposal_day_id, time, title, description, location, image_url, price, is_selected")
                .in("proposal_day_id", dayIds)
                .eq("is_selected", true) // Only include selected activities
                .order("display_order", { ascending: true });

            if (activitiesError) throw activitiesError;
            activitiesData = (data || []) as ProposalActivity[];
        }
        const allActivities = activitiesData;

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

        if (!proposal.client_id) {
            return apiError("Proposal client is not set", 400);
        }

        const destination = normalizeTemplateDestination(
            proposal.tour_templates as { destination?: string | null } | { destination?: string | null }[] | null
        );
        const durationDays = Math.max(1, days.length);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays - 1); // e.g. 1 day trip starts/ends same day

        // 4. Create Itinerary Record
        const itineraryPayload = {
            user_id: proposal.client_id,
            trip_title: proposal.title,
            destination,
            summary: `Created from proposal: ${proposal.title}`,
            duration_days: durationDays,
            raw_data: {
                trip_title: proposal.title,
                destination,
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

        // 7. Auto-create draft invoice linked to the new trip
        let invoiceId: string | null = null;
        try {
            const invoiceNumber = await getNextInvoiceNumber(supabaseAdmin, admin.organizationId);
            const totalAmount = Number(proposal.client_selected_price ?? proposal.total_price ?? 0);
            const { data: invoiceData } = await supabaseAdmin
                .from("invoices")
                .insert({
                    organization_id: admin.organizationId,
                    client_id: proposal.client_id || null,
                    trip_id: tripData.id,
                    invoice_number: invoiceNumber,
                    status: "draft",
                    total_amount: totalAmount,
                    subtotal_amount: totalAmount,
                    balance_amount: totalAmount,
                    tax_amount: 0,
                })
                .select("id")
                .single();
            if (invoiceData) {
                invoiceId = invoiceData.id;
            }
        } catch (invoiceErr) {
            console.error("Auto-create invoice failed (non-fatal):", invoiceErr);
        }

        const [{ data: travelerProfile }, { data: operatorProfile }, { data: organization }] = await Promise.all([
            supabaseAdmin
                .from("profiles")
                .select("full_name, email")
                .eq("id", proposal.client_id)
                .maybeSingle(),
            supabaseAdmin
                .from("profiles")
                .select("full_name, email")
                .eq("id", admin.userId)
                .maybeSingle(),
            supabaseAdmin
                .from("organizations")
                .select("name")
                .eq("id", admin.organizationId)
                .maybeSingle(),
        ]);

        const tripUrl = proposal.share_token
            ? `${new URL(req.url).origin}/portal/${proposal.share_token}`
            : null;
        const operatorName = operatorProfile?.full_name || organization?.name || "Antigravity Travel";
        const operatorEmail = operatorProfile?.email || null;

        if (travelerProfile?.email) {
            void sendBookingConfirmation({
                to: travelerProfile.email,
                recipientName: travelerProfile.full_name || "Traveler",
                destination,
                startDate: startDate.toISOString().split("T")[0],
                endDate: endDate.toISOString().split("T")[0],
                totalPaid: null,
                operatorName,
                operatorEmail,
                tripUrl,
            });
        }

        if (operatorEmail) {
            void sendBookingConfirmation({
                to: operatorEmail,
                recipientName: operatorName,
                destination,
                startDate: startDate.toISOString().split("T")[0],
                endDate: endDate.toISOString().split("T")[0],
                totalPaid: null,
                operatorName,
                operatorEmail,
                tripUrl: `${new URL(req.url).origin}/admin/trips/${tripData.id}`,
            });
        }

        return NextResponse.json({
            success: true,
            tripId: tripData.id,
            invoiceId,
            message: "Proposal successfully converted to trip"
        });

    } catch (error) {
        console.error("Convert proposal error:", error);
        return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
}
