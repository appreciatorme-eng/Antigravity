# Feature Reference

Product feature inventory for TripBuilt. One section per product area with route, key files, and data model notes.

## Product Areas

### Home / Dashboard (`/`)

KPI dashboard for tour operators. Shows live business metrics.

**KPIs tracked:**
- Revenue (booked value, won value, paid trips)
- Outstanding balance (drill-through to `/analytics/drill-through/outstanding`)
- Bookings today
- Trip pipeline (by status)
- Collections workspace (admin view of payments due)

**Drill-through pages** (`/analytics/drill-through/`):
- `outstanding` — outstanding balance contributors
- `won-value` — won value breakdown
- `booked-value` — booked value contributors

**Key files:**
- `src/app/dashboard/` — schedule + tasks sub-pages
- `src/app/analytics/drill-through/` — drill pages
- `src/app/api/_handlers/dashboard/` — KPI data handlers
- Revenue data: live (no cache) — removed `unstable_cache` Apr 2026

---

### Inbox (`/inbox`)

WhatsApp conversation hub. Dual-mode: Meta Cloud API (primary) or WPPConnect (self-hosted fallback).

**Features:**
- Conversation list with unread badge (bottom nav)
- Broadcast mode (`/inbox?mode=broadcast`) — bulk WhatsApp messages
- Contact name sync from WhatsApp (Mar 2026 migration)

**Key files:**
- `src/app/inbox/`
- `src/lib/whatsapp.server.ts` — Meta Cloud API path
- `src/lib/whatsapp-wppconnect.ts` — WPPConnect path
- `src/app/api/_handlers/whatsapp/`

---

### Planner (`/planner`)

AI-assisted trip itinerary builder.

**Features:**
- Hero date range (optional, auto-fill end date from trip duration — Jan 2026)
- Drag-drop day ordering
- AI itinerary generation (Gemini / OpenAI)
- Map view of stops

**Key files:**
- `src/app/planner/`
- `src/app/admin/planner/` — admin planner view
- `src/app/api/_handlers/itinerary/`
- `src/app/api/_handlers/itineraries/`

---

### Trips (`/trips`)

Trip management — the core operational object.

**Trip lifecycle:** Lead → Quote → Confirmed → Completed → Archived

**Key files:**
- `src/app/trips/`
- `src/app/api/_handlers/trips/`

---

### Clients (`/clients`)

Client CRM. Review badge shown in bottom nav.

**Key files:**
- `src/app/clients/`
- `src/app/api/_handlers/`

---

### Bookings (`/bookings`)

Booking management (flights, hotels, transfers). Separate from trips — a trip has many bookings.

**Key files:**
- `src/app/bookings/`
- `src/app/api/_handlers/bookings/`

---

### Calendar (`/calendar`)

Visual calendar of trips, bookings, and driver schedules.

**Key files:**
- `src/app/calendar/`

---

### Drivers (`/drivers`)

Driver roster and assignment management.

**Key files:**
- `src/app/drivers/`
- `src/app/api/_handlers/drivers/`

---

### Invoices (`/admin/invoices`)

Invoice Studio — create, send, and manage invoices.

**Features:**
- Create / edit invoices
- Delete with hover trash icon + ConfirmDangerModal (Apr 2026)
- Soft-delete columns (Apr 2026 migration)
- E-invoicing (`/admin/e-invoicing`)
- GST Report (`/admin/gst-report`)

**Key files:**
- `src/app/admin/invoices/`
- `src/app/admin/e-invoicing/`
- `src/app/admin/gst-report/`
- `src/app/api/_handlers/invoices/`

---

### Revenue (`/admin/revenue`)

Revenue analytics and reporting.

**Features:**
- Revenue breakdown by trip, client, period
- Collections workspace — who owes what (Apr 2026)
- Commercial payments ledger (Apr 2026 migration: `commercial_payments_ledger`)

**Key files:**
- `src/app/admin/revenue/`
- `supabase/migrations/20260412183000_commercial_payments_ledger.sql`

---

### Pricing & Profit (`/admin/pricing`)

Margin analysis and pricing tools.

