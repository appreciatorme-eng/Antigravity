"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Loader2, Sparkles, Download, Copy, Check, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    citations?: Array<{ id: string; question: string }>;
    actionResult?: { success: boolean; message: string; data?: unknown };
    actionProposal?: { actionName: string; params: Record<string, unknown>; confirmationMessage: string };
    suggestedActions?: Array<{ label: string; prefilledMessage: string }>;
}

const WELCOME = "Hi! I'm GoBuddy, your operations co-pilot. I can look up live data from your business -- trips, clients, invoices, drivers, proposals. Ask me anything!";

const QUICK_PROMPTS = [
    "What's happening today?",
    "Show me overdue invoices",
    "Any trips without drivers?",
    "Client follow-ups needed",
];

const NUMERIC_KEYS = ["revenue", "amount", "total", "count", "value", "trips", "invoices", "clients"] as const;
const LABEL_KEYS = ["name", "label", "date", "period", "month", "week", "day"] as const;

// --- Inline Markdown Renderer ---

function parseInlineMarkdown(line: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    // Regex matches: **bold**, *italic*, `code`, [text](url)
    const inlinePattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlinePattern.exec(line)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(line.slice(lastIndex, match.index));
        }
        if (match[2] != null) {
            nodes.push(<strong key={match.index}>{match[2]}</strong>);
        } else if (match[3] != null) {
            nodes.push(<em key={match.index}>{match[3]}</em>);
        } else if (match[4] != null) {
            nodes.push(
                <code key={match.index} className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-[11px] font-mono">
                    {match[4]}
                </code>
            );
        } else if (match[5] != null && match[6] != null) {
            nodes.push(
                <a key={match.index} href={match[6]} target="_blank" className="underline text-indigo-500" rel="noreferrer">
                    {match[5]}
                </a>
            );
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
        nodes.push(line.slice(lastIndex));
    }
    return nodes;
}

function MarkdownContent({ text }: { text: string }) {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Heading
        const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
            elements.push(
                <p key={i} className="font-semibold text-sm mt-1 mb-0.5">
                    {parseInlineMarkdown(headingMatch[1])}
                </p>
            );
            i++;
            continue;
        }

        // Unordered list: group consecutive lines starting with - or *
        if (/^[\-\*]\s+/.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
                const content = lines[i].replace(/^[\-\*]\s+/, "");
                items.push(
                    <li key={i} className="ml-4 list-disc text-xs">
                        {parseInlineMarkdown(content)}
                    </li>
                );
                i++;
            }
            elements.push(<ul key={`ul-${i}`}>{items}</ul>);
            continue;
        }

        // Ordered list: group consecutive lines starting with number.
        if (/^\d+\.\s+/.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                const content = lines[i].replace(/^\d+\.\s+/, "");
                items.push(
                    <li key={i} className="ml-4 list-decimal text-xs">
                        {parseInlineMarkdown(content)}
                    </li>
                );
                i++;
            }
            elements.push(<ol key={`ol-${i}`}>{items}</ol>);
            continue;
        }

        // Empty line
        if (line.trim() === "") {
            elements.push(<div key={i} className="h-1.5" />);
            i++;
            continue;
        }

        // Regular paragraph with inline parsing
        elements.push(
            <p key={i} className="text-sm">
                {parseInlineMarkdown(line)}
            </p>
        );
        i++;
    }

    return <div className="space-y-0.5 text-sm leading-relaxed">{elements}</div>;
}

// --- Chart Helpers ---

function isChartData(data: unknown): boolean {
    if (!Array.isArray(data) || data.length < 2 || data.length > 20) return false;
    return data.every((item) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
        const obj = item as Record<string, unknown>;
        return NUMERIC_KEYS.some((key) => typeof obj[key] === "number");
    });
}

function getChartDataKey(obj: Record<string, unknown>): string {
    return NUMERIC_KEYS.find((key) => typeof obj[key] === "number") ?? "value";
}

