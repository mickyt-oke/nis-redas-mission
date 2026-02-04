<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ValidateRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Validate common security headers
        $this->validateSecurityHeaders($request);

        // Validate request size
        $this->validateRequestSize($request);

        // Validate content type for POST/PUT requests
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            $this->validateContentType($request);
        }

        // Sanitize input data
        $this->sanitizeInput($request);

        return $next($request);
    }

    /**
     * Validate security headers
     */
    protected function validateSecurityHeaders(Request $request): void
    {
        // Check for suspicious user agents
        $userAgent = $request->userAgent();
        $suspiciousPatterns = [
            '/bot/i',
            '/crawler/i',
            '/spider/i',
            '/scraper/i',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                // Log suspicious activity
                \Log::warning('Suspicious user agent detected', [
                    'user_agent' => $userAgent,
                    'ip' => $request->ip(),
                    'path' => $request->path(),
                ]);
            }
        }
    }

    /**
     * Validate request size
     */
    protected function validateRequestSize(Request $request): void
    {
        $maxSize = config('app.max_request_size', 10240); // 10MB default
        $contentLength = $request->header('Content-Length', 0);

        if ($contentLength > $maxSize * 1024) {
            abort(413, 'Request entity too large');
        }
    }

    /**
     * Validate content type
     */
    protected function validateContentType(Request $request): void
    {
        $contentType = $request->header('Content-Type', '');

        // Allow multipart for file uploads
        if (str_contains($contentType, 'multipart/form-data')) {
            return;
        }

        // Require JSON for API requests
        if (!str_contains($contentType, 'application/json')) {
            abort(415, 'Unsupported Media Type. Expected application/json');
        }
    }

    /**
     * Sanitize input data
     */
    protected function sanitizeInput(Request $request): void
    {
        $input = $request->all();

        array_walk_recursive($input, function (&$value) {
            if (is_string($value)) {
                // Remove null bytes
                $value = str_replace("\0", '', $value);

                // Trim whitespace
                $value = trim($value);

                // Remove control characters except newlines and tabs
                $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
            }
        });

        $request->merge($input);
    }
