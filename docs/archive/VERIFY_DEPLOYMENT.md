# ✅ Deployment Verification Checklist

After deployment completes, verify everything is working:

## 1️⃣ Homepage
- [ ] Visit: https://travelsuite-rust.vercel.app
- [ ] Page loads without errors
- [ ] Images and fonts load correctly
- [ ] Navigation works

## 2️⃣ Planner Page
- [ ] Visit: https://travelsuite-rust.vercel.app/planner
- [ ] Form displays correctly
- [ ] Can enter destination and preferences
- [ ] Generate button is visible

## 3️⃣ Itinerary Generation (Most Important!)
- [ ] Fill out the planner form
- [ ] Click "Generate Itinerary"
- [ ] Should NOT see "Missing Google API Key" error
- [ ] Should see loading state
- [ ] Itinerary generates successfully
- [ ] Weather widget displays
- [ ] Currency converter displays
- [ ] Map shows locations
- [ ] Images load (or placeholder icons show)

## 4️⃣ Admin Panel
- [ ] Visit: https://travelsuite-rust.vercel.app/admin
- [ ] Login/auth flow works
- [ ] Dashboard loads (no infinite spinner)
- [ ] Navigate to: Trips, Clients, Drivers
- [ ] All pages load within 2-3 seconds
- [ ] No infinite loop issues

## 5️⃣ Build Logs
Check in Vercel Dashboard → Deployments → Latest → Build Logs:

**Should see:**
```
✓ Installing dependencies
✓ Running "npm ci --legacy-peer-deps"
✓ Building Next.js application
✓ Compiled successfully
✓ Deployment ready
```

**Should NOT see:**
```
✗ Error: Cannot find module '@repo/shared'
✗ Module not found
✗ Build failed
```

## 6️⃣ Environment Variables
Verify in Vercel Dashboard → Settings → Environment Variables:

Required variables should be set:
- [ ] `GOOGLE_API_KEY` (secret)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (public)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)

## 🐛 If Something Fails

### Build Fails
1. Check build logs in Vercel Dashboard
2. Look for the specific error
3. Verify Root Directory is: `projects/travel-suite/apps/web`

### API Errors
1. Check environment variables are set
2. Test API directly:
```bash
curl -X POST https://travelsuite-rust.vercel.app/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"3 day trip to Tokyo","days":3}'
```

### Admin Panel Issues
1. Check browser console for errors
2. Try in incognito mode
3. Clear browser cache

## 📊 Performance Check

After deployment:
```bash
# Check response time
curl -w "@-" -o /dev/null -s https://travelsuite-rust.vercel.app << 'EOF'
time_total: %{time_total}s
time_connect: %{time_connect}s
size_download: %{size_download} bytes
EOF
```

Expected: < 2 seconds total time

## ✅ All Clear?

If all checks pass:
- ✅ Deployment successful
- ✅ All features working
- ✅ No errors in production
- 🎉 You're done!

## 📝 Quick Test Commands

```bash
# 1. Test homepage
curl -I https://travelsuite-rust.vercel.app

# 2. Test API
curl -X POST https://travelsuite-rust.vercel.app/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"weekend in Paris","days":2}' | jq .

# 3. Check deployment ID
curl -sI https://travelsuite-rust.vercel.app | grep x-vercel-id
```

---

**Created:** February 18, 2026
**Last Deployment:** Check Vercel Dashboard
