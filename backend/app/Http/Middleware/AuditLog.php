<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditLog
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        // Process the request
        $response = $next($request);

        // Calculate request duration
        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // Log the request
        $this->logRequest($request, $response, $duration);

        return $response;
    }

    /**
     * Log the request details
     */
    private function logRequest(Request $request, Response $response, float $duration): void
    {
        // Only log important operations (write operations and authentication)
        $shouldLog = $this->shouldLogRequest($request, $response);

        if (!$shouldLog) {
            return;
        }

        $user = $request->user();

        $logData = [
            'timestamp' => now()->toIso8601String(),
            'method' => $request->method(),
            'path' => $request->path(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => $user?->id,
            'user_email' => $user?->email,
            'user_role' => $user?->role,
            'status_code' => $response->getStatusCode(),
            'duration_ms' => $duration,
        ];

        // Add request body for write operations (excluding sensitive data)
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $logData['request_data'] = $this->sanitizeRequestData($request->all());
        }

        // Add response data for failed requests
        if ($response->getStatusCode() >= 400) {
            $content = $response->getContent();
            $logData['response'] = json_decode($content, true) ?? $content;
        }

        // Log based on status code
        if ($response->getStatusCode() >= 500) {
            Log::error('API Request Failed', $logData);
        } elseif ($response->getStatusCode() >= 400) {
            Log::warning('API Request Error', $logData);
        } else {
            Log::info('API Request', $logData);
        }
    }

    /**
     * Determine if the request should be logged
     */
    private function shouldLogRequest(Request $request, Response $response): bool
    {
        // Always log authentication attempts
        if (in_array($request->path(), ['api/login', 'api/register', 'api/logout'])) {
            return true;
        }

        // Always log write operations
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return true;
        }

        // Log failed requests
        if ($response->getStatusCode() >= 400) {
            return true;
        }

        // Log slow requests (> 1 second)
        $duration = microtime(true) - LARAVEL_START;
        if ($duration > 1.0) {
            return true;
        }

        return false;
    }

    /**
     * Sanitize request data to remove sensitive information
     */
    private function sanitizeRequestData(array $data): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'current_password',
            'new_password',
            'token',
            'api_key',
            'secret',
            'credit_card',
            'cvv',
        ];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        return $data;
    }
}
