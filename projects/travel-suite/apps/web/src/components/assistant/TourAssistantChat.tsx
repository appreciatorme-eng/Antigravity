"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Message,
    QUICK_PROMPTS,
    WELCOME,
} from "./tour-assistant-helpers";
import { TourAssistantPresentation } from "./TourAssistantPresentation";
import { authedFetch } from "@/lib/api/authed-fetch";

// --- Main Component ---

export default function TourAssistantChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: "welcome", role: "assistant", content: WELCOME },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [customPrompts, setCustomPrompts] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hide FAB when any modal/dialog is open (QA-005)
    useEffect(() => {
        const check = () => setDialogVisible(!!document.querySelector("[role=dialog]"));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    interface SpeechRecognitionLike {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        start: () => void;
        stop: () => void;
    }

    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

    const voiceSupported = typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    function startRecording() {
        const win = window as unknown as Record<string, new () => SpeechRecognitionLike>;
        const SpeechRecognitionImpl = win["SpeechRecognition"] ?? win["webkitSpeechRecognition"];
        if (!SpeechRecognitionImpl) return;

        const recognition = new SpeechRecognitionImpl();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const results = event.results as ArrayLike<ArrayLike<{ transcript: string }>>;
            const transcript = Array.from(results)
                .map((r) => (r as ArrayLike<{ transcript: string }>)[0].transcript)
                .join("");
            setInput(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;
            inputRef.current?.focus();
        };

        recognition.onerror = () => {
            setIsRecording(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
    }

    function stopRecording() {
        recognitionRef.current?.stop();
    }

    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 120);
            setHasUnread(false);
        }
    }, [isOpen]);

    // Close on ESC
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) setIsOpen(false);
    }, [isOpen]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Load custom quick prompts on mount
    useEffect(() => {
        void fetch("/api/assistant/quick-prompts")
            .then((r) => r.ok ? r.json() : { prompts: [] })
            .then((data: { prompts?: string[] }) => {
                const custom = data.prompts ?? [];
                const merged = [...new Set([...custom, ...QUICK_PROMPTS])].slice(0, 8);
                setCustomPrompts(merged);
            })
            .catch(() => {});
    }, []);

    const historyForApi = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

    function copyToClipboard(text: string, id: string) {
        void navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    }

    function regenerateLastMessage() {
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
        if (!lastUserMsg) return;
        const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf("assistant");
        if (lastAssistantIdx < 0) return;
        const trimmed = messages.slice(0, lastAssistantIdx);
        setMessages(trimmed);
        void sendMessage(lastUserMsg.content);
    }

    async function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: "user",
            content: trimmed,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        setStreamingStatus(null);

        // Create a placeholder assistant message for streaming
        const assistantId = `a-${Date.now()}`;
        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

        try {
            const res = await authedFetch("/api/assistant/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, history: historyForApi }),
            });

            if (!res.ok || !res.body) {
                // Fallback to non-streaming endpoint
                const fallbackRes = await authedFetch("/api/assistant/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: trimmed, history: historyForApi }),
                });
                const data = await fallbackRes.json() as {
                    reply?: string;
                    error?: string;
                    citations?: Array<{ id: string; question: string }>;
                    actionResult?: { success: boolean; message: string; data?: unknown };
                    actionProposal?: { actionName: string; params: Record<string, unknown>; confirmationMessage: string };
                    suggestedActions?: Array<{ label: string; prefilledMessage: string }>;
                };
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, content: data.reply ?? data.error ?? "Something went wrong.", citations: data.citations, actionResult: data.actionResult, actionProposal: data.actionProposal, suggestedActions: data.suggestedActions }
                            : m
                    )
                );
                if (!isOpen) setHasUnread(true);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() ?? "";

                for (const block of lines) {
                    const eventMatch = block.match(/^event:\s*(\S+)/m);
                    const dataMatch = block.match(/^data:\s*(.+)$/m);
                    if (!eventMatch || !dataMatch) continue;

                    const eventType = eventMatch[1];
                    let payload: Record<string, unknown> = {};
                    try {
                        payload = JSON.parse(dataMatch[1]) as Record<string, unknown>;
                    } catch {
                        continue;
                    }

                    switch (eventType) {
                        case "status":
                            setStreamingStatus(payload.status as string);
                            break;

                        case "token":
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId
                                        ? { ...m, content: m.content + (payload.token as string) }
                                        : m
                                )
                            );
                            break;

                        case "proposal":
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId
                                        ? {
                                              ...m,
                                              content: (payload.reply as string) || m.content,
                                              actionProposal: {
                                                  actionName: payload.actionName as string,
                                                  params: payload.params as Record<string, unknown>,
                                                  confirmationMessage: payload.confirmationMessage as string,
                                              },
                                          }
                                        : m
                                )
                            );
                            break;

                        case "error":
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId
                                        ? { ...m, content: (payload.message as string) || "Something went wrong." }
                                        : m
                                )
                            );
                            break;

                        case "suggestions":
                            if (payload.suggestedActions) {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantId
                                            ? {
                                                  ...m,
                                                  suggestedActions: payload.suggestedActions as Array<{
                                                      label: string;
                                                      prefilledMessage: string;
                                                  }>,
                                              }
                                            : m
                                    )
                                );
                            }
                            break;

                        case "done":
                            if (payload.suggestedActions) {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantId
                                            ? { ...m, suggestedActions: payload.suggestedActions as Array<{ label: string; prefilledMessage: string }> }
                                            : m
                                    )
                                );
                            }
                            break;
                    }
                }
            }

            if (!isOpen) setHasUnread(true);
        } catch {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, content: "Connection error. Please check your network and try again." }
                        : m
                )
            );
        } finally {
            setIsLoading(false);
            setStreamingStatus(null);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        void sendMessage(input);
    }

    async function exportCSV(actionName: string, data: unknown) {
        try {
            const res = await authedFetch("/api/assistant/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actionName, data }),
            });
            if (!res.ok) return;
            const blob = await res.blob();
            const disposition = res.headers.get("Content-Disposition");
            const filename = disposition?.match(/filename="(.+)"/)?.[1] ?? "export.csv";
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // Silent failure -- export is best-effort
        }
    }

    async function confirmAction(actionName: string, params: Record<string, unknown>, confirmed: boolean) {
        setIsLoading(true);
        try {
            const res = await authedFetch("/api/assistant/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: confirmed ? "confirm" : "cancel",
                    actionName,
                    params,
                }),
            });
            const data = await res.json() as { reply?: string; error?: string; actionResult?: { success: boolean; message: string; data?: unknown } };
            const msg: Message = {
                id: `a-${Date.now()}`,
                role: "assistant",
                content: data.reply ?? data.error ?? "Something went wrong.",
                actionResult: data.actionResult,
            };
            setMessages((prev) => [...prev, msg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { id: `err-${Date.now()}`, role: "assistant", content: "Connection error. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    const lastAssistantId = messages.filter((m) => m.role === "assistant").at(-1)?.id;
    const displayPrompts = customPrompts.length > 0 ? customPrompts : QUICK_PROMPTS;

    // Hide FAB entirely when a modal/dialog is open and chat is closed
    if (dialogVisible && !isOpen) return null;

    return (
        <TourAssistantPresentation
            bottomRef={bottomRef}
            copiedId={copiedId}
            displayPrompts={displayPrompts}
            hasUnread={hasUnread}
            input={input}
            inputRef={inputRef}
            isLoading={isLoading}
            isOpen={isOpen}
            isRecording={isRecording}
            lastAssistantId={lastAssistantId}
            messages={messages}
            streamingStatus={streamingStatus}
            voiceSupported={voiceSupported}
            onClose={() => setIsOpen(false)}
            onConfirmAction={confirmAction}
            onCopy={copyToClipboard}
            onExportCsv={exportCSV}
            onInputChange={setInput}
            onPromptClick={(prompt) => {
                void sendMessage(prompt);
            }}
            onRegenerate={regenerateLastMessage}
            onSubmit={handleSubmit}
            onToggle={() => setIsOpen((open) => !open)}
            onToggleRecording={toggleRecording}
        />
    );
}
