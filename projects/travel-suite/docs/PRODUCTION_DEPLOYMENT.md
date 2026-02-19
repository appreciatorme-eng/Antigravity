# Production Deployment Checklist

## Overview

This guide covers deploying Phases 4-7 (RAG System, PDF Import, Professional UI, PDF Export) to production.

**Estimated Deployment Time**: 30-45 minutes
**Required Access**: Supabase Admin, Environment Variables, Database Access

---

## Pre-Deployment Verification

### Local Testing

- [ ] All migrations run successfully locally
- [ ] RAG system generates itineraries (cache → RAG → Gemini flow)
- [ ] PDF upload and extraction works
- [ ] Professional UI renders correctly
- [ ] PDF export generates professional template
- [ ] All environment variables configured locally

### Code Review

- [ ] All commits pushed to `main` branch
- [ ] No merge conflicts
- [ ] CI/CD pipeline passing (if configured)
- [ ] TypeScript compilation successful: `npm run build`

---

## Phase 1: Database Setup (15 minutes)

### 1.1 Backup Current Database

```bash
# Via Supabase CLI
npx supabase db dump -f backup-pre-rag-$(date +%Y%m%d).sql

# Or via Supabase Dashboard
# Settings → Database → Backup & Restore → Create Backup
```

**Verification**: Backup file created and downloadable ✅

### 1.2 Apply RAG Migration

**Migration File**: `supabase/migrations/20260219140000_rag_template_search.sql`

**Option A: Supabase CLI** (Recommended)
```bash
cd projects/travel-suite
npx supabase db push
```

**Option B: Supabase Dashboard**
1. Go to SQL Editor
2. Create new query
3. Copy contents of `20260219140000_rag_template_search.sql`
4. Run query
5. Verify: No errors in output

**Verification Queries**:
```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Expected: 1 row

-- Check new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tour_templates'
AND column_name IN ('embedding', 'quality_score', 'usage_count');
-- Expected: 3 rows

-- Check new table
SELECT COUNT(*) FROM template_usage_attribution;
-- Expected: 0 (empty table, ready for data)

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%template%'
AND routine_schema = 'public';
-- Expected: search_similar_templates_with_quality, calculate_template_quality, etc.
```

**Success Criteria**: All verification queries return expected results ✅

### 1.3 Apply PDF Import Migration

**Migration File**: `supabase/migrations/20260219150000_pdf_import_pipeline.sql`

**Same process as 1.2**

**Verification Queries**:
```sql
-- Check new tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pdf_imports', 'pdf_extraction_queue');
-- Expected: 2 rows

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('pdf_imports', 'pdf_extraction_queue');
-- Expected: Multiple policies per table

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%pdf%'
AND routine_schema = 'public';
-- Expected: get_pending_pdf_extractions, start_pdf_extraction, etc.
```

**Success Criteria**: All tables, policies, and functions exist ✅

### 1.4 Create Supabase Storage Bucket

**Bucket Name**: `pdf-imports`

**Via Supabase Dashboard**:
1. Storage → Create bucket
2. Name: `pdf-imports`
3. Public: ✅ Yes (for file serving)
4. File size limit: 10MB
5. Allowed MIME types: `application/pdf`

**Set RLS Policies**:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdf-imports');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pdf-imports');

-- Allow users to delete own uploads
CREATE POLICY "Users can delete own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pdf-imports' AND auth.uid() = owner);
```

**Verification**:
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'pdf-imports';
-- Expected: 1 row

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'pdf-imports';
-- Expected: 3 rows
```

**Success Criteria**: Bucket created with correct permissions ✅

---

## Phase 2: Environment Variables (5 minutes)

### 2.1 Required Environment Variables

**Production Environment** (Vercel/Hosting):

```bash
# OpenAI API Key (Required for RAG + PDF extraction)
OPENAI_API_KEY=sk-proj-...

# Existing Variables (Keep these)
GOOGLE_GEMINI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Optional: Sentry, PostHog (if configured)
SENTRY_DSN=...
NEXT_PUBLIC_POSTHOG_KEY=...
```

### 2.2 Vercel Deployment

**Via Vercel Dashboard**:
1. Project → Settings → Environment Variables
2. Add `OPENAI_API_KEY`
3. Environment: Production, Preview, Development ✅
4. Save

**Via Vercel CLI**:
```bash
vercel env add OPENAI_API_KEY production
# Paste key when prompted
```

