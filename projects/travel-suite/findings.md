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

### Notification Approach
- Push notifications via Firebase Cloud Messaging (FCM)
- Server-side triggers via Supabase Edge Functions
- No external workflow automation (n8n not used)

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Supabase over Firebase | Already in use, Postgres preferred, free tier sufficient |
| Flutter over React Native | Company already using Flutter |
| flutter_riverpod | Simpler than Bloc, good for medium apps |
| freezed | Immutable data classes, auto-generated fromJson/toJson |
| SliverAppBar | Native collapsing header, no custom implementation needed |
| shimmer | Popular, maintained, simple API |
| flutter_animate | Declarative, chainable, supports stagger |
| Hero animations | Built-in Flutter, no extra dependency |
| debugPrint | Stripped from release builds unlike print() |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Freezed 3.x syntax incompatibility | Changed from `@freezed class` to `abstract class X with _$X` |
| Android SDK not available | Cannot build APK on current machine, need emulator or device |
| Unused imports causing warnings | Removed unused url_launcher and flutter_local_notifications |
| print() not production-safe | Replaced with debugPrint from foundation.dart |
| Hardcoded Supabase keys | Identified as security concern, environment variables recommended |

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
