-- Reputation Manager: Complete schema for all phases
-- Phase 1: reputation_reviews, reputation_snapshots, reputation_brand_voice
-- Phase 2: reputation_review_campaigns, reputation_campaign_sends
-- Phase 4: reputation_platform_connections, reputation_competitors
-- Phase 5: reputation_widgets

-- pgcrypto lives in 'extensions' schema on Supabase; grant access
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- PHASE 1: Foundation
-- ============================================================

CREATE TABLE IF NOT EXISTS reputation_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  platform TEXT NOT NULL DEFAULT 'internal'
    CHECK (platform IN ('google', 'tripadvisor', 'facebook', 'makemytrip', 'internal')),
  platform_review_id TEXT,
  platform_url TEXT,

  reviewer_name TEXT NOT NULL,
  reviewer_avatar_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  language TEXT DEFAULT 'en',

  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  destination TEXT,
  trip_type TEXT,

  sentiment_score NUMERIC(4,3) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment_label TEXT CHECK (sentiment_label IS NULL OR sentiment_label IN ('positive', 'neutral', 'negative')),
  ai_topics TEXT[] DEFAULT '{}',
  ai_summary TEXT,

  response_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (response_status IN ('pending', 'draft', 'responded', 'not_needed')),
  response_text TEXT,
  ai_suggested_response TEXT,
  response_posted_at TIMESTAMPTZ,
  response_posted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  is_featured BOOLEAN DEFAULT FALSE,
  is_verified_client BOOLEAN DEFAULT FALSE,
  requires_attention BOOLEAN DEFAULT FALSE,
  attention_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, platform, platform_review_id)
);

CREATE INDEX idx_rep_reviews_org_platform ON reputation_reviews(organization_id, platform);
CREATE INDEX idx_rep_reviews_org_date ON reputation_reviews(organization_id, review_date DESC);
CREATE INDEX idx_rep_reviews_org_attention ON reputation_reviews(organization_id, requires_attention) WHERE requires_attention = TRUE;
CREATE INDEX idx_rep_reviews_org_rating ON reputation_reviews(organization_id, rating);
CREATE INDEX idx_rep_reviews_org_sentiment ON reputation_reviews(organization_id, sentiment_label);

CREATE TABLE IF NOT EXISTS reputation_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  google_rating NUMERIC(3,2) DEFAULT 0,
  google_count INTEGER DEFAULT 0,
  tripadvisor_rating NUMERIC(3,2) DEFAULT 0,
  tripadvisor_count INTEGER DEFAULT 0,
  facebook_rating NUMERIC(3,2) DEFAULT 0,
  facebook_count INTEGER DEFAULT 0,
  makemytrip_rating NUMERIC(3,2) DEFAULT 0,
  makemytrip_count INTEGER DEFAULT 0,
  internal_rating NUMERIC(3,2) DEFAULT 0,
  internal_count INTEGER DEFAULT 0,

  overall_rating NUMERIC(3,2) DEFAULT 0,
  total_review_count INTEGER DEFAULT 0,

  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,

  response_rate NUMERIC(5,2) DEFAULT 0,
  avg_response_time_hours NUMERIC(8,2) DEFAULT 0,

  nps_score INTEGER,
  review_requests_sent INTEGER DEFAULT 0,
  review_requests_converted INTEGER DEFAULT 0,

  health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, snapshot_date)
);

CREATE INDEX idx_rep_snapshots_org_date ON reputation_snapshots(organization_id, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS reputation_brand_voice (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  tone TEXT NOT NULL DEFAULT 'professional_warm'
    CHECK (tone IN ('professional_warm', 'casual_friendly', 'formal', 'luxury')),
  language_preference TEXT DEFAULT 'en'
    CHECK (language_preference IN ('en', 'hi', 'mixed')),

  owner_name TEXT,
  sign_off TEXT,

  key_phrases TEXT[] DEFAULT '{}',
  avoid_phrases TEXT[] DEFAULT '{}',
  sample_responses TEXT[] DEFAULT '{}',

  auto_respond_positive BOOLEAN DEFAULT FALSE,
  auto_respond_min_rating INTEGER DEFAULT 4
    CHECK (auto_respond_min_rating >= 1 AND auto_respond_min_rating <= 5),
  escalation_threshold INTEGER DEFAULT 3
    CHECK (escalation_threshold >= 1 AND escalation_threshold <= 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- ============================================================
-- PHASE 2: Campaigns + NPS
-- ============================================================

CREATE TABLE IF NOT EXISTS reputation_review_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'post_trip'
    CHECK (campaign_type IN ('post_trip', 'mid_trip_checkin', 'manual_blast', 'nps_survey')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'archived')),

  trigger_event TEXT NOT NULL DEFAULT 'trip_completed'
    CHECK (trigger_event IN ('trip_completed', 'trip_day_2', 'manual')),
  trigger_delay_hours INTEGER DEFAULT 24,

  target_rating_minimum INTEGER DEFAULT 9,
  promoter_threshold INTEGER DEFAULT 9,
  passive_threshold INTEGER DEFAULT 7,
  promoter_action TEXT DEFAULT 'google_review_link'
    CHECK (promoter_action IN ('google_review_link', 'tripadvisor_link', 'makemytrip_link', 'custom_link')),
  promoter_review_url TEXT,
  detractor_action TEXT DEFAULT 'internal_feedback'
    CHECK (detractor_action IN ('internal_feedback', 'private_form', 'escalate_owner')),

  channel_sequence TEXT[] DEFAULT '{whatsapp}',
  whatsapp_template_name TEXT,
  email_template_id TEXT,

  nps_question TEXT DEFAULT 'On a scale of 1-10, how likely are you to recommend us to a friend?',
  nps_followup_question TEXT DEFAULT 'What would make your experience a 10?',

  stats_sent INTEGER DEFAULT 0,
  stats_opened INTEGER DEFAULT 0,
  stats_completed INTEGER DEFAULT 0,
  stats_reviews_generated INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rep_campaigns_org_status ON reputation_review_campaigns(organization_id, status);

CREATE TABLE IF NOT EXISTS reputation_campaign_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES reputation_review_campaigns(id) ON DELETE CASCADE,

  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'completed', 'failed', 'expired')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  nps_score INTEGER CHECK (nps_score IS NULL OR (nps_score >= 1 AND nps_score <= 10)),
  nps_feedback TEXT,
  nps_submitted_at TIMESTAMPTZ,

  routed_to TEXT CHECK (routed_to IS NULL OR routed_to IN ('google_review', 'tripadvisor_review', 'makemytrip_review', 'internal_feedback', 'followup')),
  review_link TEXT,
  review_link_clicked BOOLEAN DEFAULT FALSE,
  review_link_clicked_at TIMESTAMPTZ,
  review_submitted BOOLEAN DEFAULT FALSE,
  review_submitted_at TIMESTAMPTZ,

  notification_queue_id UUID,

  nps_token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  nps_token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rep_sends_campaign ON reputation_campaign_sends(campaign_id, status);
CREATE INDEX idx_rep_sends_org ON reputation_campaign_sends(organization_id, created_at DESC);
CREATE INDEX idx_rep_sends_token ON reputation_campaign_sends(nps_token) WHERE nps_token IS NOT NULL;
CREATE INDEX idx_rep_sends_trip ON reputation_campaign_sends(trip_id) WHERE trip_id IS NOT NULL;

-- ============================================================
-- PHASE 4: Platform Connections + Competitors
-- ============================================================

CREATE TABLE IF NOT EXISTS reputation_platform_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  platform TEXT NOT NULL
    CHECK (platform IN ('google_business', 'tripadvisor', 'facebook', 'makemytrip')),
  platform_account_id TEXT,
  platform_account_name TEXT,
  platform_location_id TEXT,

  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  sync_enabled BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  sync_cursor TEXT,
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, platform)
);

