# Platform Owner "God Mode" — Master Architecture & Implementation Plan

## Context

As the sole developer and SaaS owner, you need a dedicated command center with full visibility and control over every aspect of the platform — user signups, feature usage, API spending, referrals, support, notifications, contacts, and emergency kill switches. This is distinct from the `/admin` panel (for tour operator org admins). This is YOUR control plane.

---

## Architecture Decision: Route Group, Not Separate App

**Recommendation: Route group at `/god` inside the existing web app.**

Why not a separate app:
- This is NOT a proper monorepo (no pnpm workspaces, no turbo) — each app is independent. A separate app means duplicating ALL 84 env vars, all glass components, all Supabase clients, all auth logic.
- Solo developer = less infrastructure to maintain
- Kill switch works at **database + Redis level** — even if the Next.js app crashes, you can toggle maintenance mode directly in Supabase Studio SQL or Upstash Redis console as a fallback
- API handlers at `/api/superadmin/*` are independent — they work even if UI pages have issues

**The arrangement:**
- **UI**: `apps/web/src/app/(superadmin)/god/*` — 12 pages
- **API**: `apps/web/src/app/api/superadmin/[...path]/route.ts` — 21 endpoints
- **Lib**: `apps/web/src/lib/platform/*` — settings, audit, auth helpers
- **Components**: `apps/web/src/components/god-mode/*` — sidebar, KPI cards, charts

---

## Database Migration

**File**: `supabase/migrations/20260312000000_platform_god_mode.sql`

### Table 1: `platform_settings`
```
key              TEXT PRIMARY KEY
value            JSONB NOT NULL DEFAULT '{}'
description      TEXT
updated_by       UUID → profiles(id)
updated_at       TIMESTAMPTZ DEFAULT now()
created_at       TIMESTAMPTZ DEFAULT now()
```

Seed rows:
- `maintenance_mode` → `{ enabled: false, message: "...", allowed_paths: ["/api/health", "/api/superadmin"] }`
- `feature_flags` → `{ ai_enabled: true, marketplace_enabled: true, social_enabled: true, reputation_enabled: true, booking_enabled: true, whatsapp_enabled: true }`
- `spend_limits` → `{ global_daily_cap_usd: 500, pause_all_ai: false }`
- `org_suspensions` → `{ suspended_org_ids: [] }`

### Table 2: `platform_announcements`
```
id                UUID PK DEFAULT gen_random_uuid()
title             TEXT NOT NULL
body              TEXT NOT NULL
announcement_type TEXT CHECK (info, warning, critical, maintenance)
target_segment    TEXT CHECK (all, free, pro, enterprise, specific_orgs)
target_org_ids    UUID[] DEFAULT '{}'
delivery_channels TEXT[] DEFAULT '{in_app}'
status            TEXT CHECK (draft, scheduled, sent, cancelled)
scheduled_at      TIMESTAMPTZ
sent_at           TIMESTAMPTZ
sent_by           UUID → profiles(id)
recipient_count   INTEGER DEFAULT 0
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()
```

### Table 3: `platform_audit_log`
```
id          UUID PK DEFAULT gen_random_uuid()
actor_id    UUID NOT NULL → profiles(id)
action      TEXT NOT NULL
category    TEXT CHECK (kill_switch, org_management, announcement, settings, support, cost_override)
target_type TEXT
target_id   TEXT
details     JSONB DEFAULT '{}'
ip_address  TEXT
created_at  TIMESTAMPTZ DEFAULT now()
```

Indexes: `(created_at DESC)`, `(category, created_at DESC)`

### Alter: `support_tickets`
Add: `admin_response TEXT`, `responded_at TIMESTAMPTZ`, `responded_by UUID → profiles(id)`

### RLS
All 3 new tables: `super_admin` only (via `profiles.role = 'super_admin'` check).

---

## Shared Infrastructure (3 new lib files)

### File 1: `src/lib/auth/require-super-admin.ts`

```typescript
export async function requireSuperAdmin(request): Promise<RequireSuperAdminResult>
```
- Wraps `requireAdmin(req, { requireOrganization: false })`
- Asserts `isSuperAdmin === true`, else 403
- Used by every `/api/superadmin/*` handler

### File 2: `src/lib/platform/settings.ts`

