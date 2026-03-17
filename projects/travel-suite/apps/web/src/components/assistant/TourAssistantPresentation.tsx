"use client";

import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from "recharts";
import {
    Bot,
    Check,
    Copy,
    Download,
    Loader2,
    Mic,
    MicOff,
    RefreshCw,
    Send,
    Sparkles,
    X,
} from "lucide-react";

import {
    getChartDataKey,
    getChartLabelKey,
    isChartData,
    MarkdownContent,
    type Message,
} from "./tour-assistant-helpers";

interface TourAssistantPresentationProps {
    bottomRef: React.RefObject<HTMLDivElement | null>;
    copiedId: string | null;
    displayPrompts: string[];
    hasUnread: boolean;
    input: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    isLoading: boolean;
    isOpen: boolean;
    isRecording: boolean;
    lastAssistantId?: string;
    messages: Message[];
    streamingStatus: string | null;
    voiceSupported: boolean;
    onClose: () => void;
    onConfirmAction: (actionName: string, params: Record<string, unknown>, confirmed: boolean) => void;
    onCopy: (text: string, id: string) => void;
    onExportCsv: (actionName: string, data: unknown) => void;
    onInputChange: (value: string) => void;
    onPromptClick: (prompt: string) => void;
    onRegenerate: () => void;
    onSubmit: (event: React.FormEvent) => void;
    onToggle: () => void;
    onToggleRecording: () => void;
}

