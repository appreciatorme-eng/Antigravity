# Priority Matrix — P0 to P3

Last updated: 2026-03-08  
Goal: sequence the requested initiatives by business risk, implementation dependency, and expected impact.

## Priority definitions
- **P0**: blocker, safety, or architecture work required before scaling feature scope
- **P1**: high-impact revenue/conversion work with direct user value
- **P2**: growth and monetization expansions that depend on P0/P1 foundations
- **P3**: optimization and follow-on leverage work

## Summary table

| Priority | Initiative | Estimate | Dependency | Primary outcome |
|---|---|---:|---|---|
| P0 | Public share token PII hardening + regression tests | 0.5-1 day | none | safer tokenized sharing |
| P0 | Public token/data exposure runbook | 0.5 day | none | prevents future overexposure |
| P0 | Embedding v2 design + migration + benchmark plan | 2-3 days | none | safe semantic retrieval cutover |
| P0 | SQL-backed QA scenario pack | 1 day | none | release confidence |
| P1 | WhatsApp → Proposal in 60 Seconds | 5-7 days | P0 docs + chatbot tables | faster lead-to-proposal conversion |
| P1 | Review → Marketing asset pipeline | 4-6 days | review sync + social review queue | growth loop from happy travelers |
| P1 | Monthly operator scorecard | 4-5 days | analytics + email stack | retention and operator habit |
| P1 | Shared itinerary cache phase 1 | 5-8 days | embedding v2 path | lower latency and model cost |
| P2 | Marketplace featured listing monetization | 5-7 days | billing + marketplace traffic | new MRR |
| P2 | Embedding v2 rollout/backfill execution | 4-6 days | migration design | lower cost and fewer dependencies |
| P2 | Shared cache analytics and promotion tuning | 3-4 days | shared cache phase 1 | >95% hit rate on common trips |
| P3 | Cross-org benchmarking/network effects | 3-5 days | marketplace + scorecards + cache data | defensible insight layer |

## Detailed matrix

### P0 — Must complete first

#### 1. Public token PII hardening
- Estimate: 0.5-1 day
- Why now: token routes are trust-critical and regress easily
- Done when:
  - share route/page select projections are safe
  - regression test fails on `email`, `phone`, `full_name`
  - token docs explicitly define allowed fields

#### 2. Public token and secret ownership docs
- Estimate: 0.5 day
- Why now: prevents repeat of the same class of issue across share, portal, payment, and proposal tokens
- Done when:
  - every public-token surface has an exposure matrix
  - every env var has an owner and failure symptom

#### 3. Embedding migration plan and benchmark suite
- Estimate: 2-3 days
- Why now: retrieval quality and cache hit rate depend on it, and rollback risk is high
- Done when:
  - v2 schema exists
  - benchmark query set exists
  - dual-read or cutover plan is written

#### 4. QA + SQL verification pack
- Estimate: 1 day
- Why now: upcoming flows cross WhatsApp, proposals, payments, reviews, and analytics
- Done when:
  - 10 critical flows have reproducible SQL checks
  - operators/testers can validate behavior without reading source

### P1 — Highest product impact

#### 5. WhatsApp → Proposal in 60 Seconds
- Estimate: 5-7 days
- Dependency: chatbot session persistence and proposal draft creation
- Why now: highest conversion leverage in the funnel
- Success metric:
  - median lead-to-draft time under 60 seconds
  - >40% of qualified inbound leads become proposal drafts

#### 6. Traveler Review → Marketing Asset Pipeline
- Estimate: 4-6 days
- Dependency: real reviews, social draft pipeline
- Why now: visible “wow” feature and compounding content engine
- Success metric:
  - positive review to branded asset in under 2 clicks
  - operator approval rate >50% on generated assets

#### 7. Monthly Operator Performance Scorecard
- Estimate: 4-5 days
- Dependency: analytics aggregation and Resend delivery
- Why now: monthly habit loop and operator retention
- Success metric:
  - monthly email delivery >95%
  - scorecard open/click rate >35%

#### 8. Shared itinerary cache phase 1
- Estimate: 5-8 days
- Dependency: v2 embeddings and canonical fingerprinting
- Why now: impacts cost, latency, and proposal-generation feel platform-wide
- Success metric:
  - >80% hit rate on top destinations in phase 1
  - measurable AI token reduction

### P2 — Growth and monetization expansion

#### 9. Marketplace paid listings
- Estimate: 5-7 days
- Dependency: functioning marketplace discovery and payment path
- Why not P1: MRR upside is real only if there is already traffic/inquiry volume
- Success metric:
  - paid listing conversion from eligible operators
  - attributable listing impressions and inquiries

#### 10. Embedding rollout/backfill execution
- Estimate: 4-6 days
- Dependency: P0 design approved
- Why not P1: valuable, but not a customer-visible feature until retrieval quality is proven
- Success metric:
  - >90% template `embedding_v2` coverage
  - no retrieval quality regression on benchmark set

#### 11. Shared cache promotion tuning
- Estimate: 3-4 days
- Dependency: shared cache phase 1 live
- Why not P1: optimization pass after the base system is stable
- Success metric:
  - >95% hit rate on common itineraries
  - low false-positive reuse

### P3 — Leverage and defensibility

#### 12. Cross-org benchmarking / network effects
- Estimate: 3-5 days
- Dependency: marketplace, scorecards, revenue, cache, and funnel data at scale
- Why later: requires enough data density to be meaningful
- Success metric:
  - agencies can compare themselves to anonymized peer percentiles
  - benchmark insights improve retention or upsell

## Recommended delivery order

### Wave 1
- Public token safety
- runbooks
- QA SQL scenarios
- embedding migration design

### Wave 2
- WhatsApp → Proposal
- Review → marketing assets

### Wave 3
- Operator scorecards
- shared cache phase 1

### Wave 4
- Marketplace monetization
- embedding rollout execution

### Wave 5
- cache tuning
- benchmarking/network effects

## Resourcing note
If only one engineer is available, do not split attention across all themes. The correct sequence is:
1. safety and retrieval foundation
2. conversion features
3. retention/reporting
4. monetization expansion
