import { apiSuccess, apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

const SUPPORT_TICKET_SELECT = [
    "admin_response",
    "category",
    "created_at",
    "description",
    "id",
    "organization_id",
    "priority",
    "responded_at",
    "responded_by",
    "status",
    "title",
    "updated_at",
    "user_id",
].join(", ");

type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return apiError("Unauthorized", 401);
        }

        // Get organization ID
        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return apiError("No organization found", 400);
        }

        const body = await req.json();
        const { title, description, category, priority } = body;

        if (!title || !description || !category || !priority) {
            return apiError("Missing required fields", 400);
        }

        const { data: ticketData, error } = await supabase
            .from("support_tickets")
            .insert({
                organization_id: profile.organization_id,
                user_id: user.id,
                title,
                description,
                category,
                priority,
                status: 'Open'
            })
            .select(SUPPORT_TICKET_SELECT)
            .single();
        const data = ticketData as unknown as SupportTicketRow | null;

        if (error) {
            console.error("Error creating ticket:", error);
            return apiError("Failed to create support ticket", 500);
        }

        return apiSuccess(data);
    } catch (error) {
        console.error("Support ticket creation error:", error);
        return apiError("Internal Server Error", 500);
    }
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return apiError("Unauthorized", 401);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return apiError("No organization found", 400);
        }

        const { data: ticketsData, error } = await supabase
            .from("support_tickets")
            .select(SUPPORT_TICKET_SELECT)
            .eq("organization_id", profile.organization_id)
            .order("created_at", { ascending: false });
        const data = ticketsData as unknown as SupportTicketRow[] | null;

        if (error) {
            console.error("Error fetching tickets:", error);
            return apiError("Failed to fetch support tickets", 500);
        }

        return apiSuccess(data);
    } catch (error) {
        console.error("Support ticket fetch error:", error);
        return apiError("Internal Server Error", 500);
    }
}
