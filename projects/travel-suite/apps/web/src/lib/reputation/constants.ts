import type { PlatformConfig, ReputationPlatform, AIReviewTopic } from "./types";

export const REPUTATION_PLATFORMS: PlatformConfig[] = [
  { id: "google", label: "Google", color: "#4285F4", icon: "🔵" },
  { id: "tripadvisor", label: "TripAdvisor", color: "#34E0A1", icon: "🟢" },
  { id: "facebook", label: "Facebook", color: "#1877F2", icon: "🔵" },
  { id: "makemytrip", label: "MakeMyTrip", color: "#EB2026", icon: "🔴" },
  { id: "internal", label: "Direct Feedback", color: "#8B5CF6", icon: "🟣" },
];

export const PLATFORM_LABELS: Record<ReputationPlatform, string> = {
  google: "Google",
  tripadvisor: "TripAdvisor",
  facebook: "Facebook",
  makemytrip: "MakeMyTrip",
  internal: "Direct Feedback",
};

export const PLATFORM_COLORS: Record<ReputationPlatform, string> = {
  google: "#4285F4",
  tripadvisor: "#34E0A1",
  facebook: "#1877F2",
  makemytrip: "#EB2026",
  internal: "#8B5CF6",
};

export const AI_REVIEW_TOPICS: { id: AIReviewTopic; label: string; emoji: string }[] = [
  { id: "hotel_quality", label: "Hotel Quality", emoji: "🏨" },
  { id: "transport", label: "Transport", emoji: "🚗" },
  { id: "driver_behavior", label: "Driver Behavior", emoji: "🧑‍✈️" },
  { id: "food", label: "Food", emoji: "🍽️" },
  { id: "itinerary_planning", label: "Itinerary Planning", emoji: "📋" },
  { id: "value_for_money", label: "Value for Money", emoji: "💰" },
  { id: "guide_quality", label: "Guide Quality", emoji: "🗣️" },
  { id: "safety", label: "Safety", emoji: "🛡️" },
  { id: "communication", label: "Communication", emoji: "📱" },
  { id: "booking_process", label: "Booking Process", emoji: "📝" },
  { id: "weather", label: "Weather", emoji: "🌤️" },
  { id: "cleanliness", label: "Cleanliness", emoji: "✨" },
  { id: "punctuality", label: "Punctuality", emoji: "⏰" },
  { id: "flexibility", label: "Flexibility", emoji: "🔄" },
  { id: "local_experience", label: "Local Experience", emoji: "🗺️" },
];

export const HEALTH_SCORE_WEIGHTS = {
  avgRating: 0.40,
  responseRate: 0.20,
  avgResponseTime: 0.15,
  reviewVelocity: 0.15,
  sentimentRatio: 0.10,
} as const;

export const RATING_THRESHOLDS = {
  excellent: 4.5,
  good: 4.0,
  average: 3.5,
  poor: 3.0,
  critical: 2.5,
} as const;

export const RESPONSE_TIME_TARGETS = {
  excellent: 2,
  good: 6,
  average: 12,
  poor: 24,
  critical: 48,
} as const;

export const NPS_BOUNDARIES = {
  promoter: 9,
  passive: 7,
  detractor: 0,
} as const;

export const REVIEW_LINK_TEMPLATES: Record<string, string> = {
  google: "https://search.google.com/local/writereview?placeid={place_id}",
  tripadvisor: "https://www.tripadvisor.com/UserReviewEdit-{location_id}",
  makemytrip: "https://www.makemytrip.com/tripideas/review/{listing_id}",
};

export const SENTIMENT_THRESHOLDS = {
  positive: 0.2,
  negative: -0.2,
} as const;

export interface ReputationTierLimits {
  maxReviews: number | null;
  maxPlatformConnections: number;
  maxAIResponsesPerMonth: number | null;
  maxActiveCampaigns: number;
  maxWidgets: number;
  sentimentAnalysis: boolean;
  midTripCheckin: boolean;
  autoResponses: boolean;
  competitorTracking: boolean;
  whiteLabelWidget: boolean;
  reviewToRevenue: boolean;
}

export const REPUTATION_TIER_LIMITS: Record<string, ReputationTierLimits> = {
  free: {
    maxReviews: 50,
    maxPlatformConnections: 1,
    maxAIResponsesPerMonth: 5,
    maxActiveCampaigns: 1,
    maxWidgets: 1,
    sentimentAnalysis: false,
    midTripCheckin: false,
    autoResponses: false,
    competitorTracking: false,
    whiteLabelWidget: false,
    reviewToRevenue: false,
  },
  pro: {
    maxReviews: null,
    maxPlatformConnections: 3,
    maxAIResponsesPerMonth: 100,
    maxActiveCampaigns: 5,
    maxWidgets: 3,
    sentimentAnalysis: true,
    midTripCheckin: true,
    autoResponses: true,
    competitorTracking: false,
    whiteLabelWidget: false,
    reviewToRevenue: false,
  },
  enterprise: {
    maxReviews: null,
    maxPlatformConnections: 999,
    maxAIResponsesPerMonth: null,
    maxActiveCampaigns: 999,
    maxWidgets: 999,
    sentimentAnalysis: true,
    midTripCheckin: true,
    autoResponses: true,
    competitorTracking: true,
    whiteLabelWidget: true,
    reviewToRevenue: true,
  },
};

export const HEALTH_SCORE_LABELS: Record<string, { min: number; label: string; color: string }> = {
  excellent: { min: 80, label: "Excellent", color: "#22c55e" },
  good: { min: 60, label: "Good", color: "#84cc16" },
  average: { min: 40, label: "Average", color: "#eab308" },
  poor: { min: 20, label: "Needs Work", color: "#f97316" },
  critical: { min: 0, label: "Critical", color: "#ef4444" },
};

export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  post_trip: "Post-Trip Review Request",
  mid_trip_checkin: "Mid-Trip Check-In",
  manual_blast: "Manual Campaign",
  nps_survey: "NPS Survey",
};

export const DEFAULT_REVIEWS_PER_PAGE = 20;
