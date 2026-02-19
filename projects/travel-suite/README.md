# Travel Suite Project

A comprehensive AI-powered travel planning and management platform for tour operators. Built as a **B2B SaaS product** for travel agents using modern technologies.

## 🏗️ Architecture

```
travel-suite/
├── apps/
│   ├── mobile/          # Flutter client app (iOS/Android)
│   ├── web/             # Next.js 16 web app + admin panel
│   └── agents/          # Python AI agents (FastAPI + Agno)
├── docs/                # Project documentation (52+ docs), including proposal system guides
├── scripts/             # Utility scripts (RLS verification)
├── supabase/            # Edge Functions + 39 migrations
│   ├── functions/       # send-notification (v8)
│   ├── migrations/      # 39 SQL migration files
│   └── schema.sql       # Master schema reference
└── packages/            # Shared code (future)
```

## 🚀 Quick Start

### Web App
```bash
cd apps/web
npm install
npm run dev
```

### Mobile App
```bash
cd apps/mobile
flutter pub get
flutter run
```

### AI Agents
```bash
cd apps/agents
pip install -r requirements.txt
python main.py
```
> **Note**: All AI endpoints require JWT authentication and are rate-limited (5 req/min, 60 req/hr per user).

## 📱 Mobile App Features

- **Authentication**: Email/password + Google OAuth via Supabase
- **Role Onboarding**: Progressive profile setup with specific fields for `Client` (Bio, Diet, Mobility) and `Driver` (Vehicle, License)
- **Trips Overview**: Animated card list with shimmer loading
- **Trip Detail**: Collapsing header (SliverAppBar), day selector, activity timeline
- **Driver Info**: View assigned driver details
- **Notifications**: FCM push + local notifications for "I've Landed" feature
- **Maps**: Interactive OpenStreetMap via flutter_map
- **Driver Live Location**: Driver-mode users can publish real-time location pings (~20s interval)
- **Client Live Tracking**: Open current live driver route from trip detail

### Key Dependencies
- `supabase_flutter` - Backend integration
- `flutter_riverpod` - State management
- `freezed` - Immutable data classes (3.x, abstract class pattern)
- `flutter_animate` - Entrance animations
- `shimmer` - Loading skeletons
- `flutter_map` - Interactive maps
- `firebase_messaging` + `flutter_local_notifications` - Push + local notifications

## 🌐 Web App Features

### Core Features
- **RAG-Based Itinerary System**: 3-tier generation (Cache → RAG → AI) with 95% cost savings
  - **Unified Template Sharing**: Tour operators share professional templates across network
  - **Smart Assembly**: AI combines best fragments from multiple operators
  - **Quality Ranking**: 50% similarity + 30% quality + 15% usage + 5% recency
  - **Attribution Tracking**: Analytics for template usage and contribution
  - **Cost**: $0.0007/query (RAG) vs $0.01/query (pure AI) = 93% savings
  - **Speed**: 200-500ms (RAG) vs 3-5 seconds (AI)
  - 📚 **Quick Start**: See `docs/RAG_QUICKSTART.md` (5-minute setup)
  - 📚 **Technical Docs**: See `docs/rag-system-implementation.md`
  - 📚 **Migration Guide**: See `docs/MIGRATION_GUIDE.md`
- **AI Itinerary Generator**: Powered by Google Gemini 1.5 Flash (fallback tier)
- **Weather Integration**: Open-Meteo API (free, no key required)
- **Currency Conversion**: Frankfurter API (free, unlimited)
- **PDF Export**: @react-pdf/renderer with dynamic operator branding
- **Maps**: MapLibre GL JS (via mapcn)
- **Authentication**: Supabase Auth with Google OAuth
- **Monitoring**: Sentry (error tracking) + PostHog (product analytics)

### Interactive Proposal System (Revolutionary Feature)
- **Template Library**: Reusable tour templates with AI-powered PDF/URL import
- **Proposal Builder**: Clone templates, customize activities, generate shareable links
- **Public Magic Links**: Clients view proposals without login (`/p/{token}`)
- **Live Price Calculator**: Toggle optional activities, see instant price updates
- **Inline Collaboration**: Clients comment on specific days/activities
- **Version Control**: Track all proposal changes with diff view
- **One-Click Approval**: Streamlined approval workflow
- **Real-time Updates**: WebSocket notifications via Supabase Realtime
- **Mobile Responsive**: Beautiful experience on all devices
- **Analytics**: Track views, engagement, conversion rates

**Business Impact**: Replaces static PDFs, closes deals **4.6x faster** (3 days vs 14 days), **87% time savings** for operators