```typescript
export async function getPlatformSetting(key: string): Promise<JsonValue>
export async function setPlatformSetting(key: string, value: JsonValue, actorId: string): Promise<void>
export async function isMaintenanceMode(): Promise<boolean>
export async function isFeatureEnabled(feature: string): Promise<boolean>
export async function isOrgSuspended(orgId: string): Promise<boolean>
```
- Redis first (60s TTL) → falls back to Supabase
- On write: updates DB → invalidates Redis → logs to `platform_audit_log`
- Reuses Redis pattern from `lib/cost/spend-guardrails.ts` (`getRedisClient`)

### File 3: `src/lib/platform/audit.ts`

```typescript
export async function logPlatformAction(
  actorId: string, action: string, category: AuditCategory,
  details?: Record<string, unknown>, ipAddress?: string
): Promise<void>
```

---

## Kill Switch Enforcement

### How it works:
1. Owner toggles kill switch on `/god/kill-switch`
2. API writes to `platform_settings` → invalidates Redis
3. Every `requireAdmin()` call checks `isMaintenanceMode()` via Redis (sub-ms)
4. If maintenance: returns 503 with configured message
5. Exception: `/api/health` + `/api/superadmin/*` always pass through

### Enforcement injection point:
**File to modify**: `src/lib/auth/admin.ts`
- Add `checkPlatformStatus()` call AFTER rate limit check, BEFORE database queries
- If maintenance mode → return 503
- If org suspended → return 403
- If feature disabled → caller-specific (opt-in per endpoint)

### Emergency fallback (if app is completely down):
- **Supabase Studio** → SQL: `UPDATE platform_settings SET value = '{"enabled": true}' WHERE key = 'maintenance_mode'`
- **Upstash Console** → Set key `platform:maintenance_mode` = `{"enabled": true}`

---

## API Endpoints (21 handlers)

### Catch-all: `src/app/api/superadmin/[...path]/route.ts`
Uses `createCatchAllHandlers` from `lib/api-dispatch.ts` (identical pattern to admin catch-all).

### Endpoint Specifications

#### Overview & Users (4 endpoints)

**1. `GET /api/superadmin/overview`**
- **Returns**: total_users, total_orgs, total_trips (all-time + this month), total_proposals, mrr_estimate (from subscriptions), api_spend_today_usd (from Redis cost meters), active_sessions_24h, signup_trend_7d (daily counts for sparkline), cost_trend_7d (daily sums for sparkline)
- **Queries**: `profiles` COUNT, `organizations` COUNT, `trips` COUNT, `subscriptions` WHERE status=active SUM(amount), Redis `cost:daily:*` keys, `profiles` GROUP BY date for last 7 days
- **Drill-through data**: Each KPI includes `href` for navigation (e.g., total_users → `/god/signups`)

**2. `GET /api/superadmin/users/signups`**
- **Query params**: `range` (7d|30d|90d|all), `page`, `limit`
- **Returns**: `{ trend: [{ date, count, orgs_created }], recent: [{ id, full_name, email, role, org_name, org_tier, created_at }], totals: { total_users, total_orgs, users_this_month, orgs_this_month } }`
- **Queries**: `profiles` GROUP BY date_trunc('day', created_at), `profiles` LEFT JOIN `organizations` ORDER BY created_at DESC

**3. `GET /api/superadmin/users/directory`**
- **Query params**: `search`, `role` (all|client|driver|admin), `tier` (all|free|pro|enterprise), `page`, `limit` (default 50)
- **Returns**: `{ users: [{ id, full_name, email, phone, role, avatar_url, org_id, org_name, org_slug, org_tier, created_at, last_sign_in_at }], total, page, pages }`
- **Queries**: `profiles` LEFT JOIN `organizations`, with ILIKE search on name/email/phone
- **Drill-through**: Each user row expandable → shows org details, trip count, proposal count, last activity

**4. `GET /api/superadmin/users/:id`**
- **Returns**: Full profile + org details + trip count + proposal count + payment total + support tickets + referral activity
- **Queries**: `profiles` by id, JOIN organizations, COUNT trips, COUNT proposals, SUM invoice_payments, COUNT support_tickets, COUNT client_referral_events

#### Analytics (2 endpoints)

**5. `GET /api/superadmin/analytics/feature-usage`**
- **Query params**: `range` (7d|30d|90d), `group_by` (day|week|month)
- **Returns**: `{ features: { trips: { total, trend: [...] }, proposals: { total, trend }, ai_sessions: { total, trend }, social_posts: { total, trend }, reputation_campaigns: { total, trend }, templates_used: { total, trend }, bookings_searched: { total, trend } }, top_orgs: [{ org_id, org_name, trip_count, proposal_count, ai_usage }] }`
- **Queries**: COUNT on each feature table GROUP BY date_trunc + organization_id
- **Drill-through**: Click feature bar → filtered view showing which orgs are using that feature

