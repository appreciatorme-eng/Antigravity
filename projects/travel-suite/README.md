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
- **Trips Overview**: Animated card list with shimmer loading
- **Trip Detail**: Collapsing header (SliverAppBar), day selector, activity timeline
- **Driver Info**: View assigned driver details
- **Notifications**: Local notifications for "I've Landed" feature
- **Maps**: Interactive OpenStreetMap via flutter_map

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

## 🤖 AI Agents

- **Trip Planner**: Generates personalized itineraries
- **Support Bot**: Answers travel questions via RAG
- **Recommender**: Activity recommendations

## 💼 Monetization

Travel Suite is designed as a **B2B SaaS product for travel agents** with tiered subscriptions. See `docs/monetization.md` for details.

## 🔔 Automation & Notifications

- Supabase Edge Functions for FCM (push notifications)
- Notification logging and admin-triggered sends
- Scheduled jobs planned for daily briefings and reminders

## 🎨 Brand Identity

- **Primary**: `#00d084` (Vivid Green)
- **Secondary**: `#124ea2` (Royal Blue)
- **Headings**: Cormorant Garamond
- **Body Text**: Poppins

## 📊 Database (Supabase)

Key tables:
- `profiles` - User profiles
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
- [ ] White-label support

### Future
- [ ] Offline support
- [ ] Real-time driver tracking
- [ ] Multi-language support

## 📄 License

Proprietary - GoBuddy Adventures
