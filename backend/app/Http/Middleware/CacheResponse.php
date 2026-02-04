<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CacheResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, int $minutes = 5): Response
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Don't cache authenticated user-specific data
        $cacheKey = $this->getCacheKey($request);

        // Check if we have a cached response
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);

            return response()->json($cachedResponse['data'], $cachedResponse['status'])
                ->header('X-Cache', 'HIT')
                ->header('Cache-Control', "public, max-age={$minutes}");
        }

        // Process the request
        $response = $next($request);

        // Only cache successful JSON responses
        if ($response->isSuccessful() &&
            $response->headers->get('Content-Type') === 'application/json') {

            $data = json_decode($response->getContent(), true);

            Cache::put($cacheKey, [
                'data' => $data,
                'status' => $response->getStatusCode(),
            ], now()->addMinutes($minutes));

            $response->header('X-Cache', 'MISS');
        }

        // Add cache control headers
        $response->header('Cache-Control', "public, max-age=" . ($minutes * 60));

        return $response;
    }

    /**
     * Generate a unique cache key for the request
     */
    private function getCacheKey(Request $request): string
    {
        $url = $request->fullUrl();
        $user = $request->user();

        // Include user ID in cache key for user-specific data
        $userKey = $user ? "user:{$user->id}" : 'guest';

        return 'api:response:' . md5($url . $userKey);
    }
}
