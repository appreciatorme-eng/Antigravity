# 🔧 Troubleshooting Guide - Travel Suite Deployment

## Table of Contents
1. [Vercel Deployment Issues](#vercel-deployment-issues)
2. [Marketplace Not Visible](#marketplace-not-visible)
3. [Google Sign-In Redirect Issues](#google-sign-in-redirect-issues)
4. [Build Configuration Issues](#build-configuration-issues)
5. [Environment Variables](#environment-variables)
6. [Quick Reference](#quick-reference)

---

## Vercel Deployment Issues

### Issue 1: "Root Directory does not exist" Error

**Problem**:
```
Error: The specified Root Directory 'projects/travel-suite/apps/web' does not exist
```

**Root Cause**:
When deploying from CLI while in the web app directory, Vercel was duplicating the path:
- Expected: `projects/travel-suite/apps/web`
- Actual: `~/Desktop/travel-suite/projects/travel-suite/apps/web/projects/travel-suite/apps/web`

**Solution**:
Deploy from the **monorepo root** instead of the app directory:

```bash
# ✅ Correct - Deploy from monorepo root
cd /Users/justforfun/Desktop/travel-suite
VERCEL_ORG_ID="team_J0lUNQXDIkYfMO3uWCzz1aKS" \
VERCEL_PROJECT_ID="prj_BHSFkTPSGJyALZa8eKH22XOUephW" \
vercel deploy --prod --yes

# ❌ Wrong - Deploy from app directory
cd /Users/justforfun/Desktop/travel-suite/projects/travel-suite/apps/web
vercel deploy --prod --yes
```

**Alternative Solution**:
If you prefer deploying from the app directory, set Root Directory to empty in Vercel Dashboard.

**Files Changed**: None
**Vercel Settings**: Root Directory = `projects/travel-suite/apps/web`
**Date Fixed**: February 18, 2026
**Commits**: `9091b19`, `397bce5`

---

### Issue 2: Conflicting vercel.json Files

**Problem**:
Root-level `/vercel.json` was conflicting with Vercel Dashboard settings, causing deployment failures.

**Root Cause**:
Both root `vercel.json` and Dashboard settings were trying to configure the same project, leading to conflicts.

**Solution**:
1. Deleted `/vercel.json` from repository root
2. Kept only `projects/travel-suite/apps/web/vercel.json`
3. Ensured Dashboard settings take precedence

**Files Changed**:
- Deleted: `/vercel.json`

**Vercel Config** (`projects/travel-suite/apps/web/vercel.json`):
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci --legacy-peer-deps",
  "devCommand": "npm run dev"
}
```

**Date Fixed**: February 18, 2026
**Commit**: `9091b19`

---

### Issue 3: Monorepo Dependency Issue

**Problem**:
```
Error: Cannot find module '@repo/shared'
```

**Root Cause**:
`package.json` had a local file dependency that Vercel couldn't access:
```json
"@repo/shared": "file:../../packages/shared"
```

**Solution**:
Removed the problematic dependency from `package.json`:

**File Changed**: `projects/travel-suite/apps/web/package.json`
**Line Removed**: Line 36 - `"@repo/shared": "file:../../packages/shared"`

**Date Fixed**: February 18, 2026
**Commit**: `2dbc729`

---

### Issue 4: GitHub Auto-Deploy Not Triggering

**Problem**:
Pushing to main branch didn't trigger automatic Vercel deployments.

**Root Cause**:
GitHub webhook integration was not properly configured.

**Solution**:
1. Verified Git integration in Vercel Dashboard
2. Confirmed Production Branch = `main`
3. Ensured Root Directory = `projects/travel-suite/apps/web`
4. GitHub webhook automatically configured after verification

**How to Verify**:
```bash
# Check GitHub webhooks
# Go to: https://github.com/appreciatorme-eng/Antigravity/settings/hooks
# Should see webhook URL containing "vercel.com"
```

**Vercel Settings**:
- Settings → Git → Connected Repository: `appreciatorme-eng/Antigravity`
- Production Branch: `main`
- Root Directory: `projects/travel-suite/apps/web`

**Date Fixed**: February 18, 2026
**Status**: Working automatically now

---

### Issue 5: Vercel Authentication Protection Blocking Access

**Problem**:
Site showed "Authentication Required" page instead of homepage.

**Root Cause**:
Vercel Deployment Protection was enabled, requiring authentication to view any page.

**Solution**:
1. Go to Vercel Dashboard: Settings → Deployment Protection
2. Toggle "Vercel Authentication" to **OFF**
3. Or change to "Only Preview Deployments"
4. Save changes

**How to Verify**:
```bash
curl -sI https://travelsuite-rust.vercel.app | grep "HTTP"
# Should return: HTTP/2 200
# Not: HTTP/2 401
```

**Date Fixed**: February 18, 2026
**Setting**: Deployment Protection = Disabled (or Preview Only)

---

## Marketplace Not Visible

### Issue 6: Marketplace Sidebar Tab Missing

**Problem**:
"Tour Marketplace" tab not appearing in admin sidebar, even though code was deployed.

**Symptoms**:
- Code present in `layout.tsx` (line 45)
- Sidebar showed 16 items instead of 17
- Debug counter showed "17 menu items" but only 16 visible

**Root Cause**:
The `Store` icon (from lucide-react) was causing a silent React rendering error.

**Investigation Steps**:
1. Verified code was in repository: ✅
2. Checked deployment included marketplace: ✅
3. Added debug logging to count items: 17 items present
4. Noticed only 16 rendering → icon issue suspected
5. Changed icon to fix

**Solution**:
Changed marketplace icon from `Store` to `Building2`:

**File Changed**: `projects/travel-suite/apps/web/src/app/admin/layout.tsx`

**Before** (Line 36-44):
```tsx
import {
    ...
    Store,
} from "lucide-react";

const sidebarLinks = [
    ...
    { href: "/admin/marketplace", label: "Tour Marketplace", icon: Store },
    ...
];
```

**After** (Line 37-45):
```tsx
import {
    ...
    Store,
    Building2,
} from "lucide-react";

const sidebarLinks = [
    ...
    { href: "/admin/marketplace", label: "Tour Marketplace", icon: Building2 },
    ...
];
```

**Why It Worked**:
- `Building2` is a unique icon (not used elsewhere)
- No React key collision or rendering conflicts
- Clean import and render

**Date Fixed**: February 18, 2026
**Commits**: `4e61da2`, `d0a105f`

**Prevention**:
Always verify icons are:
1. Properly imported from lucide-react
2. Not duplicated in the same component
3. Valid icon names (check lucide.dev)

---

## Google Sign-In Redirect Issues

### Issue 7: Authentication Redirects to Old Deployment URL

**Problem**:
After Google Sign-in, users redirected to old deployment URL:
```
https://travelsuite-ipuv8ge1s-avinashs-projects-5f49190e.vercel.app/?code=...
```

Instead of main production URL:
```
https://travelsuite-rust.vercel.app
```

**Root Cause**:
Two configuration issues:

1. **Vercel Environment Variable**:
   - Old: `NEXT_PUBLIC_APP_URL="https://antigravity.vercel.app"`
   - Should be: `NEXT_PUBLIC_APP_URL="https://travelsuite-rust.vercel.app"`

2. **Supabase Redirect URLs**:
   - Site URL pointing to old deployment
   - Redirect URLs including old deployment URLs

**Solution Part 1: Update Vercel Environment Variable**

```bash
# Remove old variable
vercel env rm NEXT_PUBLIC_APP_URL production --yes

# Add correct variable
echo "https://travelsuite-rust.vercel.app" | \
  vercel env add NEXT_PUBLIC_APP_URL production

# Trigger deployment to apply
git commit --allow-empty -m "chore: update app URL"
git push origin main
```

**Solution Part 2: Update Supabase Configuration**

1. **Go to Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/rtdjmykkgmirxdyfckqi
   ```

2. **Navigate**: Authentication → URL Configuration

3. **Update Site URL**:
   - Old: `https://antigravity.vercel.app`
   - New: `https://travelsuite-rust.vercel.app`

4. **Update Redirect URLs**:
   - Add: `https://travelsuite-rust.vercel.app/**`
   - Remove all old URLs:
     - `https://antigravity.vercel.app/**`
     - `https://travelsuite-ipuv8ge1s-...`
     - Any other deployment-specific URLs

5. **Save Changes**

**How to Verify**:
1. Clear browser cookies and cache
2. Open: https://travelsuite-rust.vercel.app
3. Click "Continue with Google"
4. After auth, check URL - should stay on `travelsuite-rust.vercel.app`

**Date Fixed**: February 18, 2026
**Commits**: `6982858`, `1c864c1`
**Status**: Vercel side fixed, Supabase needs manual update

---

## Build Configuration Issues

### Issue 8: Build Cache Causing Stale Deployments

**Problem**:
New code deployed but old version still showing.

**Root Cause**:
Vercel using cached build artifacts from previous deployments.

**Solution**:
Force fresh build by clearing cache:

**Method 1: Via Dashboard**
1. Settings → General → Reset Build Cache
2. Deployments → Latest → Redeploy
3. Uncheck "Use existing Build Cache"

**Method 2: Via Code Change**
```bash
# Make a small change to force rebuild
git commit --allow-empty -m "chore: force rebuild"
git push origin main
```

**Prevention**:
When deploying critical changes:
1. Always clear build cache
2. Verify deployment URL is the latest
3. Check in incognito window

---

### Issue 9: Node.js Version Compatibility

**Problem**:
Build failures due to Node.js version mismatches.

**Current Configuration**:
- **Node Version**: 24.x
- **Package Manager**: npm
- **Install Command**: `npm ci --legacy-peer-deps`

**File**: `projects/travel-suite/apps/web/.nvmrc`
```
22
```

**Vercel Settings**:
- Node.js Version: 24.x (configured in project settings)

**Why `--legacy-peer-deps`**:
Resolves peer dependency conflicts in Next.js 16.1.6

**If Build Fails**:
1. Check Node version in Vercel logs
2. Verify `.nvmrc` file exists
3. Ensure `package-lock.json` is committed
4. Try `npm ci --legacy-peer-deps` locally

---

## Environment Variables

### Issue 10: Missing Environment Variables

**Required Variables**:

**Production Environment**:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rtdjmykkgmirxdyfckqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google API
GOOGLE_API_KEY=AIzaSyDadM1G8L7jP_r2ph3ZCeOBpGAOTLZyKI0
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyDadM1G8L7jP_r2ph3ZCeOBpGAOTLZyKI0

# Firebase
FIREBASE_PROJECT_ID=travel-suite-5d509
NEXT_PUBLIC_FIREBASE_PROJECT_ID=travel-suite-5d509
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# App Configuration
NEXT_PUBLIC_APP_URL=https://travelsuite-rust.vercel.app

# Optional
SENTRY_DSN=https://...
NEXT_PUBLIC_MOCK_ADMIN=false
```

**How to Add**:
```bash
# Via CLI
echo "your-value" | vercel env add VAR_NAME production

# Via Dashboard
# Settings → Environment Variables → Add New
```

**How to Verify**:
```bash
# Pull production env vars
vercel env pull .env.production.local

# Check what's set
vercel env ls
```

---

## Quick Reference

### Common Commands

```bash
# Deploy to production
cd /Users/justforfun/Desktop/travel-suite
VERCEL_ORG_ID="team_J0lUNQXDIkYfMO3uWCzz1aKS" \
VERCEL_PROJECT_ID="prj_BHSFkTPSGJyALZa8eKH22XOUephW" \
vercel deploy --prod --yes

# List deployments
vercel ls

# Check deployment status
vercel inspect DEPLOYMENT_ID

# Pull environment variables
vercel env pull

# Trigger fresh deployment
git commit --allow-empty -m "chore: trigger deployment"
git push origin main
```

### Important URLs

**Production**:
- Main Site: https://travelsuite-rust.vercel.app
- Admin Panel: https://travelsuite-rust.vercel.app/admin

**Vercel Dashboard**:
- Project: https://vercel.com/avinashs-projects-5f49190e/travelsuite
- Settings: https://vercel.com/avinashs-projects-5f49190e/travelsuite/settings
- Deployments: https://vercel.com/avinashs-projects-5f49190e/travelsuite/deployments

**Supabase Dashboard**:
- Project: https://supabase.com/dashboard/project/rtdjmykkgmirxdyfckqi
- Auth Settings: https://supabase.com/dashboard/project/rtdjmykkgmirxdyfckqi/auth/url-configuration

**GitHub**:
- Repository: https://github.com/appreciatorme-eng/Antigravity
- Webhooks: https://github.com/appreciatorme-eng/Antigravity/settings/hooks

### Debugging Checklist

When something breaks:

1. **Check Deployment**:
   - [ ] Is latest deployment successful?
   - [ ] Using correct deployment URL?
   - [ ] Build logs show errors?

2. **Check Configuration**:
   - [ ] Environment variables set?
   - [ ] Root Directory correct?
   - [ ] Production Branch = main?

3. **Check Browser**:
   - [ ] Clear cache (Ctrl+Shift+R)
   - [ ] Try incognito window
   - [ ] Check DevTools Console for errors

4. **Check Code**:
   - [ ] Latest commit pushed to GitHub?
   - [ ] No merge conflicts?
   - [ ] Dependencies installed?

5. **Check Authentication**:
   - [ ] Supabase Site URL correct?
   - [ ] Redirect URLs updated?
   - [ ] OAuth providers configured?

### File Structure Reference

```
Antigravity/                           (GitHub repository root)
├── projects/
│   └── travel-suite/
│       └── apps/
│           └── web/                   (Next.js app - Vercel Root Directory)
│               ├── src/
│               │   ├── app/
│               │   │   └── admin/
│               │   │       └── layout.tsx  (Marketplace sidebar config)
│               │   └── lib/
│               │       └── supabase/
│               ├── public/
│               ├── .env.example
│               ├── package.json       (No @repo/shared dependency)
│               ├── vercel.json        (Build configuration)
│               └── next.config.ts
├── TROUBLESHOOTING_GUIDE.md          (This file)
├── MARKETPLACE_DEPLOYMENT_FINAL.md   (Marketplace solution)
├── FIX_GOOGLE_SIGNIN_REDIRECT.md     (Auth redirect fix)
└── DEPLOYMENT_SUCCESS.md             (Deployment summary)
```

---

## Version History

### February 18, 2026

**Issues Resolved**:
1. ✅ Root Directory path duplication
2. ✅ Conflicting vercel.json files
3. ✅ Monorepo dependency (@repo/shared)
4. ✅ GitHub auto-deploy configuration
5. ✅ Vercel authentication protection
6. ✅ Marketplace sidebar not visible (icon issue)
7. ✅ Google Sign-in redirect (Vercel env var updated)
8. ⏳ Supabase redirect URLs (requires manual update)

**Deployments**:
- Total deployments: 12+
- Successful: 10
- Failed (before fixes): 2
- Latest: `travelsuite-gni281qqi`

**Configuration Changes**:
- Root Directory: `projects/travel-suite/apps/web`
- Node Version: 24.x
- Install Command: `npm ci --legacy-peer-deps`
- Framework: Next.js 16.1.6

---

## Contact & Support

**Repository**: https://github.com/appreciatorme-eng/Antigravity
**Vercel Team**: avinashs-projects-5f49190e
**Project ID**: prj_BHSFkTPSGJyALZa8eKH22XOUephW
**Org ID**: team_J0lUNQXDIkYfMO3uWCzz1aKS

**Last Updated**: February 18, 2026
**Maintained By**: Avinash + Claude Sonnet 4.5
