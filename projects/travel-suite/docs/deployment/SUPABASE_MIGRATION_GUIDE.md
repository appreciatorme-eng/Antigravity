# Supabase Migration Deployment Guide

## Template Analytics Migration

### Migration File
`supabase/migrations/20260215000000_template_analytics.sql`

### What It Does

Creates database tables and functions for tracking template usage analytics:

1. **`template_views`** - Tracks when templates are viewed
2. **`template_usage`** - Tracks when templates are used to create proposals
3. **Helper Functions**:
   - `get_template_analytics()` - Get comprehensive analytics for a template
   - `get_top_templates_by_usage()` - Get top N templates by usage

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view analytics for their organization
- Users can only insert records for their organization
- No cross-organization data leakage

---

## Deployment Options

### Option 1: Supabase Dashboard (Recommended for Production)

1. Log in to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Database** → **Migrations**
4. Click **New Migration**
5. Copy contents of `supabase/migrations/20260215000000_template_analytics.sql`
6. Paste into migration editor
7. Review the SQL
8. Click **Run Migration**
9. Verify success in the **Migrations** tab

### Option 2: Supabase CLI (Local Development)

```bash
# 1. Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# 2. Push migration
npx supabase db push

# 3. Verify migration
npx supabase db verify
```

### Option 3: Direct SQL Execution

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy contents of migration file
3. Execute SQL directly
4. Verify tables created in **Table Editor**

---

## Verification Steps

After running the migration, verify:

### 1. Check Tables Created

```sql
-- In SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('template_views', 'template_usage');
```

Expected result: 2 rows (both tables)

### 2. Check RLS Policies

```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('template_views', 'template_usage');
```

Expected result: 4 policies (2 per table)

### 3. Check Functions Created

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_template_analytics', 'get_top_templates_by_usage');
```

Expected result: 2 rows (both functions)

### 4. Test Analytics Function

```sql
-- Replace with actual template_id and organization_id
SELECT get_template_analytics(
  'YOUR_TEMPLATE_ID'::uuid,
  'YOUR_ORG_ID'::uuid
);
```

Expected result: JSON object with analytics data

---

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop tables (cascades to dependent objects)
DROP TABLE IF EXISTS template_usage CASCADE;
DROP TABLE IF EXISTS template_views CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_template_analytics(uuid, uuid);
DROP FUNCTION IF EXISTS get_top_templates_by_usage(uuid, integer, integer);
```

---

## Post-Deployment

### 1. Enable Analytics Tracking in Code

The tracking functions are already implemented in:
- `apps/web/src/lib/analytics/template-analytics.ts`

No code changes needed - analytics will start tracking automatically once migration runs.

### 2. Test Analytics Features

1. Navigate to a template in admin panel
2. View should be tracked in `template_views`
3. Create a proposal from template
4. Usage should be tracked in `template_usage`
5. Visit `/admin/analytics/templates` to view dashboard

### 3. Monitor Performance

Template analytics uses indexed queries for performance:
- All foreign keys are indexed
- Date columns (`viewed_at`, `created_at`) are indexed
- Organization filters use indexed columns

Expected query performance:
- Individual template analytics: <50ms
- Top templates query (30 days): <100ms
- Timeline queries: <200ms

---

## Troubleshooting

### Error: "relation does not exist"

**Cause:** Migration hasn't run yet or failed
**Solution:** Re-run migration using one of the deployment options above

### Error: "permission denied for table"

**Cause:** RLS policies not created or user not in organization
**Solution:** Verify policies exist and user has `organization_id` in `user_profiles`

### Error: "function does not exist"

**Cause:** Helper functions not created
**Solution:** Verify functions created using verification SQL above

### No Data in Analytics

**Cause:** Tracking not implemented or no activity yet
**Solution:**
1. Verify tracking calls are being made (check browser console)
2. Create test views/usage to populate data
3. Check `template_views` and `template_usage` tables directly

---

## Environment Variables

No new environment variables needed for analytics. Uses existing Supabase configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Security Considerations

### Row Level Security (RLS)

All analytics tables enforce organization-based isolation:

```sql
-- Example policy
CREATE POLICY "Users can view template_views for their organization"
ON template_views
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM user_profiles
        WHERE user_id = auth.uid()
    )
);
```

### Data Privacy

- `viewed_by` and `created_by` fields are optional (nullable)
- Can track anonymously if privacy required
- No PII stored in analytics tables

### Performance Impact

Minimal performance impact:
- Tracking is async (non-blocking)
- Indexes optimize query performance
- Aggregations computed at database level

---

## Migration Details

**File:** `supabase/migrations/20260215000000_template_analytics.sql`
**Created:** February 15, 2026
**Version:** 1.0
**Status:** Ready for deployment

**Changes:**
- Creates 2 tables (`template_views`, `template_usage`)
- Creates 6 indexes (foreign keys + date columns)
- Creates 8 RLS policies (4 per table)
- Creates 2 helper functions
- Adds comments for documentation

**Impact:**
- No breaking changes
- No existing data modified
- Purely additive migration
- Safe to run in production

---

## Next Steps After Deployment

1. ✅ Migration deployed successfully
2. ✅ Verify tables and functions created
3. ✅ Test analytics tracking (view a template)
4. ✅ Test analytics dashboard (`/admin/analytics/templates`)
5. ✅ Monitor performance in production
6. 🔄 Set up analytics alerts (optional)
7. 🔄 Create analytics reports (optional)

---

## Support

If you encounter issues:
1. Check verification steps above
2. Review troubleshooting section
3. Check Supabase logs in dashboard
4. Verify RLS policies are active
5. Test with direct SQL queries

**Migration is idempotent** - safe to re-run if needed (uses `IF NOT EXISTS` checks).
