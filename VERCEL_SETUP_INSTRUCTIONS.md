# 🚀 Vercel Project Configuration - CRITICAL SETUP

## ⚠️ Current Issue

Your Vercel deployment is failing because it's trying to build from the monorepo root instead of the correct directory.

## ✅ Fix: Update Root Directory in Vercel Dashboard

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Find your project: **travelsuite** or **travelsuite-rust**
3. Click on the project

### Step 2: Go to Settings
1. Click **Settings** (top navigation)
2. Click **General** (left sidebar)

### Step 3: Update Root Directory
Scroll to **Build & Development Settings**

**Change this setting:**
```
Root Directory: projects/travel-suite/apps/web
```

**IMPORTANT:**
- Click the **Edit** button next to "Root Directory"
- Type: `projects/travel-suite/apps/web`
- Click **Save**
- This tells Vercel where your Next.js app actually lives in the monorepo

### Step 4: Verify Other Settings

While you're in Settings, verify these:

**Framework Preset:**
```
Next.js
```

**Build Command:** (should auto-detect, but verify)
```
npm run build
```

**Output Directory:** (should auto-detect)
```
.next
```

**Install Command:**
```
npm ci --legacy-peer-deps
```

**Node.js Version:**
```
22.x
```

### Step 5: Redeploy

After saving the Root Directory:

1. Go to **Deployments** tab
2. Find the latest failed deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**

OR

Just push a new commit:
```bash
git commit --allow-empty -m "chore: trigger deployment with correct root directory"
git push origin main
```

## 📸 Visual Guide

### Where to find Root Directory setting:

```
Vercel Dashboard
└── Your Project (travelsuite)
    └── Settings
        └── General
            └── Build & Development Settings
                └── Root Directory  [Edit] ← Click here
                    └── Type: projects/travel-suite/apps/web
                    └── [Save]
```

## ✅ Expected Result

After setting the correct Root Directory:

1. ✅ Build will start from `projects/travel-suite/apps/web`
2. ✅ Vercel will find `package.json` and `next.config.ts`
3. ✅ Dependencies will install correctly
4. ✅ Build will succeed
5. ✅ Deployment will complete

## 🔍 How to Verify It's Working

After redeploying, check the build logs:

**You should see:**
```
Installing dependencies...
Running "npm ci --legacy-peer-deps"
> Found package.json in /vercel/path0/projects/travel-suite/apps/web
```

**You should NOT see:**
```
Error: Cannot find module '@repo/shared'
Error: No package.json found
```

## 🆘 If It Still Fails

1. **Check the build logs** in Vercel Dashboard → Deployments → Click deployment → View Function Logs
2. **Screenshot the error** and share it
3. **Verify Root Directory** is exactly: `projects/travel-suite/apps/web` (no leading/trailing slashes)

## 📞 Alternative: Use Vercel CLI

If you prefer CLI:

```bash
# 1. Install Vercel CLI
npm install -g vercel@latest

# 2. Navigate to web app
cd projects/travel-suite/apps/web

# 3. Link project (first time only)
vercel link

# 4. Deploy preview
vercel

# 5. Deploy production
vercel --prod
```

The CLI automatically uses the correct directory because you run it FROM that directory.

---

**Created:** February 18, 2026
**Next Step:** Update Root Directory in Vercel Dashboard NOW
