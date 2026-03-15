# 🔧 QUICK FIX - Vercel Deployment Error

## The Problem
Vercel is building from the wrong directory in your monorepo.

## The Solution (2 minutes)

### Go to Vercel Dashboard NOW:

1. **Open:** https://vercel.com/dashboard
2. **Find:** Your `travelsuite` project
3. **Click:** Settings → General
4. **Scroll to:** "Build & Development Settings"
5. **Edit:** Root Directory
6. **Set to:** `projects/travel-suite/apps/web`
7. **Click:** Save
8. **Go to:** Deployments tab
9. **Click:** Redeploy on latest deployment

## ✅ Done!

Your next deployment will work correctly.

---

## Alternative: Use the Deploy Script

```bash
cd /Users/justforfun/Desktop/travel-suite
./deploy.sh prod
```

This will deploy from the correct directory automatically.
