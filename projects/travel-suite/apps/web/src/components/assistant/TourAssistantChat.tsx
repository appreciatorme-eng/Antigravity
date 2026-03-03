"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Loader2, Sparkles, Download, Copy, Check, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
// cn utility no longer needed -- all styles use inline className strings and style objects

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
                <code key={match.index} className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd" }}>
                    {match[4]}
                </code>
            );
        } else if (match[5] != null && match[6] != null) {
            nodes.push(
                <a key={match.index} href={match[6]} target="_blank" className="underline" style={{ color: "#67e8f9" }} rel="noreferrer">
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
            <style>{`
                @keyframes gb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes gb-cursor { 0%,100% { opacity:1; } 50% { opacity:0; } }
                @keyframes gb-dot { 0%,80%,100% { transform:scale(0.55); opacity:0.35; } 40% { transform:scale(1); opacity:1; } }
                @keyframes gb-pulse-ring { 0% { transform:scale(1); opacity:0.7; } 100% { transform:scale(1.7); opacity:0; } }
                .gb-spin { animation: gb-spin 5s linear infinite; }
                .gb-cursor { animation: gb-cursor 0.9s ease infinite; display:inline-block; }
                .gb-dot-1 { animation: gb-dot 1.3s ease infinite 0s; }
                .gb-dot-2 { animation: gb-dot 1.3s ease infinite 0.22s; }
                .gb-dot-3 { animation: gb-dot 1.3s ease infinite 0.44s; }
                .gb-scroll::-webkit-scrollbar { width:3px; }
                .gb-scroll::-webkit-scrollbar-track { background:transparent; }
                .gb-scroll::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.28); border-radius:99px; }
                .gb-scroll::-webkit-scrollbar-thumb:hover { background:rgba(139,92,246,0.5); }
            `}</style>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[58]"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="chat-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className="fixed z-[60] bottom-24 right-5 md:bottom-6 md:right-6 flex flex-col overflow-hidden"
                        style={{
                            width: "min(420px, calc(100vw - 32px))",
                            height: "min(600px, calc(100dvh - 110px))",
                            background: "#060d1a",
                            border: "1px solid rgba(124,58,237,0.22)",
                            borderRadius: 20,
                            boxShadow: "0 32px 80px -8px rgba(0,0,0,0.85), 0 0 0 1px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center gap-3 px-4 py-3 shrink-0"
                            style={{
                                background: "rgba(124,58,237,0.07)",
                                borderBottom: "1px solid rgba(124,58,237,0.15)",
                            }}
                        >
                            {/* Animated avatar orb */}
                            <div className="relative shrink-0" style={{ width: 36, height: 36 }}>
                                {/* Spinning ring */}
                                <div
                                    className="absolute inset-0 rounded-full gb-spin"
                                    style={{ background: "conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)", padding: 2 }}
                                >
                                    <div className="w-full h-full rounded-full" style={{ background: "#0a1228" }} />
                                </div>
                                {/* Icon */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm leading-tight" style={{ color: "#f0f0ff" }}>GoBuddy</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
                                    <p className="text-xs" style={{ color: "#8892a4" }}>Operations AI · Live data</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center rounded-lg transition-all duration-150 w-7 h-7"
                                style={{ background: "rgba(255,255,255,0.05)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                aria-label="Close assistant"
                            >
                                <X className="w-3.5 h-3.5" style={{ color: "#8892a4" }} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 gb-scroll">
                            {messages.map((msg) =>
                                msg.role === "user" ? (
                                    <div key={msg.id} className="flex justify-end">
                                        <motion.div
                                            initial={{ opacity: 0, x: 12, scale: 0.96 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="max-w-[78%]"
                                        >
                                            <div
                                                className="px-4 py-2.5 text-sm leading-relaxed text-white"
                                                style={{
                                                    background: "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)",
                                                    borderRadius: "16px 16px 4px 16px",
                                                    boxShadow: "0 2px 12px rgba(124,58,237,0.3)",
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                        </motion.div>
                                    </div>
                                ) : (
                                    <div key={msg.id} className="flex gap-2.5 justify-start">
                                        {/* Mini orb avatar */}
                                        <div className="relative shrink-0 mt-1" style={{ width: 26, height: 26 }}>
                                            <div
                                                className="absolute inset-0 rounded-full gb-spin"
                                                style={{ background: "conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)", padding: 1.5 }}
                                            >
                                                <div className="w-full h-full rounded-full" style={{ background: "#0a1228" }} />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Bot className="w-3 h-3" style={{ color: "#a78bfa" }} />
                                            </div>
                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0, x: -12, scale: 0.96 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="max-w-[82%] flex flex-col"
                                        >
                                            <div
                                                className="px-4 py-3 text-sm leading-relaxed group"
                                                style={{
                                                    background: "rgba(255,255,255,0.028)",
                                                    border: "1px solid rgba(124,58,237,0.13)",
                                                    borderLeft: "2px solid rgba(124,58,237,0.45)",
                                                    borderRadius: "16px 16px 16px 4px",
                                                    color: "#dde1f0",
                                                }}
                                            >
                                                <MarkdownContent text={msg.content} />
                                                {/* Streaming cursor */}
                                                {isLoading && msg.id === lastAssistantId && msg.content.length > 0 && (
                                                    <span className="gb-cursor ml-0.5 w-[2px] h-[13px] align-middle" style={{ background: "#a78bfa", borderRadius: 1 }} />
                                                )}

                                                {/* Citations */}
                                                {msg.citations && msg.citations.length > 0 && (
                                                    <p className="mt-2 text-[10px] leading-tight" style={{ color: "#8892a4" }}>
                                                        Source: {msg.citations[0].question}
                                                    </p>
                                                )}

                                                {/* Action result banner */}
                                                {msg.actionResult && (
                                                    <div
                                                        className="mt-2.5 text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2"
                                                        style={
                                                            msg.actionResult.success
                                                                ? { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }
                                                                : { background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }
                                                        }
                                                    >
                                                        <span>{msg.actionResult.success ? "\u2713 Action completed" : "\u2717 Action failed"}</span>
                                                        {msg.actionResult.success && msg.actionResult.data != null && Array.isArray(msg.actionResult.data) && msg.actionResult.data.length > 0 ? (
                                                            <button
                                                                onClick={() => void exportCSV("export", msg.actionResult!.data)}
                                                                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg transition-all"
                                                                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
                                                                title="Export as CSV"
                                                            >
                                                                <Download className="w-2.5 h-2.5" />
                                                                CSV
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                )}

                                                {/* Inline chart */}
                                                {msg.actionResult?.success && isChartData(msg.actionResult.data) && (
                                                    <div className="mt-2.5 rounded-xl overflow-hidden p-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(124,58,237,0.1)" }}>
                                                        <ResponsiveContainer width="100%" height={90}>
                                                            <BarChart data={msg.actionResult.data as Record<string, unknown>[]}>
                                                                <XAxis dataKey={getChartLabelKey((msg.actionResult.data as Record<string, unknown>[])[0])} tick={{ fontSize: 9, fill: "#8892a4" }} axisLine={false} tickLine={false} />
                                                                <Tooltip
                                                                    contentStyle={{ background: "#0a1228", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 8, fontSize: 10, color: "#dde1f0" }}
                                                                    cursor={{ fill: "rgba(124,58,237,0.06)" }}
                                                                />
                                                                <Bar dataKey={getChartDataKey((msg.actionResult.data as Record<string, unknown>[])[0])} fill="url(#violetGrad)" radius={[3, 3, 0, 0]} />
                                                                <defs>
                                                                    <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor="#8b5cf6" />
                                                                        <stop offset="100%" stopColor="#4338ca" stopOpacity={0.7} />
                                                                    </linearGradient>
                                                                </defs>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                )}

                                                {/* Confirm / cancel */}
                                                {msg.actionProposal && !isLoading && (
                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            onClick={() => confirmAction(msg.actionProposal!.actionName, msg.actionProposal!.params, true)}
                                                            className="text-xs px-3.5 py-1.5 rounded-xl text-white font-medium transition-all"
                                                            style={{ background: "linear-gradient(135deg, #7c3aed, #4338ca)", boxShadow: "0 2px 10px rgba(124,58,237,0.3)" }}
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => confirmAction(msg.actionProposal!.actionName, msg.actionProposal!.params, false)}
                                                            className="text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all"
                                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#8892a4" }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Suggested actions */}
                                                {msg.suggestedActions && msg.suggestedActions.length > 0 && !isLoading && (
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {msg.suggestedActions.map((action) => (
                                                            <button
                                                                key={action.label}
                                                                onClick={() => void sendMessage(action.prefilledMessage)}
                                                                className="text-[11px] px-2.5 py-1 rounded-full transition-all"
                                                                style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.16)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)"; }}
                                                            >
                                                                {action.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Copy button */}
                                                {msg.id !== "welcome" && (
                                                    <button
                                                        onClick={() => copyToClipboard(msg.content, msg.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-1"
                                                        aria-label="Copy message"
                                                    >
                                                        {copiedId === msg.id
                                                            ? <Check className="w-3 h-3" style={{ color: "#34d399" }} />
                                                            : <Copy className="w-3 h-3" style={{ color: "#8892a4" }} />
                                                        }
                                                    </button>
                                                )}
                                            </div>

                                            {/* Regenerate */}
                                            {msg.id === lastAssistantId && msg.id !== "welcome" && !isLoading && (
                                                <button
                                                    onClick={regenerateLastMessage}
                                                    className="flex items-center gap-1 text-[10px] mt-1.5 transition-colors"
                                                    style={{ color: "#8892a4" }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8892a4")}
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                    Regenerate
                                                </button>
                                            )}
                                        </motion.div>
                                    </div>
                                )
                            )}

                            {/* Typing indicator */}
                            {isLoading && streamingStatus && (
                                <div className="flex gap-2.5 justify-start">
                                    {/* Mini orb avatar */}
                                    <div className="relative shrink-0 mt-1" style={{ width: 26, height: 26 }}>
                                        <div
                                            className="absolute inset-0 rounded-full gb-spin"
                                            style={{ background: "conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)", padding: 1.5 }}
                                        >
                                            <div className="w-full h-full rounded-full" style={{ background: "#0a1228" }} />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Bot className="w-3 h-3" style={{ color: "#a78bfa" }} />
                                        </div>
                                    </div>
                                    <div
                                        className="flex items-center gap-2 px-4 py-3"
                                        style={{
                                            background: "rgba(255,255,255,0.028)",
                                            border: "1px solid rgba(124,58,237,0.13)",
                                            borderLeft: "2px solid rgba(124,58,237,0.45)",
                                            borderRadius: "16px 16px 16px 4px",
                                        }}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full gb-dot-1" style={{ background: "#8b5cf6" }} />
                                            <span className="w-1.5 h-1.5 rounded-full gb-dot-2" style={{ background: "#6d28d9" }} />
                                            <span className="w-1.5 h-1.5 rounded-full gb-dot-3" style={{ background: "#06b6d4" }} />
                                        </div>
                                        <span className="text-xs" style={{ color: "#8892a4" }}>{streamingStatus}</span>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Quick prompts -- show only when there's just the welcome message */}
                        {messages.length === 1 && !isLoading && (
                            <div className="px-4 pb-3 shrink-0">
                                <p className="text-[10px] mb-2 font-medium uppercase tracking-wider" style={{ color: "#8892a4" }}>Quick actions</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {displayPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => void sendMessage(prompt)}
                                            className="text-xs px-3 py-1.5 rounded-full transition-all"
                                            style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.22)", color: "#a78bfa" }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.15)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.38)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.07)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.22)"; }}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex items-center gap-2 px-3 py-3 shrink-0"
                            style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask GoBuddy anything..."
                                disabled={isLoading}
                                className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none transition-all disabled:opacity-40"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(124,58,237,0.2)",
                                    color: "#e2e8ff",
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed, #4338ca)",
                                    boxShadow: input.trim() && !isLoading ? "0 4px 16px rgba(124,58,237,0.4)" : "none",
                                }}
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

            {/* Trigger container */}
            <div className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-[60]" style={{ width: 60, height: 60 }}>
                {/* Spinning conic-gradient ring -- only when closed */}
                {!isOpen && (
                    <div
                        className="absolute inset-0 rounded-full gb-spin"
                        style={{ background: "conic-gradient(from 0deg, #7c3aed, #06b6d4, #a78bfa, #7c3aed)", padding: 2 }}
                    >
                        <div className="w-full h-full rounded-full" style={{ background: "#060d1a" }} />
                    </div>
                )}

                {/* Pulse ring animation -- only when closed */}
                {!isOpen && hasUnread && (
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: "transparent",
                            border: "2px solid rgba(139,92,246,0.6)",
                            animation: "gb-pulse-ring 1.8s ease-out infinite",
                        }}
                    />
                )}

                {/* Actual clickable button */}
                <motion.button
                    onClick={() => setIsOpen((o) => !o)}
                    whileTap={{ scale: 0.9 }}
                    className="absolute inset-[3px] rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                        background: isOpen ? "#1a1a2e" : "#060d1a",
                        boxShadow: isOpen
                            ? "none"
                            : "0 0 28px rgba(124,58,237,0.55), 0 0 60px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                    aria-label={isOpen ? "Close assistant" : "Open assistant"}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                <X className="w-5 h-5 text-slate-400" />
                            </motion.div>
                        ) : (
                            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                <Sparkles className="w-5 h-5" style={{ color: "#a78bfa" }} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Unread dot */}
                    {hasUnread && !isOpen && (
                        <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#060d1a]" style={{ background: "#f43f5e" }} />
                    )}
                </motion.button>
            </div>
        </>
    );
}
