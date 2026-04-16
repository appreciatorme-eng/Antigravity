import { apiSuccess, apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { logError } from "@/lib/observability/logger";
import { sendOpsAlert, sendHitlProposal } from "@/lib/god-slack";

// Lightweight keyword-based AI triage (no LLM cost, runs in-process)
function triageTicket(title: string, description: string, priority: string): {
    type: "urgent_bug" | "howto" | "billing" | "general";
    suggestedResponse: string;
} {
    const text = `${title} ${description}`.toLowerCase();
    // Urgent bug signals
    if (
        priority === "urgent" ||
        ["crash", "down", "broken", "error", "500", "not working", "can't login", "cannot login", "data loss"]
            .some(kw => text.includes(kw))
    ) {
        return { type: "urgent_bug", suggestedResponse: "" };
    }
    // How-to signals
    if (["how", "how do i", "how to", "where do", "how can i", "what is", "steps to"].some(kw => text.includes(kw))) {
        return {
            type: "howto",
            suggestedResponse:
                `Hi! Thanks for reaching out. For your question about "${title}", ` +
                `you can find step-by-step guidance in our Help Center at https://help.travelsuite.app. ` +
                `If you need more help, reply and a human will follow up within 24 hours.`,
        };
    }
    // Billing signals
    if (["invoice", "payment", "billing", "charge", "refund", "subscription", "plan"].some(kw => text.includes(kw))) {
        return {
            type: "billing",
            suggestedResponse:
                `Hi! For billing questions like "${title}", please check your Billing page at /admin/billing. ` +
                `If you see an unexpected charge, reply here and our billing team will investigate within 1 business day.`,
        };
    }
    return { type: "general", suggestedResponse: "" };
}

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
            logError("Error creating ticket", error);
            return apiError("Failed to create support ticket", 500);
        }

        // ── AI Support Triage (Zero Inbox Protocol) ─────────────────────────────
        // Runs synchronously but never blocks the HTTP response (errors are swallowed)
        try {
            const triage = triageTicket(title, description, priority);

            if (triage.type === "urgent_bug") {
                // Immediate Slack ops alert — skip HITL, fire directly
                await sendOpsAlert(
                    `🚨 *Urgent Bug Ticket Filed* by org \`${profile.organization_id}\`\n` +
                    `*Title:* ${title}\n*Description:* ${description.slice(0, 300)}`
                );
            } else if (triage.type === "howto" || triage.type === "billing") {
                // Propose a pre-drafted AI response via Slack HITL
                await sendHitlProposal(
                    `Auto-Respond to Ticket: "${title}"`,
                    `AI classified this as a *${triage.type}* question and drafted the reply below.\n\n*Draft:* ${triage.suggestedResponse}`,
                    `send_ticket_response|ticket:${data?.id}|org:${profile.organization_id}`,
                    "medium"
                );
            }
        } catch (triageErr) {
            logError("AI triage error (non-fatal)", triageErr);
        }
        // ────────────────────────────────────────────────────────────────────────

        return apiSuccess(data);
    } catch (error) {
        logError("Support ticket creation error", error);
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
            logError("Error fetching tickets", error);
            return apiError("Failed to fetch support tickets", 500);
        }

        return apiSuccess(data);
    } catch (error) {
        logError("Support ticket fetch error", error);
        return apiError("Internal Server Error", 500);
    }
}
