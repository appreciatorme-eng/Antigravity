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

### 1.3 Template Registry (95+ Templates)

Data-driven registry instead of inline JSX. Each template definition:
```typescript
{ id, name, category, subcategory, layout, tier, dimensions,
  aspectRatio, colorScheme, tags, seasonalAvailability }
```

**Categories & Counts:**
| Category | Count | Examples |
|----------|-------|---------|
| Festival | 25 | Diwali (4), Holi (3), Christmas (3), Eid (2), Navratri (2), Ganesh Chaturthi (2), Raksha Bandhan (2), Independence Day (2), Republic Day (2), Onam, Pongal, Baisakhi |
| Season | 12 | Summer (4), Monsoon (3), Winter (3), Spring (2) |
| Destination | 12 | Dubai, Bali, Maldives, Kashmir, Kerala, Goa, Europe, Thailand, Singapore |
| Package Type | 12 | Honeymoon (3), Family (3), Adventure (2), Luxury (2), Corporate (2) |
| Promotion | 10 | Flash Sale, Early Bird, Last Minute, Group Discount, Festive Offer |
| Review | 8 | Customer Love, Star Rating, Testimonial Grid, Before/After |
| Informational | 6 | Services, Fleet, About Us |
| Carousel | 10 | Trip Highlights, Multi-Destination, Day-by-Day, Photo Album |

### 1.4 Indian Festival Calendar

Static JSON (`/lib/social/indian-calendar.ts`) with 25+ festival entries for 2026-2027:
- Each entry: `{ id, name, nameHindi, date, surfaceBeforeDays, templateCategory, tags }`
- `getUpcomingFestivals(daysAhead)` auto-surfaces relevant templates
- Example: "Holi Special Templates" appear 21 days before Holi
- Updated annually (no external API cost)

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

### 1.6 New API Routes (Phase 1)

- `GET /api/social/posts` - list saved posts for org
- `POST /api/social/posts` - create/save post (draft or ready)
- `PATCH /api/social/posts/[id]` - update post
- `DELETE /api/social/posts/[id]` - delete post
- `POST /api/social/posts/[id]/render` - render template to PNG, store in Supabase Storage

### 1.7 Rendering

Keep existing `html-to-image` (`toPng()`) approach - it's free, client-side, and works well.
- 1080x1080 (square), 1080x1350 (4:5 portrait), 1080x1920 (story)
- Scaled preview (1/4 size) for fast UI
- High-res export for download/publish

---

## Phase 2: Review Pipeline + AI Poster Creation + Carousel - 2-3 weeks

### 2.1 Review-to-Social Pipeline

**Problem**: Reviews in Social Studio are hardcoded mock data. Real reviews exist in `marketplace_reviews` and `PortalReview.tsx` component.

**New table: `social_reviews`**
- Aggregates reviews from: client portal, marketplace, Google (manual import), manual entry
- Fields: `reviewer_name`, `trip_name`, `destination`, `rating`, `comment`, `source`, `is_featured`

**Wire up real reviews:**
1. Modify `PortalReview.tsx` onSubmit to also insert into `social_reviews`
2. Import existing `marketplace_reviews` via `/api/social/reviews/import`
3. Replace hardcoded mock data with real database query

**Auto-generate review posters**: When a 4+ star review comes in:
1. Auto-select best review template
2. Populate with reviewer name, comment, trip, org branding
3. Save as draft `social_posts` entry with `source: 'auto_review'`
4. Notify admin: "New review poster ready for publishing!"

**AI-enhanced review formatting** (Groq ~$0.006):
- Clean up grammar while preserving voice
- Add emoji emphasis
- Shorten to 2-3 sentences for visual impact
- Generate headline from review text

### 2.2 AI Poster Creation (Cheapest Approach)

**Primary path (~$0.007/poster):** AI generates template parameters, existing html-to-image renders the poster.

1. User types prompt: "Create a Diwali poster for Kashmir, 5N/6D at 35,999"
2. **Groq LLaMA 3.1 8B** (~$0.006) generates structured JSON: `{ templateId, destination, price, offer, season, heroImageQuery }`
3. `heroImageQuery` triggers **Unsplash/Pexels search** (free, already integrated)
4. Template renders via existing `html-to-image` at 1080x1080

**New API route: `POST /api/social/ai-poster`**
- Input: `{ prompt: string, templateId?: string }`
- Output: `{ templateData, suggestedTemplateId, heroImageUrl }`

**Premium path (Business/Enterprise only):** Stability AI SDXL (~$0.004/image) for AI-generated hero backgrounds when user wants truly custom visuals.

```typescript
// /apps/web/src/app/api/social/ai-image/route.ts
// POST { prompt: string, style: "photographic" | "cinematic" | "illustration" }
// Uses Stability AI REST API: https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image
// Env: STABILITY_API_KEY
// Prompt template: "Travel promotional background, {destination}, {style}, ultra-wide, no text, no words"
```

