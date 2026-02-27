# Social Studio V2 - Complete Rebuild Plan

## Context

Tour operators currently spend significant money on graphic designers for social media marketing posters/flyers. The existing Social Studio (`/apps/web/src/app/social/page.tsx`, 1,072 lines) has 30 basic templates + 4 pro templates but suffers from critical gaps: company data is hardcoded (`companyName: "GoBuddy Adventures"`), reviews are mock data, there's no database persistence, no social media auto-posting, no carousel support, and no WhatsApp photo integration. This rebuild transforms Social Studio into the **primary revenue driver** - a self-service content creation + publishing platform that makes tour operators' social marketing effortless and professional.

**Estimated total monthly infrastructure cost for 100 active orgs: ~$54/month**

### Decisions
- **Build all 4 phases together** (not incremental) - ship the complete feature
- **AI images**: Free tier gets Unsplash/Pexels, premium tiers (Business/Enterprise) unlock Stability AI SDXL
- **Meta Developer**: Needs setup - guidance included in Phase 3

### Build Order (All Phases, Sequential Dependencies)
1. **Database migration** (5 new tables + storage bucket) - [DONE]
2. **Lib utilities** (template-registry, indian-calendar, color-utils, types) - [DONE]
3. **Template layouts** (8 layout components + 4 shared components) - [DONE]
4. **Page decomposition** (server component + 8 client components) - [DONE]
5. **API routes** (posts CRUD, ai-poster, reviews, publish, schedule, OAuth, queue) - [DONE]
6. **WhatsApp webhook extension** (image parsing + download) - [DONE]
7. **Cron jobs** (social queue processor, token refresh) - [DONE]
8. **Wire PortalReview.tsx** to social_reviews - [DONE]
9. **Tier gating** in billing/tiers.ts - [DONE]
10. **UI/UX Gap Fixes** (festival banner, brand color, publish kit, search, aspect ratio, phone mockup, post history, platform status bar, caption tone/hashtags) - [DONE - 2026-02-27]
11. **Template Registry Expansion** (6 → 30+ templates) - [DONE - 2026-02-27]

---

## Gap Analysis — Identified 2026-02-27

After auditing the implemented code against the tracker, the following gaps were found and fixed:

### Gaps Fixed (2026-02-27)

| Gap | File | Fix Applied |
|-----|------|-------------|
| `getUpcomingFestivals()` never called — festival banner missing | `TemplateGallery.tsx` | Festival urgency banner wired at top of gallery |
| `color-utils.ts` never imported anywhere | `TemplateEditor.tsx`, layouts | Brand Color toggle added; org `primary_color` applied to templates |
| No "Save Draft" button in UI (API existed) | `TemplateGallery.tsx` | Save Draft added to template card actions |
| No post history view | `SocialStudioClient.tsx` | "Post History" tab added with `PostHistory` component |
| No platform connection status visible | `SocialStudioClient.tsx` | `PlatformStatusBar` added below header |
| Template cards only had Download HQ on hover | `TemplateGallery.tsx` | `PublishKitDrawer` replaces hover — Download + Save + Schedule + Publish |
| Aspect ratios hardcoded 1080x1080 | `TemplateGallery.tsx` | 1:1 / 4:5 / Story switcher per card |
| Template search input missing | `TemplateGallery.tsx` | Search bar added above category pills |
| No tier lock icons on Pro/Business templates | `TemplateGallery.tsx` | Lock badge overlay on locked templates |
| Caption tone fixed — no selector | `CaptionEngine.tsx` + `SocialStudioClient.tsx` | Tone chips: Luxury / Budget / Adventure / Family / Corporate |
| Hashtag packs not grouped by reach | `CaptionEngine.tsx` | Three hashtag packs with copy-all buttons |
| Template preview in abstract grid — no phone context | `TemplateGallery.tsx` | Instagram phone mockup wrapper on selected template |
| Reviews → Templates bridge lost context | `ReviewsToInsta.tsx` | Pre-filters gallery, auto-populates review fields |
| Template registry had only 6 entries | `template-registry.ts` | Expanded to 30+ across all categories |

---

## Phase 1: Template Engine + Auto-Branding + Persistence - 2-3 weeks

> This alone is monetizable - tour operators get professional, auto-branded templates instantly.

### 1.1 Decompose Monolithic Page

Break `/apps/web/src/app/social/page.tsx` (1,072 lines) into modules:

