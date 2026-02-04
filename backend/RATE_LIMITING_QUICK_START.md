# Rate Limiting Quick Start Guide

## 🚀 Getting Started

The rate limiting system is now active on your API. Here's what you need to know to get started quickly.

## ✅ What's Already Configured

The following rate limits are active by default:

| Endpoint Type | Limit | Examples |
|--------------|-------|----------|
| Authentication | 5/min | `/login`, `/register` |
| Read Operations | 60/min | GET `/missions`, `/users`, `/documents` |
| Write Operations | 30/min | POST/PUT/DELETE on resources |
| Heavy Operations | 10/min | File uploads, downloads, broadcasts |

## 📝 Quick Setup (Optional)

If you want to customize the default limits, add these to your `.env` file:

```env
# Copy from .env.rate-limit.example
RATE_LIMIT_AUTH=5
RATE_LIMIT_READ=60
RATE_LIMIT_WRITE=30
RATE_LIMIT_HEAVY=10
```

## 🧪 Testing the Implementation

### Option 1: Run the Test Script

```bash
cd backend
php test_rate_limiting.php
```

### Option 2: Manual Testing with cURL

**Test Authentication Rate Limit:**

```bash
# Make 6 login requests (limit is 5)
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}' \
    -i
done
```

**Test Read Rate Limit:**

```bash
# First, get a token
TOKEN=$(curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nis.gov.ng","password":"Admin@123"}' \
  | jq -r '.token')

# Then make requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/missions \
  -i
```

## 📊 Understanding the Response

### Successful Request (200 OK)

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1234567890
```

### Rate Limit Exceeded (429 Too Many Requests)

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

```json
{
  "message": "Too many requests. Please slow down.",
  "error": "rate_limit_exceeded",
  "details": {
    "limit": 60,
    "retry_after": 45,
    "retry_after_human": "45 seconds"
  }
}
```

## 🔧 Common Adjustments

### Increase Limits for All Users

```env
RATE_LIMIT_READ=120  # Double the read limit
RATE_LIMIT_WRITE=60  # Double the write limit
```

### Give Admins Higher Limits

```env
RATE_LIMIT_ADMIN_MULTIPLIER=3  # Admins get 3x limits
```

### Whitelist Internal Services

```env
RATE_LIMIT_SKIP_IPS=127.0.0.1,192.168.1.100
```

### Change Time Window

```env
RATE_LIMIT_DECAY_MINUTES=5  # 5-minute window instead of 1
```

## 🎯 Role-Based Limits

Different user roles automatically get different limits:

```
User:        60 requests/min (1x multiplier)
Supervisor:  90 requests/min (1.5x multiplier)
Admin:      120 requests/min (2x multiplier)
Super Admin: 180 requests/min (3x multiplier)
```

## 🐛 Troubleshooting

### Rate limits not working?

1. **Clear cache:**

   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

2. **Check middleware is registered:**

   ```bash
   php artisan route:list
   ```

   Look for `throttle.read`, `throttle.write`, etc. in the middleware column.

3. **Verify cache is working:**

   ```bash
   php artisan tinker
   >>> Cache::put('test', 'value', 60);
   >>> Cache::get('test');
   ```

### Users complaining about rate limits?

1. **Check logs:**

   ```bash
   tail -f storage/logs/laravel.log | grep "429"
   ```

2. **Increase limits temporarily:**

   ```env
   RATE_LIMIT_READ=120
   RATE_LIMIT_WRITE=60
   ```

3. **Whitelist specific users:**

   ```env
   RATE_LIMIT_SKIP_USER_IDS=1,2,3
   ```

## 📚 Next Steps

1. ✅ Test the implementation with the test script
2. ✅ Monitor logs for rate limit violations
3. ✅ Adjust limits based on actual usage patterns
4. ✅ Document rate limits in your API documentation
5. ✅ Set up monitoring/alerts for excessive rate limiting

## 📖 Full Documentation

For detailed information, see:

- `RATE_LIMITING_IMPLEMENTATION.md` - Complete implementation guide
- `config/rate-limit.php` - Configuration options
- `.env.rate-limit.example` - Environment variable examples

## 🆘 Need Help?

- Check the logs: `storage/logs/laravel.log`
- Review configuration: `config/rate-limit.php`
- Test with: `php test_rate_limiting.php`
- Read full docs: `RATE_LIMITING_IMPLEMENTATION.md`
