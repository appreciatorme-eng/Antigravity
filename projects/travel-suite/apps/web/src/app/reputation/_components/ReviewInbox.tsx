"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  X,
  Star,
} from "lucide-react";
import type {
  ReputationReview,
  ReputationPlatform,
} from "@/lib/reputation/types";
import { PLATFORM_LABELS } from "@/lib/reputation/constants";
import { ReviewCard } from "./ReviewCard";

interface ReviewInboxProps {
  organizationName?: string;
}

type StatusFilter = "all" | "attention" | "needs_response";

const PLATFORM_FILTERS: { value: ReputationPlatform | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "google", label: "Google" },
  { value: "tripadvisor", label: "TripAdvisor" },
  { value: "facebook", label: "Facebook" },
  { value: "makemytrip", label: "MakeMyTrip" },
  { value: "internal", label: "Direct" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attention", label: "Needs Attention" },
  { value: "needs_response", label: "Needs Response" },
];

interface AddReviewFormData {
  reviewer_name: string;
  rating: number;
  platform: ReputationPlatform;
  title: string;
  comment: string;
  destination: string;
}

const INITIAL_FORM_DATA: AddReviewFormData = {
  reviewer_name: "",
  rating: 5,
  platform: "internal",
  title: "",
  comment: "",
  destination: "",
};

function AddReviewModal({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddReviewFormData) => void;
  submitting: boolean;
}) {
  const [formData, setFormData] = useState<AddReviewFormData>({
    ...INITIAL_FORM_DATA,
  });

  const updateField = <K extends keyof AddReviewFormData>(
    field: K,
    value: AddReviewFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Add Manual Review</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reviewer Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Reviewer Name *
            </label>
            <input
              type="text"
              required
              value={formData.reviewer_name}
              onChange={(e) => updateField("reviewer_name", e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
              placeholder="Enter reviewer name"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Rating *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => updateField("rating", star)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= formData.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-700 hover:text-slate-500"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Platform</label>
            <select
              value={formData.platform}
              onChange={(e) =>
                updateField("platform", e.target.value as ReputationPlatform)
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
            >
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-slate-900">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
              placeholder="Optional review title"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Comment</label>
            <textarea
              value={formData.comment}
              onChange={(e) => updateField("comment", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 resize-none"
              placeholder="Review comment..."
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Destination</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => updateField("destination", e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
              placeholder="e.g., Goa, Manali"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.reviewer_name}
              className="px-4 py-2 bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Review
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function ReviewInbox({ organizationName }: ReviewInboxProps) {
  const [reviews, setReviews] = useState<ReputationReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<ReputationPlatform | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", "review_date");
      params.set("sortOrder", "desc");

      if (platformFilter !== "all") {
        params.set("platform", platformFilter);
      }

      if (statusFilter === "attention") {
        params.set("requiresAttention", "true");
      } else if (statusFilter === "needs_response") {
        params.set("status", "pending");
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/reputation/reviews?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [page, platformFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [platformFilter, statusFilter, searchQuery]);

  const handleFlag = async (id: string) => {
    try {
      await fetch(`/api/reputation/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requires_attention: true,
          attention_reason: "Manually flagged for review",
        }),
      });
      fetchReviews();
    } catch (err) {
      console.error("Error flagging review:", err);
    }
  };

  const handleRespond = (id: string) => {
    // For Phase 1 this scrolls to / opens the review.
    // Full response modal is a Phase 2 feature.
    console.log("Open response for review:", id);
  };

  const handleAddReview = async (formData: AddReviewFormData) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/reputation/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add review");
      }
      setShowAddModal(false);
      fetchReviews();
    } catch (err) {
      console.error("Error adding review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/15 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Review
        </button>
      </div>

      {/* Platform Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {PLATFORM_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setPlatformFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
              platformFilter === f.value
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
              statusFilter === f.value
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-xs text-slate-500 ml-auto">
          {total} {total === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Inbox className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No reviews found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {searchQuery || platformFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters or search query."
              : `Start collecting reviews for ${organizationName ?? "your agency"}. You can add reviews manually or connect platforms.`}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${platformFilter}-${statusFilter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onFlag={handleFlag}
                onRespond={handleRespond}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Review Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddReviewModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddReview}
            submitting={submitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