```
/apps/web/src/app/social/
  page.tsx                         -- Server component: auth + org data fetch
  _components/
    SocialStudioClient.tsx         -- Main client orchestrator
    TemplateGallery.tsx            -- Grid with category filters + search
    TemplateEditor.tsx             -- Left sidebar: edit template fields
    TemplatePreview.tsx            -- Live preview + export buttons
    TemplateRenderer.tsx           -- 1080x1080 render wrapper (html-to-image)
    MediaLibrary.tsx               -- Image picker (uploads + Unsplash)
    CaptionEngine.tsx              -- AI caption generator (existing, extracted)
    PosterExtractor.tsx            -- AI poster analyzer (existing, extracted)
    PublishKitDrawer.tsx           -- NEW: slide-over publish panel [ADDED]
    PostHistory.tsx                -- NEW: saved posts viewer [ADDED]
    PlatformStatusBar.tsx          -- NEW: IG/FB connection status [ADDED]

/apps/web/src/lib/social/
    template-registry.ts           -- All template definitions (data-driven)
    indian-calendar.ts             -- Festival dates + auto-surfacing logic
    color-utils.ts                 -- Brand color palette from org primary_color
    types.ts                       -- Shared TypeScript interfaces

/apps/web/src/components/social/templates/
    layouts/                       -- CenterLayout, SplitLayout, BottomLayout,
                                   -- ElegantLayout, ReviewLayout, CarouselSlideLayout
    shared/                        -- BrandFooter, BrandHeader, StarRating, PriceTag
```

### 1.2 Auto-Branding System

**Problem**: Currently hardcodes `companyName: "GoBuddy Adventures"`, `contactNumber: "+91 85534 40021"`

**Fix**: Server component fetches org data, passes as props:
- `organizations` table already has: `name`, `logo_url`, `primary_color`
- `profiles` table has: `phone_normalized` for admin contact number
- On page load, auto-populate ALL template fields from org profile

**Dynamic Color Theming**: Use `colord` library (~3KB, zero deps) to generate full palette from org's `primary_color`:
- Primary, light, dark variants
- Complementary & analogous colors
- Text contrast color (auto white/black)
- Background gradients derived from brand color
- **Status**: `color-utils.ts` implemented. Brand Color toggle wired in `TemplateEditor.tsx`. [DONE - 2026-02-27]

### 1.3 Template Registry (30+ Templates, target 95+)

Data-driven registry instead of inline JSX. Each template definition:
```typescript
{ id, name, category, subcategory, layout, tier, dimensions,
  aspectRatio, colorScheme, tags, seasonalAvailability }
```

**Categories & Counts (current → target):**
| Category | Current | Target | Examples |
|----------|---------|--------|---------|
| Festival | 4 | 25 | Diwali (4), Holi (3), Christmas (3), Eid (2), Navratri (2) |
| Season | 4 | 12 | Summer (4), Monsoon (3), Winter (3), Spring (2) |
| Destination | 6 | 12 | Dubai, Bali, Maldives, Kashmir, Kerala, Goa, Europe |
| Package Type | 5 | 12 | Honeymoon (3), Family (3), Adventure (2), Luxury (2) |
| Promotion | 4 | 10 | Flash Sale, Early Bird, Last Minute, Group Discount |
| Review | 3 | 8 | Customer Love, Star Rating, Testimonial Grid |
| Informational | 2 | 6 | Services, Fleet, About Us |
| Carousel | 2 | 10 | Trip Highlights, Multi-Destination, Day-by-Day |

**Status**: Expanded from 6 → 30 templates [DONE - 2026-02-27]. Remaining 65+ templates to be added incrementally.

### 1.4 Indian Festival Calendar

Static JSON (`/lib/social/indian-calendar.ts`) with 25+ festival entries for 2026-2027:
- Each entry: `{ id, name, nameHindi, date, surfaceBeforeDays, templateCategory, tags }`
- `getUpcomingFestivals(daysAhead)` auto-surfaces relevant templates
- Example: "Holi Special Templates" appear 21 days before Holi
- **Status**: Implemented. Now wired in `TemplateGallery.tsx` as urgency banner [DONE - 2026-02-27]

### 1.5 Database - New Tables

**`social_posts`** - Persist created posts (drafts, ready, published, archived)
- `organization_id`, `created_by`, `template_id`, `template_data` (JSONB)
- `caption_instagram`, `caption_facebook`, `hashtags`
- `rendered_image_url` (Supabase Storage), `rendered_image_urls` (carousel)
- `status`: draft → ready → scheduled → publishing → published/failed
- `source`: manual, ai_generated, auto_review, auto_festival, itinerary
- RLS: admins see only their org's posts

