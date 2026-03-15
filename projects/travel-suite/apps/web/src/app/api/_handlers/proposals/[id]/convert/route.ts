import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/admin";
import { sendBookingConfirmation } from "@/lib/email/notifications";
import { getNextInvoiceNumber } from "@/lib/invoices/module";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { Database } from "@/lib/database.types";
import { ITINERARY_SELECT, TRIP_SELECT } from "@/lib/travel/selects";

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

type ItineraryRow = Database["public"]["Tables"]["itineraries"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type ProposalConvertRow = Pick<
    Database["public"]["Tables"]["proposals"]["Row"],
    "client_id" | "client_selected_price" | "share_token" | "title" | "total_price"
> & {
    tour_templates: { destination?: string | null } | { destination?: string | null }[] | null;
};

const PROPOSAL_CONVERT_SELECT = [
    "client_id",
    "client_selected_price",
    "share_token",
    "title",
    "total_price",
    "tour_templates(destination)",
].join(", ");

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

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: proposalId } = await params;
        const auth = await requireAdmin(req, { requireOrganization: true });
        if (!auth.ok) {
            return auth.response;
        }
        if (!auth.organizationId) {
            return apiError("Admin organization not configured", 400);
        }

        const supabaseAdmin = auth.adminClient;
        const organizationId = auth.organizationId;
        const adminUserId = auth.userId;
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
            .select(PROPOSAL_CONVERT_SELECT)
            .eq("id", proposalId)
            .eq("organization_id", organizationId)
            .single();
        const proposalRow = proposal as unknown as ProposalConvertRow | null;

        if (proposalError || !proposalRow) {
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

        if (!proposalRow.client_id) {
            return apiError("Proposal client is not set", 400);
        }

        const destination = normalizeTemplateDestination(
            proposalRow.tour_templates
        );
        const durationDays = Math.max(1, days.length);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays - 1); // e.g. 1 day trip starts/ends same day

        // 4. Create Itinerary Record
        const itineraryPayload = {
            user_id: proposalRow.client_id,
            trip_title: proposalRow.title,
            destination,
            summary: `Created from proposal: ${proposalRow.title}`,
            duration_days: durationDays,
            raw_data: {
                trip_title: proposalRow.title,
                destination,
                days: itineraryDays,
                duration_days: durationDays,
                summary: `Created from proposal: ${proposalRow.title}`
            },
        };

        const { data: itineraryData, error: insertItineraryError } = await supabaseAdmin
            .from("itineraries")
            .insert(itineraryPayload)
            .select(ITINERARY_SELECT)
            .single();
        const insertedItinerary = itineraryData as unknown as ItineraryRow | null;

        if (insertItineraryError || !insertedItinerary) {
            throw new Error(insertItineraryError?.message || "Failed to create itinerary");
        }

        // 5. Create Trip Record
        const { data: tripData, error: insertTripError } = await supabaseAdmin
            .from("trips")
            .insert({
                client_id: proposalRow.client_id,
                organization_id: organizationId,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                status: "confirmed", // Auto-confirm since it came from an approved proposal
                itinerary_id: insertedItinerary.id,
            })
            .select(TRIP_SELECT)
            .single();
        const insertedTrip = tripData as unknown as TripRow | null;

        if (insertTripError || !insertedTrip) {
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
            const invoiceNumber = await getNextInvoiceNumber(supabaseAdmin, organizationId);
            const totalAmount = Number(proposalRow.client_selected_price ?? proposalRow.total_price ?? 0);
            const { data: invoiceData } = await supabaseAdmin
                .from("invoices")
                .insert({
                    organization_id: organizationId,
                    client_id: proposalRow.client_id || null,
                    trip_id: insertedTrip.id,
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
                .eq("id", proposalRow.client_id)
                .maybeSingle(),
            supabaseAdmin
                .from("profiles")
                .select("full_name, email")
                .eq("id", adminUserId)
                .maybeSingle(),
            supabaseAdmin
                .from("organizations")
                .select("name")
                .eq("id", organizationId)
                .maybeSingle(),
        ]);

        const tripUrl = proposalRow.share_token
            ? `${new URL(req.url).origin}/portal/${proposalRow.share_token}`
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
                tripUrl: `${new URL(req.url).origin}/admin/trips/${insertedTrip.id}`,
            });
        }

        return NextResponse.json({
            success: true,
            tripId: insertedTrip.id,
            invoiceId,
            message: "Proposal successfully converted to trip"
        });

    } catch (error) {
        console.error("Convert proposal error:", error);
        return apiError(safeErrorMessage(error, "Request failed"), 500);
    }
}
