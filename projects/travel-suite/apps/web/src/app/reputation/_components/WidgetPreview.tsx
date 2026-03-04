"use client";

import { Star } from "lucide-react";
import type {
  ReputationWidget,
  ReputationReview,
  WidgetType,
} from "@/lib/reputation/types";

interface WidgetPreviewProps {
  config: Partial<ReputationWidget>;
  sampleReviews?: ReputationReview[];
}

const SAMPLE_REVIEWS_DEFAULT: Pick<
  ReputationReview,
  "id" | "reviewer_name" | "rating" | "comment" | "platform" | "review_date"
>[] = [
  {
    id: "sample-1",
    reviewer_name: "Sarah M.",
    rating: 5,
    comment:
      "Amazing trip to Rajasthan! The team planned everything perfectly. Would highly recommend.",
    platform: "google",
    review_date: "2025-02-15",
  },
  {
    id: "sample-2",
    reviewer_name: "James K.",
    rating: 5,
    comment:
      "Unforgettable experience in Kerala. Great guides, beautiful hotels, excellent service.",
    platform: "tripadvisor",
    review_date: "2025-02-10",
  },
  {
    id: "sample-3",
    reviewer_name: "Priya R.",
    rating: 4,
    comment:
      "Wonderful Goa trip. The itinerary was well thought out. Minor hiccup with transfers but resolved quickly.",
    platform: "facebook",
    review_date: "2025-02-05",
  },
  {
    id: "sample-4",
    reviewer_name: "Michael T.",
    rating: 5,
    comment:
      "Best tour operator we have used. Professional, responsive, and great value for money.",
    platform: "google",
    review_date: "2025-01-28",
  },
];

function StarRating({
  rating,
  accentColor,
}: {
  rating: number;
  accentColor: string;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3.5 h-3.5"
          fill={star <= rating ? accentColor : "transparent"}
          stroke={star <= rating ? accentColor : "#94a3b8"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  theme,
  accentColor,
  borderRadius,
}: {
  review: (typeof SAMPLE_REVIEWS_DEFAULT)[0];
  theme: "light" | "dark";
  accentColor: string;
  borderRadius: number;
}) {
  const isLight = theme === "light";

  return (
    <div
      className="p-4 border"
      style={{
        borderRadius: `${borderRadius}px`,
        backgroundColor: isLight ? "#ffffff" : "#1e293b",
        borderColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-semibold"
          style={{ color: isLight ? "#0f172a" : "#ffffff" }}
        >
          {review.reviewer_name}
        </span>
        <span
          className="text-[10px] uppercase tracking-wide"
          style={{ color: isLight ? "#94a3b8" : "#64748b" }}
        >
          {review.platform}
        </span>
      </div>
      <StarRating rating={review.rating} accentColor={accentColor} />
      <p
        className="text-xs mt-2 line-clamp-3 leading-relaxed"
        style={{ color: isLight ? "#475569" : "#cbd5e1" }}
      >
        {review.comment}
      </p>
    </div>
  );
}

function CarouselPreview({
  reviews,
  theme,
  accentColor,
  borderRadius,
}: {
  reviews: (typeof SAMPLE_REVIEWS_DEFAULT);
  theme: "light" | "dark";
  accentColor: string;
  borderRadius: number;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {reviews.slice(0, 3).map((review) => (
        <div key={review.id} className="min-w-[220px] max-w-[220px]">
          <ReviewCard
            review={review}
            theme={theme}
            accentColor={accentColor}
            borderRadius={borderRadius}
          />
        </div>
      ))}
    </div>
  );
}

function GridPreview({
  reviews,
  theme,
  accentColor,
  borderRadius,
}: {
  reviews: (typeof SAMPLE_REVIEWS_DEFAULT);
  theme: "light" | "dark";
  accentColor: string;
  borderRadius: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {reviews.slice(0, 4).map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          theme={theme}
          accentColor={accentColor}
          borderRadius={borderRadius}
        />
      ))}
    </div>
  );
}

function BadgePreview({
  reviews,
  accentColor,
  borderRadius,
}: {
  reviews: (typeof SAMPLE_REVIEWS_DEFAULT);
  accentColor: string;
  borderRadius: number;
}) {
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2.5 text-white shadow-lg"
      style={{
        backgroundColor: accentColor,
        borderRadius: `${borderRadius}px`,
      }}
    >
      <Star className="w-5 h-5" fill="#ffffff" />
      <span className="text-lg font-bold">{avgRating.toFixed(1)}</span>
      <span className="text-xs opacity-80">
        ({reviews.length} reviews)
      </span>
    </div>
  );
}