function getChartLabelKey(obj: Record<string, unknown>): string {
    return LABEL_KEYS.find((key) => key in obj) ?? "name";
}

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
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
            const res = await fetch("/api/assistant/chat/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, history: historyForApi }),
            });

            if (!res.ok || !res.body) {
                // Fallback to non-streaming endpoint
                const fallbackRes = await fetch("/api/assistant/chat", {
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
            const res = await fetch("/api/assistant/export", {
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
            const res = await fetch("/api/assistant/confirm", {
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

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[58]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-panel"
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className={cn(
                            "fixed z-[60]",
                            "bottom-24 right-5 md:bottom-6 md:right-6",
                            "w-[calc(100vw-40px)] max-w-sm",
                            "bg-white dark:bg-[#0d1f38] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700",
                            "flex flex-col overflow-hidden",
                        )}
                        style={{ height: "min(520px, calc(100dvh - 120px))" }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm leading-tight">GoBuddy Assistant</p>
                                <p className="text-white/70 text-xs">Your live business co-pilot</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                aria-label="Close assistant"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-2",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                                        </div>
                                    )}
                                    <div className="max-w-[82%] flex flex-col">
                                        <div
                                            className={cn(
                                                "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                                                msg.role === "user"
                                                    ? "bg-indigo-600 text-white rounded-br-md"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md",
                                                msg.role === "assistant" && "group"
                                            )}
                                        >
                                            {msg.role === "assistant"
                                                ? <MarkdownContent text={msg.content} />
                                                : msg.content
                                            }
                                            {msg.citations && msg.citations.length > 0 && (
                                                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                                                    Source: {msg.citations[0].question}
                                                </p>
                                            )}
                                            {msg.actionResult && (
                                                <div className={cn(
                                                    "mt-2 text-xs px-2 py-1.5 rounded-lg flex items-center justify-between",
                                                    msg.actionResult.success
                                                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                                )}>
                                                    <span>{msg.actionResult.success ? "Action completed successfully" : "Action failed"}</span>
                                                    {msg.actionResult.success && msg.actionResult.data != null && Array.isArray(msg.actionResult.data) && msg.actionResult.data.length > 0 ? (
                                                        <button
                                                            onClick={() => void exportCSV("export", msg.actionResult!.data)}
                                                            className="ml-2 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-800/40 hover:bg-green-200 dark:hover:bg-green-700/40 transition-colors"
                                                            title="Export as CSV"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            CSV
                                                        </button>
                                                    ) : null}
                                                </div>
                                            )}
                                            {msg.actionResult?.success && isChartData(msg.actionResult.data) && (
                                                <div className="mt-2 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 p-2">
                                                    <ResponsiveContainer width="100%" height={100}>
                                                        <BarChart data={msg.actionResult.data as Record<string, unknown>[]}>
                                                            <XAxis dataKey={getChartLabelKey((msg.actionResult.data as Record<string, unknown>[])[0])} tick={{ fontSize: 9 }} />
                                                            <Tooltip contentStyle={{ fontSize: 10 }} />
                                                            <Bar dataKey={getChartDataKey((msg.actionResult.data as Record<string, unknown>[])[0])} fill="#6366f1" radius={[2, 2, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                            {msg.actionProposal && !isLoading && (
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        onClick={() => confirmAction(msg.actionProposal!.actionName, msg.actionProposal!.params, true)}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-medium"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => confirmAction(msg.actionProposal!.actionName, msg.actionProposal!.params, false)}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                            {msg.suggestedActions && msg.suggestedActions.length > 0 && !isLoading && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {msg.suggestedActions.map((action) => (
                                                        <button
                                                            key={action.label}
                                                            onClick={() => void sendMessage(action.prefilledMessage)}
                                                            className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors whitespace-nowrap"
                                                        >
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Copy button for assistant messages (excluding welcome) */}
                                            {msg.role === "assistant" && msg.id !== "welcome" && (
                                                <button
                                                    onClick={() => copyToClipboard(msg.content, msg.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1 p-0.5 rounded"
                                                    aria-label="Copy message"
                                                >
                                                    {copiedId === msg.id
                                                        ? <Check className="w-3 h-3 text-green-500" />
                                                        : <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                        {/* Regenerate button -- last assistant message only, when not loading */}
                                        {msg.role === "assistant" && msg.id === lastAssistantId && msg.id !== "welcome" && !isLoading && (
                                            <button
                                                onClick={regenerateLastMessage}
                                                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1.5 transition-colors"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                Regenerate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isLoading && streamingStatus && (
                                <div className="flex gap-2 justify-start">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
                                        <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{streamingStatus}</span>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Quick prompts -- show only when there's just the welcome message */}
                        {messages.length === 1 && !isLoading && (
                            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                                {displayPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => void sendMessage(prompt)}
                                        className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors whitespace-nowrap"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex items-center gap-2 px-3 py-3 border-t border-slate-200 dark:border-slate-700 shrink-0"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question..."
                                disabled={isLoading}
                                className={cn(
                                    "flex-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5 outline-none",
                                    "text-slate-800 dark:text-slate-100 placeholder:text-slate-400",
                                    "focus:ring-2 focus:ring-indigo-500/40 transition-all",
                                    "disabled:opacity-50"
                                )}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                    "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed",
                                    "shadow-sm hover:shadow-md"
                                )}
                                aria-label="Send message"
                            >
                                {isLoading
                                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    : <Send className="w-4 h-4 text-white" />
                                }
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger bubble */}
            <motion.button
                onClick={() => setIsOpen((o) => !o)}
                whileTap={{ scale: 0.92 }}
                className={cn(
                    "fixed bottom-24 right-5 md:bottom-6 md:right-6 z-[60]",
                    "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-colors duration-200",
                    isOpen
                        ? "bg-slate-700 shadow-slate-900/40"
                        : "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-[0_4px_24px_rgba(99,102,241,0.5)]"
                )}
                aria-label={isOpen ? "Close assistant" : "Open assistant"}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Sparkles className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Unread dot */}
                {hasUnread && !isOpen && (
                    <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                )}
            </motion.button>
        </>
    );
}
