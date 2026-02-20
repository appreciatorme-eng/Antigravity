# Apply Geocoding Migrations via CLI

## Method 1: Using psql (Recommended - Fastest)

### Prerequisites
- `psql` installed (comes with PostgreSQL)
- Supabase database connection string

### Steps

**1. Get your DATABASE_URL**

Go to Supabase Dashboard:
- **Project Settings** → **Database**
- Scroll to **Connection String**
- Select **Transaction** pooler mode
- Click **Copy**

Example format:
```
postgres://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**2. Run the script**

```bash
cd /Users/justforfun/Desktop/Claude\ Code\ CLI/Antigravity/projects/travel-suite

DATABASE_URL='paste-your-connection-string-here' ./apply-via-psql.sh
```

**Example:**
```bash
DATABASE_URL='postgres://postgres.abcd:mypassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres' ./apply-via-psql.sh
```

**Expected output:**
```
🗺️  Geocoding Migrations - psql method
======================================

📄 Migration 1: Geocoding Cache Table
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
ALTER TABLE
CREATE POLICY
CREATE POLICY
✅ Migration 1 complete

📄 Migration 2: Geocoding Usage Tracking
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
ALTER TABLE
CREATE POLICY
CREATE POLICY
✅ Migration 2 complete

======================================
🎉 All migrations applied successfully!
```

---

## Method 2: Using Node.js Script

### Prerequisites
- Node.js installed
- Supabase URL and Service Role Key

### Steps

**1. Get your credentials**

From Supabase Dashboard:
- **Project Settings** → **API**
- Copy **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
- Copy **service_role** secret (SUPABASE_SERVICE_ROLE_KEY)

**2. Run the script**

```bash
cd /Users/justforfun/Desktop/Claude\ Code\ CLI/Antigravity/projects/travel-suite

NEXT_PUBLIC_SUPABASE_URL='https://xxxxx.supabase.co' \
SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOi...' \
node apply-migrations.mjs
```

---

## Method 3: Using Supabase CLI with db push

### Prerequisites
- Supabase CLI installed (`brew install supabase`)
- Project linked to remote

### Steps

**1. Link to your project**

```bash
cd /Users/justforfun/Desktop/Claude\ Code\ CLI/Antigravity/projects/travel-suite

supabase link --project-ref YOUR_PROJECT_REF
```

Get `YOUR_PROJECT_REF` from:
- Supabase Dashboard → **Project Settings** → **General** → **Reference ID**

**2. Push migrations**

```bash
supabase db push
```

This will push ALL pending migrations in the `supabase/migrations/` folder.

---

## Verification

After running migrations, verify they worked:

### 1. Check tables exist

```bash
# If using psql:
psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE tablename IN ('geocoding_cache', 'geocoding_usage');"
```

**Expected output:**
```
   tablename
-----------------
 geocoding_cache
 geocoding_usage
```

### 2. Check functions exist

```bash
psql "$DATABASE_URL" -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%geocoding%';"
```

**Expected output:**
```
         routine_name
-------------------------------
 can_make_geocoding_api_call
 get_geocoding_usage_stats
 get_or_create_geocoding_usage
 increment_geocoding_api_call
 increment_geocoding_cache_hit
```

### 3. Test via API

Visit your deployed app:
```
https://your-app.vercel.app/api/admin/geocoding/usage
```

Should return:
```json
{
  "status": "healthy",
  "month": "2024-02",
  "usage": {
    "totalRequests": 0,
    "cacheHits": 0,
    "apiCalls": 0,
    "cacheHitRate": "0%"
  },
  "limits": {
    "threshold": 90000,
    "remaining": 90000,
    "percentageUsed": "0%",
    "limitReached": false
  }
}
```

---

## Troubleshooting

### Error: "psql: command not found"

**Install PostgreSQL:**
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### Error: "connection refused"

**Check:**
1. Is your DATABASE_URL correct?
2. Did you use the **Transaction** pooler mode?
3. Is your IP allowlisted in Supabase? (Go to Project Settings → Database → Add your IP)

### Error: "relation already exists"

This is fine! It means the migration was already applied. The script is idempotent.

### Error: "permission denied"

**Check:**
1. Are you using the **service_role** key (not anon key)?
2. For psql, did you include the password in the connection string?

---

## Quick Reference

### Scripts Location
```
/Users/justforfun/Desktop/Claude Code CLI/Antigravity/projects/travel-suite/
├── apply-via-psql.sh          # psql method (recommended)
├── apply-migrations.mjs        # Node.js method
└── supabase/migrations/
    ├── 20260220000000_add_geocoding_cache.sql
    └── 20260220010000_add_geocoding_usage_tracking.sql
```

### Migration Files
- **20260220000000_add_geocoding_cache.sql** - Cache table + indexes + policies
- **20260220010000_add_geocoding_usage_tracking.sql** - Usage table + functions + tracking

### What Gets Created
**Tables:**
- `geocoding_cache` - Stores geocoded locations
- `geocoding_usage` - Tracks monthly API usage

**Functions:**
- `can_make_geocoding_api_call()` - Check quota
- `increment_geocoding_api_call()` - Track API call
- `increment_geocoding_cache_hit()` - Track cache hit
- `get_geocoding_usage_stats()` - Get statistics
- `get_or_create_geocoding_usage()` - Internal helper

**Policies:**
- Read access for cache (public)
- Write access for cache (authenticated)
- Read access for usage (authenticated)

---

## Next Steps After Migration

1. ✅ **Verify** migrations worked (see Verification section above)
2. 🧪 **Test** - Generate a Chennai itinerary
3. 📊 **Monitor** - Check `/api/admin/geocoding/usage`
4. 🗺️ **Verify** - Map shows Chennai, not New York
5. 📈 **Watch** - Cache hit rate should increase over time

---

**Need help?** Check:
- `APPLY_MIGRATIONS_NOW.md` - Dashboard method (copy-paste SQL)
- `DEPLOYMENT_CHECKLIST.md` - Full testing checklist
- `GEOCODING_IMPLEMENTATION.md` - Complete documentation
