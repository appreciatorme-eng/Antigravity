/* ------------------------------------------------------------------
 * POST /api/whatsapp/extract-trip-intent
 * Extracts trip details from a WhatsApp conversation using Gemini AI,
 * saves a whatsapp_proposal_draft, and returns the draft ID.
 * ------------------------------------------------------------------ */

import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { getGeminiModel, parseGeminiJson } from "@/lib/ai/gemini.server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 30;

const BodySchema = z.object({
    waId: z.string().min(7).max(20),
    contactName: z.string().max(200).optional(),
    contactPhone: z.string().max(30).optional(),
    clientId: z.string().uuid().optional(),
});

interface ExtractedIntent {
    destination: string | null;
    trip_start_date: string | null;
    trip_end_date: string | null;
    travel_dates: string | null;
    group_size: number | null;
    budget_inr: number | null;
    traveler_name: string | null;
}

function buildExtractionPrompt(messages: { direction: string; body: string }[]): string {
    const transcript = messages
        .map((m) => `${m.direction === "out" ? "OPERATOR" : "TRAVELER"}: ${m.body}`)
        .join("\n");

    return `You are a travel assistant. Extract trip planning details from this WhatsApp conversation.
Return ONLY a JSON object — no explanation, no markdown fences.

Fields to extract:
- destination: string or null (city/country/region)
- trip_start_date: string or null (ISO date YYYY-MM-DD if determinable, else null)
- trip_end_date: string or null (ISO date YYYY-MM-DD if determinable, else null)
- travel_dates: string or null (free-text date description if exact dates not clear, e.g. "first week of March")
- group_size: number or null (count of travelers)
- budget_inr: number or null (budget in Indian Rupees, numbers only)
- traveler_name: string or null (first name or full name of traveler)

Return null for any field not mentioned in the conversation.

Conversation:
${transcript}`;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.ok) return authResult.response;
        const { userId, organizationId, adminClient } = authResult;

        const rl = await enforceRateLimit({
            identifier: userId,
            limit: 20,
            windowMs: 60_000,
            prefix: "api:whatsapp:extract-trip-intent",
        });
        if (!rl.success) {
            return apiError("Too many requests", 429);
        }

        if (!organizationId) {
            return apiError("Organization not configured", 400);
        }

        const body = await request.json().catch(() => null);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Invalid request body", 400);
        }
        const { waId, contactName, contactPhone, clientId } = parsed.data;

        const baseSessionName = `org_${organizationId.replace(/-/g, "").slice(0, 8)}`;

        // Fetch last 25 messages for this contact
        const { data: events, error: eventsError } = await adminClient
            .from("whatsapp_webhook_events")
            .select("metadata, received_at")
            .filter("metadata->>session", "like", `${baseSessionName}%`)
            .filter("metadata->>wa_id", "eq", waId)
            .eq("event_type", "text")
            .order("received_at", { ascending: false })
            .limit(25);

        // Graceful: if no messages in DB, run extraction with empty context
        const messages: { direction: string; body: string }[] = [];
        if (!eventsError && events && events.length > 0) {
            for (const ev of [...events].reverse()) {
                const meta = ev.metadata as { direction?: string; body_preview?: string } | null;
                const body_text = meta?.body_preview ?? "";
                if (body_text) {
                    messages.push({ direction: meta?.direction ?? "in", body: body_text });
                }
            }
        }

        // Run Gemini extraction
        let extracted: ExtractedIntent = {
            destination: null,
            trip_start_date: null,
            trip_end_date: null,
            travel_dates: null,
            group_size: null,
            budget_inr: null,
            traveler_name: contactName ?? null,
        };

        if (messages.length > 0) {
            try {
                const model = getGeminiModel();
                const result = await model.generateContent(buildExtractionPrompt(messages));
                const raw = result.response.text();
                const geminiResult = parseGeminiJson<ExtractedIntent>(raw);
                extracted = {
                    destination: geminiResult.destination ?? null,
                    trip_start_date: geminiResult.trip_start_date ?? null,
                    trip_end_date: geminiResult.trip_end_date ?? null,
                    travel_dates: geminiResult.travel_dates ?? null,
                    group_size: typeof geminiResult.group_size === "number" ? geminiResult.group_size : null,
                    budget_inr: typeof geminiResult.budget_inr === "number" ? geminiResult.budget_inr : null,
                    traveler_name: geminiResult.traveler_name ?? contactName ?? null,
                };
            } catch {
                // Extraction failed — proceed with name fallback only
                extracted.traveler_name = contactName ?? null;
            }
        }

        const displayPhone = contactPhone ?? `+${waId}`;
        const destination = extracted.destination;
        const draftTitle = destination
            ? `${extracted.traveler_name ?? displayPhone} — ${destination}`
            : `Proposal for ${extracted.traveler_name ?? displayPhone}`;

        // Save draft to DB
        const { data: draft, error: insertError } = await adminClient
            .from("whatsapp_proposal_drafts")
            .insert({
                organization_id: organizationId,
                chatbot_session_id: crypto.randomUUID(),
                client_id: clientId ?? null,
                traveler_name: extracted.traveler_name,
                traveler_phone: displayPhone,
                destination: extracted.destination,
                travel_dates: extracted.travel_dates,
                trip_start_date: extracted.trip_start_date,
                trip_end_date: extracted.trip_end_date,
                group_size: extracted.group_size,
                budget_inr: extracted.budget_inr,
                title: draftTitle,
                source_context: { waId, messageCount: messages.length, extractedByUserId: userId },
                status: "pending",
            })
            .select("id")
            .single();

        if (insertError || !draft) {
            logError("[extract-trip-intent] draft insert failed", insertError);
            return apiError("Failed to save proposal draft", 500);
        }

        return apiSuccess({ draftId: draft.id, extracted });
    } catch (error) {
        logError("[/api/whatsapp/extract-trip-intent:POST] Unhandled error", error);
        return apiError("An unexpected error occurred. Please try again.", 500);
    }
}