**`social_media_library`** - Uploaded + WhatsApp photos
- `organization_id`, `file_path` (Supabase Storage), `source` (upload/whatsapp/unsplash/ai)
- `source_contact_phone`, `caption`, `mime_type`, `tags`
- RLS scoped to org

**Supabase Storage Bucket**: `social-media`
- Paths: `{org_id}/posts/`, `{org_id}/whatsapp/`, `{org_id}/uploads/`
- Max 10MB per file, image/* MIME types

**Migration file**: `supabase/migrations/20260227152017_social_studio_v2.sql` [DONE]

### 1.6 New API Routes (Phase 1)

- `GET /api/social/posts` - list saved posts for org [DONE]
- `POST /api/social/posts` - create/save post (draft or ready) [DONE]
- `PATCH /api/social/posts/[id]` - update post [DONE]
- `DELETE /api/social/posts/[id]` - delete post [DONE]
- `POST /api/social/posts/[id]/render` - render template to PNG, store in Supabase Storage [DONE]

### 1.7 Rendering

Keep existing `html-to-image` (`toPng()`) approach - it's free, client-side, and works well.
- 1080x1080 (square), 1080x1350 (4:5 portrait), 1080x1920 (story)
- Scaled preview (1/4 size) for fast UI
- High-res export for download/publish
- **Aspect ratio switcher** added to TemplateGallery UI [DONE - 2026-02-27]

---

## Phase 2: Review Pipeline + AI Poster Creation + Carousel - 2-3 weeks

### 2.1 Review-to-Social Pipeline

**Problem**: Reviews in Social Studio are hardcoded mock data. Real reviews exist in `marketplace_reviews` and `PortalReview.tsx` component.

**New table: `social_reviews`** [DONE]
- Aggregates reviews from: client portal, marketplace, Google (manual import), manual entry
- Fields: `reviewer_name`, `trip_name`, `destination`, `rating`, `comment`, `source`, `is_featured`

**Wire up real reviews:** [DONE]
1. Modify `PortalReview.tsx` onSubmit to also insert into `social_reviews`
2. Import existing `marketplace_reviews` via `/api/social/reviews/import`
3. Replace hardcoded mock data with real database query

**Auto-generate review posters**: When a 4+ star review comes in:
1. Auto-select best review template
2. Populate with reviewer name, comment, trip, org branding
3. Save as draft `social_posts` entry with `source: 'auto_review'`
4. Notify admin: "New review poster ready for publishing!"
- **Status**: Draft save wired. UI notification badge TODO.

**AI-enhanced review formatting** (Groq ~$0.006) [DONE]

**Review → Template bridge**: Pre-filters gallery to ReviewLayout templates + auto-populates review data [DONE - 2026-02-27]

### 2.2 AI Poster Creation (Cheapest Approach)

**Primary path (~$0.007/poster):** [DONE]

**New API route: `POST /api/social/ai-poster`** [DONE]

**Premium path (Business/Enterprise only):** Stability AI SDXL [PENDING - needs STABILITY_API_KEY env]

| Approach | Cost | Tier | Use Case |
|----------|------|------|----------|
| Groq text + Unsplash image | ~$0.007 | Free/Pro | 95% of use cases |
| Groq text + Stability AI image | ~$0.010 | Business+ | Unique custom visuals |
| Gemini caption generation | $0 (free tier) | All | Caption add-on |

### 2.3 Carousel Editor [DONE]

Multi-slide posts (Instagram allows up to 10 images per carousel).
`CarouselBuilder` component with drag-to-reorder, per-slide editing.

### 2.4 New API Routes (Phase 2) [ALL DONE]

- `GET /api/social/reviews`
- `POST /api/social/reviews`
- `POST /api/social/reviews/import`
- `POST /api/social/ai-poster`

---

## Phase 3: Social Media Auto-Posting + Scheduling - 2-3 weeks

### 3.1 Platform Integration (All FREE - Direct Meta Graph API) [API routes done, UI added]

**Instagram Graph API** - Container-based posting [API DONE]
**Facebook Graph API** - Page posting [API DONE]

### 3.2 Meta Developer Account Setup (Pre-requisite) [PENDING - manual step]

Since you don't have this yet, here's what's needed:

1. **Create Meta Developer Account**: https://developers.facebook.com/ (free)
2. **Create a Facebook App**: Type = "Business", add "Instagram Graph API" and "Facebook Login" products
3. **Link Facebook Page**: Your business Facebook Page must be linked to an Instagram Professional Account
4. **Request Permissions**: Submit for App Review requesting:
   - `instagram_basic` - read profile info
   - `instagram_content_publish` - publish images/carousels
   - `pages_manage_posts` - post to Facebook pages
   - `pages_read_engagement` - read engagement metrics
5. **App Review** takes ~2-5 business days
6. **Environment variables to add**:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_secret
   META_REDIRECT_URI=https://yourdomain.com/api/social/oauth/callback
   ```

### 3.3 OAuth Flow & Token Storage [DONE]

**New table: `social_connections`** [DONE]
**OAuth routes**: `/api/social/oauth/facebook`, `/api/social/oauth/callback` [DONE]
**Platform status bar** in UI showing connection state [DONE - 2026-02-27]

### 3.4 Publishing & Scheduling [DONE]

**`POST /api/social/publish`** [DONE]
**`POST /api/social/schedule`** [DONE]
**`POST /api/social/process-queue`** cron [DONE]
**`POST /api/social/refresh-tokens`** cron [DONE]
**PublishKitDrawer UI**: Opens from template card — platform selector, schedule picker, publish CTA [DONE - 2026-02-27]

**Vercel Cron setup** (add to `vercel.json`):
```json
{
  "crons": [
    { "path": "/api/social/process-queue", "schedule": "*/5 * * * *" },
    { "path": "/api/social/refresh-tokens",  "schedule": "0 0 * * *" }
  ]
}
```

---

## Phase 4: WhatsApp Photo Integration + Analytics - 1-2 weeks

### 4.1 WhatsApp Photo Capture [DONE]

`parseWhatsAppImageMessages()` in `/lib/whatsapp.server.ts`
Image download → Supabase Storage → `social_media_library` insert

### 4.2 Media Library UI [DONE]

"Media Library" tab in Social Studio — WhatsApp photos, uploads, Unsplash.
Tab source filters: All / WhatsApp Photos / Direct Uploads

### 4.3 Basic Analytics [DONE - mock data, real Graph API metrics pending]

Stat cards: Total Posts, Published, Scheduled, WhatsApp Media
Platform breakdown bar
Post reach trend chart
**TODO**: Pull real engagement metrics from Meta Graph API after OAuth setup

### 4.4 Remaining Templates

Fill up to 95+ total templates, polish designs, add aspect ratio variants.
**Status**: 30 templates added. 65+ remaining to fill. [IN PROGRESS]

---

## UI/UX Improvements Applied (2026-02-27)

These improvements were identified as gaps between the "liked but not loved" baseline and a production-quality tool:

### Applied
- **Festival Urgency Banner** — `getUpcomingFestivals()` wired, shows countdown + template count
- **Brand Color Toggle** — `color-utils.ts` now used; generates 6-color palette from org `primary_color`
- **PublishKitDrawer** — Replaces hover Download HQ; shows caption preview, platform selector, schedule picker
- **Platform Status Bar** — Persistent IG/FB connection status strip below header
- **Template Search** — Search input above category pills in gallery
- **Tier Lock Badges** — Pro/Business templates show lock icon overlay with upgrade hint
- **Aspect Ratio Switcher** — Per-template 1:1 / 4:5 / Story (9:16) toggle
- **Save Draft** — Direct save from template card to `social_posts` table
- **Post History Tab** — New tab with `PostHistory` component, lists/manages saved drafts
- **Caption Tone Selector** — Tone chips passed to AI: Luxury / Budget / Adventure / Family / Corporate / Playful
- **Hashtag Packs** — Three grouped packs (Broad / Niche / Local India) with one-click copy-all
- **Instagram Phone Mockup** — Selected template wrapped in phone frame for feed context
- **Review Bridge** — `ReviewsToInsta` "Design Post" pre-filters to ReviewLayout + populates data

### Remaining UI/UX (Future)
- `[ ]` Stability AI image tab for Business+ tier
- `[ ]` Engagement metric pull from Meta Graph API (post-OAuth setup)
- `[ ]` "Export Pack" ZIP download for multiple selected templates
- `[ ]` Content calendar view in Analytics (dots on days posts published)
- `[ ]` Auto-review notification badge on Reviews tab when new draft appears
- `[ ]` Scroll-sync carousel template browser (Instagram-style swipe)
- `[ ]` WhatsApp setup onboarding wizard

---

## Subscription Tier Gating (Revenue Strategy)

| Feature | Starter (Free) | Pro (3,499/mo) | Business (10,999/mo) | Enterprise |
|---------|:-:|:-:|:-:|:-:|
| Basic templates | 10 | All 95+ | All 95+ | All + custom |
| Festival templates | 3 per festival | All | All | All |
| Auto-branding | Yes | Yes | Yes | Yes |
| Carousel templates | None | Up to 5 slides | Up to 10 slides | Unlimited |
| AI poster creation | 5/month | 50/month | 200/month | Unlimited |
| AI captions | 10/month | Unlimited | Unlimited | Unlimited |
| Review-to-social | Manual only | Auto-generate | Auto + publish | All |
| Instagram auto-post | None | Manual publish | Scheduled auto-post | All + API |
| Facebook auto-post | None | Manual publish | Scheduled auto-post | All + API |
| WhatsApp photos | None | 50 photos | Unlimited | All |
| Media library | 100MB | 1GB | 5GB | 25GB |
| Post history | Last 10 | Unlimited | Unlimited + analytics | All |

---

## Environment Variables Checklist

```bash
# Required (free)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=

