# Rate Limiting and Throttling Implementation

## Overview

This document describes the rate limiting and throttling implementation for the NIS REDAS Mission API backend. The system protects the API from abuse, ensures fair usage, and maintains optimal performance.

## Features

✅ **Role-Based Rate Limiting**: Different limits for different user roles
✅ **Endpoint-Specific Limits**: Custom limits for specific operations
✅ **Granular Control**: Separate limits for read, write, and heavy operations
✅ **Response Headers**: Clear rate limit information in API responses
✅ **Configurable**: Easy to adjust via environment variables
✅ **IP-Based Fallback**: Rate limiting for unauthenticated requests
✅ **Whitelist Support**: Skip rate limiting for trusted IPs/users

## Rate Limit Categories

### 1. Authentication Endpoints

- **Limit**: 5 requests per minute
- **Applies to**: `/login`, `/register`
- **Purpose**: Prevent brute force attacks

### 2. Read Operations (GET)

- **Limit**: 60 requests per minute
- **Applies to**: All GET endpoints (missions, users, documents, etc.)
- **Purpose**: Allow frequent data fetching while preventing abuse

### 3. Write Operations (POST/PUT/DELETE)

- **Limit**: 30 requests per minute
- **Applies to**: Create, update, delete operations
- **Purpose**: Prevent spam and data manipulation

### 4. Heavy Operations

- **Limit**: 10 requests per minute
- **Applies to**:
  - Document uploads
  - Document downloads
  - Report creation
  - Broadcast notifications
- **Purpose**: Protect server resources

### 5. General API

- **Limit**: 60 requests per minute
- **Applies to**: Global fallback for all API routes
- **Purpose**: Overall API protection

## Role-Based Multipliers

Users with higher privileges get increased rate limits:

| Role | Multiplier | Example (Read Limit) |
|------|-----------|---------------------|
| User | 1x | 60 requests/min |
| Supervisor | 1.5x | 90 requests/min |
| Admin | 2x | 120 requests/min |
| Super Admin | 3x | 180 requests/min |

## Response Headers

When rate limiting is active, the following headers are included in responses:

```
X-RateLimit-Limit: 60          # Maximum requests allowed
X-RateLimit-Remaining: 45      # Requests remaining in current window
X-RateLimit-Reset: 1234567890  # Unix timestamp when limit resets
```

When rate limit is exceeded (429 response):

```
Retry-After: 45                # Seconds until you can retry
```

## Error Response Format

When rate limit is exceeded, the API returns:

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

## Configuration

### Environment Variables

Add these to your `.env` file (see `.env.rate-limit.example`):

```env
# Default limits
RATE_LIMIT_AUTH=5
RATE_LIMIT_READ=60
RATE_LIMIT_WRITE=30
RATE_LIMIT_HEAVY=10
RATE_LIMIT_API=60

# Role multipliers
RATE_LIMIT_SUPER_ADMIN_MULTIPLIER=3
RATE_LIMIT_ADMIN_MULTIPLIER=2
RATE_LIMIT_SUPERVISOR_MULTIPLIER=1.5
RATE_LIMIT_USER_MULTIPLIER=1

# Endpoint-specific
RATE_LIMIT_LOGIN=5
RATE_LIMIT_REGISTER=3
RATE_LIMIT_DOCUMENT_UPLOAD=10
```

### Whitelist Configuration

Skip rate limiting for specific IPs or users:

```env
# Comma-separated IP addresses
RATE_LIMIT_SKIP_IPS=127.0.0.1,192.168.1.100

# Comma-separated user IDs
RATE_LIMIT_SKIP_USER_IDS=1,2,3
```

## Implementation Details

### Files Created/Modified

1. **`config/rate-limit.php`** - Configuration file
2. **`app/Http/Middleware/ThrottleRequests.php`** - Custom middleware
3. **`app/Exceptions/Handler.php`** - Exception handler
4. **`bootstrap/app.php`** - Middleware registration
5. **`routes/api.php`** - Route-level throttling

### Middleware Aliases

The following middleware aliases are available:

- `throttle.auth` - For authentication endpoints
- `throttle.read` - For read operations
- `throttle.write` - For write operations
- `throttle.heavy` - For heavy operations
- `throttle.api` - General API throttling

### Usage in Routes

```php
// Apply to specific route
Route::get('/endpoint', [Controller::class, 'method'])
    ->middleware('throttle.read');

// Apply to route group
Route::middleware(['throttle.write'])->group(function () {
    Route::post('/create', [Controller::class, 'create']);
    Route::put('/update', [Controller::class, 'update']);
});
```

## Testing Rate Limits

### Manual Testing

1. **Test Authentication Limit**:

```bash
# Make 6 login requests quickly
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}'
done
```

1. **Test Read Limit**:

```bash
# Make 61 GET requests quickly
for i in {1..61}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://localhost:8000/api/missions
done
```

1. **Check Response Headers**:

```bash
curl -I -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/missions
```

### Expected Behavior

- First N requests: Success (200 OK) with rate limit headers
- Request N+1: Rate limit exceeded (429 Too Many Requests)
- After decay time: Limit resets, requests succeed again

## Monitoring

### Log Rate Limit Violations

Rate limit exceptions are automatically logged. Check logs:

```bash
tail -f storage/logs/laravel.log | grep "ThrottleRequestsException"
```

### Cache Inspection

Rate limit data is stored in the configured cache. To inspect:

```php
use Illuminate\Support\Facades\Cache;

// Check rate limit key
$key = 'throttle:user:1:missions.index';
$attempts = Cache::get($key);
```

## Performance Considerations

1. **Cache Store**: Uses database cache by default. For better performance, consider Redis:

   ```env
   RATE_LIMIT_CACHE_STORE=redis
   ```

2. **Decay Time**: Default is 1 minute. Adjust based on your needs:

   ```env
   RATE_LIMIT_DECAY_MINUTES=5
   ```

3. **Header Overhead**: Minimal. Can be disabled if needed:

   ```env
   RATE_LIMIT_HEADERS_ENABLED=false
   ```

## Best Practices

1. **Start Conservative**: Begin with lower limits and increase based on usage patterns
2. **Monitor Logs**: Watch for legitimate users hitting limits
3. **Communicate Limits**: Document rate limits in API documentation
4. **Use Appropriate Limits**: Different endpoints need different limits
5. **Consider Burst Traffic**: Allow some flexibility for legitimate burst usage

## Troubleshooting

### Issue: Legitimate users hitting limits

**Solution**: Increase limits or adjust role multipliers

```env
RATE_LIMIT_READ=120  # Increase from 60
```

### Issue: Rate limits not working

**Solution**: Check middleware registration and cache configuration

```bash
php artisan config:clear
php artisan cache:clear
```

### Issue: Different limits needed per endpoint

**Solution**: Add endpoint-specific configuration

```php
// config/rate-limit.php
'endpoints' => [
    'custom.endpoint' => 100,
],
```

## Future Enhancements

- [ ] Dynamic rate limiting based on server load
- [ ] Per-user custom limits
- [ ] Rate limit analytics dashboard
- [ ] Automatic limit adjustment based on patterns
- [ ] Integration with API gateway

## Support

For issues or questions about rate limiting:

1. Check this documentation
2. Review configuration in `config/rate-limit.php`
3. Check logs in `storage/logs/laravel.log`
4. Verify cache is working properly

## References

- Laravel Rate Limiting: <https://laravel.com/docs/11.x/routing#rate-limiting>
- HTTP 429 Status Code: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429>
- Rate Limiting Best Practices: <https://cloud.google.com/architecture/rate-limiting-strategies-techniques>
