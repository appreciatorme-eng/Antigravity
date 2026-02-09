# Findings & Decisions

## Requirements
-

## Research Findings
- **mapcn**: A beautiful, accessible, and customizable map component library built on MapLibre GL and Tailwind CSS.
  - **Compatibility**: Integrates seamlessly with Shadcn UI and handles dark mode automatically.
  - **Performance**: Vector-based (WebGL) for smooth interactions, ideal for real-time tracking (drivers).
  - **Location**: Should be installed in `apps/web/src/components/ui/map`.
  - **Installation**: `npx shadcn@latest add https://mapcn.dev/maps/map.json`.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| **Install mapcn** | To replace or augment Leaflet for a more premium, vector-based map experience, especially for real-time driver tracking. Matches the tech stack (Next.js, Shadcn, Tailwind). |
| **Add Supabase Types** | Recommend generating TypeScript types from the database schema to ensure type safety across the application. |

## Project Review: Travel Suite
- **Architecture**: Monorepo structure with `apps/web` (Next.js 16) and `apps/agents` (Python FastAPI/Agno).
- **Backend**: Supabase (Postgres, Auth, Realtime, Vector). robust schema covering multi-tenant organizations, itineraries, and trips.
- **Frontend (Web)**: Modern stack (React 19, Tailwind 4). Functional but could be more visually "premium".
- **Frontend (Mobile)**: Flutter (Dart) app, leveraging `supabase_flutter` for auth/data, `flutter_riverpod` for state, and `flutter_map` for mapping.
- **AI Integration**: Specific agents (TripPlanner, SupportBot) implemented via Python backend with RAG/Vector embeddings.
- **Automation**: n8n workflows handle robust notifications (Trip Briefings, reminders).

### Key Strengths
1.  **Comprehensive Data Model**: The schema is well-designed for a travel platform, including real-time location and multi-tenancy.
2.  **Full-Stack Pattern**: Leveraging Next.js for UI and Python for complex Agent logic is a solid architectural choice.
3.  **Real-time Capabilities**: Schema supports driver tracking and notifications.

### Action Plan
1.  **Install `mapcn`** in `apps/web/src/components/ui/map`.
2.  **Generate Types** for Supabase schema to improve type safety.
3.  **Enhance UI**: Apply "premium" design principles (typography, animations) to key pages like `TripsPage`.
4.  **Verify Agent Logic**: Ensure `apps/agents` has actual implementation logic beyond boilerplate.

| Issue | Resolution |
|-------|------------|

## Resources
-
