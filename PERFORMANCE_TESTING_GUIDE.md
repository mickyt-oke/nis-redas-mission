# Performance Optimization Testing Guide

## Quick Verification Checklist

### ✅ Frontend Optimizations

#### 1. Lazy Loading Verification

**Test**: Navigate between pages and check Network tab

```bash
# Start the development server
npm run dev
```

**Expected Results**:

- Initial page load should NOT load all page components
- Each page should load its component only when navigated to
- Check Network tab: Look for dynamic imports (e.g., `lazy_MissionsPage.js`)
- Bundle size should be split into smaller chunks

**How to Test**:

1. Open Chrome DevTools > Network tab
2. Navigate to <http://localhost:3000>
3. Clear network log
4. Navigate to /missions
5. You should see new JavaScript chunks being loaded
6. Navigate to /user-management
7. Again, new chunks should load

#### 2. Suspense Boundaries Verification

**Test**: Check for loading states

**Expected Results**:

- Loading spinner appears when navigating to new pages
- No blank screens during navigation
- Smooth transitions between pages

**How to Test**:

1. Open Chrome DevTools > Network tab
2. Throttle network to "Slow 3G"
3. Navigate between pages
4. You should see loading spinners with messages like "Loading missions..."

#### 3. React Query Caching Verification

**Test**: Check if data is cached

**Expected Results**:

- First load: API request made
- Second load (within 5 minutes): No API request, data from cache
- Background refetch on window focus

**How to Test**:

1. Open Chrome DevTools > Network tab
2. Navigate to /missions (API request should be made)
3. Navigate away and back to /missions (no API request if within 5 min)
4. Switch to another window/tab and back (background refetch should occur)
5. Open React Query DevTools (bottom-right corner in dev mode)
6. Check query status: "fresh", "stale", or "fetching"

### ✅ Backend Optimizations

#### 1. Response Caching Verification

**Test**: Check cache headers and behavior

```bash
# Test API endpoint with curl
curl -I http://localhost:8000/api/missions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Results**:

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=300
X-Cache: MISS  (first request)
```

Second request within 5 minutes:

```
X-Cache: HIT  (cached response)
```

**How to Test**:

1. Make first API request
2. Check response headers for `X-Cache: MISS`
3. Make same request again within 5 minutes
4. Check response headers for `X-Cache: HIT`
5. Response should be instant (from cache)

#### 2. Query Optimization Verification

**Test**: Check for N+1 queries

**Expected Results**:

- Missions endpoint should use eager loading
- Single query with joins instead of multiple queries
- Response time < 200ms (without cache)

**How to Test**:

1. Enable Laravel query logging in `.env`:

   ```env
   DB_LOG_QUERIES=true
   ```

2. Make API request to `/api/missions`
3. Check `storage/logs/laravel.log` for queries
4. Should see JOIN queries, not multiple SELECT queries

#### 3. Rate Limiting Verification

**Test**: Ensure rate limits are working

```bash
# Test rate limiting (already implemented)
php backend/test_rate_limiting.php
```

**Expected Results**:

- Read endpoints: 120 requests/minute
- Write endpoints: 60 requests/minute
- Heavy endpoints: 20 requests/minute

## Performance Metrics Testing

### 1. Lighthouse Audit

**Before Running Audit**:

```bash
# Build for production
npm run build
npm run start
```

**Run Lighthouse**:

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Performance" category
4. Click "Analyze page load"

**Target Scores**:

- Performance: 85-95
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.0s
- Cumulative Layout Shift: < 0.1

### 2. Bundle Size Analysis

**Install Bundle Analyzer**:

```bash
npm install --save-dev @next/bundle-analyzer
```

**Update `next.config.mjs`**:

```javascript
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default withBundleAnalyzer(nextConfig)
```

**Run Analysis**:

```bash
ANALYZE=true npm run build
```

**Expected Results**:

- Initial bundle: < 1MB
- Lazy-loaded chunks: 100-300KB each
- No duplicate dependencies
- Tree-shaking working correctly

### 3. Network Performance

**Test with Chrome DevTools**:

1. Open DevTools > Network tab
2. Disable cache
3. Throttle to "Fast 3G"
4. Reload page

**Metrics to Check**:

- Total page size: < 2MB
- Number of requests: < 50
- Load time: < 5s on Fast 3G
- Time to Interactive: < 6s on Fast 3G

