# Starter Runtime (Isolated)

This is a minimal runnable scaffold for your multi-tenant RAG assistant.

It demonstrates:

- Tenant-safe retrieval from FAQ JSONL.
- Unified handling for web and WhatsApp messages.
- Confirm-before-update action flow.
- Audit event logging.

## Files

- `index.js` - runnable demo sequence.
- `orchestrator.js` - core message flow.
- `retrieval.js` - FAQ retrieval logic (replace with vector DB retrieval in production).
- `actions.js` - proposal, confirmation, execution stubs for updates.
- `audit.js` - JSONL audit writer for local demo.
- `sql/audit_tables.sql` - SQL template for audit table.

## Run demo

```bash
node rag-assistant/starter/index.js
```

The demo shows:

1. FAQ/status answer for "What is pending today?"
2. Update proposal for itinerary price
3. Action execution after explicit `yes`

## Production wiring checklist

1. Replace `retrieval.js` with your vector DB calls and `organization_id` filter.
2. Replace `executeAction` in `actions.js` with real transactional updates.
3. Replace local JSONL audit with DB writes to `chat_audit_events`.
4. Connect your web chat route and WhatsApp webhook route to `handleMessage`.
