# Implementation Plan - GoBuddy Adventures MVP

## Goal Description
Build a complete AI-powered travel planning application with the GoBuddy Adventures brand. This includes the core itinerary generation engine, weather forecasts, currency conversion, interactive maps, and PDF export.

## Current Status: ✅ Phase 1 Complete

### ✅ Completed Features

#### 1. Project Structure
**Directory**: `projects/travel-suite`
```text
├── apps
│   ├── mobile/         # Flutter (Dart) - iOS/Android ✅
│   └── web/            # Next.js (Main App) ✅
├── packages
│   └── shared/         # Shared types/utils (Future)
└── supabase
    └── schema.sql      # Database Schema ✅
```

#### 2. Database Schema (Supabase) ✅
- [x] `profiles`: Users linked to Auth
- [x] `itineraries`: User's saved itineraries with JSON data
- [x] `trips`: Core booking entity
- [x] `driver_locations`: GPS data
- [x] `shared_itineraries`: Public share links
- [x] RLS policies configured

#### 3. AI Itinerary Engine ✅
- **Endpoint**: `POST /api/itinerary/generate`
- **AI Provider**: Google Gemini 1.5 Flash (Free Tier)
- **Features**:
  - Natural language prompt processing
  - Structured JSON itinerary output
  - Multi-day trip support
  - Budget-aware recommendations

#### 4. PDF Generation ✅
- **Library**: `@react-pdf/renderer`
- **Implementation**: Client-side rendering with download button
- **Branding**: GoBuddy Adventures header/footer

#### 5. Weather Integration ✅
**File**: `lib/external/weather.ts`
- **Source**: [Open-Meteo](https://open-meteo.com) (Free, no API key)
- **Features**:
  - Geocoding (location name → coordinates)
  - 7-day forecast with temp, precipitation, weather codes
  - WeatherWidget component for visual display
- **API**: `GET /api/weather?location=Paris&days=7`

#### 6. Currency Conversion ✅
**File**: `lib/external/currency.ts`
- **Source**: [Frankfurter](https://frankfurter.app) (Free, unlimited)
- **Features**:
  - Exchange rate lookup
  - Amount conversion
  - Currency formatting utilities
- **API**: `GET /api/currency?amount=100&from=USD&to=EUR`

#### 7. Maps Integration ✅
- **Library**: Leaflet (OSM tiles, free)
- **Component**: `ItineraryMap.tsx`
- **Features**: Interactive pins for activities

#### 8. Image Integration ✅
- **Source**: Wikimedia Commons
- **API**: `GET /api/images?query=Eiffel+Tower`
- **Features**: Location images for activities

#### 9. Authentication ✅
- **Provider**: Supabase Auth
- **Methods**: Email/Password, Google OAuth ✅
- **Flow**: Signup → Email verification → Dashboard
- **Google OAuth**: Configured and tested
  - Client ID: `927661594030-rjadafq1lph1ooi1c5n72djac992n6lm.apps.googleusercontent.com`
  - Setup docs: `docs/GOOGLE_OAUTH_SETUP.md`

#### 10. Design System (GoBuddy Identity) ✅
- **Primary Color (Action)**: `#00d084` (Vivid Green)
- **Secondary Color (Brand)**: `#124ea2` (Royal Blue)
- **Typography**:
  - Headings: `Cormorant Garamond` (Serif)
  - Body/UI: `Poppins` (Sans-serif)

---

## 🚀 Phase 2: Tour Operator Notification System

### Goal
Build a **Mobile App for Clients** + **Admin Panel for Travel Agents** with automated push notifications. Enable monetization to other travel agents.

### Cost: $124/year
- Apple Developer: $99/year
- Google Play: $25 one-time
- All other services: Free tier

### Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client App    │     │   Admin Panel   │     │   Driver        │
│    (Flutter)    │     │    (Next.js)    │     │  (WhatsApp)     │
│                 │     │                 │     │                 │
│ • View trips    │     │ • Manage trips  │     │ • Receives      │
│ • Get notified  │     │ • Assign drivers│     │   pickup info   │
│ • See driver    │     │ • Send alerts   │     │ • Client details│
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │    Supabase     │
            │  + Firebase FCM │
            └─────────────────┘
```

### New Database Tables
| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant travel agents |
| `external_drivers` | Third-party drivers (name, phone, vehicle) |
| `trip_driver_assignments` | Driver assigned per trip day |
| `trip_accommodations` | Hotel info per day |
| `push_tokens` | Client device tokens for push |
| `notification_logs` | Audit trail |

### Mobile App Features (`apps/mobile/`)
- [ ] **My Trips** - View upcoming and past trips
- [ ] **Trip Details** - Day-by-day itinerary with times
- [ ] **Driver Info** - Today's driver contact, vehicle
- [ ] **Push Notifications** - Automatic alerts
- [ ] **"I've Landed" Button** - Triggers driver info
- [ ] **Offline Support** - View itinerary without internet

### Admin Panel Features (`apps/web/admin/`)
- [ ] **Dashboard** - Overview of active trips
- [ ] **Driver Management** - Add/edit external drivers
- [ ] **Trip Assignment** - Assign drivers + hotels per day
- [ ] **Send Notifications** - Manual triggers + status
- [ ] **Client Management** - View/manage clients

### Notification Types
| Type | Trigger | To Client | To Driver |
|------|---------|-----------|-----------|
| `trip_confirmed` | Admin confirms | Push | WhatsApp |
| `driver_assigned` | Driver assigned | Push | WhatsApp |
| `daily_briefing` | 7am each day | Push | WhatsApp |
| `client_landed` | Client taps button | Push | WhatsApp |

### Implementation Timeline
1. **Week 1**: Database schema + TypeScript types
2. **Week 2**: Mobile app core (auth, trips, details)
3. **Week 3**: Admin panel (drivers, assignments)
4. **Week 4**: Notifications + polish
5. **Week 5**: App store submission

### Monetization Model
| Feature | Free Tier | Pro Tier ($29/mo) |
|---------|-----------|-------------------|
| Trips/month | 10 | Unlimited |
| Drivers | 5 | Unlimited |
| Push notifications | 100/mo | Unlimited |
| White-label branding | No | Yes |

---

## Verification Plan
1. ✅ **Schema**: SQL applied to Supabase
2. ✅ **AI API**: Generates valid itineraries
3. ✅ **Weather API**: Returns 7-day forecasts
4. ✅ **Currency API**: Converts amounts correctly
5. ✅ **Map**: Displays activity pins
6. ✅ **PDF**: Downloads correctly