export function TourAssistantPresentation({
    bottomRef,
    copiedId,
    displayPrompts,
    hasUnread,
    input,
    inputRef,
    isLoading,
    isOpen,
    isRecording,
    lastAssistantId,
    messages,
    streamingStatus,
    voiceSupported,
    onClose,
    onConfirmAction,
    onCopy,
    onExportCsv,
    onInputChange,
    onPromptClick,
    onRegenerate,
    onSubmit,
    onToggle,
    onToggleRecording,
}: TourAssistantPresentationProps) {
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
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

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
                            boxShadow:
                                "0 32px 80px -8px rgba(0,0,0,0.85), 0 0 0 1px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
                        }}
                    >
                        <div
                            className="flex items-center gap-3 px-4 py-3 shrink-0"
                            style={{
                                background: "rgba(124,58,237,0.07)",
                                borderBottom: "1px solid rgba(124,58,237,0.15)",
                            }}
                        >
                            <div className="relative shrink-0" style={{ width: 36, height: 36 }}>
                                <div
                                    className="absolute inset-0 rounded-full gb-spin"
                                    style={{
                                        background:
                                            "conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)",
                                        padding: 2,
                                    }}
                                >
                                    <div className="w-full h-full rounded-full" style={{ background: "#0a1228" }} />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm leading-tight" style={{ color: "#f0f0ff" }}>
                                    TripBuilt
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span
                                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                        style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }}
                                    />
                                    <p className="text-xs" style={{ color: "#8892a4" }}>
                                        Operations AI · Live data
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex items-center justify-center rounded-lg transition-all duration-150 w-7 h-7"
                                style={{ background: "rgba(255,255,255,0.05)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                aria-label="Close assistant"
                            >
                                <X className="w-3.5 h-3.5" style={{ color: "#8892a4" }} />
                            </button>
                        </div>

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
                                                    background:
                                                        "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)",
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
                                        <div className="relative shrink-0 mt-1" style={{ width: 26, height: 26 }}>
                                            <div
                                                className="absolute inset-0 rounded-full gb-spin"
                                                style={{
                                                    background:
                                                        "conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)",
                                                    padding: 1.5,
                                                }}
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
                                                {isLoading &&
                                                    msg.id === lastAssistantId &&
                                                    msg.content.length > 0 && (
                                                        <span
                                                            className="gb-cursor ml-0.5 w-[2px] h-[13px] align-middle"
                                                            style={{ background: "#a78bfa", borderRadius: 1 }}
                                                        />
                                                    )}

                                                {msg.citations && msg.citations.length > 0 && (
                                                    <p className="mt-2 text-[10px] leading-tight" style={{ color: "#8892a4" }}>
                                                        Source: {msg.citations[0].question}
                                                    </p>
                                                )}

                                                {msg.actionResult && (
                                                    <div
                                                        className="mt-2.5 text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2"
                                                        style={
                                                            msg.actionResult.success
                                                                ? {
                                                                      background: "rgba(16,185,129,0.08)",
                                                                      border: "1px solid rgba(16,185,129,0.2)",
                                                                      color: "#34d399",
                                                                  }
                                                                : {
                                                                      background: "rgba(244,63,94,0.08)",
                                                                      border: "1px solid rgba(244,63,94,0.2)",
                                                                      color: "#fb7185",
                                                                  }
                                                        }
                                                    >
                                                        <span>
                                                            {msg.actionResult.success
                                                                ? "\u2713 Action completed"
                                                                : "\u2717 Action failed"}
                                                        </span>
                                                        {msg.actionResult.success &&
                                                        msg.actionResult.data !== null &&
                                                        msg.actionResult.data !== undefined &&
                                                        Array.isArray(msg.actionResult.data) &&
                                                        msg.actionResult.data.length > 0 ? (
                                                            <button
                                                                onClick={() => void onExportCsv("export", msg.actionResult?.data)}
                                                                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg transition-all"
                                                                style={{
                                                                    background: "rgba(16,185,129,0.12)",
                                                                    border: "1px solid rgba(16,185,129,0.25)",
                                                                }}
                                                                title="Export as CSV"
                                                            >
                                                                <Download className="w-2.5 h-2.5" />
                                                                CSV
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                )}

                                                {msg.actionResult?.success && isChartData(msg.actionResult.data) && (
                                                    <div
                                                        className="mt-2.5 rounded-xl overflow-hidden p-2"
                                                        style={{
                                                            background: "rgba(0,0,0,0.25)",
                                                            border: "1px solid rgba(124,58,237,0.1)",
                                                        }}
                                                    >
                                                        <ResponsiveContainer width="100%" height={90}>
                                                            <BarChart data={msg.actionResult.data as Record<string, unknown>[]}>
                                                                <XAxis
                                                                    dataKey={getChartLabelKey((msg.actionResult.data as Record<string, unknown>[])[0])}
                                                                    tick={{ fontSize: 9, fill: "#8892a4" }}
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        background: "#0a1228",
                                                                        border: "1px solid rgba(124,58,237,0.25)",
                                                                        borderRadius: 8,
                                                                        fontSize: 10,
                                                                        color: "#dde1f0",
                                                                    }}
                                                                    cursor={{ fill: "rgba(124,58,237,0.06)" }}
                                                                />
                                                                <Bar
                                                                    dataKey={getChartDataKey((msg.actionResult.data as Record<string, unknown>[])[0])}
                                                                    fill="url(#violetGrad)"
                                                                    radius={[3, 3, 0, 0]}
                                                                />
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

                                                {msg.actionProposal && !isLoading && (
                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                onConfirmAction(
                                                                    msg.actionProposal!.actionName,
                                                                    msg.actionProposal!.params,
                                                                    true,
                                                                )
                                                            }
                                                            className="text-xs px-3.5 py-1.5 rounded-xl text-white font-medium transition-all"
                                                            style={{
                                                                background:
                                                                    "linear-gradient(135deg, #7c3aed, #4338ca)",
                                                                boxShadow: "0 2px 10px rgba(124,58,237,0.3)",
                                                            }}
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                onConfirmAction(
                                                                    msg.actionProposal!.actionName,
                                                                    msg.actionProposal!.params,
                                                                    false,
                                                                )
                                                            }
                                                            className="text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all"
                                                            style={{
                                                                background: "rgba(255,255,255,0.05)",
                                                                border: "1px solid rgba(255,255,255,0.12)",
                                                                color: "#8892a4",
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}

                                                {msg.suggestedActions &&
                                                    msg.suggestedActions.length > 0 &&
                                                    !isLoading && (
                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {msg.suggestedActions.map((action) => (
                                                                <button
                                                                    key={action.label}
                                                                    onClick={() => onPromptClick(action.prefilledMessage)}
                                                                    className="text-[11px] px-2.5 py-1 rounded-full transition-all"
                                                                    style={{
                                                                        background: "rgba(124,58,237,0.08)",
                                                                        border: "1px solid rgba(124,58,237,0.25)",
                                                                        color: "#a78bfa",
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background =
                                                                            "rgba(124,58,237,0.16)";
                                                                        e.currentTarget.style.borderColor =
                                                                            "rgba(124,58,237,0.4)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background =
                                                                            "rgba(124,58,237,0.08)";
                                                                        e.currentTarget.style.borderColor =
                                                                            "rgba(124,58,237,0.25)";
                                                                    }}
                                                                >
                                                                    {action.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                {msg.id !== "welcome" && (
                                                    <button
                                                        onClick={() => onCopy(msg.content, msg.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-1"
                                                        aria-label="Copy message"
                                                    >
                                                        {copiedId === msg.id ? (
                                                            <Check className="w-3 h-3" style={{ color: "#34d399" }} />
                                                        ) : (
                                                            <Copy className="w-3 h-3" style={{ color: "#8892a4" }} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {msg.id === lastAssistantId &&
                                                msg.id !== "welcome" &&
                                                !isLoading && (
                                                    <button
                                                        onClick={onRegenerate}
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
                                ),
                            )}

                            {isLoading && streamingStatus && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="relative shrink-0 mt-1" style={{ width: 26, height: 26 }}>
                                        <div
                                            className="absolute inset-0 rounded-full gb-spin"
                                            style={{
                                                background:
                                                    "conic-gradient(from 0deg, #7c3aed, #06b6d4, #7c3aed)",
                                                padding: 1.5,
                                            }}
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
                                        <span className="text-xs" style={{ color: "#8892a4" }}>
                                            {streamingStatus}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {messages.length === 1 && !isLoading && (
                            <div className="px-4 pb-3 shrink-0">
                                <p className="text-[10px] mb-2 font-medium uppercase tracking-wider" style={{ color: "#8892a4" }}>
                                    Quick actions
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {displayPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            onClick={() => onPromptClick(prompt)}
                                            className="text-xs px-3 py-1.5 rounded-full transition-all"
                                            style={{
                                                background: "rgba(124,58,237,0.07)",
                                                border: "1px solid rgba(124,58,237,0.22)",
                                                color: "#a78bfa",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background =
                                                    "rgba(124,58,237,0.15)";
                                                e.currentTarget.style.borderColor =
                                                    "rgba(124,58,237,0.38)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background =
                                                    "rgba(124,58,237,0.07)";
                                                e.currentTarget.style.borderColor =
                                                    "rgba(124,58,237,0.22)";
                                            }}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={onSubmit}
                            className="flex items-center gap-2 px-3 py-3 shrink-0"
                            style={{ borderTop: "1px solid rgba(124,58,237,0.12)" }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => onInputChange(e.target.value)}
                                placeholder={isRecording ? "Listening..." : "Ask TripBuilt anything..."}
                                disabled={isLoading}
                                className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none transition-all disabled:opacity-40"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(124,58,237,0.2)",
                                    color: "#e2e8ff",
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)";
                                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            {voiceSupported && (
                                <button
                                    type="button"
                                    onClick={onToggleRecording}
                                    disabled={isLoading}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{
                                        background: isRecording
                                            ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                                            : "rgba(124,58,237,0.12)",
                                        border: isRecording ? "none" : "1px solid rgba(124,58,237,0.25)",
                                        boxShadow: isRecording ? "0 0 16px rgba(220,38,38,0.5)" : "none",
                                    }}
                                    aria-label={isRecording ? "Stop recording" : "Start voice input"}
                                >
                                    {isRecording ? (
                                        <MicOff className="w-4 h-4 text-white" />
                                    ) : (
                                        <Mic className="w-4 h-4" style={{ color: "#a78bfa" }} />
                                    )}
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed, #4338ca)",
                                    boxShadow:
                                        input.trim() && !isLoading
                                            ? "0 4px 16px rgba(124,58,237,0.4)"
                                            : "none",
                                }}
                                aria-label="Send message"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 text-white" />
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-[60]" style={{ width: 60, height: 60 }}>
                {!isOpen && (
                    <div
                        className="absolute inset-0 rounded-full gb-spin"
                        style={{
                            background:
                                "conic-gradient(from 0deg, #7c3aed, #06b6d4, #a78bfa, #7c3aed)",
                            padding: 2,
                        }}
                    >
                        <div className="w-full h-full rounded-full" style={{ background: "#060d1a" }} />
                    </div>
                )}

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

                <motion.button
                    onClick={onToggle}
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
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Sparkles className="w-5 h-5" style={{ color: "#a78bfa" }} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {hasUnread && !isOpen && (
                        <span
                            className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#060d1a]"
                            style={{ background: "#f43f5e" }}
                        />
                    )}
                </motion.button>
            </div>
        </>
    );
}
