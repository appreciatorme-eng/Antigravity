import "server-only";

import { getGeminiModel, parseGeminiJson } from "./gemini.server";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Travel-specific intent categories
// ---------------------------------------------------------------------------

export type TravelIntent =
  | "new_enquiry"
  | "payment_query"
  | "modification"
  | "document"
  | "cancellation"
  | "feedback"
  | "general"
  | "follow_up";

export interface IntentResult {
  readonly intent: TravelIntent;
  readonly confidence: number; // 0-1
}

const INTENT_PROMPT = `You are a travel industry message classifier for an Indian tour operator.

Classify the following message into ONE of these intent categories:

- new_enquiry: New trip enquiry, asking about destinations, packages, dates, pricing
- payment_query: Questions about payment, balance, refund, invoice, receipt
- modification: Requesting changes to existing booking (hotel change, date change, add/remove pax)
- document: Sending or asking about documents (passport, visa, Aadhaar, tickets, vouchers)
- cancellation: Requesting to cancel a trip or booking
- feedback: Review, complaint, appreciation, post-trip feedback
- follow_up: Following up on a previous conversation, asking for status update
- general: Greetings, small talk, unrelated to travel operations

Respond in JSON: {"intent": "<category>", "confidence": <0.0-1.0>}

Message:
`;

// ---------------------------------------------------------------------------
// Public: classifyMessage
// ---------------------------------------------------------------------------

export async function classifyMessage(messageText: string): Promise<IntentResult> {
  const fallback: IntentResult = { intent: "general", confidence: 0.5 };

  if (!messageText || messageText.length < 3) return fallback;

  try {
    const model = getGeminiModel();
    const result = await model.generateContent(INTENT_PROMPT + messageText.slice(0, 500));
    const text = result.response.text();
    const parsed = parseGeminiJson<IntentResult>(text);

    // Validate the intent is one of our known categories
    const validIntents: readonly TravelIntent[] = [
      "new_enquiry", "payment_query", "modification", "document",
      "cancellation", "feedback", "follow_up", "general",
    ];

    if (!validIntents.includes(parsed.intent)) {
      return fallback;
    }

    return {
      intent: parsed.intent,
      confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.7)),
    };
  } catch (err) {
    logError("[classify-intent] Gemini classification failed", err);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Intent display metadata
// ---------------------------------------------------------------------------

export const INTENT_META: Record<TravelIntent, { label: string; emoji: string; color: string; urgency: number }> = {
  cancellation:   { label: "Cancellation",  emoji: "❌", color: "#ef4444", urgency: 1 },
  new_enquiry:    { label: "New Enquiry",   emoji: "🆕", color: "#8b5cf6", urgency: 2 },
  payment_query:  { label: "Payment",       emoji: "💰", color: "#f59e0b", urgency: 3 },
  modification:   { label: "Modification",  emoji: "✏️", color: "#3b82f6", urgency: 4 },
  document:       { label: "Document",      emoji: "📄", color: "#10b981", urgency: 5 },
  follow_up:      { label: "Follow Up",     emoji: "🔄", color: "#6366f1", urgency: 6 },
  feedback:       { label: "Feedback",      emoji: "⭐", color: "#ec4899", urgency: 7 },
  general:        { label: "General",       emoji: "💬", color: "#64748b", urgency: 8 },
};
