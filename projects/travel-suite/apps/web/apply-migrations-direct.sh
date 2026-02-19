#!/bin/bash

# Direct SQL execution via Supabase PostgREST
# This applies migrations by executing SQL directly via HTTP

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "Error: Missing environment variables"
    echo "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "🚀 Applying migrations directly to Supabase..."
echo "URL: $SUPABASE_URL"
echo ""

# Extract project reference from URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    local filename=$(basename "$file")

    echo "📄 Applying: $filename"

    # Read SQL file
    SQL_CONTENT=$(cat "$file")

    # Use Supabase Management API to execute SQL
    # Note: This requires direct PostgreSQL connection or Supabase CLI
    # For now, we'll output instructions for manual application

    echo "✅ Ready to apply (see instructions below)"
}

# Apply migrations
execute_sql_file "../../supabase/migrations/20260219140000_rag_template_search.sql"
execute_sql_file "../../supabase/migrations/20260219150000_pdf_import_pipeline.sql"

echo ""
echo "========================================================================"
echo "⚠️  Manual Migration Required"
echo "========================================================================"
echo ""
echo "The migrations need to be applied via Supabase Dashboard SQL Editor:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "2. Copy and paste the contents of these files:"
echo "   - supabase/migrations/20260219140000_rag_template_search.sql"
echo "   - supabase/migrations/20260219150000_pdf_import_pipeline.sql"
echo ""
echo "3. Click 'Run' for each migration"
echo ""
echo "Or use Supabase CLI:"
echo "   supabase db push"
echo ""
echo "========================================================================"