📚 **Documentation**: See `docs/business/PROPOSAL_SYSTEM_README.md` for complete guide
- **Admin Trip Editor**:
  - Route-optimized day sequencing from itinerary locations
  - Numbered map markers + route distance labels
  - Auto-calculated start/end times (30-minute slots, travel-time aware)
  - Nearby hotel suggestions with one-click autofill (name/address/phone)
  - Driver assignment conflict detection (visual busy indicators)
  - Tokenized live-location links per trip/day (`/live/:token`)
  - Reminder queue + driver ping visibility per day
- **Admin User Controls**:
  - Client creation with travel preference metadata
  - Per-client tag dropdown (`standard`, `vip`, `repeat`, `corporate`, `family`, `honeymoon`, `high_priority`)
  - New clients default to `lead` stage (with backfill migration for existing records)
  - Lifecycle stages include payment and review phases (`payment_pending`, `payment_confirmed`, `review`)
  - Kanban lifecycle board with stage movement controls (`lead` → `past`)
  - Dedicated Kanban page (`/admin/kanban`) with drag/drop and transition timeline
  - Pre-lead contact inbox with search + import (phone picker/CSV) and one-click "Move to Lead"
  - Per-client phase notification toggle in Kanban (default ON)
  - Per-stage notification toggles in Settings (enable/disable auto client notifications by phase)
  - Role override (`client` ↔ `driver`) from Clients panel
  - Driver account linking auto-syncs linked app user role to `driver`
- **Admin Panel Sections** (15):
  - Activity, Analytics, Billing, Clients, Drivers, Kanban, Notifications, Planner, Proposals, Revenue, Security, Settings, Support, Templates, Tour Templates, Trips

## 🤖 AI Agents

| Agent | Endpoint | Description |
|-------|----------|-------------|
| **Trip Planner** | `POST /api/chat/trip-planner` | Multi-agent team (researcher + planner + budgeter) |
| **Support Bot** | `POST /api/chat/support` | RAG-powered support with knowledge base |
| **Recommender** | `POST /api/chat/recommend` | Personalized destination recommendations |

### Security & Infrastructure
- **Auth**: JWT verification via Supabase Auth API (dev fallback when `SUPABASE_URL` not set)
- **Rate Limiting**: In-memory sliding-window per user
  - AI endpoints: 5 req/min, 60 req/hr
  - General endpoints: 30 req/min, 500 req/hr
- **CORS**: Restricted to configured origins, methods (GET, POST, OPTIONS), and specific headers
- **Logging**: Structured Python `logging` module (`gobuddy.*` namespace)
- **Additional Endpoints**: `/recommend/preferences`, `/recommend/feedback`, `/conversations/{user_id}`

## 💼 Monetization

Travel Suite is designed as a **B2B SaaS product for travel agents** with tiered subscriptions:

| Feature | Free Tier | Pro Tier ($29/mo) |
|---------|-----------|-------------------|
| Trips/month | 10 | Unlimited |
| Drivers | 5 | Unlimited |
| Push notifications | 100/mo | Unlimited |
| White-label branding | No | Yes |

See `docs/monetization.md` for full details. `invoices` + `invoice_payments` tables are in place for billing foundation.

## 🧭 Client Operations SOP

Post-confirmation client experience flow and automation checklist:
- `docs/client_experience_sop.md` — Client experience flow
- `docs/e2e_release_checklist.md` — Pre-release validation runbook
- `docs/whatsapp_tracking_flow.md` — Template catalog + webhook/location flow
- `docs/critical_foundations_2026-02-11.md` — Tenant isolation + CI + billing foundation
- `docs/next_critical_steps_2026-02-11.md` — Execution roadmap for current sprint
- `docs/observability_and_notification_architecture_2026-02-11.md` — Logging, metrics, uptime, notification refactor
- `docs/observability_finalization_2026-02-12.md` — Request-level observability completion
- `docs/posthog_self_host_minimal.md` — Minimal self-host PostHog setup
- `docs/android_production_signoff_2026-02-12.md` — Android release sign-off gates

## 🔔 Automation & Notifications

- Runtime standardized on **Supabase Edge Functions + queue tables + scheduled workers** (no n8n)
- `send-notification` Edge Function (v8): JWT-verified, admin-only, FCM v1 API
- Notification logging and admin-triggered sends
- Welcome email sent on first successful mobile auth (via web API)
- Scheduled jobs planned for daily briefings and reminders
- WhatsApp template sends for operational reminders with push fallback
- Payment-confirmed stage trigger queues WhatsApp + push confirmation
- All lifecycle stage transitions (`lead` → `past`) auto-queue client notifications
- Lifecycle auto-notifications can be toggled per stage via `/api/admin/workflow/rules`
- Lifecycle stage transitions audit-logged in `workflow_stage_events`
- WhatsApp webhook endpoint for inbound live-location payloads (`/api/whatsapp/webhook`)
- Admin webhook health diagnostics for WhatsApp/location ingestion (`/api/admin/whatsapp/health`)
- Admin one-click driver phone normalization for WhatsApp mapping