**Key files:**
- `src/app/admin/pricing/`
- `src/app/api/_handlers/`

---

### Operations (`/admin/operations`)

Operational overview — trips in progress, driver assignments, task queue.

**Key files:**
- `src/app/admin/operations/`

---

### Add-ons (`/add-ons`)

Upsell add-on packages (insurance, excursions, etc.).

**Key files:**
- `src/app/add-ons/`

---

### Marketplace (`/marketplace`)

Supplier and product marketplace for tour operators.

**Key files:**
- `src/app/marketplace/`

---

### Reputation (`/reputation`)

Review management and reputation scoring.

**Features:**
- Review aggregation
- Response management
- Contributor badges (Mar 2026 migration)
- Operator scorecard (cron-generated)

**Key files:**
- `src/app/reputation/`
- `src/app/api/reputation/[...path]/route.ts`
- `src/app/api/_handlers/reputation/`

---

### Social Studio (`/social`)

Social media content creation for tour operators.

**Features:**
- AI-generated poster images (FAL.ai)
- Meta OAuth for Facebook/Instagram publishing
- Post scheduling

**Key files:**
- `src/app/social/`
- `src/app/api/social/[...path]/route.ts`
- `src/app/api/_handlers/social/`

---

### AI Insights (`/admin/insights`)

AI-generated business insights from trip and revenue data.

**Key files:**
- `src/app/admin/insights/`

---

### Proposals (`/proposals`)

Client-facing trip proposals with PDF export.

**Features:**
- Create / edit proposals
- Share via link (`/p/[token]` — public portal)
- PDF generation (Chromium via `@sparticuz/chromium`)
- Proposal-to-trip link alignment (Apr 2026 migration)

**Key files:**
- `src/app/proposals/`
- `src/app/p/` — public proposal view
- `src/app/api/_handlers/proposals/`

---

### Automation (`/admin/`) *(new — Mar 2026)*

Rule-based automation for trip workflows.

**Schema:** `automation_rules` table (migration: `20260326000000_automation_rules.sql`)

**Key files:**
- `src/app/api/_handlers/automation/`

---

### Settings (`/settings`)

User profile, notification preferences, integrations.

**Key files:**
- `src/app/settings/`
- `src/app/api/_handlers/settings/`

---

### Billing (`/billing`)

Subscription management (Razorpay).

**Key files:**
- `src/app/billing/`
- `src/app/api/_handlers/billing/`
- `src/app/api/_handlers/subscriptions/`

---

### Onboarding (`/onboarding`)

Wizard-style onboarding for new admin users. Triggered when `profiles.onboarding_step = 0`.

**Key files:**
- `src/app/onboarding/`
- `src/app/api/_handlers/onboarding/`

---

### Notifications

In-app notification system with queue processing.

**Features:**
- Notification history (`/`) — bell icon links here
- Notification queue (Supabase table + cron processor)
- Dead-letter queue for failed notifications
- Retry-failed cron job

**Key files:**
- `src/app/admin/notifications/`
- `src/app/api/_handlers/notifications/`

---

### Kanban (`/admin/kanban`)

Drag-drop kanban board for trip pipeline management.

**Key files:**
- `src/app/admin/kanban/`

---

### Performance (`/admin/performance`)

Operator performance metrics.

**Key files:**
- `src/app/admin/performance/`

---

### Support (`/support`)

In-app support / help center.

**Key files:**
- `src/app/support/`

---

## FAB Quick Actions

Available from the `+` button in the mobile bottom nav:

| Action | Route / Event |
|---|---|
| New Trip | `/trips?create=true` |
| Quick Quote | `open-quick-quote` event |
| WA Broadcast | `/inbox?mode=broadcast` |
| New Proposal | `/proposals/create` |

---

## Public / Client-Facing Routes

| Route | Purpose |
|---|---|
| `/p/[token]` | Public proposal viewer |
| `/portal` | Client portal |
| `/pay/[id]` | Payment page |
| `/share/[id]` | Share itinerary |
| `/auth` | Login / magic link |
| `/welcome` | Post-signup welcome |
| `/(marketing)` | Marketing landing pages |
