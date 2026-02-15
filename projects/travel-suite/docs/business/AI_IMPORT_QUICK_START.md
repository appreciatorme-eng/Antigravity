# AI Tour Import - Quick Start (5 Minutes)

> Get AI tour import working in 5 minutes

---

## Step 1: Get Google Gemini API Key (2 minutes)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click **"Get API Key"**
4. Click **"Create API key"**
5. Copy the API key

**Free Tier:** 1,500 requests/day (plenty for tour operators)

---

## Step 2: Add Environment Variable (1 minute)

### Local Development

```bash
# apps/web/.env.local
NEXT_PUBLIC_GEMINI_API_KEY=your-api-key-here
```

### Production (Vercel/Netlify)

1. Go to project settings → Environment Variables
2. Add: `NEXT_PUBLIC_GEMINI_API_KEY` = `your-api-key-here`
3. Redeploy

---

## Step 3: Test Import (2 minutes)

### Test PDF Upload

1. Navigate to: `http://localhost:3000/admin/tour-templates`
2. Click **"Import Tour"**
3. Click **"Upload PDF"**
4. Upload sample tour PDF
5. Click **"Extract Tour Data"**
6. Wait 30-60 seconds
7. Review extracted data
8. Click **"Save as Template"**

### Test URL Import

1. Navigate to: `http://localhost:3000/admin/tour-templates/import`
2. Click **"Import from URL"**
3. Paste tour URL (e.g., `https://gobuddyadventures.com/tour/dubai`)
4. Click **"Preview"** (optional, fast)
5. Click **"Extract Full Tour Data"**
6. Wait 30-60 seconds
7. Review and edit data
8. Click **"Save as Template"**

---

## Troubleshooting

### "Missing NEXT_PUBLIC_GEMINI_API_KEY"

```bash
# Check .env.local exists
ls -la apps/web/.env.local

# Restart dev server
npm run dev
```

### "Failed to extract tour data"

- **PDF:** Ensure it's text-based (not scanned image)
- **URL:** Ensure it's publicly accessible (no login required)
- **API Key:** Verify key is valid in [Google AI Studio](https://aistudio.google.com/)

### "Rate limit exceeded"

- Wait 24 hours (free tier resets)
- Or upgrade to paid tier ($0.00015 per 1K tokens)

---

## What Gets Extracted

✅ Tour name, destination, duration
✅ Day-by-day itinerary
✅ Activities with times and prices
✅ Hotels with star ratings and amenities
✅ Optional/premium activity detection
✅ Base pricing

---

## Best Practices

**Good PDFs:**
- Text-based (not scanned images)
- Clear day-by-day structure
- Activity times listed
- Prices mentioned

**Good URLs:**
- Public tour pages (no login)
- Clear itinerary section
- Day-by-day breakdown visible

---

## Performance

| Action | Time |
|--------|------|
| PDF Upload (5 pages) | 30-45 sec |
| URL Scrape | 40-60 sec |
| Preview (URL) | 5-10 sec |
| Save Template | Instant |

---

## Cost

**Free Tier:** 1,500 requests/day
**Paid:** $0.00075 per PDF, $0.0015 per URL

**Example:** 100 PDFs = $0.075 (negligible)

---

## Next Steps

1. ✅ Get API key
2. ✅ Add to environment
3. ✅ Test PDF upload
4. ✅ Test URL import
5. 📖 Read full guide: `AI_TOUR_IMPORT_GUIDE.md`

---

**Status:** ✅ Ready to Use
**Support:** support@travelsuite.app

🚀 **Import 10 templates in 30 minutes!**