## ❤️ Health Check

- System health endpoint: `/api/health`
- Includes dependency checks for:
  - Database connectivity
  - Supabase Edge Functions reachability
  - Firebase FCM endpoint reachability
  - WhatsApp API availability
  - External APIs (Open-Meteo weather, Frankfurter currency)
  - Observability stack configuration (`SENTRY_DSN`, `POSTHOG_PROJECT_API_KEY`/`POSTHOG_API_KEY`, uptime heartbeat URL)
- Response includes `request_id` and structured JSON logs for queue + notification routes
- CRM and workflow endpoints also emit `request_id` + structured operational metrics

## 🎨 Brand Identity

- **Primary**: `#00d084` (Vivid Green)
- **Secondary**: `#124ea2` (Royal Blue)
- **Headings**: Cormorant Garamond
- **Body Text**: Poppins

### UX Design System

Travel Suite mobile app follows the **"Soft Glass Premium"** design system created in Google Stitch:

- **Stitch Project**: https://stitch.withgoogle.com/projects/15964200879465447191
- **Total Designs**: 25 screens (PNG screenshots + HTML/CSS exports)
- **Design Assets**: `docs/stitch/15964200879465447191/`
- **Design Catalog**: `docs/stitch/DESIGN_INVENTORY.md` (complete listing)
- **Specifications**: `docs/stitch/DESIGN_IMPLEMENTATION_SPEC.md`
- **Implementation Guide**: `docs/stitch/IMPLEMENTATION_SUMMARY.md`

**Key Features**:
- Glassmorphism card effects with backdrop blur
- Soft gradient backgrounds
- Premium mint/blue color palette
- Animated mascot character "Aero" in multiple states
- Dark mode variants for all core screens
- Mobile-first responsive layouts

**Design Categories** (25 screens):
- 4 Core screens (Auth Portal, Traveler Dashboard, Driver Command, Itinerary Timeline)
- 4 Dark mode variants
- 3 Traveler home variants with mascot states
- 3 Driver hub variants
- 4 Operator/admin panels for fleet management
- 4 Animation & interaction states
- 2 Overlays & transitions (notification, card expansion)
- 1 Loading screen with animated mascot

## 📊 Database (Supabase)

**50+ tables** in `public` schema. **39 migrations applied**.

📚 **Complete Documentation**: See `DATABASE_MIGRATION_SUMMARY.md` for comprehensive database inventory

Key tables:
- `profiles` — User profiles with CRM fields (travel preferences, lifecycle stage, tags)
- `organizations` — Multi-tenant orgs with subscription tier
- `itineraries` — AI-generated travel plans
- `itinerary_cache` — 60-day cache for itinerary generation (60-70% hit rate)
- `trips` — Booked trips with `organization_id` for tenant safety
- **RAG System** (2 tables) — `tour_templates` (with vector embeddings), `template_usage_attribution` (cross-operator usage tracking)
- `external_drivers` — Third-party drivers per org
- `driver_accounts` — App user ↔ external driver mapping
- `trip_driver_assignments` — Per-day driver assignments
- `push_tokens` — FCM device tokens
- `notification_queue` / `notification_logs` — Queue + audit trail
- `notification_delivery_status` — Per-channel delivery tracking (whatsapp/push/email)
- `crm_contacts` — Pre-lead contact inbox
- `workflow_stage_events` — Lifecycle audit log
- `workflow_notification_rules` — Per-stage notification toggles
- `invoices` / `invoice_payments` — Billing foundation
- `trip_location_shares` — Tokenized live-location links
- `trip_location_share_access_logs` — Anti-abuse rate limit logs
- **Proposal System** (10 tables) — `tour_templates`, `template_days`, `template_activities`, `template_accommodations`, `proposals`, `proposal_days`, `proposal_activities`, `proposal_accommodations`, `proposal_comments`, `proposal_versions`
- **Upsell Engine** (3 tables) — `add_ons`, `client_add_ons`, `addon_views`
- **Analytics** (3 tables) — `template_views`, `template_usage`, and more

