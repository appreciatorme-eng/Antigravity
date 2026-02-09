#!/bin/bash

SUPABASE_URL="https://rtdjmykkgmirxdyfckqi.supabase.co"
ANON_KEY="sb_publishable_J18OyzAbBFTucB7-nq39YQ_fn5ECrxh"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/send-notification"

USER_ID="35b4c6e3-98ca-4804-a758-07e83559841a" # Avi reddy

# Payload
PAYLOAD=$(cat <<EOF
{
  "user_id": "$USER_ID",
  "title": "Test Notification",
  "body": "This is a test from the deployment script.",
  "data": {
    "trip_id": "test-trip-id"
  }
}
EOF
)

echo "Testing notification function..."
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$PAYLOAD"
echo ""
