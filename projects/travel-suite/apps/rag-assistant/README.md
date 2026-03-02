# Tour Operator RAG Assistant (Web + WhatsApp)

This folder is fully isolated from the existing app code and is safe to iterate on without touching current production features.

## What this contains

- `docs/architecture.md` - multi-tenant RAG architecture and rollout plan for web chat + WhatsApp chat.
- `faq/faq_tour_operator.md` - human-readable FAQ set written for tour operators in simple language.
- `faq/faq_tour_operator.jsonl` - RAG-ready FAQ chunks for ingestion.
- `prompts/system_prompt.md` - assistant behavior rules for friendly, safe, action-oriented replies.
- `schemas/chat_action.schema.json` - action payload contract for controlled updates (example: update itinerary price).

## Product intent this supports

The assistant lets each tour operator ask business questions naturally, such as:

- "What is pending today?"
- "Update day 3 hotel in the Paris itinerary"
- "Change itinerary price to 1500 USD"
- "Which clients are in payment pending stage?"

It works in both channels:

- In-app web chat
- WhatsApp chat

while enforcing tenant isolation so one operator never sees another operator's data.

## Suggested next implementation order

1. Build ingestion for `faq/faq_tour_operator.jsonl` into your vector store with `tenant_id` metadata.
2. Add retrieval + answer route for web chat.
3. Connect WhatsApp inbound to the same orchestrator.
4. Enable action tools with explicit confirmation flow for updates.
5. Log all retrieval and tool decisions to an audit table.
