# Deployment Instructions for Notification System

Follow these steps to deploy the backend components required for push notifications and scheduled pickup reminders.

## 1. Database Migration
Apply the latest schema/migrations (`push_tokens`, `notification_logs`, reminder queue triggers, HNSW index):

```bash
npx supabase db push
```

> **Note:** This includes migration `20260212070000_switch_ivfflat_to_hnsw.sql` which switches the `policy_embeddings` vector index from IVFFlat to HNSW for correct behavior on empty/small tables.

## 2. Supabase Edge Function Configuration

You need to set the `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_PROJECT_ID` secrets for the `send-notification` function.

1.  **Get your Firebase Service Account JSON (store outside repo):**
    *   Go to Firebase Console -> Project Settings -> Service accounts.
    *   Generate a new private key (JSON file).
    *   Copy the **entire content** of this JSON file.
    *   Minify it to a single line if possible (optional, but helps with some shells).

2.  **Set the secrets:**
    Replace `<YOUR_FIREBASE_PROJECT_ID>` with your project ID (e.g., `travel-suite-123`).
    Replace `<YOUR_SERVICE_ACCOUNT_JSON>` with the JSON content you copied.

    **Note:** ensure you wrap the JSON in single quotes `'` to avoid shell expansion issues.

```bash
npx supabase secrets set FIREBASE_PROJECT_ID=<YOUR_FIREBASE_PROJECT_ID>
npx supabase secrets set FIREBASE_SERVICE_ACCOUNT='<YOUR_SERVICE_ACCOUNT_JSON>'
```

## 3. Deploy Edge Function

Deploy the `send-notification` function to Supabase:

```bash
npx supabase functions deploy send-notification
```
*Note: The Edge Function now verifies JWT tokens and admin role internally. It checks the `Authorization: Bearer <token>` header against Supabase Auth and confirms the caller has `admin` role in `profiles`. The `--no-verify-jwt` flag is no longer used.*

## 4. Verify Next.js Environment
Ensure your `apps/web/.env` (and Vercel/Production env) has:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NOTIFICATION_CRON_SECRET=... # Strong random secret for queue processor endpoint
NOTIFICATION_SIGNING_SECRET=... # Optional HMAC signing secret for cron replay protection
```

### Optional: WhatsApp Cloud API (Recommended)
To send real WhatsApp reminders (instead of push-only fallback), configure:
```
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
```
If missing, scheduled reminders still run and will use push where possible, but WhatsApp delivery will fail and retry.

## 5. Configure Scheduled Queue Processing
The reminder queue is auto-populated from `trip_driver_assignments` updates via DB triggers.

Run a scheduler every minute (Vercel Cron, external cron, or Supabase scheduled call) to invoke:
```
POST /api/notifications/process-queue
Header: x-notification-cron-secret: <NOTIFICATION_CRON_SECRET>
```

Example curl:
```bash
curl -X POST "https://<your-web-domain>/api/notifications/process-queue" \
  -H "x-notification-cron-secret: <NOTIFICATION_CRON_SECRET>"
```

Stronger option (recommended): signed cron requests.
- Headers:
  - `x-cron-ts`: current unix epoch milliseconds
  - `x-cron-signature`: `hex(hmac_sha256(NOTIFICATION_SIGNING_SECRET, "<ts>:POST:/api/notifications/process-queue"))`
- Endpoint also accepts `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` for internal service calls.

Manual testing path (admin UI):
- Admin can trigger the same processor from **Admin → Notifications → Run Queue Now**.
- This uses admin bearer auth (no cron secret required in browser flow).
- Admin can move failed queue rows back to pending via **Admin → Notifications → Retry Failed**.

## 6. Live Location Sharing Endpoints
Live location is now supported with tokenized links:
- `POST /api/location/share` (admin auth required): create/reuse live link for trip/day
- `GET /api/location/share?tripId=<id>&dayNumber=<n>` (admin auth required): fetch existing link
- `DELETE /api/location/share?tripId=<id>&dayNumber=<n>` (admin auth required): revoke active live link(s)
- `GET /api/location/client-share?tripId=<id>&dayNumber=<n>` (client auth required): create/reuse live link for mobile client view
- `POST /api/location/ping` (driver auth required): write GPS ping to `driver_locations`
- `POST /api/location/cleanup-expired` (cron secret / signed cron / service-role bearer / admin auth): deactivate expired active live links
- `GET /api/location/live/:token` (public by token): read latest location payload
- `GET /live/:token` (web page): client/driver-friendly live map view

No extra environment variable is required for live-link creation.
Use `NEXT_PUBLIC_APP_URL` if you need absolute URLs in generated share links.

Pickup reminder queue processor now auto-attaches a live location URL for pickup reminders by creating/reusing `trip_location_shares` records.

Live-share security controls:
- Links are time-limited (`expires_at`) and checked on every access.
- Links are revocable (`DELETE /api/location/share` and cleanup job).
- Public token endpoint now has per-IP+token rate limiting to reduce enumeration abuse.

### Optional: Welcome Email Provider
To enable welcome emails from the mobile app, configure an email provider for the web API:
```
RESEND_API_KEY=...
WELCOME_FROM_EMAIL=...
```
*If these are missing, the welcome email endpoint returns a skipped response and does not block user signup.*

## 7. Build Mobile App
Rebuild the mobile app to pick up the `Info.plist` changes:

```bash
cd apps/mobile
flutter clean
flutter pub get
cd ios
pod install
cd ..
flutter run
```

### Mobile live-location publishing
- Driver app now calls `POST /api/location/ping` every ~20 seconds when live sharing is enabled in trip detail.
- Ensure `apps/mobile/lib/core/config/supabase_config.dart` has a real deployed web base URL:
```
static const String apiBaseUrl = 'https://<your-deployed-web-domain>';
```

### Driver identity mapping (important)
For external-driver assignments with app-based live pings, map the app user to the external driver in:
- `public.driver_accounts` (`external_driver_id`, `profile_id`, `is_active`)
