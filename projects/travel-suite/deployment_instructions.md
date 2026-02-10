# Deployment Instructions for Notification System

Follow these steps to deploy the backend components required for the push notification system.

## 1. Database Migration
Apply the new schema for `push_tokens` and `notification_logs`:

```bash
npx supabase db push
```

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
npx supabase functions deploy send-notification --no-verify-jwt
```
*Note: The Next.js API route invokes the Edge Function using the service role key via `supabaseAdmin.functions.invoke`. This is intended for server-only usage and relies on the API route’s auth checks.*

## 4. Verify Next.js Environment
Ensure your `apps/web/.env` (and Vercel/Production env) has:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 5. Build Mobile App
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
