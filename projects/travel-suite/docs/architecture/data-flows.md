# TripBuilt Data Flows

Critical business flows across the TripBuilt travel SaaS platform. Each diagram reflects the actual implementation in `apps/web/src/`.

---

## Table of Contents

1. [Payment Flow](#1-payment-flow)
2. [WhatsApp Message Flow](#2-whatsapp-message-flow)
3. [Notification Pipeline](#3-notification-pipeline)
4. [Auth Flow](#4-auth-flow)
5. [Trip Lifecycle](#5-trip-lifecycle)
6. [AI Assistant Flow](#6-ai-assistant-flow)
7. [Onboarding Flow](#7-onboarding-flow)

---

## 1. Payment Flow

Razorpay handles all payments in INR. The flow covers order creation, client-side checkout, and webhook-driven settlement. Signature verification uses HMAC-SHA256 with timing-safe comparison. The webhook handler deduplicates events using the `x-razorpay-event-id` header stored in `payment_events`.

**Key files:** `src/lib/payments/razorpay.ts`, `src/lib/payments/payment-service.ts`, `src/lib/payments/webhook-handlers.ts`, `src/app/api/_handlers/payments/webhook/route.ts`, `src/lib/payments/payment-links.server.ts`

```mermaid
sequenceDiagram
    participant Client as Client Browser
    participant Web as Next.js App
    participant PS as PaymentService
    participant RZ as Razorpay API
    participant DB as Supabase (PostgreSQL)
    participant Email as Resend (Email)

    Client->>Web: Request payment (invoice or payment link)
    Web->>PS: createOrder(amount, "INR", orgId, notes)
    PS->>RZ: POST /v1/orders (Basic Auth, fetchWithRetry x2)
    RZ-->>PS: Order { id, status: "created" }
    PS-->>Web: Razorpay order_id
    Web->>DB: Insert payment_links row (status: "pending")
    Web->>DB: Insert payment_events (event: "created")
    Web-->>Client: Payment link URL with token

    Client->>RZ: Client pays via UPI/Card/Netbanking/Wallet
    RZ->>Web: POST /api/payments/webhook (x-razorpay-signature)

    Web->>Web: Verify HMAC-SHA256 signature (timingSafeEqual)
    Web->>DB: Check x-razorpay-event-id for deduplication
    alt Duplicate event
        Web-->>RZ: 200 { deduplicated: true }
    else New event
        alt payment.captured
            Web->>PS: recordPayment(invoiceId, amount/100, method)
            PS->>DB: Update invoice (status, razorpay_payment_id)
            PS->>DB: Insert payment record
            Web->>DB: Lookup client profile + org name
            Web->>Email: sendPaymentReceipt (via Resend)
            Web->>DB: trackFunnelEvent("payment_completed")
        else payment.failed
            Web->>PS: handlePaymentFailed(orgId, subId, paymentId)
            PS->>DB: Increment failed_payment_count
            alt 3+ failures
                PS->>DB: Set subscription status = "paused"
                PS->>DB: notifyOrganizationSubscriptionPaused
            end
        else subscription.charged
            Web->>PS: handleSubscriptionCharged(rzSubId, paymentId)
            PS->>DB: Update subscription (active, reset failures)
            PS->>PS: createInvoice for period
        end
        Web->>DB: Record event for dedup (webhook_received)
        Web-->>RZ: 200 { received: true }
    end
```

**Supported webhook events:** `payment.captured`, `payment.failed`, `subscription.charged`, `subscription.cancelled`, `subscription.paused`, `invoice.paid`

**Retry policy:** `fetchWithRetry` with 2 retries, 9s timeout, 300ms base delay with exponential backoff + jitter.

---

## 2. WhatsApp Message Flow

Incoming messages arrive via Meta Cloud API webhook. The webhook handler supports three message types (text, location, image) and routes text messages through the AI assistant channel adapter. Signature verification uses HMAC-SHA256 with the `WHATSAPP_APP_SECRET`.

**Key files:** `src/lib/whatsapp.server.ts`, `src/app/api/_handlers/whatsapp/webhook/route.ts`, `src/lib/assistant/channel-adapters/whatsapp.ts`

```mermaid
sequenceDiagram
    participant WA as WhatsApp User
    participant Meta as Meta Cloud API
    participant WH as Webhook Handler
    participant DB as Supabase
    participant Adapter as WhatsApp Channel Adapter
    participant Orch as Orchestrator
    participant OAI as OpenAI API
    participant Send as Meta Send API

    WA->>Meta: Send message (text/location/image)
    Meta->>WH: POST /api/whatsapp/webhook (x-hub-signature-256)
    WH->>WH: Verify HMAC-SHA256 (WHATSAPP_APP_SECRET)
    WH->>WH: Parse payload with Zod schemas

    alt Location message
        WH->>DB: Insert whatsapp_webhook_events (dedup by messageId)
        WH->>DB: Lookup profile by phone_normalized
        WH->>DB: Resolve current trip for driver
        WH->>DB: Insert driver_locations (lat, lng, timestamp)
        WH->>DB: Update event status = "processed"
    else Text message (async via after())
        WH->>DB: Insert whatsapp_webhook_events
        WH->>Adapter: handleWhatsAppMessage(waId, body, phone)
        Adapter->>DB: Lookup profile by phone_normalized
        Adapter->>Adapter: enforceRateLimit (40/5min per user)
        Adapter->>Adapter: sanitizeText (2000 char max)
        Adapter->>DB: getOrCreateSession (assistant_sessions)
        Adapter->>DB: Check for pending action confirmation
        alt Pending action + "YES"
            Adapter->>Adapter: Execute confirmed write action
            Adapter->>DB: logAuditEvent + clearPendingAction
        else No pending action
            Adapter->>Orch: handleMessage(message, history, channel)
            Orch->>OAI: Chat completion with tool schemas
            OAI-->>Orch: Response (text or tool_calls)
            Orch-->>Adapter: { reply, actionProposal? }
        end
        Adapter->>Adapter: formatForWhatsApp (strip markdown, 3800 char max)
        Adapter->>DB: Update session history
        Adapter->>Send: POST graph.facebook.com/v20.0/{phoneId}/messages
        Send-->>WA: Reply delivered
    else Image message (async via after())
        WH->>DB: Insert whatsapp_webhook_events
        WH->>DB: Lookup profile + org
        WH->>Meta: Download media (GET media URL, then binary)
        WH->>DB: Upload to Supabase Storage (social-media bucket)
        WH->>DB: Insert social_media_library record
    end

    WH-->>Meta: 200 { ok: true, counts }
```

**Send retry policy:** 3 attempts with 300ms * attempt delay. Retries on HTTP 429 and 5xx.

---

## 3. Notification Pipeline

The notification system uses a queue-based architecture with multi-channel delivery (WhatsApp + Push), exponential backoff retries, and a dead letter table for permanently failed messages.

**Key files:** `src/lib/notifications.ts`, `src/app/api/_handlers/notifications/process-queue/route.ts`, `src/lib/notification-templates.ts`

```mermaid
sequenceDiagram
    participant Trigger as Trigger (Trip event / Cron / Manual)
    participant DB as Supabase (notification_queue)
    participant Processor as Queue Processor (POST)
    participant WA as Meta WhatsApp API
    participant FCM as Firebase FCM (Edge Function)
    participant Track as notification_delivery_status
    participant DLQ as notification_dead_letters
    participant Logs as notification_logs

    Trigger->>DB: Insert into notification_queue<br/>(scheduled_for, payload, template_key, recipient_phone)

    Note over Processor: Cron / service-role / admin bearer triggers POST

    Processor->>DB: SELECT pending rows WHERE scheduled_for <= NOW() (limit 25)
    Processor->>DB: Batch resolve organization_ids (trips + profiles)

    loop Each queue item (batch of 10)
        Processor->>DB: UPDATE status = "processing" (optimistic lock)
        Processor->>Processor: renderTemplate(key, vars) for title/body

        alt Has recipient_phone
            Processor->>WA: sendWhatsAppTemplate or sendWhatsAppText
            Processor->>Track: Insert delivery_status (channel: whatsapp, provider: meta_whatsapp_cloud)
            Processor->>Logs: Insert notification_logs
        end

        alt Has user_id
            Processor->>FCM: supabase.functions.invoke("send-notification")
            FCM->>FCM: FCM V1 push to device
            Processor->>Track: Insert delivery_status (channel: push, provider: firebase_fcm)
        end

        alt At least one channel succeeded
            Processor->>DB: UPDATE status = "sent", error_message = null
        else All channels failed
            alt attempts >= MAX_ATTEMPTS (default 5)
                Processor->>DLQ: Insert dead letter (reason, failed_channels)
                Processor->>DB: UPDATE status = "failed"
            else Retry
                Processor->>DB: UPDATE status = "pending"<br/>scheduled_for += backoff (5min * 2^attempt, max 60min)
                Processor->>Track: Insert delivery_status (status: retrying)
            end
        end
    end

    Processor-->>Trigger: { processed, sent, failed }
```

**Backoff formula:** `BASE_BACKOFF_MINUTES (5) * 2^(attempt-1)`, capped at `MAX_BACKOFF_MINUTES (60)`.

**Auth:** Accepts cron secret (`x-notification-cron-secret`), service role bearer, or admin bearer token.

---

## 4. Auth Flow

Authentication uses Supabase Auth with email/password login. The Next.js middleware handles session refresh, locale routing (next-intl), protected route guards, and onboarding status checks. The middleware runs on every matched request before the page handler.

**Key files:** `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `src/app/api/_handlers/auth/`

```mermaid
sequenceDiagram
    participant User as User Browser
    participant MW as Next.js Middleware
    participant Intl as next-intl Middleware
    participant Supa as Supabase Auth
    participant DB as Supabase (profiles)
    participant Page as Page Handler

    User->>MW: Request any URL
    MW->>Intl: Handle locale detection (Accept-Language)
    Intl-->>MW: Response (may redirect to add locale prefix)

    alt Locale redirect (307/308)
        MW->>Supa: updateSession(request) to preserve cookies
        MW-->>User: Redirect with session cookies
    else Normal request
        MW->>Supa: updateSession(request)
        Supa-->>MW: { response, user, supabase }

        alt User is authenticated + marketing path (/, /pricing, /about)
            MW-->>User: Redirect to /{locale}/admin
        else No user + protected path (/admin, /trips, /clients, etc.)
            MW-->>User: Redirect to /{locale}/auth?next={path}
        else Authenticated user
            MW->>DB: SELECT organization_id, role, onboarding_step FROM profiles
            alt Profile lookup fails (Supabase outage)
                Note over MW: Fail-open: allow request through<br/>(downstream handlers check auth)
                MW-->>Page: Pass through
            else Onboarding incomplete + protected path
                MW-->>User: Redirect to /{locale}/onboarding?next={path}
            else Onboarding complete + /onboarding path
                MW-->>User: Redirect to ?next param or /{locale}/admin
            else Normal access
                MW-->>Page: Pass through
            end
        end
    end

    Note over User,Page: Login flow specifically
    User->>Page: POST /api/auth/password-login { email, password }
    Page->>Supa: signInWithPassword(email, password)
    Supa-->>Page: JWT + session
    Page-->>User: Set session cookies + redirect
```

**Onboarding completeness rules:**
- `super_admin`: Always complete
- `client` / `driver`: Complete if `organization_id` is set
- `admin`: Complete if `organization_id` set AND `role = "admin"` AND `onboarding_step >= 2`

**Protected prefixes:** `/admin`, `/god`, `/planner`, `/trips`, `/settings`, `/proposals`, `/reputation`, `/social`, `/support`, `/clients`, `/drivers`, `/inbox`, `/add-ons`, `/analytics`, `/calendar`

---

## 5. Trip Lifecycle

A trip progresses through multiple stages from lead capture to final payment. This diagram represents the logical business flow coordinated across multiple handlers and database tables.

**Key tables:** `leads`, `proposals`, `trips`, `invoices`, `driver_locations`, `notification_queue`

```mermaid
sequenceDiagram
    participant Source as Lead Source<br/>(CRM / WhatsApp / Manual)
    participant Admin as Tour Operator (Admin)
    participant DB as Supabase
    participant Client as Client
    participant AI as AI Assistant
    participant Driver as Driver
    participant Pay as Payment System

    Source->>DB: Lead captured (leads table)
    DB->>DB: trackFunnelEvent("lead_created")
    Admin->>AI: "Create proposal for [client]"
    AI->>DB: Insert proposal (status: draft)

    Admin->>Admin: Customize itinerary, pricing, activities
    Admin->>DB: Update proposal (status: sent)
    DB->>Client: Notification (WhatsApp / Email)

    Client->>DB: Review proposal at /proposals/{id}/view
    alt Client approves
        Client->>DB: Update proposal (status: approved)
        DB->>DB: trackFunnelEvent("proposal_accepted")
        Admin->>DB: Convert proposal to trip (status: confirmed)
        DB->>DB: Create trip with itinerary, activities
    else Client requests changes
        Client->>Admin: Feedback (WhatsApp / Portal)
        Admin->>DB: Revise proposal
    end

    Admin->>DB: Assign driver to trip
    DB->>Driver: Notification (trip assignment)

    Note over Driver,DB: Trip in progress

    Driver->>DB: Share location via WhatsApp
    DB->>DB: Insert driver_locations (lat, lng)
    DB->>Client: Live tracking link (trip_location_shares)

    Note over Admin,DB: Trip completion

    Admin->>DB: Update trip (status: completed)
    Admin->>Pay: Generate invoice (createInvoice)
    Pay->>DB: Insert invoice (status: issued)
    Pay->>Client: Payment link (via WhatsApp / Email)
    Client->>Pay: Pay via Razorpay
    Pay->>DB: Update invoice (status: paid)
    DB->>DB: trackFunnelEvent("payment_completed")
```

---

## 6. AI Assistant Flow

The orchestrator is the core of the AI assistant. It uses OpenAI's function-calling API with registered tool schemas, supports multi-round tool execution (max 3 rounds), and includes caching, usage metering, and confidence routing.

**Key files:** `src/lib/assistant/orchestrator.ts`, `src/lib/assistant/context-engine.ts`, `src/lib/assistant/actions/registry.ts`, `src/lib/assistant/model-router.ts`, `src/lib/assistant/direct-executor.ts`

```mermaid
sequenceDiagram
    participant User as User (Web / WhatsApp)
    participant Orch as Orchestrator
    participant Usage as Usage Meter
    participant Direct as Direct Executor
    participant WF as Workflow Engine
    participant Cache as Response Cache
    participant Ctx as Context Engine
    participant OAI as OpenAI API
    participant Actions as Action Registry
    participant DB as Supabase
    participant Audit as Audit Logger

    User->>Orch: handleMessage({ message, history, channel, orgId })
    Orch->>Orch: Validate input (trim, non-empty)
    Orch->>Usage: checkUsageAllowed(org)
    Usage-->>Orch: { allowed, used, limit, tier }

    alt Usage exceeded
        Orch-->>User: "You've used X of Y messages this month"
    end

    Orch->>Direct: tryDirectExecution(message, ctx)
    Note over Direct: Pattern-matching for common queries<br/>(zero LLM cost)
    alt Direct match
        Orch->>Usage: incrementUsage(isDirectExecution: true)
        Orch-->>User: Direct response
    end

    Orch->>Orch: Confidence routing (word count + category check)
    alt Vague query (<=5 words, no specific category)
        Orch-->>User: Disambiguation + suggested actions
    end

    Orch->>WF: Check active workflow / trigger new
    alt Active or triggered workflow
        Orch-->>User: Workflow step response
    end

    Orch->>Cache: getCachedResponse(orgId, message)
    Orch->>Cache: getSemanticCachedResponse (fuzzy match)
    alt Cache hit
        Orch-->>User: Cached response
    end

    Orch->>Orch: selectModel(message, tier)
    par Parallel enrichment
        Orch->>Ctx: getCachedContextSnapshot(ctx)
        Note over Ctx: Today's trips, pending invoices,<br/>recent clients, failed notifications
        Orch->>DB: getOrganizationName
        Orch->>Orch: buildPreferencesBlock + getPreference("language")
        Orch->>DB: getRecentMemory (conversation_memory)
    end

    Orch->>Orch: buildSystemPrompt(orgName, snapshot, language)
    Orch->>Orch: getRelevantSchemas(message) -- smart schema routing

    loop Max 3 tool-call rounds
        Orch->>OAI: POST /v1/chat/completions (model, messages, tools)
        OAI-->>Orch: Response with tool_calls or text

        alt No tool calls (final text)
            alt Short/empty reply
                Orch->>Orch: FAQ fallback (JSONL keyword search)
                Orch->>OAI: Re-query with FAQ context
            end
            Orch->>Cache: setCachedResponse + setSemanticCachedResponse
            Orch->>Usage: incrementUsage
            Orch-->>User: { reply, suggestedActions? }
        else Has tool calls
            loop Each tool call
                Orch->>Orch: Check blocklist (isActionBlocked)
                Orch->>Actions: findAction(name)
                alt Write action (requiresConfirmation)
                    Orch->>Audit: logAuditEvent("action_proposed")
                    Orch-->>User: { reply, actionProposal }
                else Read action
                    Orch->>Actions: action.execute(ctx, params)
                    Orch->>Audit: logAuditEvent("action_executed")
                    alt Write action completed
                        Orch->>Cache: invalidateOrgCache
                    end
                end
            end
        end
    end
```

**Models used:** Selected by `model-router.ts` based on query complexity and org tier. FAQ fallback uses `gpt-4o-mini`. Main model is determined per-query.

**Context snapshot (5-min cache):** Today's trips, pending invoices, recently active clients (7 days), failed notifications.

---

## 7. Onboarding Flow

New user signup triggers a Supabase database trigger (`handle_new_user()`) that creates a profile. The middleware then redirects to the onboarding wizard, which is a multi-step form collecting profile and organization data.

**Key files:** `src/middleware.ts`, `src/app/(auth)/onboarding/`

```mermaid
sequenceDiagram
    participant User as New User
    participant Auth as /auth Page
    participant Supa as Supabase Auth
    participant DB as Supabase (PostgreSQL)
    participant MW as Next.js Middleware
    participant Onboard as /onboarding Page
    participant PostHog as PostHog Analytics

    User->>Auth: Sign up (email + password)
    Auth->>Supa: signUp(email, password)
    Supa->>Supa: Create auth.users row
    Supa->>DB: handle_new_user() trigger fires
    DB->>DB: INSERT profiles (id, role=null, onboarding_step=null)
    Supa-->>Auth: Session + JWT
    Auth-->>User: Set cookies, redirect to /admin

    User->>MW: GET /admin
    MW->>Supa: updateSession (refresh cookies)
    MW->>DB: SELECT organization_id, role, onboarding_step FROM profiles
    Note over MW: onboarding_step < 2 and no org_id<br/>= incomplete onboarding
    MW-->>User: Redirect to /onboarding?next=/admin

    User->>Onboard: Step 1: Profile Details
    Note over Onboard: Full name, phone, business type
    Onboard->>DB: UPDATE profiles (full_name, phone, role="admin")
    Onboard->>PostHog: capture("step_completed", step=1)

    User->>Onboard: Step 2: Organization Setup
    Note over Onboard: Company name, GST, address, logo
    Onboard->>DB: INSERT organizations
    Onboard->>DB: UPDATE profiles (organization_id, onboarding_step=2)
    Onboard->>PostHog: capture("step_completed", step=2)

    User->>Onboard: Step 3: Feature Tour / Sample Data
    Note over Onboard: Interactive walkthrough, optional sample data
    Onboard->>PostHog: capture("wizard_completed")
    Onboard->>DB: UPDATE profiles (onboarding_step=3)

    User->>MW: GET /admin (or ?next target)
    MW->>DB: SELECT onboarding_step (now >= 2)
    Note over MW: Onboarding complete
    MW-->>User: Pass through to /admin dashboard

    Note over User: If user visits /onboarding after completion
    User->>MW: GET /onboarding
    MW->>DB: Check onboarding status
    MW-->>User: Redirect to /admin (or ?next param)
```

**Onboarding status checks by role:**
- `super_admin`: Always considered complete (bypass)
- `client` / `driver`: Complete when `organization_id` is present (created by admins, never self-onboard)
- `admin`: Complete when `organization_id` is set AND `onboarding_step >= 2`
