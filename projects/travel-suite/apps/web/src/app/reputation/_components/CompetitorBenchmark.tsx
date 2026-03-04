"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Trophy, X, TrendingUp, TrendingDown } from "lucide-react";
import type { ReputationCompetitor } from "@/lib/reputation/types";

interface CompetitorBenchmarkProps {
  orgRating: number;
  orgReviewCount: number;
  competitors: ReputationCompetitor[];
}

interface AddCompetitorForm {
  name: string;
  googlePlaceId: string;
}

function RatingDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-bold text-white ${sizeClasses[size]}`}>
        {rating.toFixed(1)}
      </span>
      <Star className="w-4 h-4 text-amber-400" fill="#fbbf24" />
    </div>
  );
}

function RatingBar({
  label,
  rating,
  maxRating = 5,
  color,
  isOrg,
}: {
  label: string;
  rating: number;
  maxRating?: number;
  color: string;
  isOrg?: boolean;
}) {
  const percentage = (rating / maxRating) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${isOrg ? "text-primary" : "text-slate-300"}`}>
          {label}
          {isOrg && (
            <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
        </span>
        <span className="text-xs font-semibold text-white">{rating.toFixed(1)}</span>
      </div>
      <div className="h-2.5 bg-slate-800/60 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function CompetitorBenchmark({
  orgRating,
  orgReviewCount,
  competitors,
}: CompetitorBenchmarkProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<AddCompetitorForm>({
    name: "",
    googlePlaceId: "",
  });
  const [localCompetitors, setLocalCompetitors] =
    useState<ReputationCompetitor[]>(competitors);

  const handleAdd = () => {
    if (!formData.name.trim()) return;

    // Create local placeholder competitor (in real app, this would POST to API)
    const newCompetitor: ReputationCompetitor = {
      id: crypto.randomUUID(),
      organization_id: "",
      competitor_name: formData.name.trim(),
      google_place_id: formData.googlePlaceId.trim() || null,
      tripadvisor_url: null,
      website_url: null,
      latest_rating: null,
      latest_review_count: null,
      last_checked_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLocalCompetitors((prev) => [...prev, newCompetitor]);
    setFormData({ name: "", googlePlaceId: "" });
    setShowAddForm(false);
  };

  const handleRemove = (id: string) => {
    setLocalCompetitors((prev) => prev.filter((c) => c.id !== id));
  };

  // Determine position
  const allRatings = [
    { name: "Your Agency", rating: orgRating, isOrg: true },
    ...localCompetitors
      .filter((c) => c.latest_rating !== null)
      .map((c) => ({
        name: c.competitor_name,
        rating: c.latest_rating!,
        isOrg: false,
      })),
  ].sort((a, b) => b.rating - a.rating);

  const orgPosition = allRatings.findIndex((r) => r.isOrg) + 1;
  const isLeading = orgPosition === 1;

  return (
    <div className="space-y-5">
      {/* Your position summary */}
      <div className="flex items-center justify-between rounded-xl bg-slate-800/40 border border-white/5 p-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Your Position</p>
          <div className="flex items-center gap-2">
            <Trophy
              className={`w-5 h-5 ${isLeading ? "text-amber-400" : "text-slate-400"}`}
            />
            <span className="text-lg font-bold text-white">
              #{orgPosition}
              <span className="text-sm font-normal text-slate-400 ml-1">
                of {allRatings.length}
              </span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <RatingDisplay rating={orgRating} />
          <p className="text-xs text-slate-400 mt-0.5">
            {orgReviewCount} reviews
          </p>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-3">
        <RatingBar
          label="Your Agency"
          rating={orgRating}
          color="var(--color-primary, #00d084)"
          isOrg
        />

        {localCompetitors.map((competitor) => {
          const competitorRating = competitor.latest_rating ?? 0;
          const diff = orgRating - competitorRating;

          return (
            <div key={competitor.id} className="group relative">
              <RatingBar
                label={competitor.competitor_name}
                rating={competitorRating}
                color="#6b7280"
              />
              {/* Diff indicator */}
              {competitorRating > 0 && (
                <div className="absolute right-0 -top-1 flex items-center gap-1">
                  {diff > 0 ? (
                    <span className="flex items-center text-[10px] text-emerald-400">
                      <TrendingUp className="w-3 h-3 mr-0.5" />+{diff.toFixed(1)}
                    </span>
                  ) : diff < 0 ? (
                    <span className="flex items-center text-[10px] text-red-400">
                      <TrendingDown className="w-3 h-3 mr-0.5" />{diff.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              )}
              {/* Review count */}
              {competitor.latest_review_count !== null && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {competitor.latest_review_count} reviews
                </p>
              )}
              {/* Remove button */}
              <button
                onClick={() => handleRemove(competitor.id)}
                className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Pending competitors (no rating yet) */}
      {localCompetitors.some((c) => c.latest_rating === null) && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Awaiting data...</p>
          {localCompetitors
            .filter((c) => c.latest_rating === null)
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/30 border border-white/5"
              >
                <span className="text-xs text-slate-400">{c.competitor_name}</span>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Add competitor */}
      <AnimatePresence>
        {showAddForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Competitor Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                  placeholder="e.g. Rival Tours"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Google Place ID (optional)
                </label>
                <input
                  type="text"
                  value={formData.googlePlaceId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      googlePlaceId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                  placeholder="ChIJ..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Add Competitor
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Competitor
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
