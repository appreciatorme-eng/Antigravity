# Travel Suite Project

A comprehensive travel planning and management platform built with modern technologies.

## 🏗️ Architecture

```
travel-suite/
├── apps/
│   ├── mobile/          # Flutter client app (iOS/Android)
│   ├── web/             # Next.js web app + admin panel
│   └── agents/          # Python AI agents (FastAPI)
├── docs/                # Project documentation
├── supabase/            # Database schema & migrations
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

## 📱 Mobile App Features

- **Authentication**: Email/password + Google OAuth via Supabase
- **Role Onboarding**: New users choose `Client` or `Driver` during signup
- **Trips Overview**: Animated card list with shimmer loading
- **Trip Detail**: Collapsing header (SliverAppBar), day selector, activity timeline
- **Driver Info**: View assigned driver details
- **Notifications**: Local notifications for "I've Landed" feature
- **Maps**: Interactive OpenStreetMap via flutter_map
- **Driver Live Location**: Driver-mode users can publish real-time location pings
- **Client Live Tracking**: Open current live driver route from trip detail

### Key Dependencies
- `supabase_flutter` - Backend integration
- `flutter_riverpod` - State management
- `freezed` - Immutable data classes
- `flutter_animate` - Entrance animations
- `shimmer` - Loading skeletons
- `flutter_map` - Interactive maps

## 🌐 Web App Features

- **AI Itinerary Generator**: Powered by Google Gemini
- **Weather Integration**: Open-Meteo API
- **Currency Conversion**: Frankfurter API
- **PDF Export**: @react-pdf/renderer
- **Maps**: mapcn (MapLibre GL)
- **Authentication**: Supabase Auth with Google OAuth
- **Admin Trip Editor**:
  - Route-optimized day sequencing from itinerary locations
  - Numbered map markers + route distance labels
  - Auto-calculated start/end times (30-minute slots, travel-time aware)
  - Nearby hotel suggestions with one-click autofill (name/address/phone)
  - Tokenized live-location links per trip/day (`/live/:token`)
  - Reminder queue + driver ping visibility per day
- **Admin User Controls**:
  - Client creation with travel preference metadata
  - Per-client tag dropdown (`standard`, `vip`, `repeat`, `corporate`, `family`, `honeymoon`, `high_priority`)
  - New clients default to `lead` stage (with backfill migration for existing client records)
  - Lifecycle stages include payment and review phases (`payment_pending`, `payment_confirmed`, `review`)
  - Kanban lifecycle board with stage movement controls (`lead` → `past`)
  - Dedicated Kanban page (`/admin/kanban`) with drag/drop and transition timeline
  - Pre-lead contact inbox with search + import (phone picker/CSV) and one-click “Move to Lead”
  - Per-client phase notification toggle in Kanban (default ON)
  - Per-stage notification toggles in Settings (enable/disable auto client notifications by phase)
  - Role override (`client` ↔ `driver`) from Clients panel
  - Driver account linking auto-syncs linked app user role to `driver`

## 🤖 AI Agents

- **Trip Planner**: Generates personalized itineraries
- **Support Bot**: Answers travel questions via RAG
- **Recommender**: Activity recommendations

## 💼 Monetization

Travel Suite is designed as a **B2B SaaS product for travel agents** with tiered subscriptions. See `docs/monetization.md` for details.

## 🧭 Client Operations SOP

Post-confirmation client experience flow and automation checklist are documented in:
- `docs/client_experience_sop.md`
- `docs/e2e_release_checklist.md` (pre-release validation runbook)
- `docs/whatsapp_tracking_flow.md` (template catalog + webhook/location flow)
- `docs/critical_foundations_2026-02-11.md` (tenant isolation + CI + billing foundation)
- `docs/next_critical_steps_2026-02-11.md` (execution roadmap for current sprint)

## 🔔 Automation & Notifications

- Automation runtime is standardized on **Supabase Edge Functions + queue tables + scheduled workers**.
- Supabase Edge Functions for FCM (push notifications)
- Notification logging and admin-triggered sends
- Welcome email sent on first successful mobile auth (via web API)
- Scheduled jobs planned for daily briefings and reminders
- WhatsApp template sends for operational reminders with push fallback
- Payment-confirmed stage trigger queues WhatsApp + push confirmation
- All lifecycle stage transitions (`lead` → `past`) now auto-queue client notifications (WhatsApp template + push fallback)
- Lifecycle auto-notifications can be toggled per stage via `/api/admin/workflow/rules`
- Lifecycle stage transitions are audit-logged in `workflow_stage_events`
- WhatsApp webhook endpoint for inbound live-location payloads (`/api/whatsapp/webhook`)
- Admin webhook health diagnostics for WhatsApp/location ingestion (`/api/admin/whatsapp/health`)
- Admin one-click driver phone normalization for WhatsApp mapping (`/api/admin/whatsapp/normalize-driver-phones`)

## ❤️ Health Check

- System health endpoint: `/api/health`
- Includes dependency checks for:
  - Database connectivity
  - Supabase Edge Functions reachability
  - Firebase FCM endpoint reachability
  - WhatsApp API availability
  - External APIs (Open-Meteo weather, Frankfurter currency)

## 🎨 Brand Identity

- **Primary**: `#00d084` (Vivid Green)
- **Secondary**: `#124ea2` (Royal Blue)
- **Headings**: Cormorant Garamond
- **Body Text**: Poppins

## 📊 Database (Supabase)

Key tables:
- `profiles` - User profiles
- `profiles` now stores client travel preferences (budget, destination, travelers, etc.)
- `itineraries` - AI-generated travel plans
- `trips` - Booked trips
- `trips.organization_id` - tenant-safe admin filtering
- `external_drivers` - Driver information
- `trip_driver_assignments` - Driver assignments per day
- `workflow_stage_events.organization_id` - tenant-safe lifecycle audit logs
- `invoices` / `invoice_payments` - billing and payment tracking foundation
- `notification_delivery_status` - per-channel delivery tracking (`whatsapp`/`push`/`email`) for queue processing
- Admin API for delivery tracking: `/api/admin/notifications/delivery`
- Admin API for single-item retry: `/api/admin/notifications/delivery/retry`

Security baseline:
- Organization-scoped RLS hardening is applied across workflow, CRM, queue, billing, trips, and itinerary-access policies.
- Verification script: `scripts/verify_rls_policies.sql`

## 🛠️ Development Status

### Completed
- [x] Web app foundation (Next.js 16, React 19)
- [x] Mobile app foundation (Flutter)
- [x] Supabase integration (Auth, Database)
- [x] AI itinerary generation
- [x] Weather & currency APIs
- [x] PDF export
- [x] Mobile UI polish (animations, shimmer, SliverAppBar)
- [x] Driver assignment feature
- [x] Local notifications

### In Progress
- [ ] End-to-end push notification validation on real devices
- [ ] Admin panel hardening (final RLS tightening + access tests)
- [ ] Automated pickup reminders (T-60 min): WhatsApp + push fallback
- [ ] Driver/client live location sharing workflow
- [ ] White-label support

### Future
- [ ] Offline support
- [ ] Real-time driver tracking
- [ ] Multi-language support

## 📄 License

Proprietary - GoBuddy Adventures
