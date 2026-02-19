# Quick Deploy Guide - RAG System & Professional UI

**Estimated Time:** 15-20 minutes

## ✅ Pre-Deployment Checklist

- [x] OpenAI API Key configured in `.env.local`
- [ ] Supabase project created
- [ ] Supabase credentials configured
- [ ] Database migrations applied
- [ ] Embeddings generated
- [ ] System tested

## Step 1: Get Supabase Credentials (5 minutes)

### Option A: Use Existing Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`, keep secret!)

### Option B: Use Local Supabase (Development)

```bash
# Start Docker Desktop first
docker --version  # Verify Docker is installed

# Start Supabase locally
supabase start

# Get local credentials
supabase status
```

## Step 2: Configure Environment Variables (2 minutes)

Edit `apps/web/.env.local` and uncomment/update:

```bash
# ✅ Already configured (OpenAI)
OPENAI_API_KEY=sk-proj-mBwfG...

# ADD THESE (from Step 1):
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
```

**Important:** Do NOT commit `.env.local` to git (it's already in `.gitignore`)

## Step 3: Apply Database Migrations (3 minutes)

### Method A: Using Migration Script (Recommended)

```bash
cd supabase

# Set environment variables (if not in .env.local)
export NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Run migration script
node apply-rag-migrations.mjs
```

**Expected output:**
```
🚀 Applying RAG System Migrations...
🔗 Connecting to Supabase: https://xxxxx.supabase.co
✓ Connection successful

📄 Applying migration: 20260219140000_rag_template_search.sql
📝 Found 15 SQL statements
  [1/15] CREATE EXTENSION IF NOT EXISTS vector... ✓
  [2/15] ALTER TABLE public.tour_templates ADD COLUMN... ✓
  ...
✅ Migration applied successfully: 15/15 statements

📄 Applying migration: 20260219150000_pdf_import_pipeline.sql
📝 Found 12 SQL statements
  [1/12] CREATE TABLE IF NOT EXISTS public.pdf_imports... ✓
  ...
✅ Migration applied successfully: 12/12 statements

🎉 RAG System deployment complete!
```

### Method B: Using Supabase Dashboard (Alternative)

1. Go to **Database** → **Migrations**
2. Click **New migration**
3. Copy contents of `supabase/migrations/20260219140000_rag_template_search.sql`
4. Paste and click **Run**
5. Repeat for `20260219150000_pdf_import_pipeline.sql`

## Step 4: Install Dependencies (1 minute)

```bash
# From project root
npm install

# Verify OpenAI SDK is installed
npm list openai  # Should show: openai@4.x.x
```

## Step 5: Generate Embeddings (5-15 minutes)

**Note:** This step generates vector embeddings for existing tour templates. Skip if you have no templates yet.

```bash
# Start development server
npm run dev

# In another terminal, trigger embedding generation
curl -X POST http://localhost:3000/api/admin/generate-embeddings

# Expected response:
# {
#   "success": true,
#   "processed": 10,
#   "total": 10,
#   "errors": [],
#   "message": "Generated embeddings for 10 templates"
# }
```

**What's happening:**
- Each template's text is converted to a 1536-dimensional vector
- Stored in `tour_templates.embedding` column
- Used for similarity search in RAG system
- Cost: ~$0.00002 per template (very cheap!)

## Step 6: Test the System (5 minutes)

### Test 1: Generate Itinerary with RAG

```bash
# Visit in browser:
http://localhost:3000/planner

# Create test itinerary:
# - Destination: "Kenya"
# - Duration: 7 days
# - Click "Generate Itinerary"
```

**Check server console for:**
```
✅ [TIER 1: CACHE HIT]  # If you've generated this before
OR
✅ [TIER 2: RAG HIT] Found 3 matching templates (similarity: 0.92)
OR
❌ [TIER 3: GEMINI FALLBACK] No RAG match, using Gemini AI
```

### Test 2: Professional UI

After itinerary loads, verify:
- ✅ Cover page with gradient background
- ✅ Timeline visual connecting days
- ✅ Accordion-style day cards (first day expanded)
- ✅ Rich activity descriptions (8-10 sentences)
- ✅ Activity images loaded
- ✅ Inclusions/Exclusions section at bottom

### Test 3: Print Preview

```bash
# In browser with itinerary open:
# Mac: Cmd + P
# Windows/Linux: Ctrl + P
```

Verify print preview shows:
- ✅ Professional A4 layout
- ✅ Cover page on first page
- ✅ All days expanded (no accordion in print)
- ✅ Colors preserved
- ✅ No page breaks splitting cards

### Test 4: PDF Export

```bash
# Click "Download PDF" button on itinerary

# Expected: Professional PDF downloads with:
# - @react-pdf/renderer professional template
# - Operator branding (if configured)
# - All days and activities
# - Inclusions/Exclusions
```

### Test 5: PDF Import (Optional)

```bash
# Upload a PDF template
curl -X POST http://localhost:3000/api/admin/pdf-imports/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your-itinerary.pdf" \
  -F "organization_id=your-org-uuid"

# Expected response:
# {
#   "success": true,
#   "import_id": "uuid-here",
#   "status": "extracting"
# }

# Check extraction status
curl http://localhost:3000/api/admin/pdf-imports/[import_id]
```

## Verification Checklist

After deployment, verify:

- [ ] RAG system working (check tier logs)
- [ ] Professional UI rendering correctly
- [ ] Print preview looks professional
- [ ] PDF export downloads successfully
- [ ] Images loading from multiple sources
- [ ] Embeddings generated for templates
- [ ] No errors in browser console
- [ ] No errors in server console

## Monitoring

### Check Tier Distribution (Expected After 1 Week)

```bash
# Count cache hits vs misses
SELECT
    CASE
        WHEN served_from_cache THEN 'TIER 1: CACHE'
        ELSE 'TIER 3: GEMINI'
    END as tier,
    COUNT(*) as count,
    ROUND(COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100, 1) as percentage
FROM itinerary_cache
GROUP BY served_from_cache;
```

**Target:**
- 70% TIER 1 (Cache)
- 25% TIER 2 (RAG) - *Not tracked in cache table*
- 5% TIER 3 (Gemini)

### Check Embedding Status

```bash
# Count templates with/without embeddings
SELECT
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embeddings,
    COUNT(*) FILTER (WHERE embedding IS NULL) as without_embeddings,
    COUNT(*) as total
FROM tour_templates
WHERE status = 'active';
```

**Target:** All active templates should have embeddings

### Check RAG Performance

```bash
# Get average similarity scores
SELECT
    AVG(similarity_score) as avg_similarity,
    MIN(similarity_score) as min_similarity,
    MAX(similarity_score) as max_similarity,
    COUNT(*) as total_uses
FROM template_usage_attribution;
```

**Target:** avg_similarity > 0.75 (good match quality)

## Troubleshooting

### Issue: Migrations fail with "permission denied"

**Solution:** Verify you're using `SUPABASE_SERVICE_ROLE_KEY`, not the anon key.

### Issue: "pgvector extension not found"

**Solution:**
1. Go to Supabase Dashboard → Database → Extensions
2. Search for "vector"
3. Click "Enable" on pgvector extension

### Issue: Embeddings generation fails

**Check:**
```bash
# Verify OpenAI API key is valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Should return list of models, not error
```

### Issue: RAG never hits (always TIER 3)

**Diagnose:**
```bash
# 1. Check if templates have embeddings
SELECT COUNT(*) FROM tour_templates WHERE embedding IS NOT NULL;

# 2. Check vector search function exists
SELECT proname FROM pg_proc WHERE proname = 'search_similar_templates_with_quality';

# 3. Test vector search manually
SELECT * FROM search_similar_templates_with_quality(
    '[0.1, 0.2, ...]'::vector(1536),  -- Random test embedding
    0.5,  -- Lower threshold
    10
);
```

### Issue: PDF export not working

**Check:**
```bash
# Verify @react-pdf/renderer is installed
npm list @react-pdf/renderer

# If missing:
npm install @react-pdf/renderer
```

## Cost Tracking

After deployment, monitor costs:

**OpenAI Costs (RAG System):**
- Embeddings: ~$0.00002 per template (one-time)
- PDF extraction: ~$0.01 per PDF (one-time per upload)
- Template assembly: ~$0.0002 per itinerary (ongoing)

**Expected Monthly Cost (100 itineraries/day):**
- 70% cache hits: $0 (2,100 requests)
- 25% RAG hits: $15 (750 requests × $0.0002)
- 5% Gemini fallback: $15 (150 requests × $0.01)
- **Total: ~$30/month** (vs $300/month without RAG = 90% savings)

## Success Indicators

After 7 days, you should see:

✅ **Cost Reduction:** 80-90% lower AI costs
✅ **Cache Hit Rate:** 60-70%
✅ **RAG Hit Rate:** 20-30%
✅ **Response Time:** <500ms for RAG-assembled itineraries
✅ **Quality:** Professional PDF-like UI
✅ **User Feedback:** "Wow, this looks professional!"

## Next Steps

Once deployed and verified:

1. **Upload Templates:** Start uploading PDF templates from tour operators
2. **Monitor Quality:** Track which templates get used most
3. **Optimize:** Improve template descriptions based on usage analytics
4. **Scale:** As template library grows, RAG hit rate will increase

## Support

**Documentation:**
- Full system guide: `docs/rag-system-implementation.md`
- UI component guide: `docs/PROFESSIONAL_ITINERARY_UI.md`
- PDF export guide: `docs/PDF_EXPORT_ENHANCEMENT.md`

**Quick References:**
- 5-minute setup: `docs/RAG_QUICKSTART.md`
- Migration guide: `docs/MIGRATION_GUIDE.md`
- Production checklist: `docs/PRODUCTION_DEPLOYMENT.md`

---

**Ready to deploy?** Start with Step 1 above!
