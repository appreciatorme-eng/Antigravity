# Findings & Decisions

## Requirements
<!-- Captured from implementation_plan.md and brand_identity.md -->
- Mobile app for clients (Flutter) - iOS/Android
- Admin panel for travel agents (Next.js)
- Push notifications via Firebase FCM
- Driver assignment and daily briefings
- WhatsApp integration for drivers
- Multi-tenant support (organizations)
- GoBuddy Adventures brand identity

## Research Findings

### Project Architecture
- **Monorepo structure** at `projects/travel-suite/`
- **apps/mobile/** - Flutter client app
- **apps/web/** - Next.js admin + client portal
- **apps/agents/** - Python AI agents (FastAPI)
- **supabase/** - Database schema and migrations
- **docs/** - Implementation plan, brand identity, setup guides

### Mobile App Stack
- **State management:** flutter_riverpod
- **Data modeling:** freezed + json_serializable
- **Backend:** supabase_flutter (Auth, Database, Realtime)
- **Maps:** flutter_map with OpenStreetMap tiles
- **Animations:** flutter_animate (stagger, scale, fade)
- **Loading states:** shimmer (skeleton placeholders)
- **Advanced layouts:** sliver_tools + SliverAppBar

### Flutter Dart SDK
- Requires SDK `^3.10.8`
- Freezed 3.x uses `abstract class` pattern (not `@freezed class`)
- `@JsonKey` on factory params produces warnings but works
- `withOpacity` deprecated, prefer `withValues()` for color manipulation

### Web App Stack
- Next.js with React 19
- shadcn/ui component library
- @react-pdf/renderer for PDF export
- Google Gemini 1.5 Flash for AI itinerary generation
- Leaflet for maps (mapcn identified as upgrade path)

### External APIs (All Free Tier)
| Service | Purpose | Endpoint |
|---------|---------|----------|
| Open-Meteo | Weather forecasts | `api/weather?location=X&days=7` |
| Frankfurter | Currency conversion | `api/currency?amount=X&from=USD&to=EUR` |
| Wikimedia | Location images | `api/images?query=X` |
| Supabase Auth | Authentication | Built-in |

### Firebase Project Details
- **Project ID:** `travel-suite-5d509`
- **Android Package:** `com.gobuddy.gobuddy_mobile`
- **iOS Bundle ID:** `com.gobuddy.gobuddyMobile`
- **Admin SDK:** Service account key stored in `apps/web/firebase-service-account.json`.

### Notification Architecture
- **FCM V1:** Push notifications sent via Firebase Cloud Messaging Version 1.
- **Supabase Edge Functions:** `send-notification` handles message construction and delivery.
- **Secrets Management:** Firebase credentials stored as Supabase secrets (`FIREBASE_SERVICE_ACCOUNT`).
- **Web App:** Next.js admin panel uses Firebase Admin SDK for server-side operations.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Supabase Edge Functions | Server-side security, avoids exposing Firebase keys to client |
| FCM V1 over Legacy | Recommended by Google, better security, more features |
| navigatorKey | Handles deep-linking in Flutter from background/terminated states |
| Supabase over Firebase | Already in use, Postgres preferred, free tier sufficient |
| Flutter over React Native | Company already using Flutter |
| ... | ... |

## Issues Encountered
| Notification navigation in background | Implemented global `navigatorKey` in `main.dart` |
| FCM payload inconsistency | Standardized on `trip_id` (snake_case) for mobile deep-linking |
| Supabase CLI Deno linting | Recognized as environment setup (Deno) rather than code errors |
| Freezed 3.x syntax incompatibility | Changed from `@freezed class` to `abstract class X with _$X` |
| android SDK not available | Cannot build APK on current machine |
| `flutterfire configure` failed | Missing `xcodeproj` ruby gem. Resolved with `gem install xcodeproj`. |

## Resources
- Brand identity: `docs/brand_identity.md`
- Implementation plan: `docs/implementation_plan.md`
- Database schema: `supabase/schema.sql`
- Google OAuth setup: `docs/GOOGLE_OAUTH_SETUP.md`
- Mobile README: `apps/mobile/README.md`
- GoBuddy website: https://gobuddyadventures.com/

## Visual/Browser Findings
- GoBuddy logo: https://gobuddyadventures.com/wp-content/uploads/2021/12/GoBuddy-Full-Logo-Transparent-1.png
- Primary color: `#00d084` (Vivid Green)
- Secondary color: `#124ea2` (Royal Blue)
- Heading font: Cormorant Garamond (serif)
- Body font: Poppins (sans-serif)

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
