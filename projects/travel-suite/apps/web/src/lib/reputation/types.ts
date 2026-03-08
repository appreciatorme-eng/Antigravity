export type ReputationPlatform = "google" | "tripadvisor" | "facebook" | "makemytrip" | "internal";

export type SentimentLabel = "positive" | "neutral" | "negative";

export type ResponseStatus = "pending" | "draft" | "responded" | "not_needed";

export type BrandVoiceTone = "professional_warm" | "casual_friendly" | "formal" | "luxury";

export type LanguagePreference = "en" | "hi" | "mixed";

export type CampaignType = "post_trip" | "mid_trip_checkin" | "manual_blast" | "nps_survey";

export type CampaignStatus = "active" | "paused" | "archived";

export type TriggerEvent = "trip_completed" | "trip_day_2" | "manual";

export type PromoterAction = "google_review_link" | "tripadvisor_link" | "makemytrip_link" | "custom_link";

export type DetractorAction = "internal_feedback" | "private_form" | "escalate_owner";

export type SendStatus = "pending" | "sent" | "delivered" | "opened" | "completed" | "failed" | "expired";

export type RouteTarget = "google_review" | "tripadvisor_review" | "makemytrip_review" | "internal_feedback" | "followup";

export type ConnectionPlatform = "google_business" | "tripadvisor" | "facebook" | "makemytrip";

export type WidgetType = "carousel" | "grid" | "badge" | "floating" | "wall";

export type WidgetTheme = "light" | "dark" | "auto";

export type AIReviewTopic =
  | "hotel_quality"
  | "transport"
  | "driver_behavior"
  | "food"
  | "itinerary_planning"
  | "value_for_money"
  | "guide_quality"
  | "safety"
  | "communication"
  | "booking_process"
  | "weather"
  | "cleanliness"
  | "punctuality"
  | "flexibility"
  | "local_experience";

