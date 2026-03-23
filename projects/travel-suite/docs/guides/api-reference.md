# TripBuilt API Reference

Base URL: `https://tripbuilt.com/api`

All API routes are served through catch-all dispatchers with built-in rate limiting, CSRF protection, and consistent error handling.

---

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [CSRF Protection](#csrf-protection)
- [Public API](#public-api-api)
- [Admin API](#admin-api-apiadmin)
- [Assistant API](#assistant-api-apiassistant)
- [Social API](#social-api-apisocial)
- [Reputation API](#reputation-api-apireputation)
- [Superadmin API](#superadmin-api-apisuperadmin)

---

## Authentication

TripBuilt uses four authentication modes depending on the endpoint:

### 1. None (Public)

No authentication required. Used for public-facing pages (portal tokens, widget embeds, NPS forms, webhooks).

### 2. Bearer Token (Session)

Most endpoints authenticate via Supabase Auth. The browser session cookie is used automatically for same-origin requests. For programmatic access, pass the Supabase access token:

```
Authorization: Bearer <supabase-access-token>
```

The server calls `supabase.auth.getUser()` to verify the token and extract the user identity.

### 3. Admin (requireAdmin)

Admin endpoints call `requireAdmin(request)` which:
1. Verifies the bearer token / session cookie via Supabase Auth
2. Looks up the user's profile to confirm `role` is `admin` or `super_admin`
3. Extracts `organization_id` for data scoping
4. Checks for maintenance mode and org suspension

Returns `401` if unauthenticated, `403` if the role is insufficient.

### 4. Super Admin (requireSuperAdmin)

Super admin endpoints call `requireSuperAdmin(request)` which wraps `requireAdmin` and additionally asserts `isSuperAdmin === true` (profile role is `super_admin`).

### 5. Cron Secret

Cron endpoints authenticate via the `authorizeCronRequest()` helper which supports:
- **Header-based**: `x-cron-secret` or `x-notification-cron-secret` header matching `CRON_SECRET` or `NOTIFICATION_CRON_SECRET` env vars
- **Bearer-based**: `Authorization: Bearer <CRON_SECRET>`
- **HMAC signature**: Signed request body with replay detection

Returns `401` / `403` on failure.

### 6. Webhook Signature

Payment and WhatsApp webhook endpoints verify the request signature using the provider's signing secret (e.g., Razorpay webhook signature verification).

---

## Response Format

All endpoints use a consistent JSON envelope:

### Success Response

```json
{
  "data": { ... },
  "error": null
}
```

### Error Response

```json
{
  "data": null,
  "error": "Human-readable error message",
  "code": "OPTIONAL_ERROR_CODE"
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "error": null,
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

### Response Headers

| Header | Description |
|--------|-------------|
| `x-request-id` | Unique request identifier for tracing |
| `x-ratelimit-limit` | Maximum requests allowed in window |
| `x-ratelimit-reset` | Unix timestamp when the rate limit resets |
| `retry-after` | Seconds to wait before retrying (on 429) |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `400` | Bad Request -- invalid input, malformed JSON, or validation failure |
| `401` | Unauthorized -- missing or invalid authentication |
| `403` | Forbidden -- authenticated but insufficient permissions, or CSRF validation failed |
| `404` | Not Found -- endpoint or resource does not exist |
| `405` | Method Not Allowed -- HTTP method not supported for this endpoint |
| `429` | Too Many Requests -- rate limit exceeded |
| `500` | Internal Server Error -- unhandled server error |

---

## Rate Limiting

Rate limits are enforced per IP address using Upstash Redis (sliding window). Each namespace has its own rate limit configuration:

| Namespace | Limit | Window | Prefix |
|-----------|-------|--------|--------|
| Public (`/api/*`) | 200 req | 5 minutes | `api:main` |
| Admin (`/api/admin/*`) | 300 req | 5 minutes | `api:admin:dispatch` |
| Assistant (`/api/assistant/*`) | 100 req | 5 minutes | `api:assistant` |
| Social (`/api/social/*`) | 150 req | 5 minutes | `api:social` |
| Reputation (`/api/reputation/*`) | 200 req | 5 minutes | `api:reputation` |
| Superadmin (`/api/superadmin/*`) | 100 req | 5 minutes | `api:superadmin:dispatch` |

Some individual endpoints apply stricter per-endpoint rate limits (e.g., login: 8 req / 10 min, NPS submit: 10 req / 1 min).

**Behavior when Redis is unavailable:**
- **Production**: Fail-closed (requests rejected with 429) unless `RATE_LIMIT_FAIL_OPEN=true`
- **Development**: Falls back to in-memory rate limiting

When rate limited, the response includes:
```
HTTP/1.1 429 Too Many Requests
retry-after: 45
x-ratelimit-limit: 200
x-ratelimit-reset: 1711234567890
```

---

## CSRF Protection

All mutation requests (POST, PATCH, PUT, DELETE) are subject to CSRF validation via the catch-all dispatcher, except for exempt routes:
- `cron/*` endpoints
- `auth/password-login`
- `payments/webhook`
- `whatsapp/webhook`
- `webhooks/*`

CSRF validation passes if any of these conditions are met:
1. **Bearer token present**: Requests with `Authorization: Bearer ...` are exempt (API clients)
2. **CSRF token header**: If `ADMIN_MUTATION_CSRF_TOKEN` is configured, the request must include a matching `x-admin-csrf` header (timing-safe comparison)
3. **Same-origin check**: Falls back to verifying `Origin` / `Referer` headers match the request host

---

## Public API (`/api/*`)

**Rate Limit**: 200 requests / 5 minutes

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/password-login` | None | Email/password login. Body: `{ email, password }`. Returns session tokens. Rate limited to 8 req / 10 min per IP. |

### AI

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/draft-review-response` | Bearer | AI-draft a response to a customer review |
| POST | `/api/ai/pricing-feedback` | Bearer | Get AI feedback on trip pricing |
| GET | `/api/ai/pricing-suggestion` | Bearer | Get AI pricing suggestions for a trip |
| POST | `/api/ai/suggest-reply` | Bearer | AI-suggest a reply to a WhatsApp message |

### Add-Ons

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/add-ons` | Bearer | List all add-ons for the organization |
| POST | `/api/add-ons` | Bearer | Create a new add-on |
| GET | `/api/add-ons/stats` | Bearer | Get add-on usage statistics |
| GET | `/api/add-ons/:id` | Bearer | Get a single add-on by ID |
| PUT | `/api/add-ons/:id` | Bearer | Replace an add-on |
| PATCH | `/api/add-ons/:id` | Bearer | Partially update an add-on |
| DELETE | `/api/add-ons/:id` | Bearer | Delete an add-on |

### Availability

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/availability` | Bearer | List availability slots |
| POST | `/api/availability` | Bearer | Create an availability slot |
| DELETE | `/api/availability` | Bearer | Delete an availability slot |

### Billing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/billing/contact-sales` | Bearer | Submit a contact-sales request |
| GET | `/api/billing/invoices` | Bearer | List billing invoices |
| GET | `/api/billing/subscription` | Bearer | Get current subscription details |

### Bookings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/bookings/flights/search` | Bearer | Search flights |
| GET | `/api/bookings/hotels/search` | Bearer | Search hotels |
| GET | `/api/bookings/locations/search` | Bearer | Search booking locations |
| GET | `/api/bookings/:id/invoice` | Bearer | Get invoice for a booking |

### Calendar

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/calendar/events` | Bearer | List calendar events |

### Cron Jobs

All cron endpoints require cron-secret authentication.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cron/assistant-alerts` | Cron Secret | Trigger proactive assistant alerts |
| POST | `/api/cron/assistant-briefing` | Cron Secret | Generate daily assistant briefing |
| POST | `/api/cron/assistant-digest` | Cron Secret | Generate assistant digest |
| POST | `/api/cron/automation-processor` | Cron Secret | Process automation rules |
| POST | `/api/cron/operator-scorecards` | Cron Secret | Generate operator scorecards |
| POST | `/api/cron/reputation-campaigns` | Cron Secret | Process reputation review campaigns |
| POST | `/api/cron/social-publish-queue` | Cron Secret | Publish scheduled social media posts |
| POST | `/api/cron/social-sync-metrics` | Cron Secret | Sync social media engagement metrics |

### Currency

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/currency` | Bearer | Get exchange rates. Query: `?from=USD&to=INR` |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/schedule` | Bearer | Get dashboard schedule view |
| GET | `/api/dashboard/tasks` | Bearer | Get actionable dashboard tasks |
| POST | `/api/dashboard/tasks/dismiss` | Bearer | Dismiss a dashboard task |

### Drivers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/drivers/search` | Bearer | Search available drivers |

### Emails

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/emails/welcome` | Bearer | Send welcome email |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None / Diagnostics Token | System health check. Returns status of Supabase, Redis, and external services. Detailed diagnostics require a diagnostics token. |

### Images

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/images` | Bearer | Search images across providers |
| GET | `/api/images/pexels` | Bearer | Search Pexels images |
| GET | `/api/images/pixabay` | Bearer | Search Pixabay images |
| GET | `/api/images/unsplash` | Bearer | Search Unsplash images |

### Integrations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/integrations/places` | Bearer | Search Google Places |
| POST | `/api/integrations/places` | Bearer | Get place details |
| GET | `/api/integrations/tripadvisor` | Bearer | Search TripAdvisor |
| POST | `/api/integrations/tripadvisor` | Bearer | Get TripAdvisor details |

### Invoices

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/invoices` | Bearer | List invoices |
| POST | `/api/invoices` | Bearer | Create an invoice |
| GET | `/api/invoices/:id` | Bearer | Get invoice by ID |
| PUT | `/api/invoices/:id` | Bearer | Update an invoice |
| DELETE | `/api/invoices/:id` | Bearer | Delete an invoice |
| POST | `/api/invoices/:id/pay` | Bearer | Record a payment against an invoice |
| POST | `/api/invoices/send-pdf` | Bearer | Send invoice PDF via email/WhatsApp |

### Itineraries

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/itineraries` | Bearer | List itineraries |
| GET | `/api/itineraries/:id` | Bearer | Get itinerary by ID |
| PATCH | `/api/itineraries/:id` | Bearer | Update an itinerary |
| GET | `/api/itineraries/:id/bookings` | Bearer | List bookings for an itinerary |
| POST | `/api/itineraries/:id/bookings` | Bearer | Add a booking to an itinerary |
| POST | `/api/itineraries/:id/feedback` | Bearer | Submit feedback for an itinerary |

### Itinerary Generation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/itinerary/generate` | Bearer | AI-generate an itinerary |
| POST | `/api/itinerary/import/pdf` | Bearer | Import itinerary from PDF |
| POST | `/api/itinerary/import/url` | Bearer | Import itinerary from URL |
| POST | `/api/itinerary/share` | Bearer | Create a shareable itinerary link |

### Leads

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/leads/convert` | Bearer | Convert a lead to a trip/client |

### Location Tracking

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/location/cleanup-expired` | Bearer | Clean up expired location shares |
| GET | `/api/location/client-share` | Bearer | Get client location share status |
| POST | `/api/location/client-share` | Bearer | Create/update client location share |
| GET | `/api/location/live/:token` | None | Get live location by share token (public) |
| POST | `/api/location/ping` | Bearer | Update driver GPS location |
| GET | `/api/location/share` | Bearer | List location shares |
| POST | `/api/location/share` | Bearer | Create a location share |
| DELETE | `/api/location/share` | Bearer | Delete a location share |

### Marketplace

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/marketplace` | Bearer | List marketplace listings |
| PATCH | `/api/marketplace` | Bearer | Update own marketplace listing |
| GET | `/api/marketplace/options` | Bearer | Get marketplace filter options |
| GET | `/api/marketplace/stats` | Bearer | Get marketplace statistics |
| GET | `/api/marketplace/inquiries` | Bearer | List received inquiries |
| PATCH | `/api/marketplace/inquiries` | Bearer | Update inquiry status |
| GET | `/api/marketplace/listing-subscription` | Bearer | Get listing subscription status |
| POST | `/api/marketplace/listing-subscription` | Bearer | Create listing subscription |
| PATCH | `/api/marketplace/listing-subscription` | Bearer | Update listing subscription |
| POST | `/api/marketplace/listing-subscription/verify` | Bearer | Verify listing subscription payment |
| POST | `/api/marketplace/:id/inquiry` | Bearer | Submit an inquiry to a listing |
| GET | `/api/marketplace/:id/reviews` | Bearer | Get reviews for a listing |
| POST | `/api/marketplace/:id/reviews` | Bearer | Submit a review for a listing |
| POST | `/api/marketplace/:id/view` | Bearer | Record a listing view |

### Navigation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/nav/counts` | Bearer | Get navigation badge counts (trips, leads, messages, etc.) |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/notifications/client-landed` | Bearer | Notify that a client has landed |
| GET | `/api/notifications/process-queue` | Bearer | Get notification queue status |
| POST | `/api/notifications/process-queue` | Bearer | Process pending notification queue |
| GET | `/api/notifications/retry-failed` | Bearer | Get failed notification count |
| POST | `/api/notifications/retry-failed` | Bearer | Retry failed notifications |
| GET | `/api/notifications/schedule-followups` | Bearer | Get scheduled follow-ups |
| POST | `/api/notifications/schedule-followups` | Bearer | Schedule follow-up notifications |
| POST | `/api/notifications/send` | Bearer | Send a notification |

### Onboarding

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/onboarding/first-value` | Bearer | Check first-value milestone status |
| POST | `/api/onboarding/load-sample-data` | Bearer | Load sample data for new accounts |
| GET | `/api/onboarding/setup` | Bearer | Get onboarding setup progress |
| POST | `/api/onboarding/setup` | Bearer | Save onboarding setup step |

### Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/create-order` | Bearer | Create a Razorpay payment order |
| POST | `/api/payments/links` | Bearer | Create a payment link |
| GET | `/api/payments/links/:token` | None | Get payment link details (public) |
| POST | `/api/payments/links/:token` | None | Process payment via link (public) |
| GET | `/api/payments/razorpay` | Bearer | Get Razorpay account info |
| POST | `/api/payments/razorpay` | Bearer | Configure Razorpay integration |
| GET | `/api/payments/track/:token` | None | Track payment status (public) |
| POST | `/api/payments/track/:token` | None | Update payment tracking (public) |
| POST | `/api/payments/verify` | Bearer | Verify a Razorpay payment signature |
| POST | `/api/payments/webhook` | Webhook Signature | Razorpay webhook handler (CSRF exempt) |

### Portal

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/portal/:token` | None | Get client portal data by share token (public, rate limited) |

### Proposals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/proposals/create` | Bearer | Create a new proposal |
| POST | `/api/proposals/bulk` | Bearer | Bulk operations on proposals |
| POST | `/api/proposals/send-pdf` | Bearer | Send proposal PDF via email/WhatsApp |
| GET | `/api/proposals/:id/pdf` | Bearer | Generate proposal PDF |
| POST | `/api/proposals/:id/convert` | Bearer | Convert proposal to a trip |
| POST | `/api/proposals/:id/send` | Bearer | Send proposal to client |
| GET | `/api/proposals/public/:token` | None | Get public proposal by token (public, rate limited) |
| POST | `/api/proposals/public/:token` | None | Client actions on public proposal (approve, reject, comment) |

### Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/settings/e-invoicing` | Bearer | Get e-invoicing configuration |
| POST | `/api/settings/e-invoicing` | Bearer | Update e-invoicing configuration |
| GET | `/api/settings/integrations` | Bearer | Get integration settings |
| GET | `/api/settings/marketplace` | Bearer | Get marketplace profile settings |
| GET | `/api/settings/team` | Bearer | List team members |
| POST | `/api/settings/team` | Bearer | Create team settings |
| POST | `/api/settings/team/invite` | Bearer | Invite a team member |
| PATCH | `/api/settings/team/:id` | Bearer | Update team member |
| DELETE | `/api/settings/team/:id` | Bearer | Remove team member |
| POST | `/api/settings/team/:id/resend` | Bearer | Resend team invitation |
| GET | `/api/settings/upi` | Bearer | Get UPI payment configuration |
| POST | `/api/settings/upi` | Bearer | Update UPI payment configuration |

### Share

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/share/:token` | None | Get shared itinerary by token (public, rate limited) |
| POST | `/api/share/:token` | None | Client actions on shared itinerary (comment, approve, save preferences) |

### Subscriptions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/subscriptions` | Bearer | Get current subscription |
| POST | `/api/subscriptions` | Bearer | Create/upgrade subscription |
| GET | `/api/subscriptions/limits` | Bearer | Get plan usage limits |
| POST | `/api/subscriptions/cancel` | Bearer | Cancel subscription |
| POST | `/api/subscriptions/downgrade` | Bearer | Downgrade subscription |

### Support

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/support` | Bearer | Get support ticket status |
| POST | `/api/support` | Bearer | Submit a support ticket |

### Trips

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips` | Bearer | List trips with search/filter/pagination |
| GET | `/api/trips/:id` | Bearer | Get trip details |
| DELETE | `/api/trips/:id` | Bearer | Delete a trip |
| GET | `/api/trips/:id/add-ons` | Bearer | Get trip add-ons |
| PATCH | `/api/trips/:id/add-ons` | Bearer | Update trip add-ons |
| POST | `/api/trips/:id/clone` | Bearer | Clone a trip |
| GET | `/api/trips/:id/invoices` | Bearer | List invoices for a trip |
| GET | `/api/trips/:id/notifications` | Bearer | Get trip notification history |

### Unsplash

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/unsplash` | Bearer | Search Unsplash images (legacy endpoint) |

### Weather

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/weather` | Bearer | Get weather forecast. Query: `?lat=...&lng=...` |

### WhatsApp

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/whatsapp/conversations` | Bearer | List WhatsApp conversations |
| POST | `/api/whatsapp/extract-trip-intent` | Bearer | AI-extract trip intent from a WhatsApp message |
| GET | `/api/whatsapp/proposal-drafts/:id` | Bearer | Get auto-generated proposal draft from WhatsApp lead |
| POST | `/api/whatsapp/proposal-drafts/:id` | Bearer | Update/confirm proposal draft |
| POST | `/api/whatsapp/connect` | Bearer | Connect WhatsApp account |
| POST | `/api/whatsapp/disconnect` | Bearer | Disconnect WhatsApp account |
| GET | `/api/whatsapp/broadcast` | Bearer | List WhatsApp broadcasts |
| POST | `/api/whatsapp/broadcast` | Bearer | Send a WhatsApp broadcast |
| PATCH | `/api/whatsapp/chatbot-sessions/:id` | Bearer | Update chatbot session (e.g., hand off to human) |
| GET | `/api/whatsapp/health` | Bearer | Check WhatsApp connection health |
| GET | `/api/whatsapp/qr` | Bearer | Get WhatsApp QR code for WPPConnect pairing |
| POST | `/api/whatsapp/send` | Bearer | Send a WhatsApp message |
| GET | `/api/whatsapp/status` | Bearer | Get WhatsApp connection status |
| POST | `/api/whatsapp/test-message` | Bearer | Send a test WhatsApp message |
| GET | `/api/whatsapp/webhook` | None | WhatsApp webhook verification (Meta challenge) |
| POST | `/api/whatsapp/webhook` | Webhook Signature | WhatsApp incoming message webhook (CSRF exempt) |

### Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/whatsapp` | Webhook Signature | Alias for WhatsApp webhook |
| POST | `/api/webhooks/waha` | Webhook Signature | WAHA (WhatsApp HTTP API) webhook handler |

### Debug (Non-Production Only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/debug` | Bearer | Debug endpoint (development only) |
| GET | `/api/test-geocoding` | Bearer | Test geocoding integration (development only) |

---

## Admin API (`/api/admin/*`)

**Rate Limit**: 300 requests / 5 minutes
**Auth**: All endpoints require `requireAdmin()` -- the user must have `admin` or `super_admin` role.

### Activity

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/activity` | Admin | Get organization activity audit trail |

### Automation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/automation/rules` | Admin | List automation rules |
| POST | `/api/admin/automation/toggle` | Admin | Toggle an automation rule on/off |

### Cache

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/cache-metrics` | Admin | Get cache performance metrics |
| GET | `/api/admin/clear-cache` | Admin | Get cache status |
| POST | `/api/admin/clear-cache` | Admin | Clear application cache |

### Clients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/clients` | Admin | List clients with search/pagination |
| POST | `/api/admin/clients` | Admin | Create a new client |
| PATCH | `/api/admin/clients` | Admin | Update client details |
| DELETE | `/api/admin/clients` | Admin | Delete a client |

### Contacts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/contacts` | Admin | List contacts with search/filter |
| POST | `/api/admin/contacts` | Admin | Create a new contact |
| POST | `/api/admin/contacts/:id/promote` | Admin | Promote a contact to a client |

### Cost Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/cost/overview` | Admin | Get cost overview dashboard |
| POST | `/api/admin/cost/overview` | Admin | Update cost configuration |
| POST | `/api/admin/cost/alerts/ack` | Admin | Acknowledge a cost alert |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/dashboard/stats` | Admin | Get dashboard statistics (revenue, trips, etc.) |

### Destinations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/destinations` | Admin | List destinations with stats |

### Funnel Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/funnel` | Admin | Get sales funnel analytics |

### Embeddings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/generate-embeddings` | Admin | Get embedding generation status |
| POST | `/api/admin/generate-embeddings` | Admin | Trigger embedding generation for AI features |

### Geocoding

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/geocoding/usage` | Admin | Get geocoding API usage stats |

### Insights (AI-Powered)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/insights/action-queue` | Admin | Get pending AI-recommended actions |
| GET | `/api/admin/insights/ai-usage` | Admin | Get AI feature usage analytics |
| GET | `/api/admin/insights/auto-requote` | Admin | Get auto-requote suggestions |
| GET | `/api/admin/insights/batch-jobs` | Admin | List AI batch jobs |
| POST | `/api/admin/insights/batch-jobs` | Admin | Trigger an AI batch job |
| POST | `/api/admin/insights/best-quote` | Admin | Get AI best-quote recommendation |
| GET | `/api/admin/insights/daily-brief` | Admin | Get AI daily business brief |
| GET | `/api/admin/insights/margin-leak` | Admin | Get margin leak analysis |
| GET | `/api/admin/insights/ops-copilot` | Admin | Get operations copilot suggestions |
| GET | `/api/admin/insights/proposal-risk` | Admin | Get proposal risk assessment |
| GET | `/api/admin/insights/roi` | Admin | Get ROI analytics |
| GET | `/api/admin/insights/smart-upsell-timing` | Admin | Get smart upsell timing suggestions |
| GET | `/api/admin/insights/upsell-recommendations` | Admin | Get AI upsell recommendations |
| GET | `/api/admin/insights/win-loss` | Admin | Get win/loss analysis |

### Leads

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/leads` | Admin | List leads with search/filter |
| POST | `/api/admin/leads` | Admin | Create a new lead |
| GET | `/api/admin/leads/:id` | Admin | Get lead details |
| PATCH | `/api/admin/leads/:id` | Admin | Update a lead |

### Logo

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/logo` | Admin | Upload organization logo |

### LTV

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/ltv` | Admin | Get customer lifetime value analytics |

### Marketplace Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/marketplace/verify` | Admin | Get marketplace verification status |
| POST | `/api/admin/marketplace/verify` | Admin | Submit marketplace verification request |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/notifications/delivery` | Admin | Get notification delivery log |
| POST | `/api/admin/notifications/delivery/retry` | Admin | Retry a failed notification delivery |

### Operations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/operations/command-center` | Admin | Get operations command center data |

### PDF Imports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/pdf-imports` | Admin | List PDF imports |
| POST | `/api/admin/pdf-imports/upload` | Admin | Upload a PDF for import |
| GET | `/api/admin/pdf-imports/:id` | Admin | Get PDF import details |
| PATCH | `/api/admin/pdf-imports/:id` | Admin | Update PDF import (confirm/edit extracted data) |
| DELETE | `/api/admin/pdf-imports/:id` | Admin | Delete a PDF import |

### Pricing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/pricing/dashboard` | Admin | Get pricing dashboard overview |
| GET | `/api/admin/pricing/trips` | Admin | List trips with pricing data |
| GET | `/api/admin/pricing/trip-costs` | Admin | List trip cost entries |
| POST | `/api/admin/pricing/trip-costs` | Admin | Create a trip cost entry |
| GET | `/api/admin/pricing/trip-costs/:id` | Admin | Get trip cost details |
| PATCH | `/api/admin/pricing/trip-costs/:id` | Admin | Update a trip cost entry |
| DELETE | `/api/admin/pricing/trip-costs/:id` | Admin | Delete a trip cost entry |
| GET | `/api/admin/pricing/overheads` | Admin | List overhead cost entries |
| POST | `/api/admin/pricing/overheads` | Admin | Create an overhead entry |
| GET | `/api/admin/pricing/overheads/:id` | Admin | Get overhead details |
| PATCH | `/api/admin/pricing/overheads/:id` | Admin | Update an overhead entry |
| DELETE | `/api/admin/pricing/overheads/:id` | Admin | Delete an overhead entry |
| GET | `/api/admin/pricing/vendor-history` | Admin | Get vendor pricing history |
| GET | `/api/admin/pricing/transactions` | Admin | List pricing transactions |
| POST | `/api/admin/pricing/receipts/upload` | Admin | Upload a receipt image |
| POST | `/api/admin/pricing/receipts/ocr` | Admin | OCR-extract data from a receipt |
| GET | `/api/admin/pricing/export` | Admin | Export pricing data (CSV/Excel) |

### Proposals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/proposals/:id/payment-plan` | Admin | Get payment plan for a proposal |
| POST | `/api/admin/proposals/:id/payment-plan` | Admin | Create/update payment plan |
| GET | `/api/admin/proposals/:id/tiers` | Admin | Get proposal pricing tiers |
| PATCH | `/api/admin/proposals/:id/tiers` | Admin | Update proposal pricing tiers |

### Referrals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/referrals` | Admin | List referral programs |
| POST | `/api/admin/referrals` | Admin | Create/update a referral program |

### Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/reports/destinations` | Admin | Destination performance report |
| GET | `/api/admin/reports/gst` | Admin | GST report |
| GET | `/api/admin/reports/gstr-1` | Admin | GSTR-1 filing report |
| GET | `/api/admin/reports/operators` | Admin | Operator performance report |

### Reputation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/reputation/client-referrals` | Admin | Get client referral analytics |
| POST | `/api/admin/reputation/client-referrals` | Admin | Send client referral requests |

### Revenue

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/revenue` | Admin | Get revenue analytics |

### Misc Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/repopulate-images` | Admin | Re-populate destination images |
| GET | `/api/admin/scorecards` | Admin | Get operator scorecards |
| GET | `/api/admin/security/diagnostics` | Admin | Get security diagnostics |
| POST | `/api/admin/seed-demo` | Admin | Seed demo data |
| GET | `/api/admin/setup-progress` | Admin | Get setup/onboarding progress |
| POST | `/api/admin/share/send` | Admin | Send a share link via email/WhatsApp |

### Social (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/social/generate` | Admin | AI-generate social media content |

### Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/templates` | Admin | List trip templates |
| POST | `/api/admin/templates` | Admin | Create a trip template |
| GET | `/api/admin/templates/:id` | Admin | Get template details |
| POST | `/api/admin/templates/:id/fork` | Admin | Fork a template into a new trip |

### Tour Templates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/tour-templates/extract` | Admin | AI-extract template from trip data |

### Trips (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/trips` | Admin | List trips with admin filters |
| POST | `/api/admin/trips` | Admin | Create a new trip |
| GET | `/api/admin/trips/:id` | Admin | Get trip details (admin view) |
| POST | `/api/admin/trips/:id/clone` | Admin | Clone a trip (admin) |

### WhatsApp (Admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/whatsapp/health` | Admin | WhatsApp integration health check |
| POST | `/api/admin/whatsapp/normalize-driver-phones` | Admin | Normalize driver phone numbers to E.164 |

### Workflow

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/workflow/events` | Admin | List workflow trigger events |
| GET | `/api/admin/workflow/rules` | Admin | List workflow automation rules |
| POST | `/api/admin/workflow/rules` | Admin | Create/update a workflow rule |

---

## Assistant API (`/api/assistant/*`)

**Rate Limit**: 100 requests / 5 minutes
**Auth**: All endpoints require a valid Supabase session (Bearer token / cookie).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/assistant/chat` | Bearer | Send a message to the AI assistant |
| POST | `/api/assistant/chat/stream` | Bearer | Send a message with streaming response (SSE) |
| POST | `/api/assistant/confirm` | Bearer | Confirm an assistant-suggested action |
| GET | `/api/assistant/conversations` | Bearer | List conversation sessions |
| DELETE | `/api/assistant/conversations` | Bearer | Delete conversation(s) |
| GET | `/api/assistant/conversations/:sessionId` | Bearer | Get conversation history by session |
| POST | `/api/assistant/export` | Bearer | Export conversation history |
| GET | `/api/assistant/quick-prompts` | Bearer | Get suggested quick prompts |
| POST | `/api/assistant/quick-prompts` | Bearer | Save custom quick prompts |
| GET | `/api/assistant/usage` | Bearer | Get AI usage stats for the current user |

---

## Social API (`/api/social/*`)

**Rate Limit**: 150 requests / 5 minutes
**Auth**: All endpoints require a valid Supabase session (Bearer token / cookie).

### Content Generation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/social/ai-image` | Bearer | AI-generate a social media image |
| POST | `/api/social/ai-poster` | Bearer | AI-generate a social media poster |
| POST | `/api/social/captions` | Bearer | AI-generate social media captions |
| POST | `/api/social/smart-poster` | Bearer | AI-generate a smart poster (combined) |
| POST | `/api/social/render-poster` | Bearer | Render a poster image from template |
| POST | `/api/social/extract` | Bearer | Extract content from a URL for social posting |

### Connections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/social/connections` | Bearer | List connected social accounts |
| DELETE | `/api/social/connections/:id` | Bearer | Disconnect a social account |

### OAuth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/social/oauth/facebook` | Bearer | Initiate Facebook OAuth flow |
| GET | `/api/social/oauth/google` | Bearer | Initiate Google Business OAuth flow |
| GET | `/api/social/oauth/linkedin` | Bearer | Initiate LinkedIn OAuth flow |
| GET | `/api/social/oauth/callback` | None | OAuth callback handler (redirect) |
| GET | `/api/social/oauth/status` | Bearer | Check OAuth connection status |

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/social/posts` | Bearer | List social media posts |
| POST | `/api/social/posts` | Bearer | Create a social media post |
| GET | `/api/social/posts/metrics` | Bearer | Get post engagement metrics |
| POST | `/api/social/posts/:id/render` | Bearer | Render a post preview |

### Publishing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/social/publish` | Bearer | Publish a post immediately |
| POST | `/api/social/schedule` | Bearer | Schedule a post for later |
| POST | `/api/social/process-queue` | Bearer | Process the publishing queue |
| GET | `/api/social/calendar` | Bearer | Get social content calendar |
| POST | `/api/social/queue-status` | Bearer | Get publishing queue status |
| POST | `/api/social/queue-retry` | Bearer | Retry failed queue items |
| POST | `/api/social/refresh-tokens` | Bearer | Refresh expired OAuth tokens |

### Reviews (Social)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/social/reviews` | Bearer | List reviews for social sharing |
| POST | `/api/social/reviews` | Bearer | Create a review-based social post |
| POST | `/api/social/reviews/import` | Bearer | Import reviews from platforms |
| POST | `/api/social/reviews/public` | Bearer | Generate public review page |

---

## Reputation API (`/api/reputation/*`)

**Rate Limit**: 200 requests / 5 minutes
**Auth**: Most endpoints require Bearer token. Public-facing endpoints (NPS forms, widgets) use token-based access.

### AI Analysis

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reputation/ai/analyze` | Bearer | AI-analyze a single review (sentiment, topics) |
| POST | `/api/reputation/ai/batch-analyze` | Bearer | AI-analyze reviews in batch |
| POST | `/api/reputation/ai/respond` | Bearer | AI-generate a response to a review |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/analytics/snapshot` | Bearer | Get reputation analytics snapshot |
| POST | `/api/reputation/analytics/snapshot` | Bearer | Generate fresh analytics snapshot |
| GET | `/api/reputation/analytics/topics` | Bearer | Get review topic analysis |
| GET | `/api/reputation/analytics/trends` | Bearer | Get reputation score trends |

### Brand Voice

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/brand-voice` | Bearer | Get brand voice configuration |
| PUT | `/api/reputation/brand-voice` | Bearer | Update brand voice configuration |

### Campaigns

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/campaigns` | Bearer | List review collection campaigns |
| POST | `/api/reputation/campaigns` | Bearer | Create a review collection campaign |
| GET | `/api/reputation/campaigns/:id` | Bearer | Get campaign details |
| PATCH | `/api/reputation/campaigns/:id` | Bearer | Update a campaign |
| DELETE | `/api/reputation/campaigns/:id` | Bearer | Delete a campaign |
| POST | `/api/reputation/campaigns/trigger` | Bearer | Manually trigger a campaign |

### Connections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/connections` | Bearer | List review platform connections |
| POST | `/api/reputation/connections` | Bearer | Connect a review platform |
| DELETE | `/api/reputation/connections` | Bearer | Disconnect a review platform |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/dashboard` | Bearer | Get reputation dashboard overview |

### NPS (Net Promoter Score)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/nps/:token` | None | Get NPS survey by token (public, rate limited) |
| POST | `/api/reputation/nps/submit` | None | Submit NPS response (public, rate limited: 10 req / 1 min) |

### Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/reviews` | Bearer | List reviews with filters |
| POST | `/api/reputation/reviews` | Bearer | Manually add a review |
| GET | `/api/reputation/reviews/:id` | Bearer | Get review details |
| PATCH | `/api/reputation/reviews/:id` | Bearer | Update review (response, status) |
| POST | `/api/reputation/reviews/:id/marketing-asset` | Bearer | Generate marketing asset from review |

### Sync

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reputation/sync` | Bearer | Sync reviews from connected platforms |
| POST | `/api/reputation/process-auto-reviews` | Bearer | Process automatic review requests |

### Widget

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reputation/widget/config` | Bearer | Get review widget configuration |
| POST | `/api/reputation/widget/config` | Bearer | Create widget configuration |
| PUT | `/api/reputation/widget/config` | Bearer | Update widget configuration |
| GET | `/api/reputation/widget/:token` | None | Get widget data by embed token (public, CORS: `*`) |

---

## Superadmin API (`/api/superadmin/*`)

**Rate Limit**: 100 requests / 5 minutes
**Auth**: All endpoints require `requireSuperAdmin()` -- the user must have the `super_admin` role.

### Identity

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/me` | Super Admin | Get current super admin identity and role |
| GET | `/api/superadmin/overview` | Super Admin | Get platform overview (total users, orgs, revenue) |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/users/signups` | Super Admin | Get recent signups |
| GET | `/api/superadmin/users/directory` | Super Admin | Browse user directory |
| GET | `/api/superadmin/users/:id` | Super Admin | Get user details |

### Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/analytics/feature-usage` | Super Admin | Get feature usage analytics |
| GET | `/api/superadmin/analytics/feature-usage/:feature` | Super Admin | Get usage details for a specific feature |

### Cost

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/cost/aggregate` | Super Admin | Get aggregate platform costs |
| GET | `/api/superadmin/cost/trends` | Super Admin | Get cost trends over time |
| GET | `/api/superadmin/cost/org/:orgId` | Super Admin | Get costs for a specific organization |

### Referrals

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/referrals/overview` | Super Admin | Get referral program overview |
| GET | `/api/superadmin/referrals/detail/:type` | Super Admin | Get referral details by type |

### Announcements

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/announcements` | Super Admin | List platform announcements |
| POST | `/api/superadmin/announcements` | Super Admin | Create an announcement |
| PATCH | `/api/superadmin/announcements/:id` | Super Admin | Update an announcement |
| POST | `/api/superadmin/announcements/:id/send` | Super Admin | Send an announcement to users |

### Support

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/support/tickets` | Super Admin | List support tickets (all orgs) |
| GET | `/api/superadmin/support/tickets/:id` | Super Admin | Get ticket details |
| POST | `/api/superadmin/support/tickets/:id/respond` | Super Admin | Respond to a support ticket |

### Settings (Platform)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/settings` | Super Admin | Get platform settings |
| POST | `/api/superadmin/settings/kill-switch` | Super Admin | Toggle platform kill switch (maintenance mode) |
| POST | `/api/superadmin/settings/org-suspend` | Super Admin | Suspend/unsuspend an organization |

### Monitoring

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/monitoring/health` | Super Admin | Get platform health status |
| GET | `/api/superadmin/monitoring/queues` | Super Admin | Get background queue status |

### Audit

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/superadmin/audit-log` | Super Admin | Get platform audit log |
