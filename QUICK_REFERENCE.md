# REDAS Quick Reference Guide

## 🚀 Quick Start Commands

### Backend (Laravel)

```bash
# Start development server
cd backend
php artisan serve

# Run migrations
php artisan migrate

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Run tests
php test_rate_limiting.php
php test_api_endpoints.php

# Database operations
php artisan tinker
php artisan migrate:fresh --seed
```

### Frontend (Next.js)

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint
```

---

## 📁 Important Files

### Configuration
- `backend/.env` - Backend environment variables
- `.env.local` - Frontend environment variables
- `backend/config/rate-limit.php` - Rate limiting configuration
- `backend/config/cors.php` - CORS configuration
- `next.config.mjs` - Next.js configuration

### Middleware
- `backend/app/Http/Middleware/ValidateApiRequest.php` - Request validation
- `backend/app/Http/Middleware/AuditLog.php` - Audit logging
- `backend/app/Http/Middleware/ThrottleRequests.php` - Rate limiting
- `backend/app/Http/Middleware/CacheResponse.php` - Response caching

### Routes
- `backend/routes/api.php` - API endpoints
- `app/` - Next.js pages (App Router)

### Documentation
- `API_DOCUMENTATION.md` - API reference
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `TROUBLESHOOTING_GUIDE.md` - Problem resolution
- `DEVELOPER_ONBOARDING_GUIDE.md` - Developer setup

---

## 🔐 Default Credentials

See `backend/MOCK_USERS_CREDENTIALS.md` for test user credentials.

**Super Admin:**
- Email: `admin@nis.gov.ng`
- Password: `Admin@123`

---

## 🛠️ Common Tasks

### Add New API Endpoint

1. Add route in `backend/routes/api.php`
2. Create controller method
3. Add to frontend API client (`lib/api-client.ts`)
4. Create React Query hook (`hooks/use-api.ts`)

### Add New Page

1. Create page file in `app/new-page/page.tsx`
2. Add to navigation in `components/AppSidebar.tsx`
3. Add lazy loading if needed

### Database Migration

```bash
# Create migration
php artisan make:migration create_table_name

# Run migration
php artisan migrate

# Rollback
php artisan migrate:rollback
```

---

## 📊 Rate Limits

| Endpoint Type | User | Supervisor | Admin | Super Admin |
|--------------|------|------------|-------|-------------|
| Authentication | 5/min | 7/min | 10/min | 15/min |
| Read Operations | 60/min | 90/min | 120/min | 180/min |
| Write Operations | 30/min | 45/min | 60/min | 90/min |
| Heavy Operations | 10/min | 15/min | 20/min | 30/min |

---

## 🔍 Debugging

### Check Logs

```bash
# Laravel logs
tail -f backend/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/error.log

# PM2 logs
pm2 logs
```

### Common Issues

**401 Unauthorized:**
- Check token in localStorage
- Verify Authorization header
- Check token expiration

**429 Too Many Requests:**
- Check rate limit headers
- Wait for retry-after period
- Verify user role

**500 Internal Server Error:**
- Check Laravel logs
- Verify database connection
- Check file permissions

---

## 🧪 Testing

### Manual Testing

```bash
# Test API endpoint
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nis.gov.ng","password":"Admin@123"}'

# Test with authentication
curl http://localhost:8000/api/missions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Rate Limiting Test

```bash
cd backend
php test_rate_limiting.php
```

---

## 📦 Deployment

### Quick Deploy (Production)

```bash
# Backend
cd backend
git pull
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
sudo supervisorctl restart redas-worker:*

# Frontend
cd ..
git pull
pnpm install
pnpm build
pm2 restart redas-frontend
```

### Verify Deployment

```bash
# Check backend
curl https://api.your-domain.com/api/health

# Check frontend
curl https://your-domain.com

# Check services
systemctl status nginx
systemctl status php8.2-fpm
pm2 status
```

---

## 🔧 Maintenance

### Clear All Caches

```bash
# Backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Frontend
rm -rf .next
pnpm build
```

### Database Backup

```bash
# Manual backup
pg_dump -h your-host.supabase.co -U postgres -d postgres > backup.sql

# Restore
psql -h your-host.supabase.co -U postgres -d postgres < backup.sql
```

### Update Dependencies

```bash
# Backend
composer update

# Frontend
pnpm update
```

---

## 📈 Performance Monitoring

### Check Performance

```bash
# Database query time
php artisan tinker
>>> DB::enableQueryLog();
>>> // Run your query
>>> dd(DB::getQueryLog());

# API response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/missions
```

### Optimize

```bash
# Backend
php artisan optimize
php artisan config:cache
php artisan route:cache

# Frontend
pnpm build
```

---

## 🆘 Emergency Procedures

### Application Down

1. Check logs: `tail -f backend/storage/logs/laravel.log`
2. Check services: `systemctl status nginx php8.2-fpm`
3. Restart services: `sudo systemctl restart nginx php8.2-fpm`
4. Check PM2: `pm2 status` and `pm2 restart all`

### Database Issues

1. Check connection: `php artisan tinker` → `DB::connection()->getPdo();`
2. Check Supabase dashboard
3. Verify credentials in `.env`
4. Check firewall rules

### High Load

1. Check rate limiting: `tail -f backend/storage/logs/laravel.log | grep "429"`
2. Scale PM2: `pm2 scale redas-frontend +2`
3. Enable Redis caching
4. Check for slow queries

---

## 📞 Support Contacts

- **Documentation:** Check relevant guide first
- **Technical Issues:** `TROUBLESHOOTING_GUIDE.md`
- **Deployment:** `DEPLOYMENT_GUIDE.md`
- **Development:** `DEVELOPER_ONBOARDING_GUIDE.md`

---

## 🔗 Useful Links

- **Next.js Docs:** https://nextjs.org/docs
- **Laravel Docs:** https://laravel.com/docs
- **React Query:** https://tanstack.com/query/latest
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Supabase:** https://supabase.com/docs

---

**Last Updated:** January 2024