function WallPreview({
  reviews,
  theme,
  accentColor,
  borderRadius,
}: {
  reviews: (typeof SAMPLE_REVIEWS_DEFAULT);
  theme: "light" | "dark";
  accentColor: string;
  borderRadius: number;
}) {
  return (
    <div className="columns-2 gap-3 space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="break-inside-avoid">
          <ReviewCard
            review={review}
            theme={theme}
            accentColor={accentColor}
            borderRadius={borderRadius}
          />
        </div>
      ))}
    </div>
  );
}

function getPreviewForType(
  type: WidgetType,
  reviews: (typeof SAMPLE_REVIEWS_DEFAULT),
  theme: "light" | "dark",
  accentColor: string,
  borderRadius: number
) {
  switch (type) {
    case "carousel":
      return (
        <CarouselPreview
          reviews={reviews}
          theme={theme}
          accentColor={accentColor}
          borderRadius={borderRadius}
        />
      );
    case "grid":
      return (
        <GridPreview
          reviews={reviews}
          theme={theme}
          accentColor={accentColor}
          borderRadius={borderRadius}
        />
      );
    case "badge":
      return (
        <BadgePreview
          reviews={reviews}
          accentColor={accentColor}
          borderRadius={borderRadius}
        />
      );
    case "floating":
      return (
        <BadgePreview
          reviews={reviews}
          accentColor={accentColor}
          borderRadius={borderRadius}
        />
      );
    case "wall":
      return (
        <WallPreview
          reviews={reviews}
          theme={theme}
          accentColor={accentColor}
          borderRadius={borderRadius}
        />
      );
    default:
      return (
        <GridPreview
          reviews={reviews}
          theme={theme}
          accentColor={accentColor}
          borderRadius={borderRadius}
        />
      );
  }
}

export default function WidgetPreview({
  config,
  sampleReviews,
}: WidgetPreviewProps) {
  const widgetType: WidgetType = config.widget_type ?? "carousel";
  const resolvedTheme =
    config.theme === "auto" || !config.theme ? "dark" : config.theme;
  const accentColor = config.accent_color ?? "#00d084";
  const borderRadius = config.border_radius ?? 12;
  const showBranding = config.show_branding !== false;
  const isLight = resolvedTheme === "light";

  const reviews =
    sampleReviews && sampleReviews.length > 0
      ? sampleReviews.map((r) => ({
          id: r.id,
          reviewer_name: r.reviewer_name,
          rating: r.rating,
          comment: r.comment ?? "",
          platform: r.platform,
          review_date: r.review_date,
        }))
      : SAMPLE_REVIEWS_DEFAULT;

  return (
    <div
      className="rounded-xl p-5 border overflow-hidden"
      style={{
        backgroundColor: isLight ? "#f8fafc" : "#0f172a",
        borderColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      {config.custom_header && (
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: isLight ? "#0f172a" : "#ffffff" }}
        >
          {config.custom_header}
        </p>
      )}

      {/* Widget content */}
      {getPreviewForType(widgetType, reviews, resolvedTheme, accentColor, borderRadius)}

      {/* Footer */}
      {config.custom_footer && (
        <p
          className="text-xs mt-3"
          style={{ color: isLight ? "#64748b" : "#64748b" }}
        >
          {config.custom_footer}
        </p>
      )}

      {/* Branding */}
      {showBranding && (
        <p
          className="text-[10px] text-center mt-4"
          style={{ color: isLight ? "#94a3b8" : "#475569" }}
        >
          Powered by TravelSuite Reputation
        </p>
      )}
    </div>
  );
}
