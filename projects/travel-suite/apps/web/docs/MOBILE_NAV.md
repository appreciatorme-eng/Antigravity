# Mobile Navigation Architecture

## Overview

TripBuilt uses a **unified navigation config** (`src/lib/nav/nav-config.ts`) consumed by:

- **Desktop web**: `Sidebar.tsx` (left rail, collapsible)
- **Mobile web**: `MobileNav.tsx` (bottom tabs + "More" drawer)
- **Flutter app**: `apps/mobile/lib/navigation/` (mirrors web structure)

All three surfaces read from the same config. Adding or removing a page requires a single edit to `nav-config.ts`.

---

## Shell Structure

```
RootLayout
  └→ AppShell (SaaS pages)
       ├── Sidebar (hidden on mobile, visible md:+)
       ├── TopBar (search, notifications, IST clock)
       ├── <main> content
       ├── MobileNav (visible on mobile, hidden md:+)
       ├── CommandPalette
       └── TourAssistantChat

  └→ AdminShellLayout (/admin/* pages)
       ├── Sidebar
       ├── TopBar
       ├── <main> content
       └── MobileNav  ← MUST be included

  └→ Marketing pages → no shell (standalone)
  └→ Public pages (auth, portal, share, pay, live) → no shell
```

---

## Mobile Bottom Tab Bar (5 slots)

| Slot | Icon | Label | Route | Badge |
|------|------|-------|-------|-------|
| 1 | Home | Home | `/` | — |
| 2 | MessageCircle | Inbox | `/inbox` | `inboxUnread` |
| 3 | Plus (circle) | — | — | Center FAB (opens action sheet) |
| 4 | Briefcase | Trips | `/trips` | `bookingsToday` |
| 5 | Users | Clients | `/clients` | — |

**These 5 slots are hardcoded in `MobileNav.tsx`**, not driven by `nav-config.ts`. Changing them requires editing `MobileNav.tsx` + updating the table in `CLAUDE.md`.

---

## Center FAB Quick Actions

| Emoji | Label | Action |
|-------|-------|--------|
| ✈️ | New Trip | Navigate to `/trips/new` |
| 💰 | Quick Quote | Dispatch `open-quick-quote` event |
| 📱 | WA Broadcast | Navigate to `/inbox?mode=broadcast` |
| 📋 | New Proposal | Navigate to `/proposals/create` |

---

## "More" Drawer Sections

The "More" drawer groups all secondary routes by category. These are driven by `nav-config.ts` sections.

### Daily Workflow
| Icon | Label | Route |
|------|-------|-------|
| FileText | Proposals | `/proposals` |
| Plane | Bookings | `/bookings` |
| Map | Planner | `/planner` |
| Calendar | Calendar | `/calendar` |

### Operations
| Icon | Label | Route |
|------|-------|-------|
| Truck | Drivers | `/drivers` |
| Receipt | Invoices | `/admin/invoices` |
| Coins | Pricing | `/admin/pricing` |
| Compass | Operations | `/admin/operations` |
| TrendingUp | Revenue | `/admin/revenue` |

### Growth
| Icon | Label | Route |
|------|-------|-------|
| Store | Marketplace | `/marketplace` |
| Star | Reputation | `/reputation` |
| Megaphone | Social | `/social` |
| Sparkles | AI Insights | `/admin/insights` |
| Gift | Refer & Earn | `/admin/referrals` |

### Account
| Icon | Label | Route |
|------|-------|-------|
| Settings | Settings | `/settings` |
| CreditCard | Billing | `/billing` |
| Map | Add-ons | `/add-ons` |
| LifeBuoy | Support | `/support` |

---

## How To: Add a New Page

1. Create the page: `src/app/<path>/page.tsx`
2. Add the route to `src/lib/nav/nav-config.ts` with the correct `section`
3. Add to `PROTECTED_PREFIXES` in `src/middleware.ts` if auth is required
4. **Done** — Sidebar and MobileNav auto-consume the config

## How To: Remove a Page

1. Remove the entry from `nav-config.ts`
2. Delete the page files
3. Both nav surfaces update automatically

## How To: Change Bottom Tab Bar Slots

Bottom tabs are the critical 5 — changing them affects all users.

1. Edit `MobileNav.tsx` → `PRIMARY_ITEMS` array
2. Update the "Mobile Bottom Tabs" table in `CLAUDE.md`
3. Update the table in this document
4. Coordinate with Flutter app to match

---

## Breakpoints

| Name | Width | Tailwind | Used For |
|------|-------|----------|----------|
| Mobile | < 768px | default (no prefix) | Bottom nav, single-column, cards |
| Tablet | 768–1024px | `md:` | Sidebar appears, 2-column possible |
| Desktop | > 1024px | `lg:` | Full sidebar, 3-panel layouts |

Test viewports: **390×844** (iPhone 14), **768×1024** (iPad), **1280×800** (laptop)

---

## Flutter App Alignment

The Flutter app (`apps/mobile/`) should mirror this structure:

- Same 5-tab bottom nav with center FAB
- Same "More" drawer categories
- Same Supabase API endpoints
- Push notifications (Firebase) replacing web's realtime polling

Future: extract `nav-config.ts` to `packages/nav-config/` as JSON so Flutter can consume it directly.