**Image source selection in UI:**
- Free tier: Only shows Unsplash/Pexels tab
- Business/Enterprise: Additional "AI Generate" tab with prompt input
- Toggle between: Search Stock Photos | Generate with AI

| Approach | Cost | Tier | Use Case |
|----------|------|------|----------|
| Groq text + Unsplash image | ~$0.007 | Free/Pro | 95% of use cases |
| Groq text + Stability AI image | ~$0.010 | Business+ | Unique custom visuals |
| Gemini caption generation | $0 (free tier) | All | Caption add-on |

### 2.3 Carousel Editor

Multi-slide posts (Instagram allows up to 10 images per carousel):

```typescript
interface CarouselSlide {
  slideIndex: number;
  title?: string;
  subtitle?: string;
  bodyText?: string;
  heroImage?: string;
  layout: "title" | "content" | "image" | "stats" | "cta";
}
```

- `CarouselEditor` component: slide-by-slide editing with drag-to-reorder
- Each slide rendered as independent 1080x1080 PNG via `html-to-image`
- Export: multiple PNGs (ZIP download) or direct carousel publish (Phase 3)
- 10 carousel template sets: Trip Highlights, Day-by-Day Itinerary, Multi-Destination, Photo Album, etc.

### 2.4 New API Routes (Phase 2)

- `GET /api/social/reviews` - list social reviews for org
- `POST /api/social/reviews` - create manual review
- `POST /api/social/reviews/import` - import from marketplace_reviews
- `POST /api/social/ai-poster` - AI poster creation

---

## Phase 3: Social Media Auto-Posting + Scheduling - 2-3 weeks

### 3.1 Platform Integration (All FREE - Direct Meta Graph API)

**Why direct Meta API vs Buffer/Later?**
- Meta Graph API = FREE, no limits on scheduled posts
- Buffer free tier = only 3 channels, 10 scheduled posts (too limiting)
- Full control over carousel posting, no middleman

**Instagram Graph API** (via Facebook Business):
- Container-based posting: upload image URL → create container → publish
- Carousel support: up to 10 images per post
- Rate limit: 200 API calls/hour/user (plenty)

**Facebook Graph API**:
- Page posting: `POST /{page-id}/photos` or `POST /{page-id}/feed`
- Free, no cost

### 3.2 Meta Developer Account Setup (Pre-requisite)

Since you don't have this yet, here's what's needed:

1. **Create Meta Developer Account**: https://developers.facebook.com/ (free)
2. **Create a Facebook App**: Type = "Business", add "Instagram Graph API" and "Facebook Login" products
3. **Link Facebook Page**: Your business Facebook Page must be linked to an Instagram Professional Account
4. **Request Permissions**: Submit for App Review requesting:
   - `instagram_basic` - read profile info
   - `instagram_content_publish` - publish images/carousels
   - `pages_manage_posts` - post to Facebook pages
   - `pages_read_engagement` - read engagement metrics
5. **App Review** takes ~2-5 business days (submit with screenshots of the Social Studio UI)
6. **Environment variables to add**: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`

> We'll build the OAuth flow and publishing code immediately. The App Review can happen in parallel - we use mock/test mode until approved.

### 3.3 OAuth Flow & Token Storage

**New table: `social_connections`**
- `organization_id`, `platform` (instagram/facebook), `platform_page_id`
- `access_token_encrypted` (AES-256 via Node.js crypto)
- `token_expires_at`, `refresh_token_encrypted`

**Flow:**
1. User clicks "Connect Instagram" in Social Studio settings
2. Redirect to Facebook OAuth: `https://www.facebook.com/v20.0/dialog/oauth?scope=instagram_basic,instagram_content_publish,pages_manage_posts`
3. Callback at `/api/social/oauth/callback` exchanges code for token
4. Exchange for long-lived token (60 days)
5. Store encrypted in `social_connections`

**New API routes:**
- `GET /api/social/connections` - list connected platforms
- `POST /api/social/oauth/facebook` - initiate OAuth
- `GET /api/social/oauth/callback` - OAuth callback handler
- `DELETE /api/social/connections/[id]` - disconnect platform

### 3.4 Publishing & Scheduling

**Publishing flow:**
1. Render poster PNG → upload to Supabase Storage → get public URL
2. Instagram: Create media container with image URL + caption → publish
3. Facebook: Post photo with caption to page

**Scheduling** - reuse existing notification_queue architectural pattern:

**New table: `social_post_queue`** (separate from notification_queue - different retry semantics)
- `post_id`, `platform`, `connection_id`, `scheduled_for`
- `status` (pending/processing/sent/failed), `attempts`, `error_message`
- `platform_post_id`, `platform_post_url` (after publish)

**New cron endpoint: `POST /api/social/process-queue`**
- Runs every 5 minutes (Vercel Cron)
- Picks posts where `scheduled_for <= now() AND status = 'pending'`
- Publishes to connected platforms
- Follows same pattern as existing `/api/notifications/process-queue`

