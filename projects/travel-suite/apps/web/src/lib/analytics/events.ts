"use client";

import { usePostHog } from "posthog-js/react";

export function useAnalytics() {
  const posthog = usePostHog();

  return {
    proposalCreated: (id: string, amount: number) =>
      posthog.capture("proposal_created", { proposal_id: id, amount }),
    proposalApproved: (id: string) =>
      posthog.capture("proposal_approved", { proposal_id: id }),
    paymentInitiated: (token: string, amount: number) =>
      posthog.capture("payment_initiated", { token, amount }),
    paymentCompleted: (token: string, amount: number) =>
      posthog.capture("payment_completed", { token, amount }),
    itineraryGenerated: (destination: string) =>
      posthog.capture("itinerary_generated", { destination }),
    reviewResponded: (platform: string) =>
      posthog.capture("review_responded", { platform }),
    whatsappSent: (type: "thread" | "broadcast") =>
      posthog.capture("whatsapp_message_sent", { type }),
    aiSuggestionUsed: (feature: "reply" | "review_response" | "pricing") =>
      posthog.capture("ai_suggestion_used", { feature }),
  };
}
