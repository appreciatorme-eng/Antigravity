"use client";

import { useState, useCallback, useEffect } from "react";
import {
  X,
  Star,
  Sparkles,
  RefreshCw,
  Send,
  Loader2,
  Eye,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReputationReview } from "@/lib/reputation/types";
import { PLATFORM_LABELS, PLATFORM_COLORS } from "@/lib/reputation/constants";

interface ReviewResponsePanelProps {
  review: ReputationReview | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reviewId: string, response: string) => Promise<void> | void;
}

type PanelMode = "edit" | "preview";

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-gray-300"
          }`}
        />
      ))}
    </span>
  );
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-100 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  );
}

export function ReviewResponsePanel({
  review,
  isOpen,
  onClose,
  onSave,
}: ReviewResponsePanelProps) {
  const [aiResponse, setAiResponse] = useState("");
  const [activeResponse, setActiveResponse] = useState("");
  const [mode, setMode] = useState<PanelMode>("edit");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when review changes
  useEffect(() => {
    if (review) {
      setAiResponse(review.ai_suggested_response ?? "");
      setActiveResponse(review.response_text ?? review.ai_suggested_response ?? "");
      setMode("edit");
      setError(null);
    }
  }, [review?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateAI = useCallback(
    async (regenerate = false) => {
      if (!review) return;
      setGenerating(true);
      setError(null);

      try {
        const res = await fetch("/api/reputation/ai/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewId: review.id, regenerate }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to generate response");
        }

        const data = await res.json();
        const suggested = data.response?.suggested_response ?? "";
        setAiResponse(suggested);
        setActiveResponse(suggested);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate response";
        setError(message);
      } finally {
        setGenerating(false);
      }
    },
    [review]
  );

  const handleUseAI = useCallback(() => {
    setActiveResponse(aiResponse);
  }, [aiResponse]);

  const handleSave = useCallback(async () => {
    if (!review || !activeResponse.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(review.id, activeResponse.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save response";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [review, activeResponse, onSave]);

  const platformLabel = review
    ? PLATFORM_LABELS[review.platform] ?? review.platform
    : "";
  const platformColor = review
    ? PLATFORM_COLORS[review.platform] ?? "#6b7280"
    : "#6b7280";

  return (
    <AnimatePresence>
      {isOpen && review && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Slide-over panel */}
          <motion.div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-white border-l border-gray-200 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Compose Response
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Review details */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{
                      backgroundColor: `${platformColor}20`,
                      color: platformColor,
                      border: `1px solid ${platformColor}40`,
                    }}
                  >
                    {platformLabel}
                  </span>
                  <RatingStars rating={review.rating} />
                  <span className="text-xs text-gray-500">
                    by {review.reviewer_name}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
                    {review.comment}
                  </p>
                )}
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {/* AI suggestion section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      AI Suggested Response
                    </h3>
                  </div>

                  {generating ? (
                    <div className="space-y-2">
                      <ShimmerBlock className="h-4 w-full" />
                      <ShimmerBlock className="h-4 w-5/6" />
                      <ShimmerBlock className="h-4 w-4/6" />
                      <ShimmerBlock className="h-4 w-3/6" />
                    </div>
                  ) : aiResponse ? (
                    <div className="space-y-2">
                      <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {aiResponse}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateAI(true)}
                          disabled={generating}
                          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Regenerate
                        </button>
                        <button
                          onClick={handleUseAI}
                          className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-500 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Use This
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateAI(false)}
                      disabled={generating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:border-purple-500/50 transition-colors text-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate AI Response
                    </button>
                  )}

                  {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  )}
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-100 w-fit">
                  <button
                    onClick={() => setMode("edit")}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                      mode === "edit"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-600"
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => setMode("preview")}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                      mode === "preview"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-600"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                </div>

                {/* Response textarea / preview */}
                {mode === "edit" ? (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-medium">
                      Your Response
                    </label>
                    <textarea
                      value={activeResponse}
                      onChange={(e) => {
                        setActiveResponse(e.target.value);
                      }}
                      placeholder="Type your response here or generate one with AI..."
                      rows={8}
                      className="w-full rounded-lg bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/30 resize-y"
                    />
                    <p className="text-[10px] text-gray-400">
                      {activeResponse.length} characters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 font-medium">
                      Response Preview
                    </label>
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                      {activeResponse.trim() ? (
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {activeResponse}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No response written yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving || !activeResponse.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-medium transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Save Response
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