**6. `GET /api/superadmin/analytics/feature-usage/:feature`**
- **Query params**: `range`, `page`, `limit`
- **Returns**: Per-org breakdown for a specific feature (e.g., trips by org, proposals by org)
- Used for drill-through from the aggregate view

#### Cost (3 endpoints)

**7. `GET /api/superadmin/cost/aggregate`**
- **Returns**: `{ today: { amadeus, image_search, ai_image, ai_poster, ai_text, total_usd }, month_to_date: { ... }, by_category: [{ category, today_usd, mtd_usd, cap_usd, utilization_pct }], by_org: [{ org_id, org_name, tier, today_usd, mtd_usd }] }`
- **Data source**: Reuses query logic from `_handlers/admin/cost/overview/route.ts` but WITHOUT org_id filter. Also reads Redis `cost:daily:*` keys for real-time spend
- **Drill-through**: Click category → shows per-org breakdown. Click org → shows per-category breakdown for that org

**8. `GET /api/superadmin/cost/trends`**
- **Query params**: `range` (30d|60d|90d), `category` (all|amadeus|ai_image|...)
- **Returns**: `{ daily: [{ date, amadeus, image_search, ai_image, ai_poster, ai_text, total }] }`
- **Data source**: `organization_ai_usage` grouped by month + Redis daily keys

**9. `GET /api/superadmin/cost/org/:orgId`**
- **Returns**: Detailed cost breakdown for a single org
- Drill-through target from aggregate view

#### Referrals (2 endpoints)

**10. `GET /api/superadmin/referrals/overview`**
- **Returns**: `{ b2b: { total, converted, conversion_pct, top_referrers: [...] }, client_flywheel: { total_events, converted_events, conversion_pct, total_incentives_issued, total_rewards_inr, tds_obligation_inr, recent_events: [...] } }`
- **Queries**: `referrals` + `client_referral_events` + `client_referral_incentives` cross-org

**11. `GET /api/superadmin/referrals/detail/:type`**
- **Query params**: `type` (b2b|client), `page`, `limit`
- **Returns**: Paginated list with full details per referral event
- Drill-through from overview

#### Announcements (4 endpoints)

**12. `GET /api/superadmin/announcements`**
- **Returns**: All announcements, newest first, with recipient_count

**13. `POST /api/superadmin/announcements`**
- **Body**: `{ title, body, announcement_type, target_segment, target_org_ids?, delivery_channels }`
- **Creates**: Draft announcement in `platform_announcements`

**14. `PATCH /api/superadmin/announcements/:id`**
- **Updates**: Draft fields (only if status = 'draft')

**15. `POST /api/superadmin/announcements/:id/send`**
- **Action**: Sets status='sent', iterates target profiles, calls `sendNotificationToUser()` from `lib/notifications.ts` for push delivery, logs to audit
- **Segment filtering**: all → all admin profiles, free/pro/enterprise → admins in orgs with matching tier, specific_orgs → admins in listed org IDs

#### Support (3 endpoints)

**16. `GET /api/superadmin/support/tickets`**
- **Query params**: `status` (all|open|in_progress|resolved|closed), `category`, `priority`, `search`, `page`, `limit`
- **Returns**: `{ tickets: [{ id, title, description, category, priority, status, user_id, user_name, user_email, org_id, org_name, admin_response, responded_at, created_at }], total, open_count, in_progress_count }`
- **Queries**: `support_tickets` JOIN `profiles` JOIN `organizations`

**17. `GET /api/superadmin/support/tickets/:id`**
- **Returns**: Full ticket with user profile, org details, response history

**18. `POST /api/superadmin/support/tickets/:id/respond`**
- **Body**: `{ response, new_status }`
- **Updates**: `support_tickets` SET admin_response, responded_at, responded_by, status
- **Logs**: to `platform_audit_log`

#### Settings & Kill Switch (3 endpoints)

**19. `GET /api/superadmin/settings`**
- **Returns**: All `platform_settings` rows as key-value map

**20. `POST /api/superadmin/settings/kill-switch`**
- **Body**: `{ key: "maintenance_mode"|"feature_flags"|"spend_limits"|"org_suspensions", value: {...} }`
- **Action**: Updates `platform_settings`, invalidates Redis, logs to audit
- **Validation**: Zod schema per key type