export interface ReputationReview {
  id: string;
  organization_id: string;
  platform: ReputationPlatform;
  platform_review_id: string | null;
  platform_url: string | null;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  review_date: string;
  language: string;
  trip_id: string | null;
  client_id: string | null;
  destination: string | null;
  trip_type: string | null;
  sentiment_score: number | null;
  sentiment_label: SentimentLabel | null;
  ai_topics: string[];
  ai_summary: string | null;
  response_status: ResponseStatus;
  response_text: string | null;
  ai_suggested_response: string | null;
  response_posted_at: string | null;
  response_posted_by: string | null;
  is_featured: boolean;
  is_verified_client: boolean;
  requires_attention: boolean;
  attention_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReputationSnapshot {
  id: string;
  organization_id: string;
  snapshot_date: string;
  google_rating: number;
  google_count: number;
  tripadvisor_rating: number;
  tripadvisor_count: number;
  facebook_rating: number;
  facebook_count: number;
  makemytrip_rating: number;
  makemytrip_count: number;
  internal_rating: number;
  internal_count: number;
  overall_rating: number;
  total_review_count: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  response_rate: number;
  avg_response_time_hours: number;
  nps_score: number | null;
  review_requests_sent: number;
  review_requests_converted: number;
  health_score: number;
  created_at: string;
}

export interface ReputationBrandVoice {
  id: string;
  organization_id: string;
  tone: BrandVoiceTone;
  language_preference: LanguagePreference;
  owner_name: string | null;
  sign_off: string | null;
  key_phrases: string[];
  avoid_phrases: string[];
  sample_responses: string[];
  auto_respond_positive: boolean;
  auto_respond_min_rating: number;
  escalation_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ReputationReviewCampaign {
  id: string;
  organization_id: string;
  name: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  trigger_event: TriggerEvent;
  trigger_delay_hours: number;
  target_rating_minimum: number;
  promoter_threshold: number;
  passive_threshold: number;
  promoter_action: PromoterAction;
  promoter_review_url: string | null;
  detractor_action: DetractorAction;
  channel_sequence: string[];
  whatsapp_template_name: string | null;
  email_template_id: string | null;
  nps_question: string;
  nps_followup_question: string;
  stats_sent: number;
  stats_opened: number;
  stats_completed: number;
  stats_reviews_generated: number;
  created_at: string;
  updated_at: string;
}

export interface ReputationCampaignSend {
  id: string;
  organization_id: string;
  campaign_id: string;
  trip_id: string | null;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  status: SendStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  nps_score: number | null;
  nps_feedback: string | null;
  nps_submitted_at: string | null;
  routed_to: RouteTarget | null;
  review_link: string | null;
  review_link_clicked: boolean;
  review_link_clicked_at: string | null;
  review_submitted: boolean;
  review_submitted_at: string | null;
  notification_queue_id: string | null;
  nps_token: string;
  nps_token_expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReputationPlatformConnection {
  id: string;
  organization_id: string;
  platform: ConnectionPlatform;
  platform_account_id: string | null;
  platform_account_name: string | null;
  platform_location_id: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  sync_cursor: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReputationCompetitor {
  id: string;
  organization_id: string;
  competitor_name: string;
  google_place_id: string | null;
  tripadvisor_url: string | null;
  website_url: string | null;
  latest_rating: number | null;
  latest_review_count: number | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReputationWidget {
  id: string;
  organization_id: string;
  name: string;
  widget_type: WidgetType;
  theme: WidgetTheme;
  accent_color: string;
  background_color: string | null;
  text_color: string | null;
  border_radius: number;
  min_rating_to_show: number;
  max_reviews: number;
  platforms_filter: string[];
  destinations_filter: string[];
  embed_token: string;
  is_active: boolean;
  show_branding: boolean;
  custom_header: string | null;
  custom_footer: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReputationHealthScoreFactors {
  avgRating: number;
  responseRate: number;
  avgResponseTimeHours: number | null;
  reviewVelocity: number;
  sentimentRatio: number;
}

export interface ReputationDashboardData {
  overallRating: number;
  totalReviews: number;
  responseRate: number;
  npsScore: number | null;
  healthScore: number;
  healthFactors: ReputationHealthScoreFactors;
  platformBreakdown: PlatformBreakdown[];
  ratingDistribution: Record<number, number>;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  recentReviews: ReputationReview[];
  attentionCount: number;
  trendsData: TrendDataPoint[];
}

export interface PlatformBreakdown {
  platform: ReputationPlatform;
  rating: number;
  count: number;
  label: string;
  color: string;
}

export interface TrendDataPoint {
  date: string;
  rating: number;
  reviewCount: number;
  healthScore: number;
  positive?: number;
  neutral?: number;
  negative?: number;
}

export interface ReviewsListParams {
  platform?: ReputationPlatform;
  rating?: number;
  status?: ResponseStatus;
  sentiment?: SentimentLabel;
  requiresAttention?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "review_date" | "rating" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface CreateReviewInput {
  platform: ReputationPlatform;
  platform_review_id?: string;
  platform_url?: string;
  reviewer_name: string;
  rating: number;
  title?: string;
  comment?: string;
  review_date?: string;
  destination?: string;
  trip_type?: string;
  trip_id?: string;
  client_id?: string;
}

export interface UpdateReviewInput {
  is_featured?: boolean;
  requires_attention?: boolean;
  attention_reason?: string;
  response_status?: ResponseStatus;
  response_text?: string;
}

export interface CreateCampaignInput {
  name: string;
  campaign_type: CampaignType;
  trigger_event: TriggerEvent;
  trigger_delay_hours?: number;
  promoter_threshold?: number;
  passive_threshold?: number;
  promoter_action?: PromoterAction;
  promoter_review_url?: string;
  detractor_action?: DetractorAction;
  channel_sequence?: string[];
  nps_question?: string;
  nps_followup_question?: string;
}

export interface NPSSubmission {
  token: string;
  score: number;
  feedback?: string;
}

export interface AIAnalysisResult {
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  topics: AIReviewTopic[];
  summary: string;
  requires_attention: boolean;
  attention_reason: string | null;
}

export interface AIResponseResult {
  suggested_response: string;
  tone_used: BrandVoiceTone;
  language: string;
}

export interface WidgetConfig {
  name: string;
  widget_type: WidgetType;
  theme: WidgetTheme;
  accent_color?: string;
  min_rating_to_show?: number;
  max_reviews?: number;
  platforms_filter?: string[];
  destinations_filter?: string[];
  show_branding?: boolean;
  custom_header?: string;
  custom_footer?: string;
}

export interface CampaignFunnelStats {
  sent: number;
  opened: number;
  completed: number;
  reviewsGenerated: number;
  conversionRate: number;
}

export interface PlatformConfig {
  id: ReputationPlatform;
  label: string;
  color: string;
  icon: string;
  reviewUrlTemplate?: string;
}
