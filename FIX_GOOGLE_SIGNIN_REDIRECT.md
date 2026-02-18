# 🔧 Fix Google Sign-In Redirect Issue

## Problem

Google Sign-in is redirecting to old deployment URL: `travelsuite-ipuv8ge1s-...`  
Should redirect to: `https://travelsuite-rust.vercel.app`

## ✅ Solution 1: Updated Vercel Environment Variable (DONE)

I've already updated the Vercel environment variable:
- **Old**: `NEXT_PUBLIC_APP_URL="https://antigravity.vercel.app"`
- **New**: `NEXT_PUBLIC_APP_URL="https://travelsuite-rust.vercel.app"`

A new deployment is building now that will use the correct URL.

## ✅ Solution 2: Update Supabase Redirect URLs (YOU NEED TO DO THIS)

The redirect URL is also configured in Supabase. You need to update it:

### Steps:

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/rtdjmykkgmirxdyfckqi

2. **Navigate to Authentication → URL Configuration**:
   - Left sidebar: Click "Authentication"
   - Click "URL Configuration" tab

3. **Update Site URL**:
   - Find "Site URL" field
   - Change from: `https://antigravity.vercel.app` or old deployment URL
   - Change to: `https://travelsuite-rust.vercel.app`
   - Click "Save"

4. **Update Redirect URLs**:
   - Find "Redirect URLs" section
   - Add this URL if not present: `https://travelsuite-rust.vercel.app/**`
   - Remove old URLs like:
     - `https://antigravity.vercel.app/**`
     - `https://travelsuite-ipuv8ge1s-...`
     - Any other old deployment URLs
   - Click "Save"

5. **OAuth Provider Settings (Google)**:
   - Go to: Authentication → Providers → Google
   - Check "Authorized redirect URIs"
   - Should include: `https://rtdjmykkgmirxdyfckqi.supabase.co/auth/v1/callback`
   - This should already be correct, but verify

## 🧪 Test After Changes

1. **Wait for new Vercel deployment** to complete (~2 minutes)
2. **Clear browser cache** and cookies for the site
3. **Open**: https://travelsuite-rust.vercel.app
4. **Click "Continue with Google"**
5. **After authentication**, check the URL - should be:
   ✅ `https://travelsuite-rust.vercel.app/...`  
   ❌ NOT `https://travelsuite-ipuv8ge1s-...`

## 📊 Current Status

- ✅ Vercel env variable updated
- ✅ New deployment building
- ⚠️ Supabase redirect URLs need updating (requires your access)

## 🔍 If Still Having Issues

### Check Supabase Auth Configuration

1. Open Supabase Dashboard
2. Go to Authentication → Settings
3. Screenshot the "Site URL" and "Redirect URLs" sections
4. Share with me so I can verify

### Check Google Cloud Console

The OAuth redirect might also be configured in Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project: "travel-suite-5d509"
3. Find OAuth 2.0 Client ID
4. Check "Authorized redirect URIs"
5. Should include:
   - `https://rtdjmykkgmirxdyfckqi.supabase.co/auth/v1/callback`
   - NOT old Vercel deployment URLs

## ⏱️ Timeline

**Right now**: New deployment building with correct `NEXT_PUBLIC_APP_URL`  
**After deployment** (~2 min): Vercel side fixed  
**After you update Supabase**: Full fix complete

---

**Latest Deployment**: https://travelsuite-gni281qqi-avinashs-projects-5f49190e.vercel.app (building)  
**Production URL**: https://travelsuite-rust.vercel.app  
**Next Step**: Update Supabase redirect URLs (see Solution 2 above)
