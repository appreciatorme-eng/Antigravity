# Google OAuth Setup for GoBuddy Adventures

## Overview
This guide walks you through setting up Google OAuth authentication for the GoBuddy Adventures travel planning application.

## Prerequisites
- A Google Cloud Console account
- Admin access to your Supabase project

---

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
Navigate to [Google Cloud Console](https://console.cloud.google.com/)

### 1.2 Create or Select a Project
1. Click the project dropdown at the top
2. Click "New Project" or select an existing one
3. Name it something like "GoBuddy Adventures"

### 1.3 Enable the Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity Services"
3. Click **Enable**

### 1.4 Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: **GoBuddy Adventures**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue** through the rest

### 1.5 Configure OAuth Client
1. Application type: **Web application**
2. Name: **GoBuddy Adventures Web**
3. **Authorized JavaScript origins:**
   - `http://localhost:3000` (development)
   - `https://your-production-domain.com` (production)
4. **Authorized redirect URIs:**
   - `http://localhost:3000/auth/callback` (development)
   - `https://<your-project-ref>.supabase.co/auth/v1/callback` (Supabase callback)
   - `https://your-production-domain.com/auth/callback` (production)

5. Click **Create**
6. **IMPORTANT:** Copy the **Client ID** and **Client Secret**

---

## Step 2: Configure Supabase

### 2.1 Access Authentication Settings
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**

### 2.2 Enable Google Provider
1. Find **Google** in the list of providers
2. Toggle it **ON**
3. Enter your credentials:
   - **Client ID:** (from Step 1)
   - **Client Secret:** (from Step 1)
4. Click **Save**

### 2.3 Update Redirect URLs
1. Go to **Authentication** > **URL Configuration**
2. Add your site URL: `http://localhost:3000` (for development)
3. Add to redirect URLs: `http://localhost:3000/auth/callback`

---

## Step 3: Test the Integration

### 3.1 Start the Development Server
```bash
cd projects/travel-suite/apps/web
npm run dev
```

### 3.2 Test Google Sign-In
1. Open http://localhost:3000/auth
2. Click "Continue with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to your app

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure the redirect URI in Google Console exactly matches: `https://<project-ref>.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos

### "Access blocked: App not verified"
- For testing, you can add test users in the OAuth consent screen
- For production, submit for Google verification

### User Not Created in Supabase
- Check Supabase logs in **Database** > **Logs**
- Ensure the `auth.users` table has the correct RLS policies

---

## Production Checklist

1. [ ] Update Google OAuth redirect URIs with production domain
2. [ ] Update Supabase Site URL to production domain
3. [ ] Submit OAuth consent screen for Google verification (if > 100 users)
4. [ ] Enable HTTPS on your production domain
5. [ ] Test the full flow on production

---

## Environment Variables

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

These are already configured if you followed the initial setup.
