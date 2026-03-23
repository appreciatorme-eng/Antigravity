# Multi-App Architecture

How the four applications (Web, Mobile, Agents, RAG Assistant) communicate, share types, and integrate with the Supabase backend.

---

## Table of Contents

1. [App Communication Topology](#app-communication-topology)
2. [Python Agents Architecture](#python-agents-architecture)
3. [RAG Assistant Architecture](#rag-assistant-architecture)
4. [Mobile App Architecture](#mobile-app-architecture)
5. [Type Sharing](#type-sharing)

---

## App Communication Topology

All four apps connect to Supabase as the central data layer. The Python agents add AI capabilities, and the RAG assistant provides multi-channel conversational support.

```mermaid
graph TD
    subgraph "Frontend Apps"
        Web["Next.js Web App<br/>(Vercel)"]
        Mobile["Flutter Mobile App<br/>(iOS + Android)"]
    end

    subgraph "AI Services"
        Agents["Python AI Agents<br/>(FastAPI, port 8001)"]
        RAG["RAG Assistant<br/>(Node.js orchestrator)"]
    end

    subgraph "Supabase Platform"
        PG["PostgreSQL<br/>(113 tables, RLS)"]
        Auth["Supabase Auth"]
        Realtime["Supabase Realtime"]
        Storage["Supabase Storage"]
    end

    subgraph "AI Providers"
        Gemini["Google Gemini"]
        OpenAI["OpenAI<br/>(embeddings)"]
    end

    subgraph "Channels"
        WhatsAppCh["WhatsApp<br/>(webhook)"]
        WebChat["Web Chat<br/>(in-app)"]
    end

    subgraph "Shared Code"
        Types["packages/shared/<br/>database.types.ts"]
    end

    Web -->|"direct queries<br/>(service role key)"| PG
    Web -->|"session management"| Auth
    Web -->|"live subscriptions"| Realtime
    Web -->|"file uploads"| Storage

    Mobile -->|"direct queries<br/>(anon key + RLS)"| PG
    Mobile -->|"auth state stream"| Auth

    Agents -->|"data access"| PG
    Agents -->|"AI inference"| Gemini

    RAG -->|"FAQ retrieval<br/>(JSONL-based)"| PG
    RAG -.->|"future: vector search"| OpenAI

    WhatsAppCh -->|"webhook"| RAG
    WebChat -->|"API call"| RAG

    Types -.->|"TypeScript imports"| Web
```

### Communication Patterns

| Source | Target | Method | Auth |
|--------|--------|--------|------|
| Web -> Supabase | PostgreSQL | Direct client (`@supabase/ssr`) | Service role key (server) / anon key + RLS (client) |
| Mobile -> Supabase | PostgreSQL | `supabase_flutter` SDK | Anon key + RLS |
| Web -> Agents | FastAPI endpoints | HTTP REST | Supabase JWT forwarded |
| RAG -> Supabase | PostgreSQL | Direct queries | Service role key |
| WhatsApp -> RAG | Webhook | HTTP POST | Webhook signature verification |
| Web Chat -> RAG | Internal API | HTTP POST | Authenticated session |

---

## Python Agents Architecture

The agents app (`apps/agents/`) is a FastAPI server using the Agno framework for multi-agent AI collaboration. It exposes three AI agents through REST endpoints.

```mermaid
graph LR
    subgraph "FastAPI Server (port 8001)"
        Router["API Router<br/>/api prefix"]

        subgraph "Chat Endpoints"
            TripPlanner["/chat/trip-planner<br/>POST"]
            SupportBot["/chat/support<br/>POST"]
            Recommender["/chat/recommend<br/>POST"]
        end

        subgraph "Preference Endpoints"
            Prefs["/recommend/preferences<br/>POST"]
            Feedback["/recommend/feedback<br/>POST"]
        end

        subgraph "Utility"
            Health["/health<br/>GET"]
            Conversations["/conversations/{user_id}<br/>GET"]
        end
    end

    subgraph "Agent Teams"
        Researcher["Researcher Agent<br/>(destination info)"]
        Planner["Planner Agent<br/>(day-by-day itinerary)"]
        Budgeter["Budgeter Agent<br/>(cost optimization)"]
        Support["Support Agent<br/>(RAG knowledge base)"]
        Recommend["Recommender Agent<br/>(personalized suggestions)"]
    end

    subgraph "Infrastructure"
        AuthMiddleware["JWT Verification<br/>(Supabase token)"]
        RateLimit["Rate Limiter<br/>(per-user + per-IP)"]
        CORS["CORS Middleware<br/>(Web + Mobile origins)"]
    end

    Router --> TripPlanner
    Router --> SupportBot
    Router --> Recommender
    Router --> Prefs
    Router --> Feedback
    Router --> Health

    TripPlanner --> Researcher
    TripPlanner --> Planner
    TripPlanner --> Budgeter

    SupportBot --> Support
    Recommender --> Recommend

    AuthMiddleware --> Router
    RateLimit --> Router
    CORS --> Router
```

### Agent Details

| Agent | File | Capabilities |
|-------|------|-------------|
| **Trip Planner Team** | `agents/trip_planner.py` | Multi-agent team: Researcher gathers destination info, Planner creates day-by-day itinerary, Budgeter optimizes costs. Supports structured JSON output. |
| **Support Bot** | `agents/support_bot.py` | RAG-powered support using loaded knowledge base (FAQs, policies). Provides quick responses for common questions before falling back to full agent. |
| **Recommender** | `agents/recommender.py` | Personalized destination recommendations. Learns user preferences over time. Supports preference updates and feedback loops. |

### Request Flow

1. Request arrives with Supabase JWT in `Authorization` header
2. `verify_supabase_token()` validates the JWT and extracts `user_id`
3. Rate limiter checks per-user and per-IP limits
4. Request body validated via Pydantic models (`TripPlanRequest`, `ChatMessage`, `RecommendationRequest`)
5. Agent processes request and returns structured response
6. Response wrapped in `{success: true, data: ...}` envelope

### CORS Configuration

```
Development: http://localhost:3000, http://localhost:8081
Production: WEB_APP_URL, MOBILE_APP_URL (from env vars)
Methods: GET, POST, OPTIONS
Headers: Authorization, Content-Type, X-Client-Info, apikey
```

---

## RAG Assistant Architecture

The RAG assistant (`apps/rag-assistant/`) is a multi-tenant chatbot blueprint designed for both web chat and WhatsApp channels.

```mermaid
graph TD
    subgraph "Input Channels"
        WebInput["Web Chat<br/>(authenticated session)"]
        WAInput["WhatsApp Webhook<br/>(phone number mapping)"]
    end

    subgraph "Orchestrator"
        IntentDetect["Intent Detection<br/>(faq, status_lookup, update_request)"]
        FAQRetrieval["FAQ Retrieval<br/>(JSONL token matching)"]
        ActionProposal["Action Proposal<br/>(propose -> confirm -> execute)"]
        AuditLog["Audit Logger<br/>(tenant + user + channel)"]
    end

    subgraph "Data Sources"
        FAQJSONL["faq_tour_operator.jsonl<br/>(global FAQ)"]
        TenantDocs["Tenant Docs<br/>(templates, terms, policies)"]
        LiveData["Live Business Data<br/>(trips, clients, stages)"]
    end

    subgraph "Action Tools (Phase 1)"
        GetPending["get_pending_items"]
        GetStage["get_client_stage_summary"]
        GetTrip["get_trip_status"]
        UpdatePrice["update_itinerary_price"]
        MoveStage["move_client_stage"]
        AssignDriver["assign_driver"]
    end

    WebInput --> IntentDetect
    WAInput --> IntentDetect

    IntentDetect -->|"faq"| FAQRetrieval
    IntentDetect -->|"update_request"| ActionProposal

    FAQRetrieval --> FAQJSONL
    FAQRetrieval --> TenantDocs
    FAQRetrieval --> LiveData

    ActionProposal --> UpdatePrice
    ActionProposal --> MoveStage
    ActionProposal --> AssignDriver

    FAQRetrieval --> AuditLog
    ActionProposal --> AuditLog
```

### Multi-Tenant Isolation

Every query and action is scoped by `organization_id`:

- Retrieval queries always include tenant filter
- Action tools verify `organization_id` before execution
- Chat memory is partitioned per tenant
- Audit log records `organization_id`, `user_id`, and `channel` for every interaction

### Retrieval Pipeline

The current implementation uses token-based matching against a JSONL knowledge base:

1. Query is tokenized (lowercased, alphanumeric split)
2. Each FAQ row is scored by token overlap between query and `question + answer`
3. Top-N matching rows returned (configurable via `maxRetrievedChunks`)
4. Best match formatted as response with source citation

### Rollout Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **A** | FAQ RAG only (read-only Q/A in web + WhatsApp) | Implemented |
| **B** | Live status answers (pending items, stage summaries) | Planned |
| **C** | Controlled updates with confirm step + audit | Planned |
| **D** | Rate limiting, anomaly detection, audit export | Planned |

---

## Mobile App Architecture

The mobile app (`apps/mobile/`) is built with Flutter/Dart using Riverpod for state management and connects directly to Supabase.

```mermaid
graph TD
    subgraph "Flutter App"
        Main["main.dart<br/>(Firebase + Supabase init)"]
        AuthWrapper["AuthWrapper<br/>(auth state stream)"]

        subgraph "Core"
            Config["config/<br/>(Supabase config)"]
            Services["services/<br/>(notifications, push, profile role)"]
            Theme["theme/<br/>(app theme)"]
            CoreUI["ui/<br/>(shared widgets)"]
        end

        subgraph "Features"
            AuthFeature["auth/<br/>(login, signup, onboarding guard)"]
            TripsFeature["trips/<br/>(trip list, details)"]
            BookingsFeature["bookings/<br/>(booking management)"]
            ExploreFeature["explore/<br/>(destination discovery)"]
            ConciergeFeature["concierge/<br/>(AI assistant)"]
        end
    end

    subgraph "Backend"
        Supabase["Supabase<br/>(auth + database)"]
        Firebase["Firebase<br/>(FCM push notifications)"]
    end

    Main --> AuthWrapper
    AuthWrapper -->|"authenticated"| TripsFeature
    AuthWrapper -->|"unauthenticated"| AuthFeature

    AuthWrapper --> Services
    Services --> Firebase

    TripsFeature --> Supabase
    BookingsFeature --> Supabase
    ExploreFeature --> Supabase
    ConciergeFeature --> Supabase
    AuthFeature --> Supabase
```

### Mobile Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Flutter (Dart) |
| State management | Riverpod (`flutter_riverpod`) |
| Backend | Supabase (`supabase_flutter` SDK) |
| Push notifications | Firebase Cloud Messaging |
| Local notifications | `flutter_local_notifications` |
| Auth flow | Supabase Auth stream + `OnboardingGuard` widget |

### Auth Flow

1. App initializes Firebase and Supabase on startup
2. `AuthWrapper` listens to `onAuthStateChange` stream
3. On login: syncs profile role, initializes push notifications, flushes pending navigation
4. On logout: resets initialization flags, shows `AuthScreen`
5. `OnboardingGuard` wraps the main screen to enforce onboarding completion

---

## Type Sharing

Database types flow from Supabase schema generation into the shared package and are consumed by the web app.

```mermaid
graph LR
    subgraph "Source of Truth"
        Schema["supabase/schema.sql<br/>(113 tables)"]
        Migrations["supabase/migrations/<br/>(incremental changes)"]
    end

    subgraph "Generation"
        CLI["supabase gen types<br/>(CLI command)"]
    end

    subgraph "Shared Package"
        Types["packages/shared/src/<br/>database.types.ts (127KB)<br/>index.ts (re-export)"]
        PkgJSON["packages/shared/<br/>package.json + tsconfig.json"]
    end

    subgraph "Consumers"
        WebApp["apps/web/<br/>(TypeScript imports)"]
        MobileApp["apps/mobile/<br/>(Dart models, manual sync)"]
    end

    Schema --> CLI
    Migrations --> CLI
    CLI -->|"generates"| Types
    Types -->|"npm package import"| WebApp
    Types -.->|"manual Dart translation"| MobileApp
```

### How It Works

1. **Schema changes** are made via SQL migration files in `supabase/migrations/`
2. **Type generation**: `supabase gen types typescript` produces `database.types.ts` (127KB, covering all 113 tables)
3. **Shared package** (`packages/shared/`) exports all generated types via `index.ts`
4. **Web app** imports types: `import type { Database } from '@gobuddy/shared'`
5. **Mobile app** maintains Dart model classes that mirror the database schema (manually synchronized)

### Package Configuration

The shared package uses a standard npm package setup:

```
packages/shared/
  src/
    database.types.ts   # Auto-generated Supabase types (127KB)
    index.ts            # Re-exports: export * from './database.types'
  package.json          # Package metadata
  tsconfig.json         # TypeScript configuration
```

### Type Safety Across the Stack

| App | Type Source | Sync Method |
|-----|-----------|-------------|
| **Web** (TypeScript) | `packages/shared/database.types.ts` | Direct import (automatic) |
| **Agents** (Python) | Supabase client library | Runtime validation via Pydantic |
| **Mobile** (Dart) | Manual Dart model classes | Manual sync with schema changes |
| **RAG Assistant** (JavaScript) | No strict typing | Runtime JSONL schema |
