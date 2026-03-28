# Suite S16: WhatsApp — Inbox & Messaging UI

**Category**: Functional
**Duration**: ~4 min
**Requires Auth**: Yes

## What It Tests

Verifies the WhatsApp inbox experience: conversation list loads, clicking a conversation shows the compose area with "Type a message..." placeholder, action buttons (Send Itinerary, Send PDF) are present, and the broadcast tab is accessible.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Step 1: Navigate to Inbox ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s16-whatsapp/inbox-list.png"

# Check conversation list is visible
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasConversations: document.querySelectorAll('[data-testid=\"conversation-item\"], [role=\"listitem\"], .conversation-item, [class*=\"conversation\"]').length > 0, hasSearchBar: !!document.querySelector('input[placeholder*=\"Search\" i], input[type=\"search\"]'), pageTitle: document.title })"

# --- Step 2: Click first conversation ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const items = document.querySelectorAll('[data-testid=\"conversation-item\"], [role=\"listitem\"], [class*=\"conversation\"]'); if (items.length > 0) { items[0].click(); return 'clicked first conversation'; } return 'no conversations found'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 1500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s16-whatsapp/conversation-open.png"

# Check compose area is visible
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasComposeArea: !!document.querySelector('textarea, [contenteditable], input[placeholder*=\"Type\" i], input[placeholder*=\"message\" i]'), composeText: document.querySelector('textarea, [contenteditable], input[placeholder*=\"Type\" i], input[placeholder*=\"message\" i]')?.placeholder || 'not found' })"

# --- Step 3: Check action buttons ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasSendItinerary: document.body.innerText.includes('Send Itinerary') || document.body.innerText.includes('Itinerary'), hasSendPDF: document.body.innerText.includes('Send PDF') || document.body.innerText.includes('PDF'), allButtons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 15) })"

# --- Step 4: Test broadcast tab ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox?mode=broadcast"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli snapshot
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s16-whatsapp/broadcast-tab.png"

# Check broadcast UI elements
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ hasBroadcastUI: document.body.innerText.includes('Broadcast') || document.body.innerText.includes('broadcast'), url: window.location.href, hasError: document.body.innerText.includes('Something went wrong') })"

# Check for console errors
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli console error
```

## Pass Criteria

- Inbox loads with conversation list or empty state
- Clicking a conversation shows compose area with message input
- Action buttons (Send Itinerary, Send PDF) are accessible
- Broadcast tab loads without errors
- No console errors during inbox interaction

## Issue Detection

- **P0 Critical**: Inbox page shows error boundary
- **P1 High**: Compose area not found — cannot send messages
- **P1 High**: Broadcast tab crashes or shows error
- **P2 Medium**: Action buttons missing (Send Itinerary, Send PDF)
- **P2 Medium**: Conversation click does not open detail view
- **P3 Low**: Search bar missing or non-functional
- Reference: severity-rules.md
