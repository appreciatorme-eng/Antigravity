#!/bin/bash

# Simple script to apply migration using psql
# Reads the migration file and executes it

SUPABASE_URL="https://rtdjmykkgmirxdyfckqi.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZGpteWtrZ21pcnhkeWZja3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5MDk2OCwiZXhwIjoyMDg1OTY2OTY4fQ.otwvXBNKqELRy5kEscNEcp_D21ZQNk9xuIcj3JnbqVU"

# Extract the DB host from URL
DB_HOST="db.rtdjmykkgmirxdyfckqi.supabase.co"
MIGRATION_FILE="$(dirname "$0")/migrations/20260218000000_itinerary_cache_system.sql"

echo "🚀 Applying Itinerary Cache Migration..."
echo "========================================"
echo ""
echo "Supabase Project: rtdjmykkgmirxdyfckqi"
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
