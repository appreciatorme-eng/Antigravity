# Full Audit Configuration

## Credentials

Read from `projects/travel-suite/apps/web/e2e/.env`:
```
TEST_EMAIL=e2e-admin@tripbuilt.com
TEST_PASSWORD=E2eAdmin2026secure
```

## Targets

| Name | URL |
|------|-----|
| `prod` | `https://www.tripbuilt.com` |
| `local` | `http://localhost:3000` |

## All Routes (from nav-config.ts)

```
PROTECTED_ROUTES:
  /               # Home/Dashboard (redirects to /admin for admin users)
  /inbox          # Unified Inbox
  /trips          # Trip Manager
  /clients        # Client CRM
  /proposals      # Proposals
  /bookings       # Bookings
  /planner        # AI Planner
  /calendar       # Command Center
  /drivers        # Driver Management
  /admin/invoices # Invoice Studio
  /admin/revenue  # Revenue Dashboard
  /admin/pricing  # Pricing & Profit
  /admin/operations # Operations
  /marketplace    # Marketplace
  /reputation     # Reputation Manager
  /social         # Social Studio
  /admin/insights # AI Insights
  /admin/referrals # Refer & Earn
  /settings       # Settings (3 tabs: Organization, Profile, Branding)
  /billing        # Billing & Plans
  /add-ons        # Add-ons
  /support        # Support

PUBLIC_ROUTES:
  /auth           # Login / Signup
  /pricing        # Marketing pricing page
  /               # Marketing home (when not logged in)
```

## Viewports

| Device | Width | Height | Name |
|--------|-------|--------|------|
| iPhone SE | 320 | 568 | `se` |
| iPhone 14 | 390 | 844 | `iphone14` (default) |
| iPad | 768 | 1024 | `ipad` |
| Landscape | 844 | 390 | `landscape` |
| Desktop | 1280 | 800 | `desktop` |

## Forms Catalog

| Form | Trigger | Location |
|------|---------|----------|
| Login | Direct | `/auth` |
| Signup | Tab switch | `/auth` → "Create account" tab |
| Create Trip | Button click | `/trips` → "Create Trip" |
| Add Client | Button click | `/clients` → "Add Client" |
| Add Driver | Button click | `/drivers` → "Add Driver" |
| Create Proposal | Page | `/proposals/create` |
| Invoice Studio | Inline | `/admin/invoices` (scroll to form) |
| Settings Org | Tab | `/settings` → Organization tab |
| Settings Profile | Tab | `/settings` → Profile tab |
| Settings Brand | Tab | `/settings` → Branding tab |
| Planner | Hero form | `/planner` |
| Inbox Compose | Click conversation | `/inbox` → click any conversation |
| Broadcast | Tab | `/inbox` → Broadcast tab |

## API Endpoints to Test

```
GET  /api/trips?status=all
GET  /api/admin/clients
GET  /api/subscriptions/limits
GET  /api/add-ons
GET  /api/admin/revenue
GET  /api/admin/operations/stats
POST /api/auth/password-login  (with valid creds)
POST /api/auth/password-login  (with invalid creds → expect 401)
```

## Navigation Elements

### Bottom Tabs (mobile)
| Label | Route | Expected |
|-------|-------|----------|
| Home | `/` | Dashboard loads |
| Inbox | `/inbox` | Inbox loads |
| + (FAB) | — | Action sheet opens |
| Trips | `/trips` | Trips list loads |
| Clients | `/clients` | Clients list loads |
| More | — | Drawer opens |

### FAB Actions
| Label | Route/Event | Expected |
|-------|-------------|----------|
| New Trip | `/trips?create=true` | Create Trip modal opens |
| WA Broadcast | `/inbox?mode=broadcast` | Inbox broadcast tab |
| New Proposal | `/proposals/create` | Proposal form loads |

### More Drawer Sections
| Section | Items |
|---------|-------|
| Daily Workflow | Proposals, Bookings, Planner, Calendar, Drivers |
| Operations | Invoices, Revenue, Pricing & Profit, Operations |
| Growth | Marketplace, Reputation, Social Studio, AI Insights, Refer & Earn |
| Account | Settings, Billing, Add-ons, Support |
