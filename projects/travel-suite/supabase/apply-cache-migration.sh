#!/bin/bash

# Script to apply itinerary cache migration to Supabase
# This script will apply the migration using psql or Supabase CLI

set -e  # Exit on error

echo "🚀 Applying Itinerary Cache Migration..."
echo "========================================="
echo ""

# Check if SUPABASE_DB_URL is set (connection string format)
if [ -n "$SUPABASE_DB_URL" ]; then
    echo "✅ Using SUPABASE_DB_URL connection string"
    psql "$SUPABASE_DB_URL" -f "$(dirname "$0")/migrations/20260218000000_itinerary_cache_system.sql"

elif [ -n "$SUPABASE_PROJECT_REF" ]; then
    echo "✅ Using Supabase CLI with project ref: $SUPABASE_PROJECT_REF"

    # Link the project if not already linked
    if ! supabase projects list 2>&1 | grep -q "$SUPABASE_PROJECT_REF"; then
        echo "🔗 Linking to Supabase project..."
        supabase link --project-ref "$SUPABASE_PROJECT_REF"
    fi

    # Apply migration
    supabase db push

else
    echo "❌ Error: No Supabase connection found!"
    echo ""
    echo "Please provide Supabase credentials in one of these ways:"
    echo ""
    echo "Option 1: Set SUPABASE_DB_URL environment variable"
    echo "  export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres'"
    echo ""
    echo "Option 2: Set SUPABASE_PROJECT_REF environment variable"
    echo "  export SUPABASE_PROJECT_REF='your-project-ref'"
    echo ""
    echo "Option 3: Apply manually via Supabase Dashboard"
    echo "  1. Go to https://app.supabase.com/project/_/sql/new"
    echo "  2. Copy contents from: supabase/migrations/20260218000000_itinerary_cache_system.sql"
    echo "  3. Click 'Run'"
    echo ""
    exit 1
fi

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "🔍 Verifying migration..."

# Verify tables were created
if [ -n "$SUPABASE_DB_URL" ]; then
    VERIFY_RESULT=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('itinerary_cache', 'itinerary_cache_analytics');")

    if [ "$VERIFY_RESULT" -eq 2 ]; then
        echo "✅ Verification passed: Cache tables created successfully"
    else
        echo "⚠️  Warning: Expected 2 tables, found $VERIFY_RESULT"
    fi
fi

echo ""
echo "📊 Cache system is now active!"
echo ""
echo "To monitor cache performance, run these SQL queries in Supabase:"
echo "  SELECT * FROM get_cache_stats(30);"
echo "  SELECT * FROM itinerary_cache_analytics ORDER BY created_at DESC LIMIT 10;"
echo ""
echo "See supabase/migrations/README_CACHE_MIGRATION.md for full documentation."
