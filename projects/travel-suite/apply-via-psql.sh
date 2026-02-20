#!/bin/bash

# Apply geocoding migrations via psql
# Usage: DATABASE_URL="postgres://..." ./apply-via-psql.sh

set -e

echo "🗺️  Geocoding Migrations - psql method"
echo "======================================"
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo ""
    echo "Usage:"
    echo "  DATABASE_URL='postgres://user:pass@host:5432/dbname' ./apply-via-psql.sh"
    echo ""
    echo "Get your DATABASE_URL from:"
    echo "  Supabase Dashboard → Project Settings → Database → Connection String"
    echo "  (Use 'Transaction' pooler mode)"
    echo ""
    exit 1
fi

echo "📄 Migration 1: Geocoding Cache Table"
psql "$DATABASE_URL" -f supabase/migrations/20260220000000_add_geocoding_cache.sql
echo "✅ Migration 1 complete"
echo ""

echo "📄 Migration 2: Geocoding Usage Tracking"
psql "$DATABASE_URL" -f supabase/migrations/20260220010000_add_geocoding_usage_tracking.sql
echo "✅ Migration 2 complete"
echo ""

echo "======================================"
echo "🎉 All migrations applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Test your app: Generate an itinerary"
echo "  2. Check usage: /api/admin/geocoding/usage"
echo ""
