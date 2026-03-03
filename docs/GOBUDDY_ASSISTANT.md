# GoBuddy AI Assistant — Technical & Functional Reference

> **Purpose**: Complete reference for the GoBuddy AI operations assistant built into the
> Antigravity / Travel Suite platform. Use this document to understand what was built, how
> every component works, and where to find each piece of code before starting a new session.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Technology Stack](#3-technology-stack)
4. [File Map](#4-file-map)
5. [AI Pipeline — End-to-End Flow](#5-ai-pipeline--end-to-end-flow)
6. [SSE Streaming Protocol](#6-sse-streaming-protocol)
7. [Action System](#7-action-system)
8. [Cost Optimisation Engine](#8-cost-optimisation-engine)
9. [Proactive Features](#9-proactive-features)
10. [Multi-Language Support](#10-multi-language-support)
11. [WhatsApp Integration](#11-whatsapp-integration)
12. [Safety & Guardrails](#12-safety--guardrails)
13. [Usage Metering & Tier Gating](#13-usage-metering--tier-gating)
14. [Cross-Session Memory](#14-cross-session-memory)
15. [UI — Midnight Aurora Design](#15-ui--midnight-aurora-design)
16. [API Routes Reference](#16-api-routes-reference)
17. [Environment Variables](#17-environment-variables)
18. [Database Schema (Assistant-Relevant Tables)](#18-database-schema-assistant-relevant-tables)
19. [Development Guide — Adding New Actions](#19-development-guide--adding-new-actions)
20. [Known Limits & Future Work](#20-known-limits--future-work)

---

## 1. Product Overview

GoBuddy is an embedded AI business-operations assistant designed exclusively for **tour operators**. It lets operators query live data and trigger write actions through natural language — eliminating manual navigation across the CRM, invoicing module, and driver dashboard.

### Channels

| Channel | Entry Point | Notes |
|---------|-------------|-------|
| Web (chat panel) | Floating trigger button, bottom-right corner | Full markdown, charts, suggested-action chips |
| WhatsApp | `POST /api/webhooks/whatsapp` | Text-only, 4-second reply budget |

### Personas

- **GoBuddy** — the assistant name shown to users.
- **Service role** — all DB queries run as service-role Supabase client (bypasses RLS). Per-org isolation is enforced by always scoping queries to `organization_id`.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  User (Web or WhatsApp)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP POST / Webhook POST
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Next.js API Route (App Router)                 │
│  /api/assistant/chat/stream   or                         │
│  /api/webhooks/whatsapp                                  │
│                                                          │
│  1. Auth (Supabase session / HMAC-SHA256)                │
│  2. Build ActionContext                                   │
│  3. Call Orchestrator                                     │
│  4. Stream SSE tokens (web) or reply JSON (WhatsApp)     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Orchestrator                           │
│  lib/assistant/orchestrator.ts                           │
│                                                          │
│  Step 1  — Guardrails check                              │
│  Step 2  — Usage limit check                             │
│  Step 3  — Preference / language load                    │
│  Step 4  — Context snapshot + cross-session memory       │
│  Step 5  — Confidence routing (zero-cost ambiguity gate) │
│  Step 6  — Exact-match response cache                    │
│  Step 7  — Semantic similarity cache (embeddings)        │
│  Step 8  — Direct execution (pattern-matched, no LLM)    │
│  Step 9  — Schema routing (keyword → subset of tools)    │
│  Step 10 — Model selection (gpt-4o-mini vs gpt-4o)       │
│  Step 11 — OpenAI tool-call loop (max 3 rounds)          │
│  Step 12 — Response assembly + suggested actions         │
│  Step 13 — Usage increment                               │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             ▼                           ▼
┌────────────────────┐       ┌───────────────────────────┐
│  OpenAI API        │       │   Action Handlers          │
│  gpt-4o-mini /     │       │   lib/assistant/actions/   │
│  gpt-4o            │       │   reads/ + writes/         │
│  (function calling)│       │   → Supabase queries       │
└────────────────────┘       └───────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  Upstash Redis Cache                                     │
│  • Exact-match response cache   (300 s TTL)              │
│  • Semantic embedding ring buf  (3600 s TTL, 50 entries) │
│  • Cross-session memory         (60 s TTL)               │
│  • Context snapshot             (300 s TTL)              │
│  • Usage counters               (atomic, daily flush)    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | Server components + route handlers |
| Language | TypeScript (strict) | All files `server-only` where relevant |
| LLM | OpenAI `gpt-4o-mini` (default) / `gpt-4o` (enterprise+complex) | Function-calling mode |
| Embeddings | OpenAI `text-embedding-3-small` | Semantic similarity cache only |
| Database | Supabase (PostgreSQL) | Service-role client for assistant queries |
| Cache | Upstash Redis | Response cache, semantic cache, session memory, usage |
| Realtime | Server-Sent Events (SSE) | Custom `SSEWriter` abstraction |
| UI Animation | Framer Motion | Panel slide-in/out, per-message animations |
| Charts | Recharts | BarChart with SVG gradients inside messages |
| WhatsApp | Meta Cloud API | Inbound webhook + HMAC-SHA256 verification |
| CI Build | Next.js `tsc --noEmit` + ESLint | Enforced before every commit |

---

## 4. File Map

All paths are relative to `projects/travel-suite/apps/web/src/`.

```
lib/assistant/
├── orchestrator.ts               # Central pipeline — coordinates all steps
├── types.ts                      # All shared TypeScript interfaces (readonly-only)
├── guardrails.ts                 # Content safety pre-check
├── context-engine.ts             # Builds ContextSnapshot (today's trips, invoices…)
├── conversation-store.ts         # Reads/writes assistant_conversations table
├── conversation-memory.ts        # Cross-session memory — last 3 exchange pairs
├── session.ts                    # In-request conversation history management
├── preferences.ts                # Operator preferences CRUD (language, morning_briefing…)
├── alert-preferences.ts          # Alert preference helpers
├── export.ts                     # Conversation export (CSV / JSON)
├── weekly-digest.ts              # Weekly summary generator
├── audit.ts                      # Audit log writer (writes to assistant_audit_log)
│
├── prompts/
│   └── system.ts                 # buildSystemPrompt() — static block + dynamic block
│
├── response-cache.ts             # Exact-match Redis response cache (300 s)
├── semantic-response-cache.ts    # Embedding-based semantic cache (3600 s, cosine ≥ 0.92)
├── schema-router.ts              # Keyword → subset of tool schemas (~50% token reduction)
├── model-router.ts               # gpt-4o-mini vs gpt-4o selection
├── direct-executor.ts            # Pattern-match common queries → zero LLM cost
├── usage-meter.ts                # Monthly quota check + Redis increment
├── anomaly-detector.ts           # ISO-week revenue / trip / proposal deviation detection
│
├── suggested-actions.ts          # Follow-up chip suggestions per last action
├── date-parser.ts                # Natural-language date parser (date-fns based)
│
├── briefing.ts                   # Morning WhatsApp briefing generator
├── alerts.ts                     # Proactive alert detection + queue
│
├── channel-adapters/
│   └── whatsapp.ts               # WhatsApp-specific message formatting + reply
│
├── workflows/
│   ├── definitions.ts            # Guided workflow state definitions
│   └── engine.ts                 # Redis-backed workflow state machine
│
└── actions/
    ├── registry.ts               # getAllActions() — merges reads + writes
    ├── reads/
    │   ├── dashboard.ts          # get_today_summary, get_pending_items, get_kpi_snapshot
    │   ├── trips.ts              # search_trips, get_trip_details, get_trip_itinerary
    │   ├── clients.ts            # search_clients, get_client_details, get_client_history
    │   ├── invoices.ts           # search_invoices, get_invoice_details, get_overdue_invoices
    │   ├── drivers.ts            # search_drivers, get_driver_availability
    │   ├── proposals.ts          # search_proposals, get_proposal_details
    │   ├── preferences.ts        # get_my_preferences, get_preference
    │   └── reports.ts            # generate_report (weekly/monthly aggregates)
    └── writes/
        ├── trips.ts              # update_trip_status, assign_driver_to_trip
        ├── clients.ts            # update_client_stage, add_client_note, update_client_tags
        ├── invoices.ts           # mark_invoice_paid, send_invoice_reminder
        ├── proposals.ts          # send_proposal, convert_proposal_to_trip
        ├── notifications.ts      # send_whatsapp_message, schedule_followup
        └── preferences.ts        # set_preference, delete_preference

app/api/assistant/
├── chat/route.ts                 # Standard (non-streaming) chat endpoint
├── chat/stream/route.ts          # SSE streaming endpoint (primary web path)
├── confirm/route.ts              # Write-action confirmation handler
├── conversations/route.ts        # Conversation history list
├── export/route.ts               # Conversation export endpoint
├── quick-prompts/route.ts        # Custom quick-prompt GET / POST
└── usage/route.ts                # Monthly usage stats GET

app/api/webhooks/
└── whatsapp/route.ts             # Meta Cloud API webhook (GET verify + POST messages)

app/api/cron/
├── assistant-briefing/route.ts   # Daily morning briefing trigger (7:00 AM IST)
├── assistant-alerts/route.ts     # Proactive alert check (every 4 hours)
└── assistant-digest/route.ts     # Weekly digest trigger

components/assistant/
├── TourAssistantChat.tsx         # Main chat UI (Midnight Aurora theme)
├── ConversationHistory.tsx       # Conversation list panel
└── UsageDashboard.tsx            # Usage stats panel
```

---

## 5. AI Pipeline — End-to-End Flow

This section traces a single user message from submission through to the streamed reply.

### 5.1 Request Entry (`stream/route.ts`)

1. Validate Supabase session (`createServerClient`).
2. Parse `{ message, history, channel }` from POST body.
3. Build `ActionContext` — `{ organizationId, userId, channel, supabase }`.
4. Resolve org plan via `resolveOrganizationPlan()` for tier gating.
5. Run `getOrchestrate(request, ctx)` (the orchestrator) in a try/catch.
6. Stream returned tokens via SSE.

### 5.2 Orchestrator Steps (`orchestrator.ts`)

#### Step 1 — Guardrails
`checkGuardrails(message)` runs content-safety patterns (PII extraction, prompt injection, off-topic requests). If triggered, returns a polite refusal immediately — **zero API cost**.

#### Step 2 — Usage Check
`checkUsageAllowed(ctx)` queries `organization_ai_usage` for the current month. If `ai_requests >= plan.limits.aiRequests`, returns a friendly upgrade message — **zero API cost**.

#### Step 3 — Preferences
`getPreference(ctx, "language")` loaded from `assistant_preferences` (Redis-backed). Determines reply language.

#### Step 4 — Context & Memory (parallel)
Two fetches run in `Promise.all`:
- `getContextSnapshot(ctx)` — today's trips, pending invoices, recent clients, failed notifications. Redis-cached 300 s.
- `getRecentMemory(ctx)` — last 6 messages (3 exchange pairs) from `assistant_conversations`. Redis-cached 60 s per `orgId:userId`.

Both feed into `buildSystemPrompt(orgName, snapshot, language)`.

#### Step 5 — Confidence Routing (zero-cost gate)
```
if (getSpecificCategoryCount(message) === 0 && wordCount <= 5)
  → return disambiguation response with 4 suggested follow-up actions
```
Avoids sending any API request for ambiguous short messages like "hello" or "help me".

#### Step 6 — Exact-Match Cache
`getCachedResponse(orgId, normalizedQuery)` — Redis key `assistant:resp:<orgId>:<hash>`. Skipped for write queries or messages containing "my" (user-specific). TTL: 300 s.

#### Step 7 — Semantic Similarity Cache
`getSemanticCachedResponse(orgId, message, apiKey)` — calls `text-embedding-3-small` to get a 1536-dim embedding, compares cosine similarity against a ring buffer (max 50 per org, 1 h TTL) stored in Redis. Threshold: **0.92**. On hit, returns cached `OrchestratorResponse` — no chat completion needed.

#### Step 8 — Direct Execution (zero-LLM)
`tryDirectExecution(message, ctx)` pattern-matches common queries:

| Pattern | Action called |
|---------|--------------|
| "today's summary", "what's happening" | `get_today_summary()` |
| "overdue invoices", "unpaid" | `get_overdue_invoices()` |
| "pending items", "what needs attention" | `get_pending_items()` |
| "my preferences", "my settings" | `get_my_preferences()` |
| "kpi", "dashboard", "stats" | `get_kpi_snapshot()` |

Returns a templated `OrchestratorResponse` with no OpenAI call.

#### Step 9 — Schema Routing
`getRelevantSchemas(message)` selects a subset of the 29+ tool schemas based on domain keywords:

| Keyword pattern | Schemas included |
|----------------|-----------------|
| invoice / payment / overdue / billing | invoice + dashboard |
| trip / travel / itinerary / driver | trip + driver |
| client / customer / lead / follow-up | client + notification |
| proposal / quote / convert | proposal |
| preference / setting | preference |
| summary / today / kpi / report | dashboard + report |
| (nothing matched) | **all schemas** (safe fallback) |

Reduces token cost ~50% for domain-specific queries.

#### Step 10 — Model Selection
`selectModel(message, tier)`:
- **Enterprise + complex query** (`>30 words` OR analytical keywords: analyze, forecast, predict, strategy, optimize, insight, trend, pattern, compare, "why is/are", "how should we") → `gpt-4o`
- **All other cases** → `gpt-4o-mini`

#### Step 11 — OpenAI Tool-Call Loop
Standard function-calling loop, max 3 rounds:
```
messages = [system, ...memory, ...history, user]

while rounds < 3:
  response = openai.chat.completions.create(model, messages, tools)
  if no tool_calls → break (final text reply)
  for each tool_call:
    if requiresConfirmation → return actionProposal (pause for user)
    result = action.execute(ctx, params)
    messages.push(tool result)
    rounds++
```

The system prompt is structured with **static block first** (role, rules, capabilities — ~300 tokens, identical for all orgs) followed by the dynamic org/date/snapshot block after a `---` separator. This maximises OpenAI's automatic prefix-caching benefit across organisations.

#### Step 12 — Response Assembly
- `suggestedActions` appended via `getSuggestedActions(lastActionName)`.
- Response cached in exact-match cache (if cacheable).
- Response embedding stored in semantic cache (fire-and-forget).

#### Step 13 — Usage Increment
`incrementUsage(ctx, { isCache, model, inputTokens, outputTokens })` — Redis atomic increment, flushed to `organization_ai_usage` every 10th request.

---

## 6. SSE Streaming Protocol

The web client connects to `POST /api/assistant/chat/stream` and reads a stream of SSE events.

### Event Types

| Event | Payload | When emitted |
|-------|---------|--------------|
| `token` | `{ token: string }` | Each chunk from OpenAI stream |
| `status` | `{ message: string }` | Tool call start ("Looking up invoices…") |
| `suggestions` | `{ suggestedActions: [{label, prefilledMessage}] }` | **Before** streaming starts, after tool calls resolve |
| `proposal` | `{ actionProposal: { actionName, params, confirmationMessage } }` | Write action pending confirmation |
| `done` | `{ reply: string }` | Stream complete with full assembled reply |
| `error` | `{ error: string }` | Any unrecoverable error |

### Client Handling (`TourAssistantChat.tsx`)

```
EventSource → switch(event.event):
  "token"       → append to current assistant message bubble
  "status"      → show tool-call status indicator
  "suggestions" → attach suggestedActions to current message object
  "proposal"    → render confirmation card (Yes/No buttons)
  "done"        → finalise message, stop loading spinner
  "error"       → show error toast
```

Suggestion chips are emitted **before** `streamOpenAI` begins, so they appear in the UI while the text is still streaming — no extra wait time for the user.

---

## 7. Action System

### Action Definition Contract

Every action exports an `ActionDefinition`:

```typescript
interface ActionDefinition {
  name: string;                    // matches OpenAI function name
  description: string;             // shown to LLM
  category: "read" | "write";
  parameters: ActionParameterSchema; // JSON Schema
  requiresConfirmation: boolean;   // true for all write actions
  execute(ctx, params): Promise<ActionResult>;
}
```

### Read Actions (29 total)

| Module | Actions |
|--------|---------|
| `dashboard.ts` | `get_today_summary`, `get_pending_items`, `get_kpi_snapshot` |
| `trips.ts` | `search_trips`, `get_trip_details`, `get_trip_itinerary` |
| `clients.ts` | `search_clients`, `get_client_details`, `get_client_history` |
| `invoices.ts` | `search_invoices`, `get_invoice_details`, `get_overdue_invoices` |
| `drivers.ts` | `search_drivers`, `get_driver_availability` |
| `proposals.ts` | `search_proposals`, `get_proposal_details` |
| `preferences.ts` | `get_my_preferences`, `get_preference` |
| `reports.ts` | `generate_report` (period + type parameters) |

### Write Actions (require confirmation)

| Module | Actions |
|--------|---------|
| `trips.ts` | `update_trip_status`, `assign_driver_to_trip` |
| `clients.ts` | `update_client_stage`, `add_client_note`, `update_client_tags` |
| `invoices.ts` | `mark_invoice_paid`, `send_invoice_reminder` |
| `proposals.ts` | `send_proposal`, `convert_proposal_to_trip` |
| `notifications.ts` | `send_whatsapp_message`, `schedule_followup` |
| `preferences.ts` | `set_preference`, `delete_preference` |

### Write Confirmation Flow

1. LLM selects a write action → `requiresConfirmation === true`.
2. Orchestrator pauses, returns `actionProposal` event instead of executing.
3. UI renders a confirmation card with action details.
4. User clicks **Confirm** → `POST /api/assistant/confirm` with `{ actionName, params }`.
5. Confirmation route validates the action, executes it, writes to `assistant_audit_log`.

### Adding a New Action

See [Section 19](#19-development-guide--adding-new-actions).

---

## 8. Cost Optimisation Engine

### 8.1 Exact-Match Response Cache

**File**: `lib/assistant/response-cache.ts`

- Key: `assistant:resp:<orgId>:<sha256(normalizedQuery)>`
- Normalization: lowercase, trim, strip filler words ("please", "can you", "show me")
- TTL: 300 s (matches context snapshot lifetime)
- Skip conditions: message contains "my", query has `actionProposal`, write results
- Invalidation: any successful write action calls `deleteCachedByPrefix("assistant:resp:<orgId>")`

### 8.2 Semantic Similarity Cache

**File**: `lib/assistant/semantic-response-cache.ts`

- Embedding model: `text-embedding-3-small` (1536 dimensions)
- Storage: Redis ring buffer, key `assistant:semcache:<orgId>`, max 50 entries, TTL 3600 s
- Hit threshold: cosine similarity ≥ **0.92**
- Cost: embedding call ~$0.000002 vs chat completion ~$0.0012 (600× cheaper)
- Fire-and-forget write: does not block the response path

```typescript
// cosine similarity — pure function
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i]!, 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}
```

### 8.3 Schema Routing

**File**: `lib/assistant/schema-router.ts`

Sends only relevant tool schemas per request. Dashboard tools (~3) always included as baseline. No-keyword queries fall back to all 29 schemas.

Estimated token savings: **~900 tokens** per domain-specific query (50% reduction).

### 8.4 Direct Execution

**File**: `lib/assistant/direct-executor.ts`

Five common query patterns skip OpenAI entirely. Cost: **$0.00**. Response time: ~200 ms vs ~1.5 s for LLM path.

### 8.5 Tiered Model Routing

**File**: `lib/assistant/model-router.ts`

| Condition | Model | Cost/1K tokens |
|-----------|-------|---------------|
| Free or Pro tier, any query | `gpt-4o-mini` | $0.00015 input / $0.00060 output |
| Enterprise, simple query | `gpt-4o-mini` | $0.00015 input / $0.00060 output |
| Enterprise, complex query | `gpt-4o` | $0.0025 input / $0.01 output |

### 8.6 Prompt Prefix Caching

**File**: `lib/assistant/prompts/system.ts`

System prompt structure:
```
[STATIC BLOCK — ~300 tokens, identical for every org]
You are GoBuddy…
## Your Role…
## Rules…
## Capabilities…

---
[DYNAMIC BLOCK — per-org, changes per request]
## Session Context
Organization: {orgName}
Date: {today}
{contextSnapshot}
{languageInstruction}
```

The static block is placed first so OpenAI's automatic prefix caching applies across all organisations, reducing effective input cost ~80% on the static portion after the first call.

---

## 9. Proactive Features

### 9.1 Morning Briefing

**File**: `lib/assistant/briefing.ts`
**Cron**: `POST /api/cron/assistant-briefing` — `30 1 * * *` UTC (7:00 AM IST)

- Finds orgs where operator has `morning_briefing_enabled === true` preference + WhatsApp phone
- Builds snapshot per org, formats WhatsApp-friendly text (no LLM call)
- Queues via `notification_queue` table
- Idempotency key: `${orgId}:${userId}:briefing:${YYYY-MM-DD}` — safe to re-run

Message template:
```
*Good morning!* Here's your daily briefing for {orgName}:

*Trips Today:* {count} active
- {clientName} ({status})

*Invoices:* {overdueCount} overdue ({totalAmount})
*Follow-ups:* {pendingCount} client(s) need attention

Reply with any question to get started.
```

### 9.2 Proactive Alerts

**File**: `lib/assistant/alerts.ts`
**Cron**: `POST /api/cron/assistant-alerts` — `0 */4 * * *` (every 4 hours)

Trigger types:
1. Invoice overdue > 7 days
2. Trip starting tomorrow with no driver assigned
3. Client not contacted in 30+ days
4. Anomaly alerts (from anomaly detector)

Cap: 3 alerts per org per cycle.

### 9.3 Anomaly Detection

**File**: `lib/assistant/anomaly-detector.ts`

Detects statistical deviations in three business metrics using ISO-week comparison:

| Alert Type | Trigger |
|-----------|---------|
| `revenue_spike` | Current week revenue ≥ 150% of 4-week rolling average |
| `revenue_drop` | Current week revenue ≤ 50% of 4-week rolling average |
| `trip_spike` | Current week trip count ≥ 150% of rolling average |
| `trip_drop` | Current week trip count ≤ 50% of rolling average |
| `proposal_drop` | Proposal conversion rate ≤ 50% of rolling average |

- Minimum average threshold: `1` (avoids false positives on new orgs)
- All 15 metric data points fetched in parallel via `Promise.allSettled`
- Entity ID format `"revenue:2026-03-02"` ensures daily idempotency in notification queue

### 9.4 Suggested Action Chips

**File**: `lib/assistant/suggested-actions.ts`

After each assistant response, 2–3 contextual follow-up chips are emitted via `suggestions` SSE event. Map by last tool call name:

| Last action | Suggested chips |
|------------|----------------|
| `get_today_summary` | "Show overdue invoices", "Trips without drivers?" |
| `get_overdue_invoices` | "Send reminders to all", "Show details" |
| `search_trips` | "Assign a driver", "Send update to client" |
| `get_client_details` | "Add a note", "Schedule follow-up" |
| `update_client_stage` | "Add a note", "Send WhatsApp message" |

Chips appear in the UI while the text is still streaming — zero additional latency.

### 9.5 Natural Language Reports

**File**: `lib/assistant/actions/reads/reports.ts`
**Action**: `generate_report`

Parameters: `period` (this_week / this_month / last_month / custom) + `type` (summary / revenue / trips / clients). Aggregates trip counts, invoice totals, collection rate, new clients, proposal conversion. LLM formats the structured data into a readable narrative.

### 9.6 Weekly Digest

**File**: `lib/assistant/weekly-digest.ts`
**Cron**: `POST /api/cron/assistant-digest`

Summarizes the week's business performance. Queued to WhatsApp for subscribed operators.

---

## 10. Multi-Language Support

**File**: `lib/assistant/prompts/system.ts` — `language` parameter in `buildSystemPrompt`

When `language === "hi"`, this block is appended to the system prompt:
```
## Language
Respond in Hindi (Devanagari script). Use natural, fluent Hindi — not
machine-translated text. Keep technical terms, numbers, and proper nouns in English.
```

- No translation files required — GPT-4o-mini generates Hindi natively
- Language preference stored in `assistant_preferences` as `{ key: "language", value: "hi" }`
- WhatsApp responses also respect language preference via `whatsapp.ts`
- Currently supported: `en` (default), `hi` (Hindi)
- Adding more languages: append the language name to the system prompt block — GPT-4o-mini supports ~95 languages natively

---

## 11. WhatsApp Integration

**File**: `app/api/webhooks/whatsapp/route.ts`
**Channel adapter**: `lib/assistant/channel-adapters/whatsapp.ts`

### Webhook Security

```typescript
const signature = req.headers.get("x-hub-signature-256"); // "sha256=<hex>"
const expected = crypto
  .createHmac("sha256", process.env.WHATSAPP_APP_SECRET!)
  .update(rawBody)
  .digest("hex");
if (signature !== `sha256=${expected}`) return 403;
```

### Inbound Message Flow

1. Meta sends `POST /api/webhooks/whatsapp` with message payload.
2. HMAC-SHA256 signature verified.
3. Phone number extracted → looked up in `profiles` to find `organization_id`.
4. `Promise.race` with 4-second timeout wraps the orchestrator call (Meta requires 200 OK within 5 s).
5. Reply sent via Meta Cloud API `messages` endpoint.
6. 200 OK returned regardless of orchestrator outcome (WhatsApp delivery handled separately).

### Verification

`GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=<secret>&hub.challenge=<n>` — returns `hub.challenge` to complete Meta's webhook verification flow.

---

## 12. Safety & Guardrails

**File**: `lib/assistant/guardrails.ts`

Pre-flight check applied to every message before any API call:

| Check | Pattern / Logic |
|-------|----------------|
| Prompt injection | "ignore previous instructions", "system:", "act as" + role, "DAN mode" |
| PII extraction attempts | "what is your system prompt", "show me the prompt" |
| Off-topic requests | Non-business queries (explicit content, political, personal advice) |
| Competitor fishing | "compared to [competitor]", "better than [tool]" |

On trigger: returns a polite refusal without revealing the guardrail rule that fired.

---

## 13. Usage Metering & Tier Gating

**File**: `lib/assistant/usage-meter.ts`
**API**: `GET /api/assistant/usage`

### Tier Limits

| Plan | Monthly AI Requests |
|------|-------------------|
| Free | 200 |
| Pro | 3,000 |
| Enterprise | 20,000 |

### Storage

- Redis key `assistant:usage:<orgId>:<YYYY-MM>` — atomic increment
- Flushed to `organization_ai_usage` table every 10th request
- Columns tracked: `ai_requests`, `cache_hits`, `estimated_cost_usd`, `direct_execution_count`, `token_count_input`, `token_count_output`

### Limit Response

When `ai_requests >= plan.limit`:
```
You've used 200 of 200 messages this month on the Free plan.
Upgrade to Pro for 3,000 messages/month, or Enterprise for 20,000.
```

---

## 14. Cross-Session Memory

**File**: `lib/assistant/conversation-memory.ts`

Loads the last **3 exchange pairs** (6 messages: 3 user + 3 assistant) from `assistant_conversations` for the current `orgId:userId`. Injected into the message array between the system prompt and the current conversation history:

```
[system prompt]
[memory: user msg 1]
[memory: assistant reply 1]
[memory: user msg 2]
[memory: assistant reply 2]
[memory: user msg 3]
[memory: assistant reply 3]
[current session history…]
[current user message]
```

- Redis-cached per `orgId:userId` for 60 s to avoid DB hits on rapid follow-ups
- Returns `[]` on any error, never throws — memory failure is non-fatal
- The current exchange is saved **after** the response is sent (fire-and-forget) so it never leaks into the current request's memory

---

## 15. UI — Midnight Aurora Design

**File**: `components/assistant/TourAssistantChat.tsx`

### Design Language

A dark glassmorphism theme built entirely with inline style objects and direct Tailwind class names. No external CSS files.

| Element | Style |
|---------|-------|
| Background | `#060d1a` — deep midnight blue |
| Trigger button | Spinning conic-gradient ring (`#7c3aed → #06b6d4 → #7c3aed`, 5 s rotation), dark core, violet glow |
| Chat panel | `420 × 600 px`, `rgba(15, 23, 42, 0.95)` bg, multi-layer box-shadow, `1px solid rgba(124, 58, 237, 0.3)` border |
| Header | Translucent violet glass, animated mini orb avatar, emerald live dot |
| User messages | Violet → indigo gradient, `border-radius: 16px 16px 4px 16px`, slide-in from right |
| Assistant messages | Glass card with violet `2px` left-border accent, mini orb avatar, slide-in from left |
| Streaming cursor | Blinking `|` bar (CSS `gb-cursor` animation) on active message |
| Typing indicator | 3 staggered bouncing dots (violet / indigo / cyan) |
| Charts | `BarChart` with SVG `<linearGradient id="violetGrad">`, dark glass card wrapper |
| Input | Translucent dark, violet focus ring + spread glow, gradient send button |
| Scrollbar | Custom `.gb-scroll` — 4 px thumb, violet tint |

### Animations

All defined in an inline `<style>` tag:
- `gb-spin` — 5 s linear infinite rotation (trigger ring)
- `gb-cursor` — 1 s step-end blink (streaming cursor)
- `gb-dot` — 1.4 s ease infinite bounce (typing dots)
- `gb-pulse-ring` — subtle pulsing glow on trigger

### Markdown Rendering

Custom `MarkdownContent` component (no react-markdown dependency). Regex line parser handles:
- `**bold**`, `_italic_`, `` `code` ``
- `# H1`, `## H2`, `### H3`
- `- item` unordered lists
- `1. item` ordered lists
- `[text](url)` links

### Suggested Action Chips

Rendered below assistant messages as horizontal scroll row. Clicking a chip prefills the input and auto-submits.

### Quick Prompts

6 default quick-prompt buttons shown on first open. Operators can customise via `POST /api/assistant/quick-prompts` (max 8 prompts, 100 chars each).

---

## 16. API Routes Reference

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/assistant/chat/stream` | Supabase session | SSE streaming chat |
| `POST` | `/api/assistant/chat` | Supabase session | Non-streaming chat |
| `POST` | `/api/assistant/confirm` | Supabase session | Execute confirmed write action |
| `GET` | `/api/assistant/conversations` | Supabase session | List conversation history |
| `GET` | `/api/assistant/export` | Supabase session | Export conversations |
| `GET` / `POST` | `/api/assistant/quick-prompts` | Supabase session | Get / set custom quick prompts |
| `GET` | `/api/assistant/usage` | Supabase session | Monthly usage stats |
| `GET` / `POST` | `/api/webhooks/whatsapp` | HMAC-SHA256 | Meta Cloud API webhook |
| `POST` | `/api/cron/assistant-briefing` | Cron secret header | Trigger morning briefings |
| `POST` | `/api/cron/assistant-alerts` | Cron secret header | Trigger proactive alerts |
| `POST` | `/api/cron/assistant-digest` | Cron secret header | Trigger weekly digest |

### Cron Authentication

All cron routes use `authorizeCronRequest()` which checks `Authorization: Bearer <CRON_SECRET>` header. The same pattern as `/api/notifications/schedule-followups/route.ts`.

---

## 17. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | OpenAI chat completions + embeddings |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key for DB queries |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis auth token |
| `WHATSAPP_APP_SECRET` | For WhatsApp | HMAC-SHA256 signature verification |
| `WHATSAPP_ACCESS_TOKEN` | For WhatsApp | Meta Cloud API send token |
| `WHATSAPP_PHONE_NUMBER_ID` | For WhatsApp | Sending phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | For WhatsApp | Webhook challenge verification |
| `CRON_SECRET` | For cron routes | Secures briefing/alert/digest endpoints |

---

## 18. Database Schema (Assistant-Relevant Tables)

### `assistant_conversations`

Stores every message in every session.

```sql
id                UUID PRIMARY KEY
organization_id   UUID REFERENCES organizations(id)
user_id           UUID REFERENCES auth.users(id)
session_id        TEXT
role              TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool'))
content           TEXT
created_at        TIMESTAMPTZ DEFAULT now()
```

### `assistant_preferences`

Key-value store per user (arbitrary JSON values).

```sql
id                UUID PRIMARY KEY
organization_id   UUID REFERENCES organizations(id)
user_id           UUID REFERENCES auth.users(id)
key               TEXT
value             JSONB
updated_at        TIMESTAMPTZ
UNIQUE (organization_id, user_id, key)
```

Common preference keys:
- `language` — `"en"` | `"hi"`
- `morning_briefing_enabled` — `true` | `false`
- `custom_quick_prompts` — `string[]` (max 8)
- `alert_channels` — `{ whatsapp: boolean, email: boolean }`

### `organization_ai_usage`

Monthly usage counters per org.

```sql
id                        UUID PRIMARY KEY
organization_id           UUID REFERENCES organizations(id)
month                     TEXT  -- "2026-03"
ai_requests               INTEGER DEFAULT 0
cache_hits                INTEGER DEFAULT 0
estimated_cost_usd        NUMERIC(10,6) DEFAULT 0
direct_execution_count    INTEGER DEFAULT 0
token_count_input         BIGINT DEFAULT 0
token_count_output        BIGINT DEFAULT 0
UNIQUE (organization_id, month)
```

### `assistant_audit_log`

Immutable record of every write action.

```sql
id                UUID PRIMARY KEY
organization_id   UUID REFERENCES organizations(id)
user_id           UUID REFERENCES auth.users(id)
action_name       TEXT
params            JSONB
result            JSONB
channel           TEXT
created_at        TIMESTAMPTZ DEFAULT now()
```

### `notification_queue`

Used by briefing, alerts, and digest for deduplication and delivery.

```sql
id                UUID PRIMARY KEY
organization_id   UUID
recipient_id      UUID
channel           TEXT  -- 'whatsapp' | 'email'
message           TEXT
idempotency_key   TEXT UNIQUE
status            TEXT  -- 'pending' | 'sent' | 'failed'
scheduled_at      TIMESTAMPTZ
created_at        TIMESTAMPTZ
```

---

## 19. Development Guide — Adding New Actions

### Step 1 — Create the handler

Add a file under `lib/assistant/actions/reads/` or `writes/`:

```typescript
// lib/assistant/actions/reads/my_feature.ts
import "server-only";
import type { ActionDefinition, ActionContext, ActionResult } from "../../types";

export const myFeatureActions: readonly ActionDefinition[] = [
  {
    name: "get_my_data",
    description: "Fetches my data for the current organisation.",
    category: "read",
    requiresConfirmation: false,
    parameters: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Optional filter" },
      },
      required: [],
    },
    async execute(ctx: ActionContext, params): Promise<ActionResult> {
      const { data, error } = await ctx.supabase
        .from("my_table")
        .select("*")
        .eq("organization_id", ctx.organizationId);

      if (error) {
        return { success: false, message: `Failed to fetch: ${error.message}` };
      }

      return {
        success: true,
        data,
        message: `Found ${data.length} records.`,
      };
    },
  },
];
```

### Step 2 — Register in the action registry

```typescript
// lib/assistant/actions/registry.ts
import { myFeatureActions } from "./reads/my_feature";

export function getAllActions(): readonly ActionDefinition[] {
  return [
    ...dashboardActions,
    ...tripActions,
    // ... existing actions
    ...myFeatureActions,  // add here
  ];
}
```

### Step 3 — Add to schema router

In `lib/assistant/schema-router.ts`, add the action name to `ACTION_CATEGORY_MAP`:

```typescript
const ACTION_CATEGORY_MAP = {
  // ...existing entries
  get_my_data: "dashboard", // or whichever category fits
};
```

### Step 4 — Add suggested follow-ups (optional)

In `lib/assistant/suggested-actions.ts`:

```typescript
case "get_my_data":
  return [
    { label: "Show details", prefilledMessage: "Show me the details" },
  ];
```

### Step 5 — Write tests

Follow the TDD pattern: write test first, implement to pass, verify coverage.

---

## 20. Known Limits & Future Work

### Current Limitations

| Area | Limitation |
|------|-----------|
| Language | Only `en` and `hi` tested; other languages work but untested |
| Semantic cache | Does not cache write-action results (by design) |
| WhatsApp | Text-only; images/documents not processed |
| Memory | 3 exchange pairs only — older context lost |
| Model routing | Binary (mini vs full); no mid-tier option |
| Direct execution | Only 5 patterns; adding more reduces LLM cost further |

### Suggested Future Improvements

1. **Voice input** — Web Speech API on the frontend, transcribe → existing pipeline
2. **File analysis** — Allow PDF/CSV upload; extract and summarise trip/invoice data
3. **Persistent memory facts** — Store operator preferences extracted from conversations (e.g., "always show amounts in USD")
4. **More direct-execution patterns** — Cover top-10 most common queries to eliminate LLM cost
5. **A/B testing framework** — Compare response quality between model tiers
6. **Multi-org admin view** — Aggregate usage and anomaly alerts across all orgs for super-admins
7. **Streaming for WhatsApp** — Not possible with Meta Cloud API (must send complete message)
8. **Additional languages** — Arabic, Spanish, French — just add a language block to `buildSystemPrompt`
9. **Fine-tuning** — After collecting 1,000+ conversation logs, fine-tune `gpt-4o-mini` on tour-operator domain for lower cost + higher accuracy

---

## Implementation History

| Commit | Phase | Description |
|--------|-------|-------------|
| `2110e01` | Phase 1 | Initial RAG chatbot with Supabase vector store |
| `39e8a70` | Phase 2 | Floating chat widget |
| `c3e0479` | Phase 3 | Live data access via function calling |
| `b623154` | Phase 4 | Write actions + confirmation flow + audit log |
| `b9a72cc` | Phase 5A | Long-term memory with user preferences |
| `9cd42e8` | Phase 5B | SSE streaming for real-time rendering |
| `5250c6a` | Phase 5C | WhatsApp channel integration |
| `6288eb0` | Phase 6 | Safety guardrails |
| `5c5a87e` | Phase 7 | Cost optimisation, proactive features, Hindi support |
| `7af000e` | Phase 8 | Guided workflows, conversation history, export, alerts, weekly digest |
| `5664013` | Wave 1 | Markdown rendering, copy/regen, charts, NL dates, custom prompts, WhatsApp webhook |
| `a51a42a` | Wave 2 | Semantic similarity cache + anomaly detection |
| `db31439` | ROI | Tiered model routing, prompt prefix caching, confidence routing |
| `36d268c` | Memory | Cross-session memory + streaming suggested actions |
| `183ba41` | UI | Midnight Aurora dark theme redesign |

---

*Document generated: March 2026. Update this file after each major feature addition.*
