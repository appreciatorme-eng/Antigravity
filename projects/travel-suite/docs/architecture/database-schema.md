# Database Schema

> TripBuilt Travel SaaS -- 109 tables across PostgreSQL (Supabase) with RLS enabled on all tables.

## Table of Contents

- [Master Overview](#master-overview)
- [Core Domain](#core-domain)
- [CRM Domain](#crm-domain)
- [Logistics Domain](#logistics-domain)
- [Payments Domain](#payments-domain)
- [Notifications Domain](#notifications-domain)
- [AI / RAG Domain](#ai--rag-domain)
- [Workflows Domain](#workflows-domain)
- [Location Sharing Domain](#location-sharing-domain)
- [Proposals Domain](#proposals-domain)
- [Social Media Domain](#social-media-domain)
- [Reputation Domain](#reputation-domain)
- [Marketplace Domain](#marketplace-domain)
- [Subscriptions Domain](#subscriptions-domain)
- [Templates Domain](#templates-domain)
- [Platform Admin Domain](#platform-admin-domain)
- [RLS Policy Patterns](#rls-policy-patterns)

---

## Master Overview

This diagram shows how the major domain groups connect to each other through shared foreign keys.

```mermaid
graph TD
    CORE[Core<br/>profiles, organizations,<br/>trips, itineraries]
    CRM[CRM<br/>crm_contacts,<br/>conversion_events]
    LOG[Logistics<br/>driver_assignments,<br/>accommodations,<br/>external_drivers]
    PAY[Payments<br/>invoices,<br/>invoice_payments,<br/>payment_links]
    NOTIF[Notifications<br/>notification_queue,<br/>notification_logs]
    AI[AI / RAG<br/>assistant_conversations,<br/>policy_embeddings,<br/>organization_ai_usage]
    WF[Workflows<br/>workflow_stage_events,<br/>workflow_notification_rules]
    LOC[Location Sharing<br/>trip_location_shares,<br/>access_logs]
    PROP[Proposals<br/>proposals, proposal_days,<br/>payment_plans]
    SOCIAL[Social Media<br/>social_posts,<br/>social_connections]
    REP[Reputation<br/>reputation_reviews,<br/>campaigns, NPS]
    MKT[Marketplace<br/>marketplace_profiles,<br/>inquiries, reviews]
    SUB[Subscriptions<br/>subscriptions,<br/>payment_methods]
    TMPL[Templates<br/>tour_templates,<br/>template_days]
    ADMIN[Platform Admin<br/>platform_settings,<br/>announcements, audit_log]

    CORE --> CRM
    CORE --> LOG
    CORE --> PAY
    CORE --> NOTIF
    CORE --> AI
    CORE --> WF
    CORE --> LOC
    CORE --> PROP
    CORE --> SOCIAL
    CORE --> REP
    CORE --> MKT
    CORE --> SUB
    CORE --> TMPL
    CORE --> ADMIN
    CRM --> PROP
    PROP --> PAY
    LOG --> NOTIF
    TMPL --> PROP

    style CORE fill:#4CAF50,color:#fff
    style CRM fill:#FF9800,color:#fff
    style LOG fill:#2196F3,color:#fff
    style PAY fill:#F44336,color:#fff
    style NOTIF fill:#9C27B0,color:#fff
    style AI fill:#00BCD4,color:#fff
    style WF fill:#795548,color:#fff
    style LOC fill:#607D8B,color:#fff
    style PROP fill:#E91E63,color:#fff
    style SOCIAL fill:#3F51B5,color:#fff
    style REP fill:#FF5722,color:#fff
    style MKT fill:#009688,color:#fff
    style SUB fill:#CDDC39,color:#000
    style TMPL fill:#8BC34A,color:#fff
    style ADMIN fill:#455A64,color:#fff
```

---

## Core Domain

The foundational tables that all other domains reference. Every row is scoped to an `organization_id` for multi-tenancy.

```mermaid
erDiagram
    organizations {
        uuid id PK
        text name
        text slug
        text phone
        text email
        text logo_url
        text gstin
        jsonb settings
        timestamp created_at
    }

    profiles {
        uuid id PK
        uuid organization_id FK
        text email
        text full_name
        text phone
        text role "admin | client | driver | super_admin"
        int onboarding_step
        text avatar_url
        timestamp created_at
    }

    trips {
        uuid id PK
        uuid organization_id FK
        uuid client_id FK
        text title
        text status "draft | confirmed | in_progress | completed | cancelled"
        date start_date
        date end_date
        text destination
        int pax
        numeric total_price
        numeric total_cost
        timestamp created_at
    }

    itineraries {
        uuid id PK
        uuid trip_id FK
        uuid organization_id FK
        text title
        jsonb days "array of day plans"
        text status
        text currency
        timestamp created_at
    }

    clients {
        uuid id PK
        uuid organization_id FK
        uuid profile_id FK
        text name
        text email
        text phone
        text source
        jsonb preferences
        timestamp created_at
    }

    organizations ||--o{ profiles : "has members"
    organizations ||--o{ trips : "owns"
    organizations ||--o{ clients : "manages"
    trips ||--o{ itineraries : "has"
    clients ||--o{ trips : "books"
    profiles ||--o| clients : "linked to"
```

---

## CRM Domain

Lead and contact management with conversion tracking from initial inquiry to booked client.

```mermaid
erDiagram
    crm_contacts {
        uuid id PK
        uuid organization_id FK
        text name
        text email
        text phone
        text status "new | contacted | qualified | converted | lost"
        text source "whatsapp | website | referral | manual"
        jsonb metadata
        uuid converted_profile_id FK "nullable"
        timestamp created_at
    }

    lead_events {
        uuid id PK
        uuid organization_id FK
        text event_type
        jsonb event_data
        timestamp created_at
    }

    conversion_events {
        uuid id PK
        uuid organization_id FK
        text event_type
        text source
        jsonb metadata
        timestamp created_at
    }

    referrals {
        uuid id PK
        uuid organization_id FK
        uuid referrer_id FK
        uuid referred_id FK
        text status
        timestamp created_at
    }

    crm_contacts ||--o| profiles : "converts to"
    organizations ||--o{ crm_contacts : "manages"
    organizations ||--o{ lead_events : "tracks"
    organizations ||--o{ conversion_events : "measures"
    organizations ||--o{ referrals : "has"
```

**Purpose**: CRM contacts represent pre-client leads. When a contact converts, their `converted_profile_id` links to the newly created `profiles` row, and a corresponding `clients` row is created.

---

## Logistics Domain

Driver management, trip assignments, vehicle tracking, and accommodation logistics.

```mermaid
erDiagram
    trip_driver_assignments {
        uuid id PK
        uuid trip_id FK
        uuid driver_id FK "nullable - internal driver"
        uuid external_driver_id FK "nullable - external driver"
        text status "assigned | en_route | picked_up | completed"
        text vehicle_type
        text vehicle_number
        date assignment_date
        timestamp created_at
    }

    trip_accommodations {
        uuid id PK
        uuid trip_id FK
        text hotel_name
        text room_type
        date check_in
        date check_out
        numeric cost
        text status
        timestamp created_at
    }

    external_drivers {
        uuid id PK
        uuid organization_id FK
        text name
        text phone
        text vehicle_type
        text vehicle_number
        text license_number
        boolean is_active
        timestamp created_at
    }

    driver_accounts {
        uuid id PK
        uuid profile_id FK
        uuid organization_id FK
        text license_number
        text vehicle_type
        text vehicle_number
        boolean is_available
        timestamp created_at
    }

    driver_locations {
        uuid id PK
        uuid driver_id FK
        float latitude
        float longitude
        float accuracy
        float heading
        float speed
        timestamp recorded_at
    }

    trip_service_costs {
        uuid id PK
        uuid trip_id FK
        uuid organization_id FK
        text service_type
        text vendor_name
        numeric cost
        text notes
        timestamp created_at
    }

    trips ||--o{ trip_driver_assignments : "assigned drivers"
    trips ||--o{ trip_accommodations : "booked hotels"
    trips ||--o{ trip_service_costs : "vendor costs"
    external_drivers ||--o{ trip_driver_assignments : "external"
    driver_accounts ||--o{ trip_driver_assignments : "internal"
    driver_accounts ||--o{ driver_locations : "tracked"
    profiles ||--|| driver_accounts : "driver profile"
    organizations ||--o{ external_drivers : "manages"
```

**Purpose**: Supports both internal drivers (linked via `profiles` and `driver_accounts`) and external/freelance drivers (via `external_drivers`). Each trip can have multiple driver assignments for multi-leg journeys.

---

## Payments Domain

Invoice generation, payment tracking, and Razorpay integration for the Indian market (INR currency).

```mermaid
erDiagram
    invoices {
        uuid id PK
        uuid organization_id FK
        uuid trip_id FK
        uuid client_id FK
        text invoice_number
        numeric subtotal
        numeric tax_amount
        numeric total
        text status "draft | sent | paid | partially_paid | overdue | cancelled"
        date due_date
        text currency "INR"
        jsonb line_items
        timestamp created_at
    }

    invoice_payments {
        uuid id PK
        uuid invoice_id FK
        numeric amount
        text payment_method "razorpay | bank_transfer | cash | upi"
        text razorpay_payment_id
        text razorpay_order_id
        text status "pending | captured | failed | refunded"
        timestamp paid_at
    }

    payment_links {
        uuid id PK
        uuid organization_id FK
        uuid invoice_id FK
        text token "unique shareable token"
        numeric amount
        text status "active | paid | expired"
        timestamp expires_at
        timestamp created_at
    }

    payment_events {
        uuid id PK
        uuid organization_id FK
        text event_type
        jsonb payload
        timestamp created_at
    }

    payment_methods {
        uuid id PK
        uuid organization_id FK
        text method_type "razorpay | bank | upi"
        jsonb config
        boolean is_default
        timestamp created_at
    }

    e_invoice_settings {
        uuid id PK
        uuid organization_id FK
        text gstin
        text legal_name
        jsonb irp_credentials
        boolean is_enabled
        timestamp created_at
    }

    invoices ||--o{ invoice_payments : "receives"
    invoices ||--o{ payment_links : "shareable link"
    trips ||--o{ invoices : "billed"
    clients ||--o{ invoices : "billed to"
    organizations ||--o{ payment_methods : "configured"
    organizations ||--o{ payment_events : "logged"
    organizations ||--|| e_invoice_settings : "GST e-invoicing"
```

**Purpose**: Full billing lifecycle from invoice creation through Razorpay payment capture. Payment links allow clients to pay via a tokenized URL. E-invoicing supports Indian GST compliance with IRP integration.

---

## Notifications Domain

Multi-channel notification system with queue-based delivery, retry logic, and dead letter handling.

```mermaid
erDiagram
    notification_queue {
        uuid id PK
        uuid organization_id FK
        text channel "whatsapp | email | push | sms"
        text recipient
        text template_name
        jsonb template_params
        text status "pending | processing | sent | failed | dead_letter"
        int retry_count
        timestamp scheduled_for
        timestamp created_at
    }

    notification_logs {
        uuid id PK
        uuid organization_id FK
        uuid notification_id FK
        text channel
        text status
        text error_message
        jsonb response_data
        timestamp created_at
    }

    notification_delivery_status {
        uuid id PK
        uuid notification_id FK
        text delivery_status "delivered | read | failed"
        timestamp status_at
    }

    notification_dead_letters {
        uuid id PK
        uuid organization_id FK
        uuid original_notification_id FK
        text channel
        text error_reason
        jsonb original_payload
        timestamp created_at
    }

    push_tokens {
        uuid id PK
        uuid user_id FK
        text token
        text platform "web | ios | android"
        boolean is_active
        timestamp created_at
    }

    notification_queue ||--o{ notification_logs : "attempt log"
    notification_queue ||--o{ notification_delivery_status : "delivery tracking"
    notification_queue ||--o| notification_dead_letters : "permanent failure"
    profiles ||--o{ push_tokens : "registered devices"
    organizations ||--o{ notification_queue : "queued"
```

**Purpose**: Notifications are queued first (not sent directly) and processed by the notification engine. Failed deliveries are retried with exponential backoff. After max retries, notifications move to the dead letter table for investigation.

---

## AI / RAG Domain

AI assistant conversations, policy embeddings for RAG retrieval, and per-organization AI usage tracking.

```mermaid
erDiagram
    assistant_conversations {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        uuid session_id FK
        text message_role "user | assistant | system"
        text message_content
        text action_name
        jsonb action_result
        text title
        jsonb metadata
        timestamp created_at
    }

    assistant_sessions {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        text title
        text status "active | archived"
        timestamp created_at
    }

    assistant_preferences {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        text preferred_language
        jsonb feature_flags
        timestamp created_at
    }

    assistant_audit_log {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        uuid session_id FK
        text event_type
        text channel
        text action_name
        jsonb action_params
        jsonb action_result
        timestamp created_at
    }

    policy_embeddings {
        uuid id PK
        uuid organization_id FK
        text content
        text source
        vector embedding "pgvector 1536-dim (OpenAI)"
        jsonb metadata
        timestamp created_at
    }

    itinerary_embeddings {
        uuid id PK
        uuid itinerary_id FK
        text content
        vector embedding "pgvector 1536-dim"
        jsonb metadata
        timestamp created_at
    }

    organization_ai_usage {
        uuid id PK
        uuid organization_id FK
        text model
        int prompt_tokens
        int completion_tokens
        numeric cost_usd
        text feature "assistant | itinerary | pricing | social"
        timestamp created_at
    }

    assistant_sessions ||--o{ assistant_conversations : "messages"
    assistant_sessions ||--o{ assistant_audit_log : "audit trail"
    profiles ||--o{ assistant_sessions : "owns"
    organizations ||--o{ policy_embeddings : "knowledge base"
    itineraries ||--o{ itinerary_embeddings : "searchable"
    organizations ||--o{ organization_ai_usage : "tracked"
    organizations ||--o{ assistant_preferences : "per-user prefs"
```

**Purpose**: The AI assistant uses RAG (Retrieval-Augmented Generation) with pgvector embeddings. `policy_embeddings` stores organizational policies and knowledge. `organization_ai_usage` tracks token consumption and cost per feature for billing and cost alerts.

---

## Workflows Domain

Event-driven workflow automation with configurable notification rules triggered by trip stage changes.

```mermaid
erDiagram
    workflow_stage_events {
        uuid id PK
        uuid trip_id FK
        uuid organization_id FK
        text from_stage
        text to_stage
        uuid triggered_by FK
        jsonb metadata
        timestamp created_at
    }

    workflow_notification_rules {
        uuid id PK
        uuid organization_id FK
        text trigger_stage
        text channel "whatsapp | email | push"
        text recipient_type "client | driver | admin"
        text template_name
        boolean is_active
        int delay_minutes
        timestamp created_at
    }

    trips ||--o{ workflow_stage_events : "stage changes"
    organizations ||--o{ workflow_notification_rules : "configured rules"
```

**Purpose**: When a trip transitions between stages (e.g., `confirmed` to `in_progress`), the automation engine checks `workflow_notification_rules` and queues appropriate notifications with optional delays.

---

## Location Sharing Domain

Real-time trip location sharing with tokenized access for clients and access logging.

```mermaid
erDiagram
    trip_location_shares {
        uuid id PK
        uuid trip_id FK
        uuid organization_id FK
        text token "unique share token"
        text status "active | expired | revoked"
        timestamp expires_at
        uuid created_by FK
        timestamp created_at
    }

    trip_location_share_access_logs {
        uuid id PK
        uuid share_id FK
        text ip_address
        text user_agent
        timestamp accessed_at
    }

    trips ||--o{ trip_location_shares : "shareable links"
    trip_location_shares ||--o{ trip_location_share_access_logs : "access audit"
```

**Purpose**: Operators create shareable links for clients to track their driver's live location during a trip. Each access is logged for security auditing.

---

## Proposals Domain

Multi-tier trip proposals with day-by-day itineraries, activities, accommodations, and payment plans.

```mermaid
erDiagram
    proposals {
        uuid id PK
        uuid organization_id FK
        uuid trip_id FK
        uuid client_id FK
        text title
        text status "draft | sent | viewed | accepted | rejected | expired"
        text currency
        numeric total_price
        text public_token "shareable link"
        int version
        timestamp sent_at
        timestamp created_at
    }

    proposal_versions {
        uuid id PK
        uuid proposal_id FK
        int version_number
        jsonb snapshot
        timestamp created_at
    }

    proposal_days {
        uuid id PK
        uuid proposal_id FK
        int day_number
        text title
        text description
        timestamp created_at
    }

    proposal_activities {
        uuid id PK
        uuid day_id FK
        text title
        text description
        numeric price
        text image_url
        int sort_order
    }

    proposal_accommodations {
        uuid id PK
        uuid day_id FK
        text hotel_name
        text room_type
        numeric price
        text image_url
    }

    proposal_add_ons {
        uuid id PK
        uuid proposal_id FK
        uuid add_on_id FK
        numeric price
        int quantity
    }

    proposal_payment_plans {
        uuid id PK
        uuid proposal_id FK
        text plan_type "full | installment"
        jsonb milestones
        timestamp created_at
    }

    proposal_payment_milestones {
        uuid id PK
        uuid plan_id FK
        text title
        numeric amount
        date due_date
        text status "pending | paid"
    }

    proposal_comments {
        uuid id PK
        uuid proposal_id FK
        uuid user_id FK
        text content
        timestamp created_at
    }

    proposals ||--o{ proposal_versions : "version history"
    proposals ||--o{ proposal_days : "itinerary days"
    proposals ||--o{ proposal_add_ons : "extras"
    proposals ||--o{ proposal_payment_plans : "payment options"
    proposals ||--o{ proposal_comments : "collaboration"
    proposal_days ||--o{ proposal_activities : "activities"
    proposal_days ||--o{ proposal_accommodations : "hotels"
    proposal_payment_plans ||--o{ proposal_payment_milestones : "installments"
    trips ||--o{ proposals : "quoted"
    clients ||--o{ proposals : "receives"
```

---

## Social Media Domain

Social media post management, multi-platform publishing queue, and OAuth connections.

```mermaid
erDiagram
    social_posts {
        uuid id PK
        uuid organization_id FK
        text content
        text platform "instagram | facebook | linkedin"
        text status "draft | scheduled | published | failed"
        text image_url
        jsonb metadata
        timestamp scheduled_for
        timestamp published_at
        timestamp created_at
    }

    social_post_queue {
        uuid id PK
        uuid post_id FK
        text platform
        text status "pending | processing | sent | failed"
        text platform_post_id
        text error_message
        int retry_count
        timestamp updated_at
    }

    social_connections {
        uuid id PK
        uuid organization_id FK
        text platform
        text account_name
        text access_token "encrypted"
        text refresh_token "encrypted"
        timestamp token_expires_at
        boolean is_active
        timestamp created_at
    }

    social_media_library {
        uuid id PK
        uuid organization_id FK
        text url
        text type "image | video"
        jsonb metadata
        timestamp created_at
    }

    social_reviews {
        uuid id PK
        uuid organization_id FK
        text platform
        text reviewer_name
        int rating
        text content
        timestamp reviewed_at
    }

    social_posts ||--o{ social_post_queue : "publishing queue"
    organizations ||--o{ social_posts : "creates"
    organizations ||--o{ social_connections : "linked accounts"
    organizations ||--o{ social_media_library : "asset library"
    organizations ||--o{ social_reviews : "imported reviews"
```

---

## Reputation Domain

Review management, NPS campaigns, competitor tracking, and AI-powered review response generation.

```mermaid
erDiagram
    reputation_reviews {
        uuid id PK
        uuid organization_id FK
        text platform "google | tripadvisor | trustpilot"
        text reviewer_name
        int rating
        text content
        text response_text
        text sentiment "positive | neutral | negative"
        jsonb ai_analysis
        timestamp reviewed_at
        timestamp responded_at
    }

    reputation_review_campaigns {
        uuid id PK
        uuid organization_id FK
        text name
        text trigger_event "trip_completed | trip_day_2"
        text channel "whatsapp | email | sms"
        text status "active | paused | completed"
        text review_platform_url
        timestamp created_at
    }

    reputation_campaign_sends {
        uuid id PK
        uuid campaign_id FK
        uuid client_id FK
        text status "pending | sent | clicked | reviewed"
        timestamp sent_at
    }

    reputation_brand_voice {
        uuid id PK
        uuid organization_id FK
        text tone
        text guidelines
        jsonb examples
        timestamp created_at
    }

    reputation_snapshots {
        uuid id PK
        uuid organization_id FK
        float avg_rating
        int total_reviews
        jsonb platform_breakdown
        timestamp snapshot_date
    }

    reputation_platform_connections {
        uuid id PK
        uuid organization_id FK
        text platform
        text platform_id
        text access_token
        boolean is_active
        timestamp created_at
    }

    reputation_widgets {
        uuid id PK
        uuid organization_id FK
        text token
        jsonb config
        boolean is_active
        timestamp created_at
    }

    reputation_competitors {
        uuid id PK
        uuid organization_id FK
        text name
        text platform
        text platform_url
        float latest_rating
        timestamp created_at
    }

    review_marketing_assets {
        uuid id PK
        uuid review_id FK
        text asset_type "image | video"
        text url
        jsonb config
        timestamp created_at
    }

    organizations ||--o{ reputation_reviews : "collected"
    organizations ||--o{ reputation_review_campaigns : "runs"
    reputation_review_campaigns ||--o{ reputation_campaign_sends : "send log"
    organizations ||--|| reputation_brand_voice : "voice config"
    organizations ||--o{ reputation_snapshots : "historical scores"
    organizations ||--o{ reputation_platform_connections : "linked"
    organizations ||--o{ reputation_widgets : "embeddable"
    organizations ||--o{ reputation_competitors : "tracked"
    reputation_reviews ||--o{ review_marketing_assets : "turned into assets"
```

---

## Marketplace Domain

Public marketplace where travel operators list their services and receive inquiries.

```mermaid
erDiagram
    marketplace_profiles {
        uuid id PK
        uuid organization_id FK
        text business_name
        text description
        text specialties
        text destinations
        float rating
        int review_count
        boolean is_verified
        boolean is_active
        timestamp created_at
    }

    marketplace_inquiries {
        uuid id PK
        uuid profile_id FK
        text inquirer_name
        text inquirer_email
        text message
        text status "new | responded | closed"
        timestamp created_at
    }

    marketplace_reviews {
        uuid id PK
        uuid profile_id FK
        text reviewer_name
        int rating
        text content
        boolean is_verified
        timestamp created_at
    }

    marketplace_profile_views {
        uuid id PK
        uuid profile_id FK
        text source
        timestamp viewed_at
    }

    marketplace_listing_subscriptions {
        uuid id PK
        uuid organization_id FK
        text plan "free | premium"
        text status "active | expired | cancelled"
        timestamp expires_at
        timestamp created_at
    }

    organizations ||--|| marketplace_profiles : "listed"
    marketplace_profiles ||--o{ marketplace_inquiries : "receives"
    marketplace_profiles ||--o{ marketplace_reviews : "rated"
    marketplace_profiles ||--o{ marketplace_profile_views : "analytics"
    organizations ||--o| marketplace_listing_subscriptions : "subscription"
```

---

## Subscriptions Domain

SaaS subscription management with tier-based feature limits.

```mermaid
erDiagram
    subscriptions {
        uuid id PK
        uuid organization_id FK
        text plan "free | starter | professional | enterprise"
        text status "active | cancelled | past_due | trialing"
        text billing_cycle "monthly | annual"
        timestamp current_period_start
        timestamp current_period_end
        timestamp cancelled_at
        timestamp created_at
    }

    organizations ||--o| subscriptions : "subscribes"
```

---

## Templates Domain

Reusable tour templates with quality scoring, usage tracking, and deep cloning into proposals.

```mermaid
erDiagram
    tour_templates {
        uuid id PK
        uuid organization_id FK
        text title
        text description
        text destination
        int duration_days
        text difficulty
        text category
        numeric base_price
        float quality_score
        text searchable_text
        boolean is_published
        timestamp created_at
    }

    template_days {
        uuid id PK
        uuid template_id FK
        int day_number
        text title
        text description
    }

    template_activities {
        uuid id PK
        uuid day_id FK
        text title
        text description
        numeric price
        int sort_order
    }

    template_accommodations {
        uuid id PK
        uuid day_id FK
        text hotel_name
        text room_type
        numeric price
    }

    template_usage {
        uuid id PK
        uuid template_id FK
        uuid organization_id FK
        text usage_type "cloned | viewed | forked"
        timestamp created_at
    }

    template_views {
        uuid id PK
        uuid template_id FK
        uuid user_id FK
        timestamp viewed_at
    }

    tour_templates ||--o{ template_days : "itinerary"
    template_days ||--o{ template_activities : "activities"
    template_days ||--o{ template_accommodations : "hotels"
    tour_templates ||--o{ template_usage : "tracked"
    tour_templates ||--o{ template_views : "viewed"
    organizations ||--o{ tour_templates : "creates"
```

---

## Platform Admin Domain

Super-admin tables for platform-wide settings, announcements, and audit logging.

```mermaid
erDiagram
    platform_settings {
        uuid id PK
        text key
        jsonb value
        timestamp updated_at
    }

    platform_announcements {
        uuid id PK
        text title
        text content
        text status "draft | published | archived"
        text target_audience "all | admins | clients"
        timestamp published_at
        timestamp created_at
    }

    platform_audit_log {
        uuid id PK
        uuid actor_id FK
        text action
        text resource_type
        text resource_id
        jsonb details
        text ip_address
        timestamp created_at
    }

    support_tickets {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        text subject
        text description
        text status "open | in_progress | resolved | closed"
        text priority "low | medium | high | urgent"
        timestamp created_at
    }

    operator_scorecards {
        uuid id PK
        uuid organization_id FK
        text month_key
        jsonb metrics
        float overall_score
        timestamp created_at
    }

    profiles ||--o{ platform_audit_log : "audited"
    organizations ||--o{ support_tickets : "submits"
    organizations ||--o{ operator_scorecards : "monthly scores"
```

---

## RLS Policy Patterns

All 109 tables have Row-Level Security (RLS) enabled. The main policy patterns used are:

### Organization Scoping

Most tables use a policy like:

```sql
CREATE POLICY "org_access" ON table_name
  FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
```

This ensures users can only access rows belonging to their organization.

### Role-Based Access

Admin-only operations use:

```sql
CREATE POLICY "admin_only" ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND organization_id = table_name.organization_id
    )
  );
```

### Super Admin Access

Platform-wide tables use:

```sql
CREATE POLICY "super_admin_access" ON table_name
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );
```

### Public Read Access

Marketplace and public-facing tables allow unauthenticated reads:

```sql
CREATE POLICY "public_read" ON marketplace_profiles
  FOR SELECT
  USING (is_active = true AND is_verified = true);
```

### Service Role Bypass

Cron jobs and internal operations use the Supabase service role key, which bypasses RLS entirely. This is used for cross-organization operations like campaign processing and scorecard generation.
