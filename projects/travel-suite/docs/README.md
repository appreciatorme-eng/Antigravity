# TripBuilt Documentation

> Comprehensive documentation suite for the TripBuilt (Antigravity) travel SaaS platform.

## Architecture Diagrams

Visual architecture documentation with Mermaid diagrams — renders in GitHub, Obsidian, and VS Code.

| Document | Description |
|----------|-------------|
| [System Overview](architecture/system-overview.md) | High-level C4 context diagram, monorepo layout, infrastructure topology |
| [API Architecture](architecture/api-architecture.md) | Request flow, 6 catch-all dispatchers, security layers, handler directory |
| [Database Schema](architecture/database-schema.md) | Full ERD with 109 tables grouped by domain, RLS policies |
| [Data Flows](architecture/data-flows.md) | 7 sequence diagrams: payment, WhatsApp, notifications, auth, trip lifecycle, AI assistant, onboarding |
| [Frontend Architecture](architecture/frontend-architecture.md) | Route groups, middleware pipeline, component map, state management |
| [Integrations Map](architecture/integrations-map.md) | 18+ external services with auth methods, retry policies, failure modes |
| [Security Model](architecture/security-model.md) | RLS, CSRF, rate limiting, auth flows, webhook validation |
| [Cron Jobs](architecture/cron-jobs.md) | All cron endpoints, Vercel constraints, scheduling strategies |
| [Multi-App Communication](architecture/multi-app.md) | Monorepo apps (web, mobile, agents, RAG), shared types, API boundaries |

## Developer Guides

| Document | Description |
|----------|-------------|
| [API Reference](guides/api-reference.md) | 367 endpoints across 6 namespaces with methods, auth, and descriptions |
| [Environment Variables](guides/env-vars.md) | 50+ env vars grouped by service, with format examples |
| [Developer Setup](guides/developer-setup.md) | Local development setup from clone to running dev server |
| [Deployment](guides/deployment.md) | Vercel Hobby constraints, CI/CD pipelines, cron setup |
| [Testing Guide](guides/testing-guide.md) | Vitest + Playwright, coverage thresholds, test accounts |
| [Troubleshooting](guides/troubleshooting.md) | 10 common problem categories with causes and solutions |
| [Contributing](guides/contributing.md) | Code style, git workflow, PR process, review commands |

## Feature Documentation

| Document | Description |
|----------|-------------|
| [WhatsApp Integration](features/whatsapp-integration.md) | Meta Cloud API + WPPConnect, webhooks, AI channel adapter |
| [Payment Flow](features/payment-flow.md) | Razorpay orders, payment links, webhooks, subscriptions, GST |
| [AI Assistant](features/ai-assistant.md) | Orchestrator, context engine, Gemini, action system, workflows |
| [Chatbot](features/chatbot.md) | Web chat UI, WhatsApp channel, conversation management, quick prompts |
| [RAG Assistant](features/rag-assistant.md) | Vector embeddings, semantic search, tenant isolation, usage caps |
| [Notification Pipeline](features/notification-pipeline.md) | Multi-channel (WhatsApp, email, push, SMS), queue, retry logic |
| [Multi-Tenancy](features/multi-tenancy.md) | Organization isolation, RLS policies, subscription tiers |
| [Invoicing & GST](features/invoicing-gst.md) | Invoice lifecycle, GST compliance, payment tracking, PDF export |
| [Live Tracking](features/live-tracking.md) | Driver GPS, guest share links, Supabase Realtime |
| [Reputation Management](features/reputation-management.md) | Review aggregation, NPS campaigns, sentiment analysis, widget |
| [Social Media](features/social-media.md) | Post scheduling, platform connections, AI poster, analytics |
| [Marketplace](features/marketplace.md) | B2B operator marketplace, listings, inquiries, subscriptions |
| [Demo Mode](features/demo-mode.md) | Demo context provider, seed data, restrictions |

## Quick Links

- **Production**: [tripbuilt.com](https://tripbuilt.com)
- **Web App Code**: `projects/travel-suite/apps/web/`
- **Database Schema**: `projects/travel-suite/supabase/schema.sql`
- **API Handlers**: `projects/travel-suite/apps/web/src/app/api/_handlers/`
