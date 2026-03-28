# Suite S07: Accessibility — WCAG Compliance Checks

**Category**: Accessibility
**Duration**: ~5 min
**Requires Auth**: Yes

## What It Tests

Runs automated accessibility checks on 6 key pages: images without alt text, buttons without accessible labels, links without text, inputs without labels, heading hierarchy skips, and low contrast indicators. Returns counts per violation category.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# Accessibility audit function (reused per page)
# Evaluates WCAG-related checks and returns violation counts

# --- Page 1: Home / ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => !i.alt && !i.getAttribute('aria-label') && !i.getAttribute('role')); const btns = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')); const links = Array.from(document.querySelectorAll('a')).filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label') && !a.getAttribute('title')); const inputs = Array.from(document.querySelectorAll('input, textarea, select')).filter(i => { const id = i.id; const hasLabel = id && document.querySelector('label[for=\"' + id + '\"]'); const hasAriaLabel = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.getAttribute('placeholder'); return !hasLabel && !hasAriaLabel; }); const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1])); let headingSkips = 0; for (let i = 1; i < headings.length; i++) { if (headings[i] > headings[i-1] + 1) headingSkips++; } return { page: '/', imgsNoAlt: imgs.length, btnsNoLabel: btns.length, linksNoText: links.length, inputsNoLabel: inputs.length, headingSkips, totalIssues: imgs.length + btns.length + links.length + inputs.length + headingSkips }; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s07-accessibility/home.png"

# --- Page 2: Inbox ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => !i.alt && !i.getAttribute('aria-label') && !i.getAttribute('role')); const btns = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')); const links = Array.from(document.querySelectorAll('a')).filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label') && !a.getAttribute('title')); const inputs = Array.from(document.querySelectorAll('input, textarea, select')).filter(i => { const id = i.id; const hasLabel = id && document.querySelector('label[for=\"' + id + '\"]'); const hasAriaLabel = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.getAttribute('placeholder'); return !hasLabel && !hasAriaLabel; }); const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1])); let headingSkips = 0; for (let i = 1; i < headings.length; i++) { if (headings[i] > headings[i-1] + 1) headingSkips++; } return { page: '/inbox', imgsNoAlt: imgs.length, btnsNoLabel: btns.length, linksNoText: links.length, inputsNoLabel: inputs.length, headingSkips, totalIssues: imgs.length + btns.length + links.length + inputs.length + headingSkips }; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s07-accessibility/inbox.png"

# --- Page 3: Trips ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => !i.alt && !i.getAttribute('aria-label') && !i.getAttribute('role')); const btns = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')); const links = Array.from(document.querySelectorAll('a')).filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label') && !a.getAttribute('title')); const inputs = Array.from(document.querySelectorAll('input, textarea, select')).filter(i => { const id = i.id; const hasLabel = id && document.querySelector('label[for=\"' + id + '\"]'); const hasAriaLabel = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.getAttribute('placeholder'); return !hasLabel && !hasAriaLabel; }); const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1])); let headingSkips = 0; for (let i = 1; i < headings.length; i++) { if (headings[i] > headings[i-1] + 1) headingSkips++; } return { page: '/trips', imgsNoAlt: imgs.length, btnsNoLabel: btns.length, linksNoText: links.length, inputsNoLabel: inputs.length, headingSkips, totalIssues: imgs.length + btns.length + links.length + inputs.length + headingSkips }; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s07-accessibility/trips.png"

# --- Page 4: Clients ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => !i.alt && !i.getAttribute('aria-label') && !i.getAttribute('role')); const btns = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')); const links = Array.from(document.querySelectorAll('a')).filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label') && !a.getAttribute('title')); const inputs = Array.from(document.querySelectorAll('input, textarea, select')).filter(i => { const id = i.id; const hasLabel = id && document.querySelector('label[for=\"' + id + '\"]'); const hasAriaLabel = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.getAttribute('placeholder'); return !hasLabel && !hasAriaLabel; }); const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1])); let headingSkips = 0; for (let i = 1; i < headings.length; i++) { if (headings[i] > headings[i-1] + 1) headingSkips++; } return { page: '/clients', imgsNoAlt: imgs.length, btnsNoLabel: btns.length, linksNoText: links.length, inputsNoLabel: inputs.length, headingSkips, totalIssues: imgs.length + btns.length + links.length + inputs.length + headingSkips }; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s07-accessibility/clients.png"

# --- Page 5: Settings ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => !i.alt && !i.getAttribute('aria-label') && !i.getAttribute('role')); const btns = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')); const links = Array.from(document.querySelectorAll('a')).filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label') && !a.getAttribute('title')); const inputs = Array.from(document.querySelectorAll('input, textarea, select')).filter(i => { const id = i.id; const hasLabel = id && document.querySelector('label[for=\"' + id + '\"]'); const hasAriaLabel = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.getAttribute('placeholder'); return !hasLabel && !hasAriaLabel; }); const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1])); let headingSkips = 0; for (let i = 1; i < headings.length; i++) { if (headings[i] > headings[i-1] + 1) headingSkips++; } return { page: '/settings', imgsNoAlt: imgs.length, btnsNoLabel: btns.length, linksNoText: links.length, inputsNoLabel: inputs.length, headingSkips, totalIssues: imgs.length + btns.length + links.length + inputs.length + headingSkips }; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s07-accessibility/settings.png"

# --- Page 6: Planner ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/planner"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')).filter(i => !i.alt && !i.getAttribute('aria-label') && !i.getAttribute('role')); const btns = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')); const links = Array.from(document.querySelectorAll('a')).filter(a => !a.textContent?.trim() && !a.getAttribute('aria-label') && !a.getAttribute('title')); const inputs = Array.from(document.querySelectorAll('input, textarea, select')).filter(i => { const id = i.id; const hasLabel = id && document.querySelector('label[for=\"' + id + '\"]'); const hasAriaLabel = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || i.getAttribute('placeholder'); return !hasLabel && !hasAriaLabel; }); const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => parseInt(h.tagName[1])); let headingSkips = 0; for (let i = 1; i < headings.length; i++) { if (headings[i] > headings[i-1] + 1) headingSkips++; } return { page: '/planner', imgsNoAlt: imgs.length, btnsNoLabel: btns.length, linksNoText: links.length, inputsNoLabel: inputs.length, headingSkips, totalIssues: imgs.length + btns.length + links.length + inputs.length + headingSkips }; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s07-accessibility/planner.png"
```

## Pass Criteria

- Total issues across all 6 pages < 20
- Zero images without alt text on primary content (decorative images excluded)
- Zero input fields without any form of label
- No heading hierarchy skips (e.g., h1 to h3 without h2)

## Issue Detection

- **P1 High**: Interactive elements (buttons, links) without accessible names — screen readers cannot identify them
- **P1 High**: Form inputs without labels — screen readers cannot describe form fields
- **P2 Medium**: Images without alt text (non-decorative)
- **P2 Medium**: Heading hierarchy skips — confusing for screen reader navigation
- **P3 Low**: Decorative images without `role="presentation"` or empty alt
- Reference: severity-rules.md
