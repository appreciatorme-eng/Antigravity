"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, Trash2, ArrowLeft, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationSummary {
  readonly sessionId: string;
  readonly title: string | null;
  readonly messageCount: number;
  readonly lastMessageAt: string;
  readonly preview: string;
}

interface StoredMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly actionName: string | null;
  readonly createdAt: string;
}

interface ConversationDetail {
  readonly sessionId: string;
  readonly title: string | null;
  readonly messages: readonly StoredMessage[];
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ConversationHistory() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search && search.trim()) params.set("search", search.trim());
      params.set("limit", "20");

      const res = await fetch(`/api/assistant/conversations?${params.toString()}`);
      const data = await res.json() as {
        success: boolean;
        conversations?: ConversationSummary[];
        error?: string;
      };

      if (data.success && data.conversations) {
        setConversations(data.conversations);
      } else {
        setError(data.error ?? "Failed to load conversations");
      }
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  async function handleSearch() {
    void fetchConversations(searchQuery);
  }

  async function loadConversation(sessionId: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/assistant/conversations/${sessionId}`);
      const data = await res.json() as {
        success: boolean;
        conversation?: ConversationDetail;
      };
      if (data.success && data.conversation) {
        setSelectedConversation(data.conversation);
      }
    } catch {
      // Silent failure
    } finally {
      setLoadingDetail(false);
    }
  }

  async function deleteConversation(sessionId: string) {
    try {
      await fetch(`/api/assistant/conversations?sessionId=${sessionId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.sessionId !== sessionId));
      if (selectedConversation?.sessionId === sessionId) {
        setSelectedConversation(null);
      }
    } catch {
      // Silent failure
    }
  }

  // Detail view
  if (selectedConversation) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button
            onClick={() => setSelectedConversation(null)}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {selectedConversation.title ?? "Conversation"}
            </p>
            <p className="text-[11px] text-slate-400">
              {selectedConversation.messages.length} messages
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {selectedConversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100",
                )}
              >
                {msg.content}
                <p className="text-[10px] mt-1 opacity-50">
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Conversation History
          </h3>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }}
            placeholder="Search conversations..."
            className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            onClick={() => void handleSearch()}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-8">{error}</p>
        ) : conversations.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">
            {searchQuery ? "No matching conversations" : "No conversations yet"}
          </p>
        ) : (
          <AnimatePresence>
            {conversations.map((conv) => (
              <motion.div
                key={conv.sessionId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors"
                onClick={() => void loadConversation(conv.sessionId)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {conv.title ?? "Untitled conversation"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {conv.preview}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400">
                      {conv.messageCount} messages
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteConversation(conv.sessionId);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all mt-0.5"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {loadingDetail && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
