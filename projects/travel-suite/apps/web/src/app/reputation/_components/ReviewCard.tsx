"use client";

import { useState } from "react";
import {
  Star,
  Flag,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReputationReview } from "@/lib/reputation/types";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/reputation/constants";

interface ReviewCardProps {
  review: ReputationReview;
  onFlag?: (id: string) => void;
  onRespond?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y ago`;
}

function ResponseStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ElementType }> =
    {
      pending: { label: "Pending", color: "#eab308", icon: Clock },
      draft: { label: "Draft", color: "#3b82f6", icon: MessageCircle },
      responded: { label: "Responded", color: "#22c55e", icon: CheckCircle2 },
      not_needed: { label: "Not Needed", color: "#6b7280", icon: CheckCircle2 },
    };

  const c = config[status] ?? config.pending;
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: `${c.color}15`,
        color: c.color,
        border: `1px solid ${c.color}30`,
      }}
    >
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export function ReviewCard({ review, onFlag, onRespond }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const platformColor =
    PLATFORM_COLORS[review.platform] ?? "#6b7280";
  const platformLabel =
    PLATFORM_LABELS[review.platform] ?? review.platform;

  const commentTruncateLength = 180;
  const hasLongComment =
    review.comment !== null && review.comment.length > commentTruncateLength;

  const displayComment =
    review.comment && !expanded
      ? review.comment.slice(0, commentTruncateLength)
      : review.comment;

  const tags = [review.destination, review.trip_type].filter(Boolean);
  const topics: string[] = review.ai_topics ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 hover:bg-gray-50 transition-colors"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Platform Badge */}
          <span
            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${platformColor}20`,
              color: platformColor,
              border: `1px solid ${platformColor}30`,
            }}
          >
            {platformLabel}
          </span>

          {/* Stars */}
          <div className="flex items-center gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < review.rating
                    ? "text-amber-500 fill-amber-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Reviewer name */}
          <span className="text-sm font-medium text-gray-900 truncate">
            {review.reviewer_name}
          </span>

          {/* Verified badge */}
          {review.is_verified_client && (
            <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
          )}

          {/* Attention indicator */}
          {review.requires_attention && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {review.attention_reason || "Needs attention"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ResponseStatusBadge status={review.response_status} />
          <span className="text-[10px] text-gray-400">
            {timeAgo(review.review_date)}
          </span>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-1">{review.title}</h4>
      )}

      {/* Comment */}
      {displayComment && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            {displayComment}
            {hasLongComment && !expanded && "..."}
          </p>
          {hasLongComment && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-1 text-xs text-blue-600 hover:text-blue-500 flex items-center gap-1"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Tags (destination, trip_type) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI Topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topics.map((topic) => (
            <span
              key={topic}
              className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600"
            >
              {topic.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {onFlag && (
            <button
              onClick={() => onFlag(review.id)}
              className="text-xs text-gray-400 hover:text-orange-400 flex items-center gap-1 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              Flag
            </button>
          )}
          {onRespond && review.response_status !== "responded" && (
            <button
              onClick={() => onRespond(review.id)}
              className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Respond
            </button>
          )}
        </div>

        {review.platform_url && (
          <a
            href={review.platform_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on {platformLabel}
          </a>
        )}
      </div>
    </motion.div>
  );
}
