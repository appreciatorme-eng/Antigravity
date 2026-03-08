#!/usr/bin/env bash
# post-merge.sh — Run once after PR #7 merges to complete live deployment
# Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ./scripts/post-merge.sh
set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo "Validating environment..."
for var in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY WPPCONNECT_BASE_URL \
           WPPCONNECT_TOKEN NEXT_PUBLIC_APP_URL; do
  [ -n "${!var:-}" ] || fail "$var is not set. Export it before running this script."
done
ok "All required env vars present"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUPABASE_DIR="$PROJECT_ROOT/supabase"

MIGRATIONS=(
  "$SUPABASE_DIR/migrations/20260320000000_observability_performance_indexes.sql"
  "$SUPABASE_DIR/migrations/20260320010000_payment_links_reminder.sql"
  "$SUPABASE_DIR/migrations/20260321000000_rls_round_two_hardening.sql"
)

if command -v supabase >/dev/null 2>&1; then
  echo "Applying pending migrations with Supabase CLI..."
  (
    cd "$PROJECT_ROOT"
    for abs_path in "${MIGRATIONS[@]}"; do
      [ -f "$abs_path" ] || fail "Migration not found: $abs_path"
      echo "Applying $(basename "$abs_path")..."
      supabase db push --include-all >/dev/null
      ok "$(basename "$abs_path") applied"
      break
    done
  )
else
  echo "⚠️  Supabase CLI not found. Apply these migrations manually in Supabase SQL Editor:"
  for abs_path in "${MIGRATIONS[@]}"; do
    [ -f "$abs_path" ] || fail "Migration not found: $abs_path"
    echo "   - $abs_path"
  done
fi

echo "Deploying payment-reminders edge function..."
if command -v supabase >/dev/null 2>&1; then
  project_ref="$(printf '%s' "$SUPABASE_URL" | sed -E 's#https://([^.]+)\..*#\1#')"
  (
    cd "$PROJECT_ROOT"
    supabase functions deploy payment-reminders --project-ref "$project_ref"
  )
  ok "Edge function deployed"
else
  echo "⚠️  Supabase CLI not found. Deploy manually:"
  echo "    supabase functions deploy payment-reminders"
fi

if command -v supabase >/dev/null 2>&1; then
  project_ref="$(printf '%s' "$SUPABASE_URL" | sed -E 's#https://([^.]+)\..*#\1#')"
  (
    cd "$PROJECT_ROOT"
    supabase secrets set \
      --project-ref "$project_ref" \
      WPPCONNECT_BASE_URL="$WPPCONNECT_BASE_URL" \
      WPPCONNECT_TOKEN="$WPPCONNECT_TOKEN" \
      WPPCONNECT_SESSION="${WPPCONNECT_SESSION:-default}" \
      NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
      SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
  )
  ok "Edge function secrets set"
else
  echo "⚠️  Set these secrets manually in Supabase Dashboard → Edge Functions → Secrets:"
  echo "    WPPCONNECT_BASE_URL, WPPCONNECT_TOKEN, WPPCONNECT_SESSION, NEXT_PUBLIC_APP_URL"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ⚠️  FINAL MANUAL STEP — Paste this in Supabase SQL Editor:"
echo "════════════════════════════════════════════════════════════"
cat <<'SQL'

SELECT cron.schedule(
  'payment-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/payment-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Verify it registered:
SELECT jobid, jobname, schedule, active FROM cron.job;

SQL

echo ""
ok "Post-merge setup complete. Run the SQL above to finish."
