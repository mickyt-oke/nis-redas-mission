<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class ValidateApiRequest
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

        // Sanitize input data
        $this->sanitizeInput($request);

        return $next($request);
    }

    /**
     * Validate security headers
     */
    private function validateSecurityHeaders(Request $request): void
    {
        // Check for suspicious user agents
        $userAgent = $request->userAgent();
        $suspiciousPatterns = [
            'sqlmap',
            'nikto',
            'nmap',
            'masscan',
            'nessus',
            'openvas',
            'acunetix',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (stripos($userAgent, $pattern) !== false) {
                abort(403, 'Suspicious user agent detected');
            }
        }

        // Validate Content-Type for POST/PUT requests
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            $contentType = $request->header('Content-Type');

            if (!$contentType || !str_contains($contentType, 'application/json')) {
                // Allow multipart/form-data for file uploads
                if (!str_contains($contentType, 'multipart/form-data')) {
                    abort(415, 'Unsupported Media Type. Expected application/json');
                }
            }
        }
    }

    /**
     * Validate request size
     */
    private function validateRequestSize(Request $request): void
    {
        // Maximum request size (excluding file uploads)
        $maxSize = 1024 * 1024; // 1MB

        if (!$request->hasFile('file') && strlen($request->getContent()) > $maxSize) {
            abort(413, 'Request entity too large');
        }
    }

    /**
     * Sanitize input data
     */
    private function sanitizeInput(Request $request): void
    {
        // Remove null bytes from input
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
}