Security baseline:
- Organization-scoped RLS hardening applied across all admin tables
- Verification script: `scripts/verify_rls_policies.sql`
- Queue processor supports signed cron HMAC headers and service-role bearer
- Public live-share endpoint has per-IP/token rate limiting + token expiry + revocation
- Security diagnostics: `SELECT * FROM security_diagnostic_report();`
- Admin security API: `/api/admin/security/diagnostics`
- Admin security UI: `/admin/security`

## 🔒 Security

- **Firebase SA Key**: Rotated (2026-02-12). Only one active key in GCP. Stored as Supabase secret only.
- **Git Security**: Root `.gitignore` blocks `firebase-service-account.json` and `*-service-account.json`
- **Edge Function**: JWT + admin role verification (v8 deployed)
- **AI Agents**: JWT auth + per-user rate limiting on all endpoints
- **CORS**: Restricted origins, methods, and headers
- **Structured Logging**: All services use structured logging (Python `logging`, JSON for Edge Functions)

## 🔄 CI/CD

- **GitHub Actions**: `.github/workflows/ci.yml` runs on push/PR to `main`
  - **Web**: lint → type-check → build
  - **Agents**: Python syntax check + pytest
  - **Mobile**: `flutter analyze`
  - **Migrations**: SQL file syntax check
- **GitHub Secrets required**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🛠️ Development Status

### ✅ Completed
- [x] Web app foundation (Next.js 16, React 19)
- [x] Mobile app foundation (Flutter, Dart 3.10+)
- [x] Supabase integration (Auth, Database, Realtime)
- [x] **RAG-Based Itinerary System** - Vector search, template sharing, 95% cost savings
- [x] AI itinerary generation (Gemini 1.5 Flash)
- [x] Itinerary caching system (60-70% hit rate)
- [x] Weather & currency APIs
- [x] PDF export with dynamic branding
- [x] Mobile UI polish (animations, shimmer, SliverAppBar)
- [x] Driver assignment feature
- [x] Push notification system (FCM + Edge Function v8)
- [x] Firebase service account key rotation
- [x] CI/CD pipeline (GitHub Actions)
- [x] AI agent JWT auth + rate limiting
- [x] CORS restriction on AI agents
- [x] Structured logging in all services
- [x] Admin panel (15 sections)
- [x] CRM + Kanban lifecycle board
- [x] Billing foundation (invoices + payments)
- [x] Organization-scoped RLS hardening
- [x] Android release infrastructure (signing, ProGuard, minification)
- [x] Observability (Sentry + PostHog integration)
- [x] **Interactive Proposal System** - Templates, proposals, public viewer, AI import, real-time updates
- [x] **Upsell Engine Database** - AI-driven add-on recommendations (UI pending)
- [x] **Template Analytics** - Track usage, views, conversion rates
- [x] **Dynamic Navigation** - Role-based navigation system
- [x] **Live Location Sharing** - Driver tracking with magic links
- [x] **PDF Import Pipeline (Phase 5)** - Upload PDFs → GPT-4o extraction → Review → Publish
  - Auto-extract structured templates from brochure PDFs
  - AI confidence scoring and quality validation
  - Operator review and approval workflow
  - Direct publishing to unified template database
  - 📚 **Documentation**: See `docs/PDF_IMPORT_SYSTEM.md`

### 🔄 In Progress
- [ ] Email/WhatsApp API integration (infrastructure ready, needs API keys)
- [ ] Upsell Engine UI (database complete, admin UI pending)
- [ ] Template Analytics Dashboard (partial implementation)
- [ ] End-to-end push notification validation on real devices
- [ ] **Professional Itinerary UI** - Transform to match WBB PDF quality (Phase 6)
- [ ] **PDF Import UI** - Admin interface for PDF upload and review (Phase 5 UI)

### 🔮 Planned
- [ ] **Attribution Dashboard** - Operator template usage analytics (Phase 8)
- [ ] **Referral/Commission System** - Monetize template sharing
- [ ] Stripe billing integration (foundation exists)
- [ ] Payment collection workflow
- [ ] Complete upsell engine UI
- [ ] Advanced analytics dashboards
- [ ] App Store / Play Store submission
- [ ] Vercel deployment
- [ ] AI Agents production hosting
- [ ] Offline support
- [ ] Multi-language support
- [ ] White-label support

## 📋 Project Status

For detailed implementation status, see:
- **PROJECT_STATUS.md** - Complete feature inventory and implementation status
- **DATABASE_MIGRATION_SUMMARY.md** - All 39 migrations and database schema
- **docs/business/PROPOSAL_SYSTEM_README.md** - Proposal system quick start guide

## 📄 License

Proprietary — GoBuddy Adventures