**Verification**:
```bash
vercel env ls
# Should show OPENAI_API_KEY in list
```

**Success Criteria**: `OPENAI_API_KEY` configured in production ✅

### 2.3 Other Hosting Platforms

**Railway**:
```bash
railway variables set OPENAI_API_KEY=sk-proj-...
```

**Render**:
1. Dashboard → Environment → Add Variable
2. Key: `OPENAI_API_KEY`, Value: `sk-proj-...`

**Heroku**:
```bash
heroku config:set OPENAI_API_KEY=sk-proj-...
```

---

## Phase 3: Code Deployment (10 minutes)

### 3.1 Deploy to Production

**Vercel** (Recommended):
```bash
cd projects/travel-suite
git pull origin main  # Ensure latest
vercel --prod
```

**Or via Git Integration** (if configured):
```bash
git push origin main
# Vercel auto-deploys on push to main
```

**Other Platforms**:
```bash
# Build locally
npm run build

# Deploy dist folder to your platform
# (platform-specific commands)
```

**Verification**:
1. Visit production URL
2. Check deployment logs for errors
3. Verify build succeeded

**Success Criteria**: Deployment successful, no build errors ✅

### 3.2 Verify Application Starts

**Check Production URL**:
```bash
curl https://your-domain.com
# Should return 200 OK
```

**Check API Health**:
```bash
curl https://your-domain.com/api/health
# Should return success response
```

**Success Criteria**: Application accessible and healthy ✅

---

## Phase 4: Generate Embeddings (10 minutes)

### 4.1 Batch Generate Embeddings

**For Existing Templates**:

```bash
# Call admin endpoint
curl -X POST https://your-domain.com/api/admin/generate-embeddings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "templatesProcessed": 42,
  "templatesWithErrors": 0,
  "errors": [],
  "message": "Successfully processed 42 templates..."
}
```

**Monitor Progress**:
- Check Vercel/hosting logs
- Look for: `✅ [X/Y] Embedded: Template Name`
- Errors will show: `❌ Failed to embed template...`

**Alternative: Supabase Edge Function** (if preferred):
Create edge function to call embedding generation on schedule.

### 4.2 Verify Embeddings Generated

**Check Database**:
```sql
-- Count templates with embeddings
SELECT
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embeddings,
  COUNT(*) FILTER (WHERE embedding IS NULL) as without_embeddings,
  COUNT(*) as total
FROM tour_templates
WHERE status = 'active';
```

**Expected**: Most/all active templates have embeddings ✅

### 4.3 Verify Quality Scores

```sql
-- Check quality score distribution
SELECT
  ROUND(quality_score, 1) as score_range,
  COUNT(*) as count
FROM tour_templates
WHERE embedding IS NOT NULL
GROUP BY ROUND(quality_score, 1)
ORDER BY score_range DESC;
```

**Expected**: Distribution of scores (0.1-1.0) ✅

**Success Criteria**: Embeddings generated successfully ✅

---

## Phase 5: End-to-End Testing (15 minutes)

### 5.1 Test RAG System

**Test Case 1: Cache Miss → RAG Hit**

```bash
curl -X POST https://your-domain.com/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a 5-day safari in Kenya",
    "days": 5
  }'
```

**Expected Logs** (check Vercel/hosting):
```
❌ [TIER 1: CACHE MISS] Kenya, 5 days
✅ [TIER 2: RAG HIT] Found 3 matching templates (top similarity: 0.89)
💾 RAG itinerary cached (ID: abc-123)
```

**Verify Response**:
- `trip_title` present
- `days` array has 5 items
- `source` field indicates RAG usage (if logged)

**Test Case 2: Cache Hit**

```bash
# Same request again
curl -X POST https://your-domain.com/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a 5-day safari in Kenya",
    "days": 5
  }'
```

**Expected Logs**:
```
✅ [TIER 1: CACHE HIT] Kenya, 5 days - API call avoided!
```

**Success Criteria**:
- First request uses RAG or Gemini
- Second request uses cache
- Response time < 1 second for cache hit ✅

### 5.2 Test PDF Upload

**Prepare Test PDF**:
- Any PDF file (< 10MB)
- Ideally a travel itinerary for best extraction

**Upload via API**:
```bash
curl -X POST https://your-domain.com/api/admin/pdf-imports/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-itinerary.pdf" \
  -F "organizationId=YOUR_ORG_ID"
```

