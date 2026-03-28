# Suite S15: Image Assets — Broken Images and Missing Alt Text

**Category**: Functional
**Duration**: ~3 min
**Requires Auth**: Yes

## What It Tests

Checks all `<img>` elements across key pages for: loaded status (`complete && naturalWidth > 0`), alt text presence, and broken images. Reports broken images and accessibility gaps.

## Commands

```bash
# Prerequisite: authenticated session
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli state-load "$OUTDIR/auth-state.json"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844

# --- Page 1: Home ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')); const results = imgs.map(img => ({ src: img.src?.slice(-60), loaded: img.complete && img.naturalWidth > 0, hasAlt: !!img.alt, alt: img.alt?.slice(0, 40) || '', width: img.naturalWidth, height: img.naturalHeight })); const broken = results.filter(r => !r.loaded); const noAlt = results.filter(r => !r.hasAlt); return { page: '/', totalImages: results.length, broken: broken.length, brokenList: broken.slice(0, 5), missingAlt: noAlt.length, missingAltList: noAlt.slice(0, 5) }; }"

# --- Page 2: Inbox ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/inbox"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')); const results = imgs.map(img => ({ src: img.src?.slice(-60), loaded: img.complete && img.naturalWidth > 0, hasAlt: !!img.alt, alt: img.alt?.slice(0, 40) || '' })); const broken = results.filter(r => !r.loaded); const noAlt = results.filter(r => !r.hasAlt); return { page: '/inbox', totalImages: results.length, broken: broken.length, brokenList: broken.slice(0, 5), missingAlt: noAlt.length }; }"

# --- Page 3: Trips ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/trips"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')); const results = imgs.map(img => ({ src: img.src?.slice(-60), loaded: img.complete && img.naturalWidth > 0, hasAlt: !!img.alt, alt: img.alt?.slice(0, 40) || '' })); const broken = results.filter(r => !r.loaded); const noAlt = results.filter(r => !r.hasAlt); return { page: '/trips', totalImages: results.length, broken: broken.length, brokenList: broken.slice(0, 5), missingAlt: noAlt.length }; }"

# --- Page 4: Clients ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/clients"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')); const results = imgs.map(img => ({ src: img.src?.slice(-60), loaded: img.complete && img.naturalWidth > 0, hasAlt: !!img.alt, alt: img.alt?.slice(0, 40) || '' })); const broken = results.filter(r => !r.loaded); const noAlt = results.filter(r => !r.hasAlt); return { page: '/clients', totalImages: results.length, broken: broken.length, brokenList: broken.slice(0, 5), missingAlt: noAlt.length }; }"

# --- Page 5: Settings ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/settings"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')); const results = imgs.map(img => ({ src: img.src?.slice(-60), loaded: img.complete && img.naturalWidth > 0, hasAlt: !!img.alt, alt: img.alt?.slice(0, 40) || '' })); const broken = results.filter(r => !r.loaded); const noAlt = results.filter(r => !r.hasAlt); return { page: '/settings', totalImages: results.length, broken: broken.length, brokenList: broken.slice(0, 5), missingAlt: noAlt.length }; }"

# --- Page 6: Marketplace ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/marketplace"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))"
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const imgs = Array.from(document.querySelectorAll('img')); const results = imgs.map(img => ({ src: img.src?.slice(-60), loaded: img.complete && img.naturalWidth > 0, hasAlt: !!img.alt, alt: img.alt?.slice(0, 40) || '' })); const broken = results.filter(r => !r.loaded); const noAlt = results.filter(r => !r.hasAlt); return { page: '/marketplace', totalImages: results.length, broken: broken.length, brokenList: broken.slice(0, 5), missingAlt: noAlt.length }; }"
```

## Pass Criteria

- Zero broken images across all pages
- All content images have alt text
- No images fail to load (network errors)

## Issue Detection

- **P1 High**: Broken image visible on page — missing asset, bad URL
- **P2 Medium**: Image loads but has no alt text — accessibility violation
- **P2 Medium**: Image is very large (> 1MB) — performance issue
- **P3 Low**: Decorative image without `role="presentation"` — minor a11y
- Reference: severity-rules.md