CREATE TABLE IF NOT EXISTS reputation_competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  competitor_name TEXT NOT NULL,
  google_place_id TEXT,
  tripadvisor_url TEXT,
  website_url TEXT,

  latest_rating NUMERIC(3,2),
  latest_review_count INTEGER,
  last_checked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rep_competitors_org ON reputation_competitors(organization_id);

-- ============================================================
-- PHASE 5: Widgets
-- ============================================================

CREATE TABLE IF NOT EXISTS reputation_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL DEFAULT 'Review Widget',
  widget_type TEXT NOT NULL DEFAULT 'carousel'
    CHECK (widget_type IN ('carousel', 'grid', 'badge', 'floating', 'wall')),
  theme TEXT NOT NULL DEFAULT 'light'
    CHECK (theme IN ('light', 'dark', 'auto')),

  accent_color TEXT DEFAULT '#00d084',
  background_color TEXT,
  text_color TEXT,
  border_radius INTEGER DEFAULT 12,

  min_rating_to_show INTEGER DEFAULT 4
    CHECK (min_rating_to_show >= 1 AND min_rating_to_show <= 5),
  max_reviews INTEGER DEFAULT 10,
  platforms_filter TEXT[] DEFAULT '{}',
  destinations_filter TEXT[] DEFAULT '{}',

  embed_token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  is_active BOOLEAN DEFAULT TRUE,

  show_branding BOOLEAN DEFAULT TRUE,
  custom_header TEXT,
  custom_footer TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rep_widgets_org ON reputation_widgets(organization_id);
CREATE INDEX idx_rep_widgets_token ON reputation_widgets(embed_token) WHERE embed_token IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE reputation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_brand_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_review_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_widgets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION reputation_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'reputation_reviews',
    'reputation_snapshots',
    'reputation_brand_voice',
    'reputation_review_campaigns',
    'reputation_campaign_sends',
    'reputation_platform_connections',
    'reputation_competitors',
    'reputation_widgets'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (organization_id = reputation_user_org_id())',
      tbl || '_select_policy', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (organization_id = reputation_user_org_id())',
      tbl || '_insert_policy', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (organization_id = reputation_user_org_id())',
      tbl || '_update_policy', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (organization_id = reputation_user_org_id())',
      tbl || '_delete_policy', tbl
    );
  END LOOP;
END;
$$;

-- Public access for NPS token lookups (no auth required)
CREATE POLICY reputation_campaign_sends_public_nps
  ON reputation_campaign_sends
  FOR SELECT
  TO anon
  USING (nps_token IS NOT NULL AND nps_token_expires_at > NOW());

-- Public access for widget embed token
CREATE POLICY reputation_widgets_public_embed
  ON reputation_widgets
  FOR SELECT
  TO anon
  USING (embed_token IS NOT NULL AND is_active = TRUE);

-- Public reviews access via widget
CREATE POLICY reputation_reviews_public_widget
  ON reputation_reviews
  FOR SELECT
  TO anon
  USING (is_featured = TRUE);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_reputation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'reputation_reviews',
    'reputation_brand_voice',
    'reputation_review_campaigns',
    'reputation_campaign_sends',
    'reputation_platform_connections',
    'reputation_competitors',
    'reputation_widgets'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_reputation_updated_at()',
      'trg_' || tbl || '_updated_at', tbl
    );
  END LOOP;
END;
$$;
