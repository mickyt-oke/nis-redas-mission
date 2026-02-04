<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Exceptions\ThrottleRequestsException;

class ThrottleRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $limitType  The type of limit to apply (auth, read, write, heavy, api)
     */
    public function handle(Request $request, Closure $next, string $limitType = 'api'): Response
    {
        // Check if rate limiting should be skipped
        if ($this->shouldSkipRateLimiting($request)) {
            return $next($request);
        }

        // Get the rate limit for this request
        $limit = $this->resolveRequestLimit($request, $limitType);
        $decayMinutes = config('rate-limit.decay_minutes', 1);

        // Generate a unique key for this request
        $key = $this->resolveRequestSignature($request, $limitType);

        // Execute the rate limiter
        $response = RateLimiter::attempt(
            $key,
            $limit,
            function () use ($next, $request) {
                return $next($request);
            },
            $decayMinutes * 60
        );

        if ($response === false) {
            throw $this->buildException($request, $key, $limit, $decayMinutes);
        }

        // Add rate limit headers to the response
        return $this->addHeaders(
            $response,
            $limit,
            $this->calculateRemainingAttempts($key, $limit)
        );
    }

    /**
     * Determine if rate limiting should be skipped for this request.
     */
    protected function shouldSkipRateLimiting(Request $request): bool
    {
        // Skip for whitelisted IPs
        $skipIps = config('rate-limit.skip.ips', []);
        if (in_array($request->ip(), $skipIps)) {
            return true;
        }

        // Skip for whitelisted user IDs
        if ($request->user()) {
            $skipUserIds = config('rate-limit.skip.user_ids', []);
            if (in_array($request->user()->id, $skipUserIds)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Resolve the number of attempts allowed for this request.
     */
    protected function resolveRequestLimit(Request $request, string $limitType): int
    {
        // Get base limit from config
        $baseLimit = config("rate-limit.defaults.{$limitType}", 60);

        // Check for endpoint-specific limits
        $routeName = $request->route()?->getName();
        if ($routeName && config("rate-limit.endpoints.{$routeName}")) {
            $baseLimit = config("rate-limit.endpoints.{$routeName}");
        }

        // Apply role-based multiplier if user is authenticated
        if ($request->user() && $request->user()->role) {
            $multiplier = config("rate-limit.role_multipliers.{$request->user()->role}", 1);
            $baseLimit = (int) ($baseLimit * $multiplier);
        }

        return max(1, $baseLimit);
    }

    /**
     * Resolve the request signature for rate limiting.
     */
    protected function resolveRequestSignature(Request $request, string $limitType): string
    {
        // Use user ID if authenticated, otherwise use IP address
        $identifier = $request->user()
            ? 'user:' . $request->user()->id
            : 'ip:' . $request->ip();

        // Include the route name or path for more granular limiting
        $route = $request->route()?->getName() ?? $request->path();

        return sha1($limitType . '|' . $identifier . '|' . $route);
    }

    /**
     * Calculate the number of remaining attempts.
     */
    protected function calculateRemainingAttempts(string $key, int $limit): int
    {
        return RateLimiter::remaining($key, $limit);
    }

    /**
     * Create a 'too many requests' exception.
     */
    protected function buildException(Request $request, string $key, int $limit, int $decayMinutes): ThrottleRequestsException
    {
        $retryAfter = RateLimiter::availableIn($key);

        $headers = $this->getHeaders(
            $limit,
            0,
            $retryAfter
        );

        return new ThrottleRequestsException(
            'Too Many Requests',
            null,
            $headers
        );
    }

    /**
     * Add rate limit headers to the response.
     */
    protected function addHeaders(Response $response, int $limit, int $remaining, ?int $retryAfter = null): Response
    {
        if (!config('rate-limit.headers.enabled', true)) {
            return $response;
        }

        $headers = $this->getHeaders($limit, $remaining, $retryAfter);

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }

    /**
     * Get the rate limit headers.
     */
    protected function getHeaders(int $limit, int $remaining, ?int $retryAfter = null): array
    {
        $headers = [
            config('rate-limit.headers.limit') => $limit,
            config('rate-limit.headers.remaining') => max(0, $remaining),
        ];

        if ($retryAfter !== null) {
            $headers[config('rate-limit.headers.retry_after')] = $retryAfter;
            $headers[config('rate-limit.headers.reset')] = time() + $retryAfter;
        }

        return $headers;
    }
}
