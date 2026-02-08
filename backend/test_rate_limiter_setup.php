<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Rate Limiter functionality...\n";
echo str_repeat("=", 60) . "\n\n";

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;

// Test 1: Check if cache is working
echo "Test 1: Cache functionality\n";
try {
    Cache::put('test_key', 'test_value', 60);
    $value = Cache::get('test_key');
    if ($value === 'test_value') {
        echo "✓ Cache is working\n";
    } else {
        echo "✗ Cache returned wrong value\n";
    }
} catch (\Exception $e) {
    echo "✗ Cache error: " . $e->getMessage() . "\n";
}

// Test 2: Check RateLimiter
echo "\nTest 2: RateLimiter functionality\n";
try {
    $key = 'test:throttle';
    $limit = 3;
    $decaySeconds = 60;

    for ($i = 1; $i <= 5; $i++) {
        $result = RateLimiter::attempt(
            $key,
            $limit,
            function () {
                return true;
            },
            $decaySeconds
        );

        $remaining = RateLimiter::remaining($key, $limit);
        echo "  Request $i: " . ($result ? "SUCCESS" : "FAILED") . " | Remaining: $remaining\n";
    }

    echo "✓ RateLimiter is working\n";
} catch (\Exception $e) {
    echo "✗ RateLimiter error: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . "\n";
    echo "  Line: " . $e->getLine() . "\n";
}

// Test 3: Check Middleware registration
echo "\nTest 3: Checking middleware registration\n";
try {
    $routes = \Illuminate\Support\Facades\Route::getRoutes();
    $loginRoute = null;

    foreach ($routes as $route) {
        if ($route->getName() === 'login') {
            $loginRoute = $route;
            break;
        }
    }

    if ($loginRoute) {
        echo "✓ Login route found\n";
        $middleware = $loginRoute->middleware();
        echo "  Middleware: " . implode(', ', $middleware) . "\n";
    } else {
        echo "✗ Login route not found\n";
    }
} catch (\Exception $e) {
    echo "✗ Error checking routes: " . $e->getMessage() . "\n";
}

echo "\n";