**21. `POST /api/superadmin/settings/org-suspend`**
- **Body**: `{ org_id, action: "suspend"|"unsuspend", reason? }`
- **Action**: Adds/removes org_id from `org_suspensions.suspended_org_ids`, invalidates Redis, logs to audit

#### Monitoring (2 endpoints)

**22. `GET /api/superadmin/monitoring/health`**
- **Returns**: Reuses health check functions from `_handlers/health/route.ts` — database, edge functions, FCM, WhatsApp, external APIs, notification pipeline, observability
- **Additionally**: queue depths from `notification_queue` (pending, failed), `notification_dead_letters` count, `social_post_queue` pending count, `pdf_extraction_queue` pending count

**23. `GET /api/superadmin/monitoring/queues`**
- **Returns**: `{ notification_queue: { pending, failed, dead_letters, oldest_pending_minutes }, social_post_queue: { pending }, pdf_queue: { pending }, cron_jobs: { assistant_briefing: { last_run, status }, schedule_followups: { last_run, status } } }`

#### Audit (1 endpoint)

**24. `GET /api/superadmin/audit-log`**
- **Query params**: `category`, `page`, `limit`
- **Returns**: Paginated `platform_audit_log` entries, newest first

---

## UI Pages — Detailed Component Breakdown

### Layout & Navigation

**File: `src/app/(superadmin)/god/layout.tsx`**
- Client-side auth: checks `profiles.role === 'super_admin'` (same pattern as `app/admin/layout.tsx`)
- Dark-themed wrapper with distinct accent (red/amber vs green/blue for admin)
- Renders `GodModeShell` with sidebar + main content area

**File: `src/components/god-mode/GodModeSidebar.tsx`**
- Fixed left sidebar, ~240px wide
- Logo/brand at top: "GOD MODE" with shield icon
- Nav groups with Lucide icons:

```
OVERVIEW
  ◆ Command Center      /god              LayoutDashboard

USERS & ORGS
  ◆ Signups             /god/signups      UserPlus
  ◆ Directory           /god/directory    Users

ANALYTICS
  ◆ Feature Usage       /god/analytics    BarChart3
  ◆ API Costs           /god/costs        DollarSign

GROWTH
  ◆ Referrals           /god/referrals    Share2

OPERATIONS
  ◆ Support Tickets     /god/support      LifeBuoy
  ◆ Announcements       /god/announcements Megaphone

SYSTEM
  ◆ Kill Switch         /god/kill-switch  Power
  ◆ Health Monitor      /god/monitoring   Activity
  ◆ Audit Log           /god/audit-log    ScrollText
```

- Active state: highlighted with accent color
- Bottom: link back to `/admin` ("Back to Admin Panel")

### Page 1: Command Center (`/god/page.tsx`)

**Top row: 6 KPI cards in a responsive grid (3×2 on desktop, 2×3 on tablet, 1×6 on mobile)**

Each card is a `<Link>` wrapped `<GlassCard>` with:
- Icon (colored circle background)
- Metric value (large, bold)
- Label (uppercase, small)
- Trend indicator (% change vs last period, green/red arrow)
- Sparkline (7-day mini chart using Recharts `<Sparkline>`)

| KPI | Value query | Drill-through |
|-----|------------|---------------|
| Total Users | COUNT profiles | → `/god/signups` |
| Active Orgs | COUNT organizations WHERE subscription_tier != 'free' | → `/god/directory?role=admin` |
| Trips This Month | COUNT trips WHERE created_at >= month_start | → `/god/analytics?feature=trips` |
| MRR | SUM subscriptions.amount WHERE status = active | → `/god/costs` |
| API Spend Today | Redis cost:daily:* SUM | → `/god/costs` |
| Open Tickets | COUNT support_tickets WHERE status = open | → `/god/support` |

**Middle section: 2-column grid**

Left column (60%):
- **Signup Trend Chart** — Recharts `<AreaChart>` showing daily signups for last 30 days. Click data point → navigates to `/god/signups?date=YYYY-MM-DD`
- **Cost Trend Chart** — Stacked `<BarChart>` showing daily API cost by category. Click bar → navigates to `/god/costs?date=YYYY-MM-DD`

