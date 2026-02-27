# Sprint 2–4 India Tour Operator SaaS Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use dispatching-parallel-agents to implement all task groups in parallel.

**Goal:** Complete all Sprint 2–4 items (excluding WhatsApp API integration) — billing tiers, client portal, GST report, revenue dashboard, e-signature, Razorpay UI, group manager, conflict detection, PWA manifest.

**Architecture:** 4 parallel agents with non-overlapping file scopes. All India-first (₹, GST, UPI). Glass morphism design system throughout.

**Tech Stack:** Next.js 14, TypeScript, Tailwind, Framer Motion, Lucide React, Zustand. Existing: `src/lib/india/` utilities, glass components, `src/lib/india/gst.ts`.

---

## GROUP A — Revenue, Billing & GST

**Files (no overlap with other groups):**
- Create: `src/lib/billing/tiers.ts`
- Create: `src/components/billing/UpgradeModal.tsx`
- Create: `src/components/billing/PricingCard.tsx`
- Edit:   `src/app/billing/page.tsx`
- Create: `src/app/admin/gst-report/page.tsx`
- Edit:   `src/features/admin/revenue/AdminRevenueView.tsx`
- Edit:   `src/features/admin/analytics/AdminAnalyticsView.tsx`

**Tasks:**
1. `tiers.ts` — Free/Pro(₹3499)/Business(₹10999)/Enterprise(₹29999) feature gate constants
2. `UpgradeModal.tsx` — glass modal shown when operator hits feature limit
3. `PricingCard.tsx` — per-tier card used on billing page and landing
4. `billing/page.tsx` — full pricing page with 4 tier cards, annual toggle (20% off), Indian payment badge (UPI/cards), FAQ
5. `admin/gst-report/page.tsx` — monthly GST summary: total sales, GST collected (5%), download CSV for CA
6. `AdminRevenueView.tsx` — add ₹ lakh/crore formatting, monthly comparison ("↑12% vs last month"), top-5 clients by revenue
7. `AdminAnalyticsView.tsx` — add India-specific charts: revenue by destination, peak vs off-season comparison

---

## GROUP B — Client Portal & E-Signature

**Files (no overlap):**
- Create: `src/app/portal/[token]/page.tsx`
- Create: `src/app/portal/[token]/layout.tsx`
- Create: `src/components/portal/PortalItinerary.tsx`
- Create: `src/components/portal/PortalPayment.tsx`
- Create: `src/components/portal/PortalReview.tsx`
- Create: `src/components/proposals/ESignature.tsx`
- Edit:   `src/app/proposals/page.tsx`
- Edit:   `src/app/api/proposals/[id]/convert/route.ts` (add e-sign status)

**Tasks:**
1. `portal/[token]/layout.tsx` — white-label shell: operator logo, brand colour from token, no app chrome
2. `portal/[token]/page.tsx` — client-facing page: trip summary, day-by-day itinerary, driver details, UPI payment, share location button, leave review
3. `PortalItinerary.tsx` — read-only day-by-day itinerary with map thumbnails
4. `PortalPayment.tsx` — UPI QR + payment link (reuses `UPIPaymentModal` logic in read-only form)
5. `PortalReview.tsx` — 5-star rating + comment form → saves to DB, triggers WhatsApp thank-you
6. `ESignature.tsx` — canvas-based signature pad, saves as base64, "Sign & Approve" CTA
7. `proposals/page.tsx` — add "Get Signed" button per proposal, show signed badge with timestamp

---

## GROUP C — Trip Operations

**Files (no overlap):**
- Create: `src/lib/trips/conflict-detection.ts`
- Create: `src/components/trips/ConflictWarning.tsx`
- Create: `src/components/trips/GroupManager.tsx`
- Edit:   `src/app/trips/[id]/page.tsx`

**Tasks:**
1. `conflict-detection.ts` — pure TS functions: `detectOverlaps(activities)`, `estimateTravelTime(from, to)`, `validateDaySchedule(day)`. Returns typed conflict objects (overlap/travel-time/unrealistic-duration).
2. `ConflictWarning.tsx` — amber warning banner listing conflicts with "Fix" quick actions (shift time, remove activity)
3. `GroupManager.tsx` — manage group of travelers: add pax with name/phone/dietary/passport, generate group manifest PDF (print-friendly table), WhatsApp broadcast to all pax
4. `trips/[id]/page.tsx` — integrate ConflictWarning above itinerary, add GroupManager tab to the trip detail tabs

---

## GROUP D — PWA + Lead-to-Booking + Razorpay UI

**Files (no overlap):**
- Create: `public/manifest.json`
- Create: `public/sw.js` (minimal service worker)
- Edit:   `src/app/layout.tsx`
- Create: `src/components/leads/LeadToBookingFlow.tsx`
- Create: `src/components/payments/RazorpayModal.tsx`
- Create: `src/app/api/payments/razorpay/route.ts` (stub)

**Tasks:**
1. `manifest.json` — PWA manifest: name "TourOS", short_name "TourOS", theme #00d084, background #0a1628, icons 192/512, display standalone, start_url /
2. `sw.js` — minimal service worker: cache app shell, offline fallback page for drivers in low-signal zones
3. `layout.tsx` — add PWA meta tags: theme-color, apple-mobile-web-app-capable, manifest link
4. `LeadToBookingFlow.tsx` — 3-step stepper modal: Step 1 auto-fill client from WhatsApp number → Step 2 Quick Quote (pre-fill destination from detected message) → Step 3 Send + Track. Each step has "Next →" and shows progress dots. Accessible from WhatsApp Inbox context panel "Create Trip" button.
5. `RazorpayModal.tsx` — payment gateway modal UI: amount display (₹), razorpay branded button, test/live mode toggle, success/failure states, auto-generate GST invoice on success. Stub API route returns mock order_id. (Real Razorpay key wired when operator adds it in Settings.)
6. `payments/razorpay/route.ts` — stub POST endpoint: creates mock Razorpay order, returns `{ order_id, amount, currency: 'INR' }`
