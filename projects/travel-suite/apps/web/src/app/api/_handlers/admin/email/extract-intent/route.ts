/* ------------------------------------------------------------------
 * POST /api/admin/email/extract-intent
 * Extracts trip details from an email thread using Gemini AI,
 * saves a whatsapp_proposal_draft, and returns the draft ID.
 * Port of the WhatsApp extract-trip-intent handler for the email channel.
 * ------------------------------------------------------------------ */

import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { getGeminiModel, parseGeminiJson } from "@/lib/ai/gemini.server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 30;

const MessageSchema = z.object({
    direction: z.enum(["in", "out"]),
    body: z.string().max(5000),
    subject: z.string().max(500).optional(),
});

const BodySchema = z.object({
    messages: z.array(MessageSchema).min(1).max(25),
    contactEmail: z.string().email().optional(),
    contactName: z.string().max(200).optional(),
    contactPhone: z.string().max(30).optional(),
    clientId: z.string().uuid().optional(),
});

interface ExtractedIntent {
    readonly destination: string | null;
    readonly trip_start_date: string | null;
    readonly trip_end_date: string | null;
    readonly travel_dates: string | null;
    readonly group_size: number | null;
    readonly budget_inr: number | null;
    readonly traveler_name: string | null;
}

function buildExtractionPrompt(
    messages: readonly { direction: string; body: string; subject?: string }[],
): string {
    const transcript = messages
        .map((m) => {
            const prefix = m.direction === "out" ? "OPERATOR" : "TRAVELER";
            const subjectLine = m.subject ? ` [Subject: ${m.subject}]` : "";
            return `${prefix}${subjectLine}: ${m.body}`;
        })
        .join("\n");

    return `You are a travel assistant. Extract trip planning details from this email conversation.
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

Email conversation:
${transcript}`;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const authResult = await requireAdmin(request, { requireOrganization: true });
        if (!authResult.ok) return authResult.response;
        const { userId, organizationId, adminClient } = authResult;

        const rl = await enforceRateLimit({
            identifier: userId,
            limit: 20,
            windowMs: 60_000,
            prefix: "api:admin:email:extract-intent",
        });
        if (!rl.success) {
            return apiError("Too many requests", 429);
        }

        const body = await request.json().catch(() => null);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Invalid request body", 400);
        }
        const { messages, contactEmail, contactName, contactPhone, clientId } = parsed.data;

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
            extracted = { ...extracted, traveler_name: contactName ?? null };
        }

        const displayName = contactName ?? contactEmail ?? "Unknown";
        const destination = extracted.destination;
        const draftTitle = destination
            ? `${extracted.traveler_name ?? displayName} — ${destination}`
            : `Proposal for ${extracted.traveler_name ?? displayName}`;

        // Save draft to whatsapp_proposal_drafts (shared table for both channels)
        const { data: draft, error: insertError } = await adminClient
            .from("whatsapp_proposal_drafts")
            .insert({
                organization_id: organizationId!,
                chatbot_session_id: globalThis.crypto.randomUUID(),
                client_id: clientId ?? null,
                traveler_name: extracted.traveler_name,
                traveler_phone: contactPhone ?? null,
                destination: extracted.destination,
                travel_dates: extracted.travel_dates,
                trip_start_date: extracted.trip_start_date,
                trip_end_date: extracted.trip_end_date,
                group_size: extracted.group_size,
                budget_inr: extracted.budget_inr,
                title: draftTitle,
                source_context: {
                    channel: "email",
                    contactEmail: contactEmail ?? null,
                    messageCount: messages.length,
                    extractedByUserId: userId,
                },
                status: "pending",
            })
            .select("id")
            .single();

        if (insertError || !draft) {
            logError("[email/extract-intent] draft insert failed", insertError);
            return apiError("Failed to save proposal draft", 500);
        }

        return apiSuccess({ draftId: draft.id, extracted });
    } catch (error) {
        logError("[/api/admin/email/extract-intent:POST] Unhandled error", error);
        return apiError("An unexpected error occurred. Please try again.", 500);
    }
}