Right column (40%):
- **System Status** — Compact health indicators (green/yellow/red dots) for: Database, FCM, WhatsApp, Notification Pipeline, Queues. Click → `/god/monitoring`
- **Quick Actions** — GlassButton list:
  - "Toggle Maintenance Mode" (red if active)
  - "Send Announcement" → `/god/announcements`
  - "View Support" → `/god/support`
  - "Pause All AI" (red toggle)

**Bottom row:**
- **Recent Activity Feed** — Last 10 events across all tables (new signup, new trip, new ticket, announcement sent, kill switch toggle). Each row clickable → drill-through to relevant page

### Page 2: Signups Dashboard (`/god/signups/page.tsx`)

**Header**: "User Signups" + range picker (7d | 30d | 90d | All Time) + refresh button

**Stats row**: 4 `GlassCard` metrics:
- Total Users (all time)
- New Users (in selected range)
- Orgs Created (in range)
- Avg Daily Signups (in range)

**Main chart**: Recharts `<AreaChart>` with dual series:
- Line 1: User signups per day (primary color)
- Line 2: Org creations per day (secondary color)
- Click on data point → filters table below to that date

**Table below chart**: Recent signups list
- Columns: Name, Email, Phone, Role, Org Name, Tier, Signed Up
- Sortable by any column
- Search bar (filters name/email)
- Click row → expands to show: org details, trip count, last activity
- Click "View Profile" → `/god/directory/:id` (detail view)

### Page 3: Directory (`/god/directory/page.tsx`)

**Header**: "All Contacts" + search bar + filters

**Filters row**:
- Role dropdown (All | Client | Driver | Admin)
- Tier dropdown (All | Free | Pro | Enterprise)
- Date range picker

**Table**: Paginated (50 per page) with columns:
- Avatar + Name (clickable)
- Email
- Phone
- Role (GlassBadge variant)
- Organization
- Tier (GlassBadge)
- Created

**Row click → Expandable detail panel** (not a new page, slide-out panel):
- Full profile info
- Organization details (name, slug, tier, owner, created)
- Activity summary: trips (count + last), proposals (count + last), AI sessions, social posts
- Payment summary: total paid, outstanding invoices
- Support tickets from this user
- Referral activity

### Page 4: Feature Usage (`/god/analytics/page.tsx`)

**Header**: "Feature Usage Analytics" + range picker (7d | 30d | 90d)

**Stat cards row** (7 cards, scrollable):

| Feature | Icon | Color | Count source |
|---------|------|-------|-------------|
| Trips Created | MapPin | emerald | `trips` |
| Proposals Sent | FileText | blue | `proposals` |
| AI Sessions | Sparkles | purple | `assistant_sessions` |
| Social Posts | Share | pink | `social_posts` |
| Reputation Campaigns | Star | amber | `reputation_campaign_sends` |
| Templates Used | Layout | indigo | `template_usage` |
| Bookings Searched | Search | cyan | COUNT on booking search logs |

Each card: total count + % change vs previous period. Click → drill-down chart for that feature.

**Main chart**: Recharts `<BarChart>` with grouped bars (one color per feature). X-axis = time periods. Click bar → drill-down.

**Drill-down view** (same page, below chart, appears on feature click):
- **Per-org breakdown table** for selected feature
- Columns: Org Name, Tier, Count, % of Total, Last Used
- Sorted by count descending

### Page 5: API Costs (`/god/costs/page.tsx`)

**Header**: "API Cost Dashboard" + range picker (7d | 30d | 90d)

**Alert banner**: Shows if any category exceeds 80% of cap (amber) or 95% (red)

**Cost category cards** (5 cards):

| Category | Unit cost | Daily cap |
|----------|----------|----------|
| Amadeus (flights) | $0.025/req | $75 emergency |
| Image Search | $0.004/req | $35 emergency |
| AI Image (FAL.ai) | $0.06/req | $55 emergency |
| AI Poster | $0.12/req | $40 emergency |
| AI Text (OpenAI) | $0.008/req | $20 emergency |

Each card shows: today spend, MTD spend, cap, utilization bar (green → amber → red), request count.
Click card → drill-down: per-org spend for that category.

**Trend chart**: Recharts `<StackedBarChart>` — daily cost stacked by category for selected range. Click day → shows that day's breakdown.

**Per-org cost table** (below chart):
- Columns: Org Name, Tier, Today ($), MTD ($), Top Category, Request Count
- Sortable, searchable
- Click row → `/god/costs/org/:orgId` (per-org detail view)

