# Database Migration Process - Quick Reference

## Standard Workflow for Future Migrations

### Step 1: Create Migration File

**Location**: `supabase/migrations/`

**Naming convention**:
```
YYYYMMDDHHmmss_descriptive_name.sql
```

**Example**:
```
20260220150000_add_user_preferences.sql
```

**Template**:
```sql
-- Migration: Add user preferences table
-- Date: 2024-02-20
-- Description: Stores user settings and preferences

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Your columns here
    theme TEXT DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_prefs UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON user_preferences(user_id);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own preferences"
ON user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON user_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE user_preferences IS 'Stores user settings and preferences';
```

### Step 2: Apply Migration

**Method 1: Supabase CLI (Recommended)**

```bash
# Navigate to project
cd /Users/justforfun/Desktop/Claude\ Code\ CLI/Antigravity/projects/travel-suite

# Link project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Push all pending migrations
supabase db push

# Or push with all migrations
supabase db push --include-all
```

**Method 2: psql (Direct)**

```bash
# Get DATABASE_URL from Supabase Dashboard
# Settings → Database → Connection String → Transaction Mode

DATABASE_URL='postgres://...' \
psql "$DATABASE_URL" -f supabase/migrations/YOUR_MIGRATION_FILE.sql
```

**Method 3: Supabase Dashboard**

1. Go to SQL Editor
2. Copy migration SQL
3. Paste and run
4. Verify success

### Step 3: Verify Migration

**Check tables created:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'your_table_name';
```

**Check functions created:**
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%your_function%';
```

**Check policies:**
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'your_table_name';
```

### Step 4: Test in Application

1. Deploy to Vercel (or restart dev server)
2. Test the feature using the new table/function
3. Check for errors in logs
4. Verify data is being stored correctly

### Step 5: Document Migration

Create a brief note in your commit or docs:
```markdown
## Migration: [Name]
**Date**: YYYY-MM-DD
**Tables**: table1, table2
**Functions**: func1, func2
**Purpose**: Brief description
```

## Common Migration Patterns

### Adding a New Table

```sql
CREATE TABLE IF NOT EXISTS your_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Always add indexes
CREATE INDEX idx_your_table_something ON your_table(column_name);

-- Always enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Always add policies
CREATE POLICY "policy_name" ON your_table FOR SELECT USING (true);
```

### Adding a Column

```sql
ALTER TABLE existing_table
ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Add index if needed
CREATE INDEX IF NOT EXISTS idx_existing_table_new_column
ON existing_table(new_column);
```

### Creating a Function

```sql
CREATE OR REPLACE FUNCTION your_function_name(param1 TEXT)
RETURNS TABLE (col1 TEXT, col2 INT) AS $$
BEGIN
    RETURN QUERY
    SELECT column1, column2
    FROM your_table
    WHERE something = param1;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION your_function_name IS 'Description of what it does';
```

### Creating RLS Policies

```sql
-- Enable RLS first
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can read their own data"
ON your_table
FOR SELECT
USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users can insert their own data"
ON your_table
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update policy
CREATE POLICY "Users can update their own data"
ON your_table
FOR UPDATE
USING (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users can delete their own data"
ON your_table
FOR DELETE
USING (auth.uid() = user_id);
```

## Best Practices

### ✅ DO

- Use `IF NOT EXISTS` for tables, indexes, policies
- Use `OR REPLACE` for functions
- Add comments to tables and functions
- Create indexes for foreign keys and query columns
- Enable RLS on all tables
- Add appropriate policies
- Use timestamps (created_at, updated_at)
- Use UUIDs for primary keys
- Add constraints for data integrity

### ❌ DON'T

- Use `DROP TABLE` without backup
- Skip RLS policies
- Forget to add indexes
- Use plain text for sensitive data
- Skip comments/documentation
- Apply migrations to production without testing

## Troubleshooting

### Migration fails: "relation already exists"

**Solution**: Migration already applied or use `IF NOT EXISTS`

### Migration fails: "permission denied"

**Solution**:
- Check using service_role key (not anon key)
- Verify database permissions

### Migration applied but function not working

**Solution**:
- Check function exists: `\df your_function_name` in psql
- Verify function parameters match your call
- Check RLS policies aren't blocking

### Can't access new table from app

**Solution**:
- Verify RLS policies are correct
- Check anon key has read access
- Restart your development server

## Quick Commands Reference

### Supabase CLI

```bash
# List projects
supabase projects list

# Link to project
supabase link --project-ref YOUR_REF

# Push migrations
supabase db push

# Push specific migration
supabase db push --include-all

# Check diff
supabase db diff --linked

# Reset local database (DEV ONLY)
supabase db reset
```

### psql

```bash
# Connect to database
psql "$DATABASE_URL"

# Run migration file
psql "$DATABASE_URL" -f migration.sql

# List tables
psql "$DATABASE_URL" -c "\dt"

# List functions
psql "$DATABASE_URL" -c "\df"

# Describe table
psql "$DATABASE_URL" -c "\d table_name"
```

## Example: Complete Migration Workflow

**Scenario**: Add a favorites table for users

**1. Create migration file:**
```bash
touch supabase/migrations/20260220160000_add_favorites_table.sql
```

**2. Write migration:**
```sql
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE(user_id, item_id, item_type)
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_item_id ON user_favorites(item_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
ON user_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
ON user_favorites FOR ALL
USING (auth.uid() = user_id);
```

**3. Apply migration:**
```bash
cd projects/travel-suite
supabase db push
```

**4. Verify:**
```bash
# Check table exists
echo "SELECT * FROM user_favorites LIMIT 1;" | psql "$DATABASE_URL"
```

**5. Use in code:**
```typescript
const { data, error } = await supabase
  .from('user_favorites')
  .insert({ item_id, item_type });
```

**6. Test and deploy:**
```bash
git add supabase/migrations/
git commit -m "Add user favorites table"
git push
```

## Resources

- **Supabase Docs**: https://supabase.com/docs/guides/database/migrations
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

**For this project, migrations are in**:
```
/Users/justforfun/Desktop/Claude Code CLI/Antigravity/projects/travel-suite/supabase/migrations/
```

**Apply via**:
```bash
cd /Users/justforfun/Desktop/Claude\ Code\ CLI/Antigravity/projects/travel-suite
supabase db push
```
