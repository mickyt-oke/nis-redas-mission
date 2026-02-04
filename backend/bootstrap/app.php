<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\ThrottleRequests;
use App\Http\Middleware\CacheResponse;
use App\Http\Middleware\ValidateApiRequest;
use App\Http\Middleware\AuditLog;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->expectsJson()) {
                return null; // Return null to let the middleware return 401 Unauthorized
            }
            return route('login');
        });

        // Register custom throttle middleware with aliases
        $middleware->alias([
            'throttle.auth' => ThrottleRequests::class . ':authentication',
            'throttle.read' => ThrottleRequests::class . ':read',
            'throttle.write' => ThrottleRequests::class . ':write',
            'throttle.heavy' => ThrottleRequests::class . ':heavy',
            'throttle.api' => ThrottleRequests::class . ':api',
            'cache.response' => CacheResponse::class,
            'validate.api' => ValidateApiRequest::class,
            'audit.log' => AuditLog::class,
        ]);

        // Apply global API middleware
        $middleware->api(append: [
            ValidateApiRequest::class,
            AuditLog::class,
            ThrottleRequests::class . ':api',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
