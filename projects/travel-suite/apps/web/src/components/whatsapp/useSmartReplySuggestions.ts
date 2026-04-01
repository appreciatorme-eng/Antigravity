"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authedFetch } from "@/lib/api/authed-fetch";
import type { Conversation } from "./MessageThread";

type SmartReplyPayload = {
  lastMessages: Array<{
    role: "traveler" | "agent" | "system";
    content: string;
  }>;
  threadContext?: string;
  language?: string;
  channel?: "whatsapp" | "email";
};

function buildPayload(conversation: Conversation, channel?: "whatsapp" | "email"): SmartReplyPayload | null {
  const lastMessages = conversation.messages
    .filter((message) => Boolean(message.body?.trim()))
    .slice(-6)
    .map((message) => ({
      role:
        message.type === "system"
          ? ("system" as const)
          : message.direction === "in"
            ? ("traveler" as const)
            : ("agent" as const),
      content: message.body!.trim(),
    }));

  if (lastMessages.length === 0) {
    return null;
  }

  const threadContext = [
    conversation.contact.name ? `Traveler: ${conversation.contact.name}` : null,
    conversation.contact.trip ? `Trip: ${conversation.contact.trip}` : null,
    conversation.contact.label ? `Label: ${conversation.contact.label}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    lastMessages,
    threadContext: threadContext || undefined,
    channel,
  };
}

export function useSmartReplySuggestions(
  conversation: Conversation | null,
  enabled: boolean,
  language?: string,
  channel?: "whatsapp" | "email",
) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refreshKey = useMemo(() => {
    if (!enabled || !conversation) return null;
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return [
      conversation.id,
      conversation.messages.length,
      lastMessage?.timestamp || "",
      lastMessage?.body || "",
    ].join(":");
  }, [conversation, enabled]);

  const clear = useCallback(() => {
    setSuggestions([]);
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled || !conversation) {
      setSuggestions([]);
      return;
    }

    const payload = buildPayload(conversation, channel);
    if (!payload) {
      setSuggestions([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const payloadWithLang = language && language !== 'English'
        ? { ...payload, language }
        : payload;
      const response = await authedFetch("/api/ai/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWithLang),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Failed to load reply suggestions");
      }

      setSuggestions(Array.isArray(result?.data?.suggestions) ? result.data.suggestions : []);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [conversation, enabled, language, channel]);

  useEffect(() => {
    void refresh();
    return () => abortRef.current?.abort();
  }, [refreshKey, refresh]);

  return {
    suggestions,
    loading,
    clear,
    refresh,
  };
}