### 4. API Performance

**Test API Response Times**:

```bash
# Install Apache Bench (if not installed)
# On Windows: Use WSL or download from Apache website

# Test missions endpoint
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/missions
```

**Expected Results**:

- First request (cache miss): 100-300ms
- Cached requests: 10-50ms
- 99th percentile: < 500ms
- No failed requests

## Real-World Testing Scenarios

### Scenario 1: User Dashboard Load

1. Login as user
2. Navigate to dashboard
3. Check loading time
4. Verify data loads correctly
5. Check for any console errors

**Expected**: < 2s load time, smooth experience

### Scenario 2: Mission List with Filters

1. Navigate to missions page
2. Apply filters (status, region)
3. Check if results update quickly
4. Navigate away and back
5. Verify cached data loads instantly

**Expected**: Instant filter updates, cached data on return

### Scenario 3: Multiple Page Navigation

1. Navigate through 5-6 different pages
2. Check loading states
3. Verify no memory leaks
4. Check React Query DevTools for cache status

**Expected**: Smooth navigation, proper caching, no memory issues

### Scenario 4: Concurrent Users (Backend)

1. Simulate 10 concurrent users
2. All requesting missions endpoint
3. Check cache hit rate
4. Monitor server resources

**Expected**: High cache hit rate, low server load

## Monitoring in Production

### Frontend Monitoring

```javascript
// Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/next'

// Already included in your layout
<Analytics />
```

### Backend Monitoring

```php
// Add to Laravel logging
Log::info('API Request', [
    'endpoint' => $request->path(),
    'method' => $request->method(),
    'cache_status' => $response->headers->get('X-Cache'),
    'response_time' => microtime(true) - LARAVEL_START,
]);
```

## Common Issues and Solutions

### Issue 1: Lazy Loading Not Working

**Symptoms**: All components load at once
**Solution**:

- Check if components are properly exported from `components/lazy/index.ts`
- Verify Suspense boundaries are in place
- Check browser console for errors

### Issue 2: Cache Not Working

**Symptoms**: X-Cache always shows MISS
**Solution**:

- Verify middleware is registered in `bootstrap/app.php`
- Check if cache driver is configured in `.env`
- Clear Laravel cache: `php artisan cache:clear`

### Issue 3: React Query Not Caching

**Symptoms**: API requests on every navigation
**Solution**:

- Check `staleTime` in `lib/react-query-config.ts`
- Verify QueryProvider is wrapping the app
- Check React Query DevTools for query status

### Issue 4: Slow API Responses

**Symptoms**: API takes > 500ms even with cache
**Solution**:

- Check database indexes
- Verify eager loading in controllers
- Check for N+1 queries in logs
- Consider Redis for caching

## Performance Checklist

Before deploying to production:

- [ ] Run Lighthouse audit (score > 85)
- [ ] Test lazy loading on slow network
- [ ] Verify React Query caching works
- [ ] Check backend cache hit rate
- [ ] Test with multiple concurrent users
- [ ] Verify no console errors
- [ ] Check bundle size (< 1MB initial)
- [ ] Test on mobile devices
- [ ] Verify loading states work
- [ ] Check API response times (< 200ms)
- [ ] Test rate limiting
- [ ] Verify error handling
- [ ] Check memory usage
- [ ] Test offline behavior (if applicable)
- [ ] Verify SEO metadata

## Success Criteria

### Frontend

✅ Initial bundle size: < 1MB
✅ Page load time: < 2s
✅ Time to Interactive: < 3s
✅ Lighthouse Performance: > 85
✅ No layout shifts (CLS < 0.1)

### Backend

✅ API response time: < 200ms (uncached)
✅ Cache hit rate: > 70%
✅ Database queries: < 10 per request
✅ No N+1 queries
✅ Rate limiting working

### User Experience

✅ Smooth page transitions
✅ Clear loading states
✅ No blank screens
✅ Fast data updates
✅ Responsive on all devices

## Next Steps After Testing

1. **Document Results**: Record actual metrics vs. targets
2. **Identify Bottlenecks**: Use profiling tools to find slow areas
3. **Optimize Further**: Focus on areas that didn't meet targets
4. **Monitor Production**: Set up continuous monitoring
5. **Iterate**: Regular performance audits and improvements
