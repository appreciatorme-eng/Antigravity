# Severity Classification Rules

Auto-classify issues found during audit into P0-P3 based on these detection patterns.

## P0 CRITICAL — Blocks Usage

| Signal | Detection | Example |
|--------|-----------|---------|
| Page crash | `document.body.innerText.includes('Something went wrong')` | Error boundary triggered |
| Auth bypass | Unauthenticated request reaches protected content (no redirect to `/auth`) | `/bookings` loads without login |
| Render crash | `console error` contains `TypeError` or `ReferenceError` in render path | `Cannot read properties of undefined` |
| API 500 | `fetch()` returns status 500 | Server error on critical endpoint |
| Data loss risk | Form submit silently fails (no error, no success, data gone) | Invoice creation loses line items |

## P1 HIGH — Broken Feature

| Signal | Detection | Example |
|--------|-----------|---------|
| Dead button | Button click produces no response (no navigation, no modal, no API call) | Quick Quote FAB action |
| API 400/404 on load | `console error` shows 400/404 for page's own API calls | `/api/trips/new` returns 400 |
| Form broken | Submit with valid data fails silently or shows wrong error | Create Proposal with no clients |
| Missing feature | Expected element not in snapshot (e.g., nav missing, form missing) | Admin page without mobile nav |
| Dark mode unreadable | Label luminance < 80 on dark background (text effectively invisible) | Settings form labels in dark mode |

## P2 MEDIUM — Cosmetic / UX

| Signal | Detection | Example |
|--------|-----------|---------|
| Horizontal overflow | `document.body.scrollWidth > window.innerWidth` | Page scrolls horizontally on mobile |
| Missing aria-label | Interactive element has no text, no `aria-label`, no `title` | Icon-only button without label |
| Low contrast | Text luminance difference < 4.5:1 against background (WCAG AA) | `text-slate-500` on `#0a1628` |
| Touch target too small | Button/link dimensions < 44x44px | 22px dismiss button |
| Slow page | `loadEventEnd - navigationStart > 1000ms` | Social Studio at 1294ms |
| Modal overlap | Fixed-position element covers modal content | AI FAB over form fields |

## P3 LOW — Polish

| Signal | Detection | Example |
|--------|-----------|---------|
| Heading skip | h1 followed by h3 (skipping h2) | KPI cards using h3 after page h1 |
| Missing alt text | `<img>` without `alt` attribute (decorative images excluded) | Background image without alt |
| Style mismatch | Button color doesn't match app theme | Gold button in green theme |
| Minor spacing | Element spacing inconsistent but not broken | Tabs too tight at 390px |
| Browser native validation | Uses browser default instead of custom styled errors | Login form validation popover |
| No password toggle | Password field lacks show/hide button | Auth form |
