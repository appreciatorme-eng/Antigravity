# Antigravity Repo Audit (Travel Suite Focus)

Last Updated: 2026-02-12  
Base: GitHub `main` @ `cde79e2`

## Scope

This report audits the **appreciatorme-eng/Antigravity** monorepo with an emphasis on the **Travel Suite** product (web + mobile + agents + Supabase).

Goals:
- identify what is production-ready vs what is still "prototype"
- surface the highest-risk gaps
- propose a prioritized execution plan (P0/P1/P2)
- score each major component so progress is measurable over time

Non-goals:
- score every file; instead, score each *major component* (directory / app / service)

## Executive Summary

Travel Suite is already beyond “MVP”: it contains a credible operator workflow (CRM + Kanban), trip editing, notifications, driver tracking, and a multi-tenant Supabase data model with RLS. The remaining work is concentrated in:
- automated tests and release gates
- deployment + environment hardening
- billing enforcement (Stripe) for Pro tier
- operational reliability (alerting, queue SLOs, runbooks)

The repo overall is a mixed workspace (product + internal tools + skill library + an embedded upstream server). That’s fine in dev, but you should decide whether you want to optimize for:
- *shipping a single product quickly* (Travel Suite), or
- *maintaining a general “AI workspace”* with many projects.

## Recent GitHub Changes (Top-of-Tree)

Newest commits on GitHub `main` at time of this audit:
1. `cde79e2` chore: build fixes + type safety + shared TS package
2. `07c8992` feat: `policy_embeddings` migration + doc updates
3. `b2de774` feat: admin driver detail page + driver conflict detection + map improvements
4. `44ed746` feat: progressive onboarding (mobile + migration)

## Scorecard (0-10)

Scores are a snapshot; update this table as we ship.

| Component | Score | Notes |
|---|---:|---|
| Repo structure | 7 | Clear separation (`projects/`, `servers/`, `skills/`) but contains large unrelated assets (n8n-mcp + many n8n skills). |
| CI/CD | 7 | CI exists and is useful; avoid duplicate/conflicting workflows and ensure Node versions align. |
| Repo-wide docs | 5 | `docs/REPOSITORY_OVERVIEW.md` drifted from reality (React Native + n8n references). |
| Travel Suite (overall) | 8 | Feature set is strong; remaining gaps are production assurance. |
| Travel Suite web (`projects/travel-suite/apps/web`) | 8 | Admin is rich, observability/health exist; needs more deterministic E2E tests and deployment plan. |
| Travel Suite mobile (`projects/travel-suite/apps/mobile`) | 7 | Architecture is solid; needs more tests + store-release readiness validation. |
| Travel Suite agents (`projects/travel-suite/apps/agents`) | 7 | JWT + rate limiting + pinned deps; in-memory rate limiting is OK for MVP but not multi-instance. |
| Travel Suite Supabase (`projects/travel-suite/supabase`) | 8 | Migrations + RLS hardening exist; continue tenant/RLS regression verification. |
| Travel Suite docs (`projects/travel-suite/docs`) | 8 | Strong coverage; ensure claims match reality (key rotations, “done” items). |
| Shared TS package (`projects/travel-suite/packages/shared`) | 6 | Good direction; ensure build/publish workflow is documented and used consistently. |
| AI Newsletter (`projects/ai-newsletter`) | 8 | Well-built pipeline with CI and tests; unrelated to Travel Suite product goal. |
| Miles Marketplace (`projects/milesmarketplace`) | 4 | Mostly scaffold + agent operating model, not a product yet. |
| Embedded upstream server (`servers/n8n-mcp`) | 7 | High quality, but not Travel Suite-related; increases repo weight and maintenance surface. |
| Skills library (`skills/`) | 7 | Useful internally; consider separating from product repo if you want leaner product ops. |

## Security: Firebase Service Account Key Rotation + Git History

### Was the Firebase service account key committed to Git?

History scan for common leakage patterns:
- `"type": "service_account"`, `"private_key"`, `private_key_id`
- PEM blocks like `-----BEGIN PRIVATE KEY-----`
- filenames like `firebase-adminsdk*.json`, `*service-account*.json`

Result:
- No service account JSON/private key material was found committed in Git history.
- The string `-----BEGIN PRIVATE KEY-----` appears in code as a *literal header* used for parsing a key from env secrets (not a leaked key).
- `google-services.json` is committed for Android (expected; it is not a service account key).

### Rotation recommendation

Even if it wasn’t committed, rotate service account keys before production:
1. Create new key in GCP IAM for the Firebase Admin SDK service account
2. Update Supabase secrets:
   - `FIREBASE_SERVICE_ACCOUNT` (JSON string)
   - `FIREBASE_PROJECT_ID`
3. Delete old keys in GCP IAM
4. Confirm no local `firebase-adminsdk*.json` files are tracked and that `.gitignore` blocks them

## Travel Suite: What’s Strong

- Multi-tenant + RLS foundation is present and improving.
- Notification stack is cohesive (queue + logs + push + WhatsApp support and health endpoints).
- Admin UX is already operator-oriented (Kanban phases, trip edits, live links, driver assignment conflicts).
- Observability baseline exists (`/api/health`, Sentry + PostHog hooks).
- Migration discipline is strong: schema changes are captured as SQL migrations.

## Travel Suite: Highest-Risk Gaps

### P0 (Must before real customers)

1. **Deterministic E2E tests for critical flows**
   - Kanban phase move -> notification queued
   - Trip create/edit -> itinerary saved -> map markers render
   - Driver assignment -> conflict prevention visible

2. **Deployment runbooks + environment segmentation**
   - staging vs prod env vars
   - secrets rotation plan (documented)

3. **Billing enforcement path**
   - Stripe checkout + webhook -> `organizations.subscription_tier`
   - hard limits: trips/month, drivers, notifications (per your monetization plan)

### P1 (Next)

1. CI alignment and simplification (avoid duplicate workflows; unify Node versions).
2. RLS regression testing (scriptable checks + policy name guards + negative tests).
3. Make notification delivery tracking authoritative (per-channel status, retries, dashboards).

### P2 (Soon, but not blocking)

1. Reduce repo “weight” by isolating non-product content (if desired).
2. Make shared TS package the single source of truth for Supabase types in web.
3. Hardening around external dependencies and timeouts (Overpass/Nominatim/etc).

## Recommendations (Concrete Next Actions)

1. Create/extend Playwright tests to use seeded test users and stable selectors (`data-testid`) rather than text matches.
2. Add a “staging seed” SQL script for Travel Suite (org + admin + sample clients + sample trip).
3. Add a release checklist gate that requires:
   - CI green
   - E2E suite green
   - RLS verification script run and attached to release notes
4. Decide repo strategy:
   - keep as “workspace repo” (OK), or
   - split Travel Suite into its own repo once you approach production operations.

## How To Update This Report

When you merge a meaningful milestone:
- update **Base** commit hash
- update the **Scorecard** numbers and notes
- update the **P0/P1/P2** list (remove completed items, add new risks)

