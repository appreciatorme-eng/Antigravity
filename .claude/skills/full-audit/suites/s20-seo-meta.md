# Suite S20: SEO & Meta — Public Page Metadata

**Category**: SEO
**Duration**: ~2 min
**Requires Auth**: No

## What It Tests

Checks public-facing pages (/auth, /pricing, /) for essential SEO metadata: page title, meta description, Open Graph title, and canonical link. These are critical for search engine indexing and social media sharing.

## Commands

```bash
# Use unauth session for public pages
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli open "https://www.tripbuilt.com/" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli resize 390 844 -s=seo

# --- Page 1: Marketing Home (/) ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))" -s=seo

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ page: '/', title: document.title, titleLength: document.title?.length || 0, metaDescription: document.querySelector('meta[name=\"description\"]')?.content || 'MISSING', descriptionLength: (document.querySelector('meta[name=\"description\"]')?.content || '').length, ogTitle: document.querySelector('meta[property=\"og:title\"]')?.content || 'MISSING', ogDescription: document.querySelector('meta[property=\"og:description\"]')?.content || 'MISSING', ogImage: document.querySelector('meta[property=\"og:image\"]')?.content || 'MISSING', canonical: document.querySelector('link[rel=\"canonical\"]')?.href || 'MISSING', viewport: document.querySelector('meta[name=\"viewport\"]')?.content || 'MISSING', charset: document.querySelector('meta[charset]')?.getAttribute('charset') || document.characterEncoding || 'MISSING' })" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s20-seo/home.png" -s=seo

# --- Page 2: Auth (/auth) ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/auth" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))" -s=seo

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ page: '/auth', title: document.title, titleLength: document.title?.length || 0, metaDescription: document.querySelector('meta[name=\"description\"]')?.content || 'MISSING', descriptionLength: (document.querySelector('meta[name=\"description\"]')?.content || '').length, ogTitle: document.querySelector('meta[property=\"og:title\"]')?.content || 'MISSING', ogDescription: document.querySelector('meta[property=\"og:description\"]')?.content || 'MISSING', ogImage: document.querySelector('meta[property=\"og:image\"]')?.content || 'MISSING', canonical: document.querySelector('link[rel=\"canonical\"]')?.href || 'MISSING', viewport: document.querySelector('meta[name=\"viewport\"]')?.content || 'MISSING' })" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s20-seo/auth.png" -s=seo

# --- Page 3: Pricing (/pricing) ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/pricing" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))" -s=seo

export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ page: '/pricing', title: document.title, titleLength: document.title?.length || 0, metaDescription: document.querySelector('meta[name=\"description\"]')?.content || 'MISSING', descriptionLength: (document.querySelector('meta[name=\"description\"]')?.content || '').length, ogTitle: document.querySelector('meta[property=\"og:title\"]')?.content || 'MISSING', ogDescription: document.querySelector('meta[property=\"og:description\"]')?.content || 'MISSING', ogImage: document.querySelector('meta[property=\"og:image\"]')?.content || 'MISSING', canonical: document.querySelector('link[rel=\"canonical\"]')?.href || 'MISSING', viewport: document.querySelector('meta[name=\"viewport\"]')?.content || 'MISSING' })" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli screenshot "$OUTDIR/s20-seo/pricing.png" -s=seo

# --- Additional SEO checks on home page ---
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli goto "https://www.tripbuilt.com/" -s=seo
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => new Promise(r => setTimeout(r, 2000))" -s=seo

# Check structured data (JSON-LD)
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => { const scripts = Array.from(document.querySelectorAll('script[type=\"application/ld+json\"]')); return { hasStructuredData: scripts.length > 0, count: scripts.length, types: scripts.map(s => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'parse error'; } }) }; }" -s=seo

# Check robots meta
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli eval "() => ({ robots: document.querySelector('meta[name=\"robots\"]')?.content || 'NOT SET (defaults to index,follow)', hasH1: document.querySelectorAll('h1').length, h1Text: document.querySelector('h1')?.textContent?.slice(0, 80) || 'MISSING', lang: document.documentElement.lang || 'MISSING' })" -s=seo

# Cleanup
export PATH="$HOME/.npm-global/bin:$PATH" && playwright-cli close -s=seo
```

## Pass Criteria

- All 3 public pages have a non-empty `<title>` (30-60 chars ideal)
- All 3 public pages have `meta[name="description"]` (120-160 chars ideal)
- All 3 public pages have Open Graph tags (og:title, og:description)
- Home page has `<h1>` tag
- Viewport meta tag present on all pages
- `lang` attribute set on `<html>` element

## Issue Detection

- **P1 High**: Missing `<title>` — page will show as "Untitled" in search results
- **P1 High**: Missing meta description — poor search result snippet
- **P2 Medium**: Missing Open Graph tags — poor social media preview
- **P2 Medium**: Missing canonical URL — potential duplicate content issues
- **P2 Medium**: No `<h1>` on page — poor semantic structure for SEO
- **P3 Low**: Title too long (> 60 chars) or description too short (< 120 chars)
- **P3 Low**: Missing structured data (JSON-LD)
- **P3 Low**: Missing `lang` attribute
- Reference: severity-rules.md
