# Deployment Checklist - Geocoding Implementation

## ✅ Completed Steps

### 1. Code Implementation
- [x] Geocoding utilities created (`geocoding.ts`, `geocoding-with-cache.ts`)
- [x] Database migrations created (cache + usage tracking)
- [x] API integration in itinerary generation
- [x] Map component enhanced with city fallbacks
- [x] TypeScript types updated
- [x] Admin monitoring endpoint created
- [x] All commits pushed to GitHub

### 2. Vercel Configuration
- [x] Mapbox token added to Vercel environment variables: `NEXT_PUBLIC_MAPBOX_TOKEN`

## 🔄 Remaining Setup Steps

### 3. Database Migrations (REQUIRED)
**Status**: ⏳ Needs to be run

Run these migrations in your Supabase dashboard:

**Step 1: Geocoding Cache Table**
```bash
File: supabase/migrations/20260220000000_add_geocoding_cache.sql
```
This creates the cache table for storing geocoded locations.

**Step 2: Usage Tracking Table**
```bash
File: supabase/migrations/20260220010000_add_geocoding_usage_tracking.sql
```
This creates the usage tracking table and functions for the 90k limit.

**How to Run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of migration file
3. Execute the SQL
4. Verify tables created: `geocoding_cache`, `geocoding_usage`

### 4. Verify Environment Variables
Check Vercel dashboard has:
- [x] `NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...` (added)
- [ ] `NEXT_PUBLIC_SUPABASE_URL=...` (should already exist)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY=...` (should already exist)

## 🧪 Testing Checklist

### After Migrations Are Run:

1. **Generate Test Itinerary**
   ```
   Visit: https://your-app.vercel.app/planner
   Generate: "Trip to Chennai for 3 days"
   ```

   **Expected Results:**
   - ✅ Map shows Chennai (not New York)
   - ✅ Activities have coordinates
   - ✅ Route line connects locations
   - ✅ Console shows: `📍 Geocoded: "Marina Beach, Chennai" → [lat, lng]`

2. **Check Usage Stats**
   ```
   Visit: https://your-app.vercel.app/api/admin/geocoding/usage
   ```

   **Expected Response:**
   ```json
   {
     "status": "healthy",
     "month": "2024-02",
     "usage": {
       "totalRequests": 10,
       "cacheHits": 0,
       "apiCalls": 10,
       "cacheHitRate": "0%"
     },
     "limits": {
       "threshold": 90000,
       "remaining": 89990,
       "percentageUsed": "0.01%"
     }
   }
   ```

3. **Test Cache Functionality**
   - Generate the SAME Chennai itinerary again
   - Check usage stats - `cacheHits` should increase
   - `apiCalls` should stay the same (cached)
   - Cache hit rate should increase

4. **Verify Map Display**
   - Open Chennai itinerary
   - Zoom map to see route
   - Click markers to see popups with location names
   - Verify route line connects all points

## 🚨 Troubleshooting

### Issue: "geocoding_cache table does not exist"
**Solution**: Run migration `20260220000000_add_geocoding_cache.sql`

### Issue: "function can_make_geocoding_api_call does not exist"
**Solution**: Run migration `20260220010000_add_geocoding_usage_tracking.sql`

### Issue: Map still shows New York
**Checks**:
1. Is `NEXT_PUBLIC_MAPBOX_TOKEN` set in Vercel?
2. Did migrations run successfully?
3. Check browser console for geocoding logs
4. Check API endpoint: `/api/admin/geocoding/usage`

### Issue: No geocoding happening (apiCalls = 0)
**Checks**:
1. Check Vercel logs for errors
2. Verify Supabase credentials in environment
3. Check database functions exist (run migrations)
4. Look for error messages in console

## 📊 Monitoring

### Daily Check (First Week)
Check usage endpoint to monitor:
- Cache hit rate (should increase over time)
- API calls per day
- Approaching limits

### Weekly Check (Ongoing)
- Review cache hit rate (target: 80%+)
- Check remaining API quota
- Monitor for any errors in logs

### Monthly Check
- Review total usage vs limit
- Cache optimization opportunities
- Performance metrics

## 🎯 Success Criteria

System is working correctly when:

✅ **Functionality**
- [ ] Chennai itineraries show Chennai on map
- [ ] Multiple cities geocode correctly
- [ ] Route lines connect markers
- [ ] Marker popups show location names

✅ **Performance**
- [ ] First generation: Coordinates added
- [ ] Second generation: Cached (instant)
- [ ] Cache hit rate: > 70% after week 1
- [ ] Page load: No significant delay

✅ **Cost Control**
- [ ] API calls tracked correctly
- [ ] Cache hits don't consume quota
- [ ] Usage stats endpoint works
- [ ] Limit enforcement prevents overages

✅ **Monitoring**
- [ ] Admin endpoint returns stats
- [ ] Logs show geocoding activity
- [ ] Database tables populated
- [ ] No errors in Vercel logs

## 📝 Quick Commands

### Check Usage Stats
```bash
curl https://your-app.vercel.app/api/admin/geocoding/usage
```

### Check Supabase Tables
```sql
-- Check cache
SELECT COUNT(*) FROM geocoding_cache;

-- Check usage
SELECT * FROM geocoding_usage;

-- Check recent geocoded locations
SELECT location_query, formatted_address, access_count
FROM geocoding_cache
ORDER BY created_at DESC
LIMIT 10;
```

### Vercel Logs
```bash
# Check deployment logs
Visit: Vercel Dashboard → Deployments → Latest → Logs

# Look for:
# ✅ "📍 Geocoded: ..."
# ✅ "💾 Itinerary cached successfully"
# ⚠️ "Geocoding API limit reached"
```

## 🚀 Next Steps After Verification

1. **Generate 5-10 test itineraries** for different cities
2. **Monitor cache growth** via usage endpoint
3. **Verify route calculations** are accurate
4. **Check performance** (should be instant after caching)
5. **Document any issues** encountered

## 📚 Documentation

- **Full Implementation Guide**: `GEOCODING_IMPLEMENTATION.md`
- **Database Schema**: See migration files
- **API Reference**: Comments in `geocoding-with-cache.ts`
- **Usage Monitoring**: `/api/admin/geocoding/usage`

---

**Last Updated**: February 20, 2024
**Status**: Environment configured, migrations pending
**Next Action**: Run database migrations
