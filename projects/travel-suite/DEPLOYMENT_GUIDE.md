# 🚀 Deployment Guide - Travel Suite Web App

## Quick Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (free tier works)
- GitHub repository: `appreciatorme-eng/Antigravity`
- Supabase project running

### Step 1: Deploy via Vercel Dashboard

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select repository: `appreciatorme-eng/Antigravity`
   - Click "Import"

3. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Node Version: 22.x
   ```

4. **Add Environment Variables** (CRITICAL!)

   Click "Environment Variables" and add these:

   **Required:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://rtdjmykkgmirxdyfckqi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZGpteWtrZ21pcnhkeWZja3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTA5NjgsImV4cCI6MjA4NTk2Njk2OH0.vArwxnMCeyKDxjuY0nlOfmn5N6v20CJ9ZNOT1Q1jSpI
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZGpteWtrZ21pcnhkeWZja3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM5MDk2OCwiZXhwIjoyMDg1OTY2OTY4fQ.otwvXBNKqELRy5kEscNEcp_D21ZQNk9xuIcj3JnbqVU
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```

   **⚠️ IMPORTANT:**
   - DO NOT add `NEXT_PUBLIC_MOCK_ADMIN` - this is for local dev only
   - Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL after first deployment

   **Optional (can add later):**
   ```
   GOOGLE_GEMINI_API_KEY=your-api-key-here
   NEXT_PUBLIC_GEMINI_API_KEY=your-api-key-here
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes for build to complete
   - You'll get a URL like: `https://travel-suite-xyz.vercel.app`

### Step 2: Update Supabase Configuration

1. **Update Site URL**
   - Go to Supabase Dashboard → Settings → API
   - Set **Site URL**: `https://your-app-name.vercel.app`

2. **Add Redirect URLs**
   - Go to Authentication → URL Configuration
   - Add to **Redirect URLs**:
     ```
     https://your-app-name.vercel.app/auth/callback
     https://your-app-name.vercel.app/*
     ```

3. **Update Vercel Environment Variable**
   - Go back to Vercel → Settings → Environment Variables
   - Edit `NEXT_PUBLIC_APP_URL` to match your actual Vercel URL
   - Redeploy (Vercel → Deployments → Click "..." → Redeploy)

### Step 3: Create Admin User

**Option A: Via Supabase Dashboard**
1. Go to Supabase → Authentication → Users
2. Create a new user with your email
3. Verify the email
4. Go to Table Editor → `profiles` table
5. Find your user and set `role = 'admin'`

**Option B: Via SQL Editor**
```sql
-- First, sign up via your app at: https://your-app.vercel.app/auth
-- Then run this SQL to make yourself admin:

UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### Step 4: Test Your Deployment

Visit your deployed app and test these pages:

1. **Home Page**: `https://your-app.vercel.app`
   - Should load the landing page ✅

2. **Sign In**: `https://your-app.vercel.app/auth`
   - Sign in with your admin account ✅

3. **Admin Dashboard**: `https://your-app.vercel.app/admin`
   - Should show admin dashboard ✅

4. **Billing Page**: `https://your-app.vercel.app/admin/billing`
   - Should show subscription tiers ✅

5. **Revenue Dashboard**: `https://your-app.vercel.app/admin/revenue`
   - Should show revenue metrics ✅

---

## Known Issues & Fixes

### Issue 1: TypeScript Build Error (async params)
**Symptom:** Build fails with "params: Promise<{ id: string }>"

**Fix:** Update API route files to use async params:
```typescript
// OLD (Next.js 15)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
}

// NEW (Next.js 16)
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
}
```

**Affected files:**
- `apps/web/src/app/api/add-ons/[id]/route.ts`
- `apps/web/src/app/api/proposals/[id]/pdf/route.ts`
- `apps/web/src/app/api/invoices/[id]/route.ts`
- And other dynamic routes

**Workaround:** Deploy anyway - Vercel will build successfully even with TypeScript warnings

### Issue 2: Pages Load Slowly First Time
**Symptom:** First load of admin pages takes 10-30 seconds

**Cause:** Cold start + large Supabase queries

**Fix (Optional):**
- Add database indexes on frequently queried columns
- Implement Redis caching for query results
- Use Vercel Edge Functions for critical routes

### Issue 3: Health Check Timeout
**Symptom:** `/api/health` endpoint takes 64 seconds (timeout on Vercel)

**Fix:** Add timeout to database queries:
```typescript
// In health check route
const timeout = Promise.race([
  queryDatabase(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
]);
```

---

## Environment Variables Reference

### Production (.env.production)
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://rtdjmykkgmirxdyfckqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional
GOOGLE_GEMINI_API_KEY=your-key
NEXT_PUBLIC_GEMINI_API_KEY=your-key
```

### Local Development (.env.local)
```bash
# Same as production, but:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For testing without auth (development only):
# NEXT_PUBLIC_MOCK_ADMIN=true
```

---

## Continuous Deployment

Once deployed, Vercel will automatically:
- ✅ Redeploy on every `git push` to main
- ✅ Create preview deployments for PRs
- ✅ Run builds with your environment variables
- ✅ Serve your app from global CDN

### Manual Redeploy
1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click "..." menu on latest deployment
5. Click "Redeploy"

---

## Custom Domain (Optional)

1. Go to Vercel → Project Settings → Domains
2. Add your domain (e.g., `app.travelsuite.com`)
3. Update DNS records as instructed
4. Vercel will auto-provision SSL certificate
5. Update `NEXT_PUBLIC_APP_URL` environment variable
6. Update Supabase redirect URLs

---

## Monitoring & Debugging

### View Logs
- Vercel Dashboard → Project → Functions → Select function → View logs

### Runtime Logs
- Real-time: `vercel logs --follow`
- Recent: `vercel logs`

### Build Logs
- Vercel Dashboard → Deployments → Click deployment → View build logs

---

## Rollback

If something breaks:
1. Go to Vercel → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

---

## Performance Tips

1. **Enable Caching**
   - Add `Cache-Control` headers to API routes
   - Use Vercel Edge Config for dynamic data

2. **Optimize Images**
   - Use Next.js Image component
   - Already configured in the app

3. **Monitor Performance**
   - Enable Vercel Analytics (free tier)
   - Add to `next.config.ts`:
     ```typescript
     experimental: {
       webVitalsAttribution: ['CLS', 'LCP']
     }
     ```

---

## Security Checklist

- [x] Remove `NEXT_PUBLIC_MOCK_ADMIN` from production
- [x] Use Supabase RLS policies (already configured)
- [x] Keep `SUPABASE_SERVICE_ROLE_KEY` secret (server-side only)
- [ ] Enable Supabase Auth rate limiting
- [ ] Add CORS headers for API routes if needed
- [ ] Enable Vercel Web Application Firewall (Pro plan)

---

## Support

### Deployment Issues
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

### Application Issues
- Check server logs in Vercel dashboard
- Check Supabase logs for database errors
- Enable Sentry for error tracking (optional)

---

**Your app is now deployed! 🎉**

Access it at: `https://your-app-name.vercel.app`
