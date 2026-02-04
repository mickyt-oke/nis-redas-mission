# REDAS Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered in the REDAS application, covering both frontend (Next.js) and backend (Laravel) components.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [API Connection Problems](#api-connection-problems)
3. [Database Issues](#database-issues)
4. [Performance Problems](#performance-problems)
5. [Rate Limiting Issues](#rate-limiting-issues)
6. [File Upload Problems](#file-upload-problems)
7. [Frontend Build Errors](#frontend-build-errors)
8. [Backend Errors](#backend-errors)
9. [Deployment Issues](#deployment-issues)
10. [Common Error Messages](#common-error-messages)

---

## Authentication Issues

### Problem: "Unauthenticated" Error After Login

**Symptoms:**
- User logs in successfully but gets 401 errors on subsequent requests
- Token appears to be invalid immediately after login

**Solutions:**

1. **Check Token Storage:**
```javascript
// Verify token is being stored correctly
console.log(localStorage.getItem('token'))
```

2. **Verify API Headers:**
```javascript
// Ensure Authorization header is set
const token = localStorage.getItem('token')
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

3. **Check CORS Configuration:**
```bash
# backend/config/cors.php
'supports_credentials' => true,
```

4. **Clear Browser Cache:**
- Clear localStorage
- Clear cookies
- Hard refresh (Ctrl+Shift+R)

### Problem: Login Fails with "Invalid Credentials"

**Solutions:**

1. **Verify User Exists:**
```bash
cd backend
php artisan tinker
>>> User::where('email', 'user@example.com')->first()
```

2. **Check Password Hash:**
```bash
>>> $user = User::find(1);
>>> Hash::check('password', $user->password);
```

3. **Reset Password:**
```bash
>>> $user->password = Hash::make('newpassword');
>>> $user->save();
```

### Problem: Session Expires Too Quickly

**Solutions:**

1. **Increase Session Lifetime:**
```env
# backend/.env
SESSION_LIFETIME=120  # minutes
```

2. **Check Token Expiration:**
```php
// backend/config/sanctum.php
'expiration' => 60 * 24,  // 24 hours
```

---

## API Connection Problems

### Problem: "Network Error" or "Failed to Fetch"

**Symptoms:**
- API requests fail with network errors
- CORS errors in browser console

**Solutions:**

1. **Verify API URL:**
```javascript
// Check .env.local
console.log(process.env.NEXT_PUBLIC_API_URL)
```

2. **Check Backend Server:**
```bash
# Verify Laravel is running
curl http://localhost:8000/api/health
```

3. **Check CORS Headers:**
```bash
# Test CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  http://localhost:8000/api/login -v
```

4. **Update CORS Configuration:**
```env
# backend/.env
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Problem: API Returns 404 for All Endpoints

**Solutions:**

1. **Clear Route Cache:**
```bash
cd backend
php artisan route:clear
php artisan route:cache
```

2. **Verify Routes:**
```bash
php artisan route:list
```

3. **Check .htaccess (Apache):**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

---

## Database Issues

### Problem: "Connection Refused" or "Could Not Connect to Database"

**Solutions:**

1. **Verify Database Credentials:**
```bash
# Test connection
cd backend
php artisan tinker
>>> DB::connection()->getPdo();
```

2. **Check Supabase Connection:**
```bash
# Test PostgreSQL connection
psql -h your-host.supabase.co -U postgres -d postgres
```

3. **Verify Environment Variables:**
```env
DB_CONNECTION=pgsql
DB_HOST=your-host.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-password
```

4. **Check Firewall:**
```bash
# Ensure port 5432 is open
sudo ufw status
```

### Problem: Migration Fails

**Solutions:**

1. **Check Migration Status:**
```bash
php artisan migrate:status
```

2. **Rollback and Retry:**
```bash
php artisan migrate:rollback
php artisan migrate
```

3. **Fresh Migration (Development Only):**
```bash
php artisan migrate:fresh --seed
```

4. **Check for Syntax Errors:**
```bash
php artisan migrate --pretend
```

### Problem: Slow Database Queries

**Solutions:**

1. **Run Performance Migration:**
```bash
php artisan migrate
# This will add indexes from 2024_01_20_000000_add_performance_indexes.php
```

2. **Enable Query Logging:**
```php
// Temporarily add to a controller
DB::enableQueryLog();
// ... your code ...
dd(DB::getQueryLog());
```

3. **Optimize Queries:**
```php
// Use eager loading
Mission::with('creator', 'staff')->get();

// Instead of
Mission::all(); // N+1 problem
```

---

## Performance Problems

### Problem: Slow Page Load Times

**Solutions:**

1. **Check React Query Cache:**
```javascript
// Verify cache is working
import { useQueryClient } from '@tanstack/react-query'
const queryClient = useQueryClient()
console.log(queryClient.getQueryCache())
```

2. **Verify Lazy Loading:**
```javascript
// Check if components are lazy loaded
import { LazyMissionsPage } from '@/components/lazy'
```

3. **Check Network Tab:**
- Open browser DevTools
- Go to Network tab
- Look for duplicate requests
- Check response times

4. **Clear Next.js Cache:**
```bash
rm -rf .next
pnpm build
```

### Problem: High Memory Usage

**Solutions:**

1. **Optimize Images:**
```javascript
// Use Next.js Image component
import Image from 'next/image'
<Image src="/image.jpg" width={500} height={300} alt="..." />
```

2. **Reduce Bundle Size:**
```bash
# Analyze bundle
pnpm build
# Check .next/analyze/
```

3. **Implement Pagination:**
```javascript
// Use pagination for large lists
const { data } = useMissions({ page: 1, per_page: 15 })
```

### Problem: API Requests Taking Too Long

**Solutions:**

1. **Check Backend Cache:**
```bash
# Verify Redis is running
redis-cli ping
```

2. **Enable Response Caching:**
```php
// Already enabled in routes/api.php
Route::middleware(['cache.response:5'])->group(...)
```

3. **Optimize Database Queries:**
```bash
# Run indexing migration
php artisan migrate
```

---

## Rate Limiting Issues

### Problem: Getting 429 "Too Many Requests" Errors

**Solutions:**

1. **Check Rate Limit Headers:**
```javascript
// In browser console
fetch('/api/missions').then(r => {
  console.log(r.headers.get('X-RateLimit-Limit'))
  console.log(r.headers.get('X-RateLimit-Remaining'))
})
```

2. **Implement Retry Logic:**
```javascript
// Use React Query retry
const { data } = useQuery({
  queryKey: ['missions'],
  queryFn: fetchMissions,
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
})
```

3. **Adjust Rate Limits (Development):**
```env
# backend/.env
RATE_LIMIT_ENABLED=false  # Only for development!
```

4. **Check User Role:**
```bash
# Verify user role for higher limits
php artisan tinker
>>> User::find(1)->role
```

### Problem: Rate Limiting Not Working

**Solutions:**

1. **Verify Redis Connection:**
```bash
redis-cli ping
# Should return PONG
```

2. **Check Cache Configuration:**
```bash
cd backend
php artisan config:clear
php artisan config:cache
```

3. **Test Rate Limiting:**
```bash
php test_rate_limiting.php
```

---

## File Upload Problems

### Problem: File Upload Fails

**Solutions:**

1. **Check File Size Limits:**
```php
// backend/config/filesystems.php
// Check max upload size in php.ini
upload_max_filesize = 20M
post_max_size = 20M
```

2. **Verify Storage Permissions:**
```bash
chmod -R 775 backend/storage
chown -R www-data:www-data backend/storage
```

3. **Check Disk Space:**
```bash
df -h
```

4. **Verify Storage Link:**
```bash
cd backend
php artisan storage:link
```

### Problem: Downloaded Files Are Corrupted

**Solutions:**

1. **Check File MIME Type:**
```php
// In controller
return response()->download($path, $filename, [
    'Content-Type' => Storage::mimeType($path)
]);
```

2. **Verify File Exists:**
```bash
ls -la backend/storage/app/documents/
```

---

## Frontend Build Errors

### Problem: "Module not found" Error

**Solutions:**

1. **Clear Node Modules:**
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

2. **Check Import Paths:**
```javascript
// Use correct aliases
import { Button } from '@/components/ui/button'  // ✓
import { Button } from '../components/ui/button'  // ✗
```

3. **Verify tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Problem: Build Fails with TypeScript Errors

**Solutions:**

1. **Ignore Build Errors (Temporary):**
```javascript
// next.config.mjs
typescript: {
  ignoreBuildErrors: true,
}
```

2. **Fix Type Errors:**
```bash
pnpm tsc --noEmit
```

3. **Update Dependencies:**
```bash
pnpm update
```

---

## Backend Errors

### Problem: "Class not found" Error

**Solutions:**

1. **Regenerate Autoload:**
```bash
cd backend
composer dump-autoload
```

2. **Clear Cache:**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Problem: "Permission denied" Error

**Solutions:**

1. **Fix Permissions:**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

2. **Check SELinux (if applicable):**
```bash
sudo setenforce 0  # Temporary
```

### Problem: Queue Jobs Not Processing

**Solutions:**

1. **Check Queue Worker:**
```bash
php artisan queue:work
```

2. **Restart Supervisor:**
```bash
sudo supervisorctl restart redas-worker:*
```

3. **Check Failed Jobs:**
```bash
php artisan queue:failed
php artisan queue:retry all
```

---

## Deployment Issues

### Problem: 500 Error After Deployment

**Solutions:**

1. **Check Logs:**
```bash
tail -f backend/storage/logs/laravel.log
tail -f /var/log/nginx/error.log
```

2. **Verify Environment:**
```bash
php artisan config:cache
php artisan route:cache
```

3. **Check File Permissions:**
```bash
chmod -R 775 storage bootstrap/cache
```

### Problem: Frontend Shows Blank Page

**Solutions:**

1. **Check Browser Console:**
- Open DevTools (F12)
- Look for JavaScript errors

2. **Verify Build:**
```bash
pnpm build
pnpm start
```

3. **Check Environment Variables:**
```bash
echo $NEXT_PUBLIC_API_URL
```

---

## Common Error Messages

### "CSRF token mismatch"

**Solution:**
```bash
# Clear cookies and retry
# Or disable CSRF for API (already done in Sanctum)
```

### "Integrity constraint violation"

**Solution:**
```bash
# Check foreign key constraints
# Ensure related records exist
php artisan tinker
>>> Mission::find(1)->creator  # Should not be null
```

### "Maximum execution time exceeded"

**Solution:**
```php
// Increase in php.ini
max_execution_time = 300

// Or in code
set_time_limit(300);
```

### "Memory limit exceeded"

**Solution:**
```php
// Increase in php.ini
memory_limit = 512M

// Or in code
ini_set('memory_limit', '512M');
```

---

## Debugging Tools

### Enable Debug Mode (Development Only)

```env
# backend/.env
APP_DEBUG=true
LOG_LEVEL=debug
```

### Laravel Telescope

```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

Access at: `http://localhost:8000/telescope`

### React Query DevTools

Already enabled in development:
```javascript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

### Browser DevTools

- **Network Tab:** Monitor API requests
- **Console:** Check for JavaScript errors
- **Application Tab:** Inspect localStorage/cookies
- **Performance Tab:** Profile page load

---

## Getting Help

If you can't resolve an issue:

1. **Check Logs:**
   - Laravel: `backend/storage/logs/laravel.log`
   - Nginx: `/var/log/nginx/error.log`
   - PM2: `pm2 logs`

2. **Enable Verbose Logging:**
```env
LOG_LEVEL=debug
```

3. **Contact Support:**
   - Include error messages
   - Provide steps to reproduce
   - Share relevant logs

4. **Useful Commands:**
```bash
# System info
php -v
node -v
composer --version

# Laravel info
php artisan --version
php artisan about

# Check services
systemctl status nginx
systemctl status php8.2-fpm
redis-cli ping
```

---

## Prevention Tips

1. **Regular Backups:** Backup database and files daily
2. **Monitor Logs:** Set up log monitoring and alerts
3. **Keep Updated:** Regularly update dependencies
4. **Test Changes:** Test in staging before production
5. **Document Changes:** Keep deployment notes
6. **Use Version Control:** Commit changes regularly
7. **Monitor Performance:** Use APM tools (New Relic, etc.)

---

**Last Updated:** January 2024