**Expected Response**:
```json
{
  "success": true,
  "pdf_import": {
    "id": "uuid",
    "file_name": "test-itinerary.pdf",
    "status": "uploaded",
    "created_at": "..."
  },
  "message": "PDF uploaded successfully. AI extraction will begin shortly."
}
```

**Verify in Database**:
```sql
SELECT * FROM pdf_imports ORDER BY created_at DESC LIMIT 1;
-- Should show recently uploaded PDF with status 'uploaded' or 'extracting'

SELECT * FROM pdf_extraction_queue ORDER BY created_at DESC LIMIT 1;
-- Should show queue item in 'pending' or 'processing'
```

**Success Criteria**: PDF uploaded and queued for extraction ✅

### 5.3 Test Professional UI

**Via Web Browser**:
1. Navigate to `/planner` or your itinerary page
2. Generate an itinerary
3. Verify ProfessionalItineraryView renders:
   - ✅ Cover page with gradient background
   - ✅ Timeline dots visible
   - ✅ Day cards expand/collapse
   - ✅ Activity descriptions visible
   - ✅ Inclusions/exclusions section (if tips present)

**Success Criteria**: Professional UI renders correctly ✅

### 5.4 Test PDF Export

**Via Web UI**:
1. Generate itinerary
2. Click "Download PDF" button
3. Select template: "Professional (Recommended)"
4. Download PDF

**Verify PDF**:
- ✅ Cover page matches web UI
- ✅ Operator logo visible (if configured)
- ✅ Day cards formatted correctly
- ✅ Activity images present
- ✅ Inclusions/exclusions page present
- ✅ Footer with company name

**Success Criteria**: PDF matches web UI quality ✅

---

## Phase 6: Monitoring & Verification (10 minutes)

### 6.1 Check System Metrics

**Cache Hit Rate**:
```sql
SELECT
  COUNT(*) FILTER (WHERE source = 'cache') * 100.0 / NULLIF(COUNT(*), 0) as cache_rate,
  COUNT(*) FILTER (WHERE source LIKE 'rag%') * 100.0 / NULLIF(COUNT(*), 0) as rag_rate,
  COUNT(*) FILTER (WHERE source = 'gemini') * 100.0 / NULLIF(COUNT(*), 0) as gemini_rate,
  COUNT(*) as total
FROM itinerary_cache
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Expected (after warmup)**:
- Cache: 0-20% (new deployment)
- RAG: 30-50% (if templates exist)
- Gemini: 30-70% (decreases over time)

### 6.2 Check Error Logs

**Vercel**:
```bash
vercel logs --prod
```

Look for:
- ❌ Errors (should be minimal)
- ✅ Successful RAG hits
- ✅ Cache hits

**Supabase Logs**:
1. Dashboard → Logs → Postgres Logs
2. Filter: Last 1 hour
3. Check for migration errors

### 6.3 OpenAI API Usage

**Check Usage**:
1. https://platform.openai.com/usage
2. Verify:
   - Embeddings API calls (text-embedding-3-small)
   - GPT-4o calls (PDF extraction)
   - Costs within budget

**Set Billing Alerts**:
1. Settings → Billing → Usage limits
2. Set soft limit: $50/month (adjust as needed)
3. Set hard limit: $100/month

### 6.4 Database Performance

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE tablename IN ('tour_templates', 'itinerary_cache', 'pdf_imports')
ORDER BY scans DESC;

-- Embeddings should use index heavily
-- Expected: idx_tour_templates_embedding with high scan count
```

**Success Criteria**: All systems healthy, no critical errors ✅

---

## Phase 7: Post-Deployment Tasks (5 minutes)

### 7.1 Update Organization Settings

**Set Default Template**:
```sql
UPDATE organizations
SET itinerary_template = 'professional'
WHERE id IN (
  SELECT id FROM organizations
  WHERE itinerary_template IS NULL
  OR itinerary_template = 'safari_story'
);
```

**Verify**:
```sql
SELECT
  itinerary_template,
  COUNT(*)
FROM organizations
GROUP BY itinerary_template;
```

### 7.2 Enable Public Templates

**For Unified Sharing**:
```sql
-- Make high-quality templates public
UPDATE tour_templates
SET is_public = true
WHERE quality_score > 0.7
AND status = 'active';

-- Verify
SELECT
  is_public,
  COUNT(*)
FROM tour_templates
GROUP BY is_public;
```