**Per-org detail view** (`/god/costs/org/[orgId]/page.tsx`):
- Header: org name + tier badge
- Cost breakdown by category (bar chart)
- Daily trend for this org
- Request log table (if available)

### Page 6: Referrals (`/god/referrals/page.tsx`)

**Header**: "Referral Tracking"

**Two tabs**: B2B Referrals | Client Flywheel

**B2B tab**:
- Stats: Total referrals, Converted, Conversion %, Rewards granted
- Table: Referrer Org, Referred Org, Status, Reward, Date
- Click row → expand with details

**Client Flywheel tab**:
- Stats: Total events, Converted, Conversion %, Total rewards (₹), TDS obligation (₹)
- Table: Referrer Name, Referral Code, Events, Conversions, Rewards Issued, TDS Applicable
- Click row → expand with event timeline

### Page 7: Support Tickets (`/god/support/page.tsx`)

**Header**: "Support Tickets" + status filter tabs (All | Open | In Progress | Resolved | Closed)

**Stats bar**: Open count (red badge), In Progress count (amber), Resolved today, Avg response time

**Ticket list** (not a table — card-based for better readability):
Each ticket card shows:
- Title (bold)
- Category badge + Priority badge + Status badge
- User name + org name
- Description preview (2 lines, truncated)
- Created date + time since created

**Click ticket → Slide-out detail panel**:
- Full description
- User info (name, email, phone, org)
- Response form: textarea for `admin_response` + status dropdown + "Send Response" button
- Response history (if already responded)
- "View User Profile" link → `/god/directory`

### Page 8: Announcements (`/god/announcements/page.tsx`)

**Header**: "Broadcast Center" + "New Announcement" button

**Compose form** (shown when creating):
- Title input
- Body textarea (rich text or markdown)
- Type selector: Info | Warning | Critical | Maintenance (each with color)
- Target segment: All Operators | Free Tier | Pro Tier | Enterprise | Specific Orgs (with org picker)
- Delivery channels: checkboxes (In-App Push | Email — WhatsApp when ready)
- Preview section showing how it will look
- "Save Draft" + "Send Now" buttons (Send has confirmation modal)

**Sent history table**:
- Columns: Title, Type (badge), Target, Recipients, Sent At, Sent By
- Click → expand to see full body

### Page 9: Kill Switch (`/god/kill-switch/page.tsx`)

**RED-THEMED PAGE** — distinct from all other pages. Dark background with red accents.

**Warning banner**: "These controls affect the ENTIRE platform. Changes take effect within 60 seconds."

**Toggle cards** (each is a `GlassCard` with large toggle switch):

| Switch | What it does | Redis key |
|--------|-------------|----------|
| 🔴 Maintenance Mode | All `/api/admin/*` return 503 | `platform:maintenance_mode` |
| 🔴 Pause All AI | AI endpoints return 503 | `platform:feature_flags.ai_enabled` |
| 🟡 Disable Marketplace | Marketplace endpoints disabled | `platform:feature_flags.marketplace_enabled` |
| 🟡 Disable Social Studio | Social post/publish disabled | `platform:feature_flags.social_enabled` |
| 🟡 Disable Reputation | Reputation campaigns paused | `platform:feature_flags.reputation_enabled` |
| 🟡 Disable WhatsApp | WhatsApp send disabled | `platform:feature_flags.whatsapp_enabled` |

Each toggle:
- Current state: green dot (active) / red dot (disabled)
- Toggle triggers `GlassConfirmModal` with red "Confirm" button
- Shows "Last changed: [date] by [actor]" below
- Shows affected endpoint count

**Org Suspension section**:
- Dropdown to select an org
- "Suspend" / "Unsuspend" button with reason textarea
- Currently suspended orgs listed with red badges

**Current state summary**: All switches shown as a visual grid (green/red dots)

### Page 10: Health Monitor (`/god/monitoring/page.tsx`)

**Auto-refresh**: Every 30 seconds (configurable)

**Health grid** (2×3 cards):

| Service | Checks | Indicator |
|---------|--------|-----------|
| Database | Supabase query latency | Latency ms + status dot |
| Edge Functions | `send-notification` health | Status + latency |
| Firebase FCM | FCM endpoint check | Status + latency |
| WhatsApp API | Meta Graph API check | Status + latency |
| External APIs | Weather + Currency | Status per API |
| Observability | Sentry + PostHog config | Configured/missing |