**Token refresh cron: `POST /api/social/refresh-tokens`**
- Runs daily
- Refreshes tokens expiring within 7 days

### 3.5 New API Routes (Phase 3)

- `POST /api/social/publish` - publish immediately to platform(s)
- `POST /api/social/schedule` - schedule for future publishing
- `POST /api/social/process-queue` - cron queue processor
- `POST /api/social/refresh-tokens` - token refresh cron

---

## Phase 4: WhatsApp Photo Integration + Analytics - 1-2 weeks

### 4.1 WhatsApp Photo Capture

**Problem**: Webhook at `/api/whatsapp/webhook` only handles `message.type === "location"`. Ignores images.

**Fix**: Add `parseWhatsAppImageMessages()` to `/lib/whatsapp.server.ts`:
- Filter for `message.type === "image"`
- Extract: `message.image.id`, `message.image.caption`, `message.image.mime_type`

**Image download from WhatsApp:**
1. Get download URL: `GET https://graph.facebook.com/v20.0/{mediaId}` with Bearer token
2. Download binary: `GET {url}` with Bearer token (WhatsApp stores media ~30 days)
3. Upload to Supabase Storage: `social-media/{org_id}/whatsapp/{timestamp}-{mediaId}.jpg`
4. Insert into `social_media_library` with `source: 'whatsapp'`

### 4.2 Media Library UI

"Client Photos" tab in Social Studio showing:
- WhatsApp photos grouped by sender phone/name
- Directly uploaded photos
- Previously used Unsplash/Pexels images
- One-click "Use as Hero Image" or "Add to Carousel"
- Tag/categorize photos (e.g., "Maldives trip", "Hotel shots")

### 4.3 Basic Analytics

- Posts created/published per week (chart)
- Platform breakdown (Instagram vs Facebook)
- Template popularity (which templates get used most)
- Review-to-post conversion rate
- Pull engagement metrics via Graph API (likes, comments, reach) for published posts

### 4.4 Remaining Templates

Fill up to 95+ total templates, polish designs, add aspect ratio variants (square, portrait, story).

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

**Key insight**: Free tier hooks them with 10 beautiful auto-branded templates. They upgrade to Pro for AI + all templates. They upgrade to Business for auto-posting + scheduling.

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

## Critical Files to Modify

| File | Change |
|------|--------|
| `/apps/web/src/app/social/page.tsx` | Decompose into server component + modules |
| `/apps/web/src/app/api/whatsapp/webhook/route.ts` | Add image message parsing |
| `/apps/web/src/lib/whatsapp.server.ts` | Add `parseWhatsAppImageMessages()` + `downloadWhatsAppMedia()` |
| `/apps/web/src/app/api/notifications/process-queue/route.ts` | Reference pattern for social queue |
| `/apps/web/src/lib/billing/tiers.ts` | Add Social Studio feature limits per tier |
| `/apps/web/src/components/portal/PortalReview.tsx` | Wire onSubmit to `social_reviews` |

## New Files to Create

- `/apps/web/src/lib/social/template-registry.ts`
- `/apps/web/src/lib/social/indian-calendar.ts`
- `/apps/web/src/lib/social/color-utils.ts`
- `/apps/web/src/lib/social/types.ts`
- `/apps/web/src/app/social/_components/*.tsx` (8+ component files)
- `/apps/web/src/components/social/templates/layouts/*.tsx` (8 layout files)
- `/apps/web/src/components/social/templates/shared/*.tsx` (4 shared components)
- `/apps/web/src/app/api/social/posts/route.ts` + `[id]/route.ts`
- `/apps/web/src/app/api/social/ai-poster/route.ts`
- `/apps/web/src/app/api/social/reviews/route.ts` + `import/route.ts`
- `/apps/web/src/app/api/social/publish/route.ts`
- `/apps/web/src/app/api/social/schedule/route.ts`
- `/apps/web/src/app/api/social/process-queue/route.ts`
- `/apps/web/src/app/api/social/oauth/facebook/route.ts` + `callback/route.ts`
- `/apps/web/src/app/api/social/connections/route.ts` + `[id]/route.ts`
- `/apps/web/src/app/api/social/refresh-tokens/route.ts`
- `/supabase/migrations/YYYYMMDD_social_studio_v2.sql` (5 new tables)

## Verification Plan

1. **Phase 1**: Create a post with auto-populated org branding → save as draft → reload page → draft persists → download PNG → verify logo/phone/colors match org settings
2. **Phase 2**: Submit a review via client portal → verify it appears in Social Studio reviews tab → click "Create Post" → verify poster generates with real review data → test AI poster with prompt → verify Unsplash image auto-selected
3. **Phase 3**: Connect Instagram via OAuth → create a post → click "Publish to Instagram" → verify post appears on Instagram → schedule a post for 5 min later → verify it auto-publishes
4. **Phase 4**: Send a photo via WhatsApp to the business number → verify it appears in Media Library → use it as hero image in a template → export
