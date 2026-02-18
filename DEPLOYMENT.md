# Vercel Deployment Guide - Travel Suite

This guide explains how to properly deploy the Travel Suite web application to Vercel from this monorepo.

## 🏗️ Project Structure

```
Antigravity/                    (Monorepo root)
├── projects/
│   └── travel-suite/
│       └── apps/
│           └── web/           (Next.js app - DEPLOY THIS)
│               ├── src/
│               ├── package.json
│               ├── next.config.ts
│               └── vercel.json
├── vercel.json                (Root-level Vercel config)
└── DEPLOYMENT.md              (This file)
```

## 🎯 Deployment Options

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Click "Import Project"

2. **Connect Repository**
   - Select: `appreciatorme-eng/Antigravity`
   - Framework: Next.js
   - **Root Directory**: `projects/travel-suite/apps/web` ✅ (IMPORTANT!)

3. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: projects/travel-suite/apps/web
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm ci --legacy-peer-deps
   Node Version: 22.x
   ```

4. **Environment Variables** (Add these in Vercel Dashboard)
   ```bash
   # Supabase (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Google Gemini AI (Required for itinerary generation)
   GOOGLE_API_KEY=your_google_gemini_api_key

   # Optional
   NEXT_PUBLIC_MOCK_ADMIN=false
   SENTRY_AUTH_TOKEN=your_sentry_token (if using Sentry)
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Done! 🎉

### Option 2: Vercel CLI

#### First Time Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel@latest
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Link Project** (Run from monorepo root)
   ```bash
   cd /path/to/Antigravity
   cd projects/travel-suite/apps/web
   vercel link
   ```

   When prompted:
   - Set up and deploy? **N**
   - Link to existing project? **Y**
   - Project name: **travelsuite**
   - Team: Select your team

4. **Set Environment Variables**
   ```bash
   # Production
   vercel env add GOOGLE_API_KEY production
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

   # Preview (optional)
   vercel env add GOOGLE_API_KEY preview
   vercel env add NEXT_PUBLIC_SUPABASE_URL preview
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
   ```

#### Deploy Commands

```bash
# Navigate to web app directory
cd projects/travel-suite/apps/web

# Preview deployment (test before production)
vercel

# Production deployment
vercel --prod
```

## 🔧 Troubleshooting

### Issue: "Module not found" during build

**Cause:** Monorepo dependencies not accessible
**Fix:** Ensure Root Directory is set to `projects/travel-suite/apps/web`

### Issue: "Build failed" with @repo/shared error

**Cause:** Local file dependencies don't work in Vercel
**Fix:** Already fixed - @repo/shared removed from package.json

### Issue: Environment variables not working

**Cause:** Variables not set in Vercel dashboard
**Fix:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables
3. Redeploy

### Issue: "Command not found: next"

**Cause:** Dependencies not installed properly
**Fix:** Use `npm ci --legacy-peer-deps` as install command

## 🚀 Automatic Deployments

### GitHub Integration

Vercel automatically deploys when:
- ✅ Push to `main` branch → Production deployment
- ✅ Push to PR → Preview deployment
- ✅ Manual trigger → Dashboard or CLI

### Deployment Triggers

```bash
# Any commit to main branch triggers deployment
git push origin main

# Create empty commit to force redeploy
git commit --allow-empty -m "chore: trigger deployment"
git push origin main
```

## 📊 Vercel Project Settings

### Recommended Settings

**Build & Development Settings:**
```
Framework Preset: Next.js
Root Directory: projects/travel-suite/apps/web
Build Command: npm run build
Output Directory: .next
Install Command: npm ci --legacy-peer-deps
Node.js Version: 22.x
```

**Deployment Protection:**
- ✅ Enable Deployment Protection for Production
- ✅ Enable Preview Deployments for PRs
- ❌ Disable Vercel Authentication (unless needed)

**Domains:**
- Production: travelsuite-rust.vercel.app (or custom domain)
- Preview: Auto-generated URLs for PRs

## 🔐 Required Environment Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ Yes | Supabase anonymous key |
| `GOOGLE_API_KEY` | Secret | ✅ Yes | Google Gemini API key for AI itinerary generation |
| `NEXT_PUBLIC_MOCK_ADMIN` | Public | ❌ No | Set to "true" for demo mode (default: false) |
| `SENTRY_AUTH_TOKEN` | Secret | ❌ No | Sentry error tracking token |

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in Vercel
- [ ] Root Directory set to `projects/travel-suite/apps/web`
- [ ] Build command: `npm run build`
- [ ] Install command: `npm ci --legacy-peer-deps`
- [ ] Node version: 22.x
- [ ] Test deployment with preview first (`vercel`)
- [ ] Verify API endpoints work in preview
- [ ] Check admin panel loads correctly
- [ ] Test itinerary generation works
- [ ] Deploy to production (`vercel --prod`)

## 🎯 Quick Deploy Script

Save this as `deploy.sh` in the monorepo root:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Travel Suite to Vercel..."

# Navigate to web app
cd projects/travel-suite/apps/web

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

# Check if project is linked
if [ ! -d .vercel ]; then
    echo "⚠️  Project not linked. Run 'vercel link' first."
    exit 1
fi

# Deploy
if [ "$1" = "prod" ]; then
    echo "📦 Deploying to PRODUCTION..."
    vercel --prod
else
    echo "🔍 Deploying PREVIEW..."
    vercel
fi

echo "✅ Deployment complete!"
```

Usage:
```bash
chmod +x deploy.sh
./deploy.sh        # Preview
./deploy.sh prod   # Production
```

## 📞 Support

If deployment fails:
1. Check build logs in Vercel Dashboard
2. Verify environment variables are set
3. Ensure Root Directory is correct
4. Check package.json for local dependencies
5. Review this deployment guide

---

**Last Updated:** February 18, 2026
**Vercel Project:** travelsuite
**Production URL:** https://travelsuite-rust.vercel.app
