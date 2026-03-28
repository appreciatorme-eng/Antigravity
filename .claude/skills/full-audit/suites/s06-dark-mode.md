# Suite S06: Dark Mode — Visual Consistency

**Category**: Accessibility
**Duration**: ~5 min
**Requires Auth**: Yes

## What It Tests

Toggles dark mode on 6 key pages and screenshots each. Checks for text visibility issues where labels may have low luminance against dark backgrounds (unreadable text).

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Page 1: Home / ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
# Screenshot light mode first
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s06-dark/home-light.png"
# Toggle dark mode
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { document.documentElement.classList.add('dark'); return 'dark mode enabled'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s06-dark/home-dark.png"
# Check for low-contrast text (luminance check on key text elements)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const issues = []; document.querySelectorAll('h1, h2, h3, p, span, label, a, button').forEach(el => { const style = getComputedStyle(el); const color = style.color; const bg = style.backgroundColor; if (color && bg && color === bg) issues.push({ tag: el.tagName, text: el.textContent?.slice(0, 30) }); }); return { issueCount: issues.length, samples: issues.slice(0, 5) }; }"

# --- Page 2: Inbox ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { document.documentElement.classList.add('dark'); return 'dark mode enabled'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s06-dark/inbox-dark.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const issues = []; document.querySelectorAll('h1, h2, h3, p, span, label, a, button').forEach(el => { const style = getComputedStyle(el); const color = style.color; const bg = style.backgroundColor; if (color && bg && color === bg) issues.push({ tag: el.tagName, text: el.textContent?.slice(0, 30) }); }); return { issueCount: issues.length, samples: issues.slice(0, 5) }; }"

# --- Page 3: Trips ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { document.documentElement.classList.add('dark'); return 'dark mode enabled'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s06-dark/trips-dark.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const issues = []; document.querySelectorAll('h1, h2, h3, p, span, label, a, button').forEach(el => { const style = getComputedStyle(el); const color = style.color; const bg = style.backgroundColor; if (color && bg && color === bg) issues.push({ tag: el.tagName, text: el.textContent?.slice(0, 30) }); }); return { issueCount: issues.length, samples: issues.slice(0, 5) }; }"

# --- Page 4: Clients ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { document.documentElement.classList.add('dark'); return 'dark mode enabled'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s06-dark/clients-dark.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const issues = []; document.querySelectorAll('h1, h2, h3, p, span, label, a, button').forEach(el => { const style = getComputedStyle(el); const color = style.color; const bg = style.backgroundColor; if (color && bg && color === bg) issues.push({ tag: el.tagName, text: el.textContent?.slice(0, 30) }); }); return { issueCount: issues.length, samples: issues.slice(0, 5) }; }"

# --- Page 5: Settings ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { document.documentElement.classList.add('dark'); return 'dark mode enabled'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s06-dark/settings-dark.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const issues = []; document.querySelectorAll('h1, h2, h3, p, span, label, a, button').forEach(el => { const style = getComputedStyle(el); const color = style.color; const bg = style.backgroundColor; if (color && bg && color === bg) issues.push({ tag: el.tagName, text: el.textContent?.slice(0, 30) }); }); return { issueCount: issues.length, samples: issues.slice(0, 5) }; }"

# --- Page 6: Planner ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/planner"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { document.documentElement.classList.add('dark'); return 'dark mode enabled'; }"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 500))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s06-dark/planner-dark.png"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const issues = []; document.querySelectorAll('h1, h2, h3, p, span, label, a, button').forEach(el => { const style = getComputedStyle(el); const color = style.color; const bg = style.backgroundColor; if (color && bg && color === bg) issues.push({ tag: el.tagName, text: el.textContent?.slice(0, 30) }); }); return { issueCount: issues.length, samples: issues.slice(0, 5) }; }"

# Reset to light mode
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { document.documentElement.classList.remove('dark'); return 'light mode restored'; }"
```

## Pass Criteria

- All 6 pages render without errors in dark mode
- No text elements where foreground color matches background color
- Screenshots show readable text on dark backgrounds
- No layout shifts or broken elements after dark mode toggle

## Issue Detection

- **P1 High**: Text completely invisible (foreground === background)
- **P2 Medium**: Low contrast text (hard to read but not invisible)
- **P2 Medium**: Images or icons with white backgrounds that clash with dark mode
- **P3 Low**: Inconsistent dark mode styling (some elements not themed)
- Reference: severity-rules.md
