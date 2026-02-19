# RAG System Quick Start Guide

## Prerequisites

1. **OpenAI API Key** with billing enabled
2. **Supabase project** with database access
3. **Node.js 18+** installed

## 5-Minute Setup

### Step 1: Apply Database Migration

Choose one method:

**Method A: Supabase CLI**
```bash
cd projects/travel-suite
npx supabase db push
```

**Method B: Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy/paste contents of `supabase/migrations/20260219140000_rag_template_search.sql`
3. Click "Run"

### Step 2: Add OpenAI API Key

Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-proj-...your-key-here
```

Or in Vercel/hosting environment variables if deployed.

### Step 3: Generate Embeddings

**If running locally:**
```bash
cd projects/travel-suite
npm run dev

# In another terminal:
curl -X POST http://localhost:3000/api/admin/generate-embeddings
```

**If already deployed:**
```bash
curl -X POST https://your-domain.com/api/admin/generate-embeddings
```

Expected response:
```json
{
  "success": true,
  "templatesProcessed": 42,
  "templatesWithErrors": 0,
  "errors": [],
  "message": "Successfully processed 42 templates..."
}
```

### Step 4: Test RAG System

Generate an itinerary:

```bash
curl -X POST http://localhost:3000/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a 5-day trip for Tokyo Japan",
    "days": 5
  }'
```

Check server console logs for:

```
❌ [TIER 1: CACHE MISS] Tokyo, 5 days - trying RAG templates...
✅ [TIER 2: RAG HIT] Found 3 matching templates (top similarity: 0.89)
🔍 Found 3 templates from unified knowledge base:
  1. Tokyo Experience 5D (Rank: 0.91, Similarity: 0.89, Quality: 0.85)
  2. Japan Cultural Tour 7D (Rank: 0.83, Similarity: 0.81, Quality: 0.80)
  3. Tokyo & Mt. Fuji 4D (Rank: 0.78, Similarity: 0.75, Quality: 0.82)
🤖 Using AI to adapt 5-day template to 5 days...
✅ Exact match! Using template as-is
💾 RAG itinerary cached (ID: abc-123)
```

**Success!** RAG is working if you see `[TIER 2: RAG HIT]`.

## Verifying It Works

### Check Embedding Generation Status

```bash
curl http://localhost:3000/api/admin/generate-embeddings
```

Response:
```json
{
  "totalTemplates": 50,
  "withEmbeddings": 50,
  "withoutEmbeddings": 0,
  "percentageComplete": 100
}
```

### Monitor Cost Savings

After a few days, check your hit rates:

```sql
-- Run in Supabase SQL Editor
SELECT
  COUNT(*) FILTER (WHERE source = 'cache') * 100.0 / COUNT(*) as cache_percent,
  COUNT(*) FILTER (WHERE source LIKE 'rag%') * 100.0 / COUNT(*) as rag_percent,
  COUNT(*) FILTER (WHERE source = 'gemini') * 100.0 / COUNT(*) as gemini_percent
FROM itinerary_cache
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Expected after warmup (1-2 weeks):**
- Cache: 60-70%
- RAG: 20-30%
- Gemini: 5-10%

### Check Template Quality Scores

```sql
SELECT
  name,
  destination,
  quality_score,
  usage_count,
  is_public
FROM tour_templates
WHERE embedding IS NOT NULL
ORDER BY quality_score DESC
LIMIT 10;
```

High quality scores (>0.7) mean:
- Detailed activity descriptions
- Multiple activities per day
- Images included
- Pricing information provided

## Troubleshooting

### ❌ "No matching templates found" (RAG always misses)

**Cause**: Templates don't have embeddings yet

**Fix**: Run Step 3 above (generate embeddings)

Verify:
```sql
SELECT COUNT(*) FROM tour_templates WHERE embedding IS NOT NULL;
```

Should be > 0.

### ❌ "OpenAI API error: insufficient quota"

**Cause**: No credits on OpenAI account

**Fix**:
1. Go to https://platform.openai.com/account/billing
2. Add credits ($5 minimum)
3. Re-run embedding generation

**Note**: System auto-falls back to Gemini if OpenAI fails.

### ❌ "Column 'embedding' does not exist"

**Cause**: Migration not applied

**Fix**: Run Step 1 above (apply migration)

### ⚠️ RAG hits are low (<10%)

**Possible causes**:

1. **Not enough templates**: Need at least 10-20 templates per popular destination
   ```sql
   SELECT destination, COUNT(*)
   FROM tour_templates
   WHERE embedding IS NOT NULL
   GROUP BY destination;
   ```

2. **Similarity threshold too high**: Lower from 0.7 to 0.6
   ```typescript
   // In apps/web/src/lib/rag-itinerary.ts
   p_match_threshold: 0.6 // Was 0.7
   ```

3. **Templates are private**: Make them public
   ```sql
   UPDATE tour_templates SET is_public = true;
   ```

## What's Next?

Once RAG is working:

1. **Share Templates**: Mark high-quality templates as public
   ```sql
   UPDATE tour_templates
   SET is_public = true
   WHERE quality_score > 0.7;
   ```

2. **Monitor Analytics**: Track which templates get used most

3. **Improve Quality**: Add detailed descriptions, images, pricing to boost quality scores

4. **Phase 5**: PDF Import Pipeline (coming soon)
   - Upload PDF brochures
   - AI auto-extraction
   - One-click publish

## Cost Tracking

Monitor your OpenAI usage:
- https://platform.openai.com/usage

**Expected costs**:
- Embeddings: $0.02 per 1,000 templates (one-time)
- RAG queries: $0.0007 each
- Gemini fallback: $0.01 each

**Example monthly cost** (10,000 queries):
- Without RAG: 10,000 × $0.01 = **$100**
- With RAG (70% cache, 25% RAG, 5% Gemini):
  - Cache: 7,000 × $0 = $0
  - RAG: 2,500 × $0.0007 = $1.75
  - Gemini: 500 × $0.01 = $5.00
  - **Total: $6.75** (93% savings!)

## Getting Help

**Issue**: System not working?
1. Check console logs for error messages
2. Verify all environment variables set
3. Confirm migration applied (check Supabase table editor)

**Question**: How does RAG work?
- Read: `/docs/rag-system-implementation.md`

**Deploy**: Ready for production?
- Read: `/docs/MIGRATION_GUIDE.md`

---

**Last Updated**: 2026-02-19
**Status**: ✅ Ready to Use
**Estimated Setup Time**: 5-10 minutes