**Queue depths section** (4 gauge cards):
- Notification Queue: pending / failed / dead letters
- Social Post Queue: pending
- PDF Queue: pending
- Each shows threshold warning if above configured limit

**Cron job status**:
- `assistant-briefing` (1 AM daily): last run, status, duration
- `schedule-followups` (2 AM daily): last run, status, duration
- Calculated from `notification_logs` or `assistant_audit_log` timestamps

**Error rate chart**: Recharts `<LineChart>` showing failed operations over last 24h

### Page 11: Audit Log (`/god/audit-log/page.tsx`)

**Header**: "Platform Audit Log" + category filter dropdown

**Log entries** (card-based, chronological):
Each entry:
- Timestamp (relative: "2 hours ago")
- Action (bold): "Toggled maintenance mode ON"
- Category badge (kill_switch, org_management, announcement, etc.)
- Details (expandable JSON)
- Actor: "You" (since there's only one super_admin)

**Filters**: Category, date range, search

---

## Component Library (`src/components/god-mode/`)

| Component | Purpose | Props |
|-----------|---------|-------|
| `GodModeShell.tsx` | Layout wrapper (sidebar + content) | `children` |
| `GodModeSidebar.tsx` | Navigation sidebar | `activePath` |
| `KpiCard.tsx` | Metric card with icon, value, trend, sparkline | `label, value, trend, icon, color, href, sparklineData` |
| `KpiGrid.tsx` | Responsive grid of KpiCards | `cards: KpiCardProps[]` |
| `DrillDownTable.tsx` | Sortable/searchable/paginated table | `columns, data, onRowClick, searchable, sortable` |
| `TrendChart.tsx` | Recharts area/bar chart wrapper | `data, series, type, onClick, height` |
| `StackedCostChart.tsx` | Stacked bar chart for cost breakdown | `data, categories` |
| `StatusDot.tsx` | Green/amber/red health indicator | `status: 'healthy'|'degraded'|'down'` |
| `ToggleSwitch.tsx` | Large toggle for kill switches | `enabled, onToggle, label, dangerous` |
| `SlideOutPanel.tsx` | Right-side detail panel | `open, onClose, title, children` |
| `ConfirmDangerModal.tsx` | Red confirmation dialog | `title, message, onConfirm, onCancel` |
| `TimeRangePicker.tsx` | 7d/30d/90d button group | `value, onChange` |
| `StatCard.tsx` | Simple stat card (for sub-pages) | `label, value, subtitle` |

---

## Files to Modify (existing)

| File | Change |
|------|--------|
| `src/lib/auth/admin.ts` | Add `checkPlatformStatus()` call after rate-limit check. Import from `lib/platform/settings.ts`. ~15 lines added |
| `src/lib/database.types.ts` | Add `platform_settings`, `platform_announcements`, `platform_audit_log` table types. Update `support_tickets` with 3 new columns |

---

## Files to Create (complete list)

### Infrastructure (5 files)
1. `supabase/migrations/20260312000000_platform_god_mode.sql`
2. `src/lib/auth/require-super-admin.ts`
3. `src/lib/platform/settings.ts`
4. `src/lib/platform/audit.ts`
5. `src/app/api/superadmin/[...path]/route.ts`

### API Handlers (21 files)
6. `src/app/api/_handlers/superadmin/overview/route.ts`
7. `src/app/api/_handlers/superadmin/users/signups/route.ts`
8. `src/app/api/_handlers/superadmin/users/directory/route.ts`
9. `src/app/api/_handlers/superadmin/users/[id]/route.ts`
10. `src/app/api/_handlers/superadmin/analytics/feature-usage/route.ts`
11. `src/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route.ts`
12. `src/app/api/_handlers/superadmin/cost/aggregate/route.ts`
13. `src/app/api/_handlers/superadmin/cost/trends/route.ts`
14. `src/app/api/_handlers/superadmin/cost/org/[orgId]/route.ts`
15. `src/app/api/_handlers/superadmin/referrals/overview/route.ts`
16. `src/app/api/_handlers/superadmin/referrals/detail/[type]/route.ts`
17. `src/app/api/_handlers/superadmin/announcements/route.ts`
18. `src/app/api/_handlers/superadmin/announcements/[id]/route.ts`
19. `src/app/api/_handlers/superadmin/announcements/[id]/send/route.ts`
20. `src/app/api/_handlers/superadmin/support/tickets/route.ts`
21. `src/app/api/_handlers/superadmin/support/tickets/[id]/route.ts`
22. `src/app/api/_handlers/superadmin/support/tickets/[id]/respond/route.ts`
23. `src/app/api/_handlers/superadmin/settings/route.ts`
24. `src/app/api/_handlers/superadmin/settings/kill-switch/route.ts`
25. `src/app/api/_handlers/superadmin/settings/org-suspend/route.ts`
26. `src/app/api/_handlers/superadmin/monitoring/health/route.ts`
27. `src/app/api/_handlers/superadmin/monitoring/queues/route.ts`
28. `src/app/api/_handlers/superadmin/audit-log/route.ts`

### UI Layout & Components (15 files)
29. `src/app/(superadmin)/god/layout.tsx`
30. `src/components/god-mode/GodModeShell.tsx`
31. `src/components/god-mode/GodModeSidebar.tsx`
32. `src/components/god-mode/KpiCard.tsx`
33. `src/components/god-mode/KpiGrid.tsx`
34. `src/components/god-mode/DrillDownTable.tsx`
35. `src/components/god-mode/TrendChart.tsx`
36. `src/components/god-mode/StackedCostChart.tsx`
37. `src/components/god-mode/StatusDot.tsx`
38. `src/components/god-mode/ToggleSwitch.tsx`
39. `src/components/god-mode/SlideOutPanel.tsx`
40. `src/components/god-mode/ConfirmDangerModal.tsx`
41. `src/components/god-mode/TimeRangePicker.tsx`
42. `src/components/god-mode/StatCard.tsx`

### UI Pages (12 files)
43. `src/app/(superadmin)/god/page.tsx` — Command Center
44. `src/app/(superadmin)/god/signups/page.tsx` — Signups
45. `src/app/(superadmin)/god/directory/page.tsx` — Directory
46. `src/app/(superadmin)/god/analytics/page.tsx` — Feature Usage
47. `src/app/(superadmin)/god/costs/page.tsx` — API Costs
48. `src/app/(superadmin)/god/costs/org/[orgId]/page.tsx` — Per-org cost detail
49. `src/app/(superadmin)/god/referrals/page.tsx` — Referrals
50. `src/app/(superadmin)/god/support/page.tsx` — Support Tickets
51. `src/app/(superadmin)/god/announcements/page.tsx` — Announcements
52. `src/app/(superadmin)/god/kill-switch/page.tsx` — Kill Switch
53. `src/app/(superadmin)/god/monitoring/page.tsx` — Health Monitor
54. `src/app/(superadmin)/god/audit-log/page.tsx` — Audit Log

**Total: 54 new files + 2 modified files + 1 migration**

---

## Build Order

### Phase 1: Foundation
Files 1-5, 29-31 (migration, auth, lib, API shell, layout, sidebar)

### Phase 2: Command Center + Core Visibility
Files 6-9, 32-35, 43-46 (overview + signups + directory + analytics APIs, KPI/table/chart components, 4 pages)

### Phase 3: Cost & Growth
Files 10-16, 36-37, 47-49 (cost + referral APIs, cost chart component, 3 pages)

### Phase 4: Operations
Files 17-22, 38-39, 50-51 (announcement + support APIs, slide-out panel, 2 pages)

### Phase 5: Kill Switch & Monitoring
Files 23-28, 40-42, 52-54, + admin.ts modification (settings + monitoring + audit APIs, toggle/confirm components, 3 pages, kill switch enforcement)

---

## Verification

1. **Auth gate**: `/god` as `role=admin` → Access Denied. As `role=super_admin` → dashboard loads
2. **KPI drill-through**: Click "Total Users" card → navigates to `/god/signups`. Click "API Spend" → `/god/costs`. Click data point on chart → filtered view
3. **Directory search**: Search "john" → shows matching profiles across all orgs
4. **Cost aggregate**: Total matches SUM of per-org costs. Per-org drill-through shows breakdown
5. **Kill switch**: Toggle maintenance ON → all `/api/admin/*` return 503 within 60s. `/api/superadmin/*` still works. Toggle OFF → normal. Check Redis key set/cleared
6. **Feature flag**: Disable `ai_enabled` → AI endpoints return feature-disabled error. Re-enable → works
7. **Support response**: Respond to ticket → appears in ticket detail with timestamp
8. **Announcement**: Send to "all" → push notification appears for admin users
9. **Audit log**: Every action above → entry in audit log with category, details, timestamp
10. **Build**: `tsc --noEmit` + `npm run build` pass with 0 errors