### 7.3 Documentation Update

**Internal Documentation**:
- [ ] Update team wiki with RAG system info
- [ ] Share deployment checklist with team
- [ ] Document troubleshooting steps

**User Documentation** (if applicable):
- [ ] Update user guide with professional template
- [ ] Add PDF upload tutorial
- [ ] Share RAG benefits with sales team

---

## Rollback Plan

### If Issues Arise

**1. Revert Code** (if application broken):
```bash
# Find last working commit
git log --oneline

# Revert to previous version
vercel rollback
# Or redeploy specific commit
git checkout <previous-commit>
vercel --prod
```

**2. Disable RAG** (if RAG causing issues):
```sql
-- Temporarily remove embeddings
UPDATE tour_templates SET embedding = NULL;
```

System will fall back to Gemini (Tier 3).

**3. Restore Database** (if critical):
```bash
# Use backup from Phase 1
npx supabase db restore backup-pre-rag-YYYYMMDD.sql
```

**4. Remove Migrations** (last resort):
```sql
-- Rollback RAG migration
DROP TABLE IF EXISTS template_usage_attribution;
ALTER TABLE tour_templates
  DROP COLUMN IF EXISTS embedding,
  DROP COLUMN IF EXISTS quality_score,
  DROP COLUMN IF EXISTS usage_count;

-- Rollback PDF import migration
DROP TABLE IF EXISTS pdf_extraction_queue;
DROP TABLE IF EXISTS pdf_imports;
```

**Success Criteria**: System restored to working state ✅

---

## Success Indicators

### Day 1
- [ ] All migrations applied successfully
- [ ] No deployment errors
- [ ] RAG system generating itineraries
- [ ] PDF upload working
- [ ] Professional UI rendering

### Week 1
- [ ] Cache hit rate: 20-40%
- [ ] RAG hit rate: 20-30%
- [ ] Gemini hit rate: 30-50%
- [ ] No critical errors
- [ ] OpenAI costs within budget ($10-20 for embeddings)

### Month 1
- [ ] Cache hit rate: 60-70%
- [ ] RAG hit rate: 20-30%
- [ ] Gemini hit rate: 5-10%
- [ ] 10+ PDF imports processed
- [ ] 95%+ cost savings vs baseline
- [ ] User feedback positive

---

## Support & Maintenance

### Weekly Tasks
- [ ] Check error logs
- [ ] Monitor OpenAI API usage
- [ ] Review cache/RAG/Gemini hit rates
- [ ] Check PDF import queue (should be empty or processing)

### Monthly Tasks
- [ ] Re-generate embeddings for updated templates
- [ ] Review quality scores
- [ ] Analyze attribution tracking
- [ ] Optimize cache TTL if needed

### Quarterly Tasks
- [ ] Full embedding regeneration
- [ ] Database performance review
- [ ] Cost analysis and optimization
- [ ] Feature usage report

---

## Troubleshooting

### Common Issues

**Issue**: "Column embedding does not exist"
- **Cause**: Migration not applied
- **Fix**: Run Phase 1.2 again

**Issue**: RAG always misses
- **Cause**: No embeddings generated
- **Fix**: Run Phase 4.1 (generate embeddings)

**Issue**: PDF upload returns 500 error
- **Cause**: Storage bucket not created
- **Fix**: Run Phase 1.4 (create bucket)

**Issue**: Professional UI not showing
- **Cause**: Print CSS not imported
- **Fix**: Verify `apps/web/src/app/layout.tsx` imports `@/styles/print.css`

**Issue**: PDF export fails with professional template
- **Cause**: Template import error
- **Fix**: Check `apps/web/src/components/pdf/ItineraryDocument.tsx` imports `ProfessionalTemplate`

**Issue**: High OpenAI costs
- **Cause**: Too many embeddings regenerated
- **Fix**: Limit batch embedding to new templates only

---

## Contacts

**For Deployment Issues**:
- Database: Supabase Support
- Hosting: Vercel/Platform Support
- OpenAI API: platform.openai.com/support

**For Code Issues**:
- GitHub: appreciatorme-eng/Antigravity
- Documentation: `/docs` folder

---

**Deployment Version**: 1.0.0
**Last Updated**: 2026-02-19
**Phases Included**: 4, 5, 6, 7 (RAG, PDF Import, Professional UI, PDF Export)
**Estimated Total Time**: 60-90 minutes
**Status**: ✅ Ready for Production

