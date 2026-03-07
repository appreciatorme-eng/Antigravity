#!/bin/bash

# Simple script to apply migration using psql.
# Reads the migration file and executes it against the configured Supabase project.

SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL must be set}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY must be set}"

# Extract the DB host from URL.
DB_HOST="${SUPABASE_DB_HOST:-$(printf '%s\n' "$SUPABASE_URL" | sed -E 's#^https?://([^.]+)\.supabase\.co/?$#db.\1.supabase.co#')}"
MIGRATION_FILE="$(dirname "$0")/migrations/20260218000000_itinerary_cache_system.sql"

echo "🚀 Applying Itinerary Cache Migration..."
echo "========================================"
echo ""
echo "Supabase URL: $SUPABASE_URL"
echo "Migration File: $MIGRATION_FILE"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found!"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  brew install postgresql"
    echo ""
    echo "Or apply migration manually via Supabase Dashboard SQL Editor"
    exit 1
fi

# You'll need the database password - let's prompt for it
echo "Please enter your Supabase database password:"
echo "(Find it in: Supabase Dashboard > Settings > Database > Connection string)"
read -s DB_PASSWORD
echo ""

# Apply migration
echo "📝 Executing migration..."
PGPASSWORD="$DB_PASSWORD" psql \
    "postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:5432/postgres" \
    -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "🔍 Verifying tables..."

    PGPASSWORD="$DB_PASSWORD" psql \
        "postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:5432/postgres" \
        -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('itinerary_cache', 'itinerary_cache_analytics');"

    echo ""
    echo "✅ Cache system is now active!"
else
    echo ""
    echo "❌ Migration failed!"
    exit 1
fi
