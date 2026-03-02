# Multi-Tenant RAG Chatbot Blueprint (Tour Operator SaaS)

## 1) Goals

- Give tour operators a "chat like a friend" assistant.
- Support both web app chat and WhatsApp chat with one shared brain.
- Keep every answer grounded in RAG (FAQ + business records + SOP docs).
- Allow controlled actions (for example, update itinerary price) with confirmations and audit logs.
- Enforce strict tenant isolation.

## 2) Channels and entry points

### Web

- User opens in-app chat.
- Frontend sends message with authenticated user session.
- Backend resolves `organization_id` from auth context.

### WhatsApp

- Operator sends message to business WhatsApp number.
- Webhook receives message and resolves which tenant (operator org) the sender belongs to.
- Message is routed to the same orchestration service used by web chat.

## 3) Orchestration flow (single flow for both channels)

1. Normalize input (remove noise, keep user intent).
2. Classify intent:
   - `faq`
   - `status_lookup` (pending work, pipeline stage, reminders)
   - `update_request` (price, stage, assignment)
3. Retrieve relevant context from RAG sources using tenant filter.
4. Build answer draft with citations/source references.
5. If the user asked for update actions:
   - ask confirmation,
   - run validated tool,
   - return result + what changed.
6. Save conversation + retrieval trace + action trace to audit log.

## 4) RAG data layers

Use 3 layers for strong, practical answers:

1. **Global product FAQs** (shared docs)  
   Examples: how to create a trip, what lifecycle stages mean.

2. **Tenant-specific operating content** (tenant private)  
   Examples: that operator's templates, terms, cancellation rules, payment policy.

3. **Live business snapshots** (tenant private)  
   Examples: trips, client stages, pending notifications, driver mapping health.

## 5) Multi-tenant isolation rules (mandatory)

- Every retrieval query must include `organization_id` filter or namespace.
- Never run unscoped query in vector retrieval.
- Never run action tools without `organization_id` checks.
- Keep per-tenant chat memory partitioned.
- Audit every request with `organization_id`, `user_id`, `channel`.

## 6) Action model for safe updates

Use "propose -> confirm -> execute" for all write operations.

### Example: update itinerary price

1. User: "Set Bali honeymoon package to 1800 dollars".
2. Bot: "I found 2 matching trips. Do you want trip X for client Y?"
3. User confirms exact item.
4. Bot sends validated tool payload:
   - `organization_id`
   - `trip_id` or `itinerary_id`
   - `new_price`
   - `currency`
5. Backend executes transaction and logs before/after values.
6. Bot confirms update in plain language.

## 7) Suggested action tools (phase 1)

- `get_pending_items`
- `get_client_stage_summary`
- `get_trip_status`
- `update_itinerary_price` (with confirmation)
- `move_client_stage` (with confirmation)
- `assign_driver` (with confirmation)

## 8) WhatsApp specific notes

- Keep responses short and clear.
- For risky updates, require explicit "YES" confirmation.
- Support retries and duplicate webhook protection via idempotency key.
- Maintain same business logic between web and WhatsApp to avoid drift.

## 9) Answer style for tour operators

- Friendly and direct.
- Non-technical words.
- Show next action in one line.
- If data missing, ask one clear follow-up question.

## 10) Rollout plan

### Phase A - FAQ RAG only

- Ingest `faq/faq_tour_operator.jsonl`.
- Enable read-only Q/A in web and WhatsApp.

### Phase B - Live status answers

- Add read-only tools for pending items, stage summaries, and reminders.

### Phase C - Controlled updates

- Add update tools with confirm step + audit entries.

### Phase D - Hardening

- Add rate limiting per tenant.
- Add anomaly detection for repeated failed updates.
- Add monthly audit export for admin.