# Required for AI features
GROQ_API_KEY=                        # Already set (used for captions)
GEMINI_API_KEY=                      # Already set (used for poster extraction)

# Phase 3 — Meta/Instagram
META_APP_ID=                         # After Meta Developer App creation
META_APP_SECRET=
META_REDIRECT_URI=https://yourdomain.com/api/social/oauth/callback

# Optional — Business+ tier only
STABILITY_API_KEY=                   # Stability AI SDXL for custom hero images

# Supabase Storage
# Bucket: social-media (create in Supabase dashboard)
# RLS: authenticated users access own org folder only
```

## Setup Checklist

- [x] Database migration applied (`20260227152017_social_studio_v2.sql`)
- [ ] Supabase Storage bucket `social-media` created (public read, 10MB limit)
- [ ] `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` added to `.env.local`
- [ ] Meta Developer App created (for Phase 3 auto-posting)
- [ ] Vercel Cron jobs configured in `vercel.json`
- [ ] WhatsApp webhook extended for image messages
- [ ] `STABILITY_API_KEY` added for Business+ tier

---

## Cost Per API/Service

| Service | Cost | Used For |
|---------|------|----------|
| html-to-image (client-side) | $0 | All template rendering |
| Groq LLaMA 3.1 8B | ~$0.006/req | AI poster creation, review formatting |
| Gemini 2.0 Flash | $0 (1500 req/day free) | Poster extraction, captions |
| Unsplash/Pexels/Pixabay | $0 (free tier) | Hero images |
| Meta Graph API (IG+FB) | $0 | Auto-posting |
| WhatsApp Cloud API | $0 (media download) | Photo capture |
| Supabase Storage | ~$0.021/GB/mo after 1GB free | Image storage |
| Stability AI SDXL (optional) | ~$0.004/image | Premium AI hero images |
| `colord` npm package | $0 (3KB, zero deps) | Brand color palette |

**Total infrastructure cost for 100 active orgs: ~$54/month**

---

## Critical Files Modified

| File | Change |
|------|--------|
| `apps/web/src/app/social/_components/SocialStudioClient.tsx` | Platform status bar, Post History tab, caption tone state |
| `apps/web/src/app/social/_components/TemplateGallery.tsx` | Festival banner, search, tier badges, aspect ratio switcher, publish kit, phone mockup |
| `apps/web/src/app/social/_components/TemplateEditor.tsx` | Brand color toggle using color-utils |
| `apps/web/src/app/social/_components/CaptionEngine.tsx` | Tone selector, hashtag packs with copy-all |
| `apps/web/src/app/social/_components/ReviewsToInsta.tsx` | Review bridge pre-filters gallery + populates fields |
| `apps/web/src/lib/social/template-registry.ts` | Expanded from 6 → 30+ templates |

## New Files Created

| File | Purpose |
|------|---------|
| `apps/web/src/app/social/_components/PublishKitDrawer.tsx` | Slide-over publish panel |
| `apps/web/src/app/social/_components/PostHistory.tsx` | Saved posts viewer/manager |
| `apps/web/src/app/social/_components/PlatformStatusBar.tsx` | IG/FB connection status strip |

## Verification Plan

1. **Phase 1**: Create a post with auto-populated org branding → save as draft → reload page → draft persists → download PNG → verify logo/phone/colors match org settings
2. **Phase 2**: Submit a review via client portal → verify it appears in Social Studio reviews tab → click "Create Post" → verify poster generates with real review data → test AI poster with prompt → verify Unsplash image auto-selected
3. **Phase 3**: Connect Instagram via OAuth → create a post → click "Publish to Instagram" → verify post appears on Instagram → schedule a post for 5 min later → verify it auto-publishes
4. **Phase 4**: Send a photo via WhatsApp to the business number → verify it appears in Media Library → use it as hero image in a template → export
