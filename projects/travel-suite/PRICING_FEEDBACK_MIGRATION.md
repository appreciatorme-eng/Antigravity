# Pricing Feedback Table Migration

## Overview

This migration creates the `pricing_feedback` table to track AI pricing suggestion outcomes (accepted/adjusted/dismissed). This data will be used to improve the pricing model over time through a feedback loop.

## Migration File

**Location**: `supabase/migrations/20260316000001_pricing_feedback.sql`

**Created**: 2026-03-16

## Table Schema

```sql
CREATE TABLE pricing_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
    suggestion_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('accepted', 'adjusted', 'dismissed')),
    suggested_price_paise INTEGER NOT NULL CHECK (suggested_price_paise > 0),
    final_price_paise INTEGER CHECK (final_price_paise IS NULL OR final_price_paise > 0),
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low', 'ai_estimate')),
    comparable_trips_count INTEGER NOT NULL DEFAULT 0,
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 30),
    pax INTEGER NOT NULL CHECK (pax >= 1 AND pax <= 20),
    package_tier TEXT CHECK (package_tier IN ('budget', 'standard', 'premium', 'luxury')),
    season_month INTEGER CHECK (season_month IS NULL OR (season_month >= 1 AND season_month <= 12)),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Features

- **Indexes**: Optimized for querying by organization, proposal, action, date, and destination+duration
- **RLS Policies**: Organization-level access control
- **Constraints**: Data integrity checks for actions, prices, and ranges
- **Triggers**: Automatic updated_at timestamp handling

## Application Methods

### Method 1: Automated Script (Recommended)

Use the provided Node.js script:

```bash
cd projects/travel-suite

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL='https://your-project.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'

# Run the migration script
node apply-pricing-feedback-migration.mjs
```

**Expected output**:
```
💰 Pricing Feedback Migration - Starting...

ℹ️ Connecting to: https://your-project.supabase.co

📄 Applying: Pricing Feedback Table
   File: supabase/migrations/20260316000001_pricing_feedback.sql

✅ Success: Pricing Feedback Table

ℹ️ Verifying table...
✅ Table verified successfully

🎉 Migration applied successfully!

ℹ️ Next: Implement the pricing feedback API endpoint
```

### Method 2: Supabase Dashboard (Manual)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy Migration SQL**
   - Open `supabase/migrations/20260316000001_pricing_feedback.sql`
   - Copy the entire contents

4. **Execute Migration**
   - Paste the SQL into the editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

5. **Verify Success**
   - Expected result: "Success. No rows returned"
   - Check that `pricing_feedback` table appears in Database → Tables

### Method 3: Supabase CLI

```bash
cd projects/travel-suite

# Link project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Push all pending migrations
supabase db push
```

### Method 4: Direct psql

```bash
# Get DATABASE_URL from Supabase Dashboard → Settings → Database → Connection String

DATABASE_URL='postgres://...' \
psql "$DATABASE_URL" -f supabase/migrations/20260316000001_pricing_feedback.sql
```

## Verification

After applying the migration, verify the schema:

### Check Table Exists

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'pricing_feedback';
```

### Check Columns

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pricing_feedback'
ORDER BY ordinal_position;
```

### Check RLS Policies

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'pricing_feedback';
```

**Expected policies**:
- `Org members can view pricing feedback` (SELECT)
- `Org members can create pricing feedback` (INSERT)
- `Org members can update pricing feedback` (UPDATE)
- `Org admins can delete pricing feedback` (DELETE)

### Check Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pricing_feedback';
```

**Expected indexes**:
- `idx_pricing_feedback_organization_id`
- `idx_pricing_feedback_proposal_id`
- `idx_pricing_feedback_action`
- `idx_pricing_feedback_created_at`
- `idx_pricing_feedback_created_by`
- `idx_pricing_feedback_destination_duration`

### Test Insert (via application)

```typescript
const { data, error } = await supabase
  .from('pricing_feedback')
  .insert({
    organization_id: 'your-org-id',
    suggestion_id: 'test-123',
    action: 'accepted',
    suggested_price_paise: 1000000,
    final_price_paise: 1000000,
    confidence_level: 'high',
    comparable_trips_count: 5,
    destination: 'Goa',
    duration_days: 5,
    pax: 2
  })
  .select()
  .single();

console.log(data); // Should return the inserted row
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS pricing_feedback CASCADE;
```

**⚠️ WARNING**: This will permanently delete all pricing feedback data!

## Next Steps

After applying this migration:

1. ✅ Verify table and policies are created
2. ⏭️ Implement pricing feedback API endpoint (`/api/ai/pricing-feedback`)
3. ⏭️ Integrate feedback tracking in frontend widget
4. ⏭️ Create analytics dashboard for pricing insights

## Dependencies

This migration depends on existing tables:
- `organizations` (for organization_id FK)
- `proposals` (for proposal_id FK)
- `profiles` (for created_by FK)

All referenced tables already exist in the schema.

## Status

- [x] Migration file created
- [ ] Migration applied to database
- [ ] Schema verified
- [ ] Ready for API implementation

---

**Migration file**: `supabase/migrations/20260316000001_pricing_feedback.sql`
**Script**: `apply-pricing-feedback-migration.mjs`
**Feature**: AI-Powered Pricing Intelligence (Task 012)
