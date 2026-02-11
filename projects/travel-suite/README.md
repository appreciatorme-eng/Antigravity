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
  - Lifecycle stages include payment and review phases (`payment_pending`, `payment_confirmed`, `review`)
  - Kanban lifecycle board with stage movement controls (`lead` → `past`)
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

## 🔔 Automation & Notifications

- Supabase Edge Functions for FCM (push notifications)
- Notification logging and admin-triggered sends
- Welcome email sent on first successful mobile auth (via web API)
- Scheduled jobs planned for daily briefings and reminders
- WhatsApp template sends for operational reminders with push fallback
- Payment-confirmed stage trigger queues WhatsApp + push confirmation
- Lifecycle stage transitions are audit-logged in `workflow_stage_events`
- WhatsApp webhook endpoint for inbound live-location payloads (`/api/whatsapp/webhook`)
- Admin webhook health diagnostics for WhatsApp/location ingestion (`/api/admin/whatsapp/health`)
- Admin one-click driver phone normalization for WhatsApp mapping (`/api/admin/whatsapp/normalize-driver-phones`)

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
- `external_drivers` - Driver information
- `trip_driver_assignments` - Driver assignments per day

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
- [ ] Admin panel hardening (audit logs, role-based access polish)
- [ ] Automated pickup reminders (T-60 min): WhatsApp + push fallback
- [ ] Driver/client live location sharing workflow
- [ ] White-label support

### Future
- [ ] Offline support
- [ ] Real-time driver tracking
- [ ] Multi-language support

## 📄 License

Proprietary - GoBuddy Adventures
