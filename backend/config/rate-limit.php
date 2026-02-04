<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains all rate limiting configurations for the API.
    | You can customize limits based on endpoint types and user roles.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Default Rate Limits (requests per minute)
    |--------------------------------------------------------------------------
    */

    'defaults' => [
        'authentication' => env('RATE_LIMIT_AUTH', 5),
        'read' => env('RATE_LIMIT_READ', 60),
        'write' => env('RATE_LIMIT_WRITE', 30),
        'heavy' => env('RATE_LIMIT_HEAVY', 10),
        'api' => env('RATE_LIMIT_API', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Role-Based Multipliers
    |--------------------------------------------------------------------------
    |
    | Multiply the default limits by these values for specific roles.
    | For example, admins get 2x the normal limits.
    |
    */

    'role_multipliers' => [
        'super_admin' => env('RATE_LIMIT_SUPER_ADMIN_MULTIPLIER', 3),
        'admin' => env('RATE_LIMIT_ADMIN_MULTIPLIER', 2),
        'supervisor' => env('RATE_LIMIT_SUPERVISOR_MULTIPLIER', 1.5),
        'user' => env('RATE_LIMIT_USER_MULTIPLIER', 1),
    ],

    /*
    |--------------------------------------------------------------------------
    | Endpoint-Specific Limits
    |--------------------------------------------------------------------------
    |
    | Override default limits for specific endpoints.
    | Format: 'endpoint_pattern' => requests_per_minute
    |
    */

    'endpoints' => [
        // Authentication endpoints
        'login' => env('RATE_LIMIT_LOGIN', 5),
        'register' => env('RATE_LIMIT_REGISTER', 3),
        'logout' => env('RATE_LIMIT_LOGOUT', 10),

        // Heavy operations
        'documents.store' => env('RATE_LIMIT_DOCUMENT_UPLOAD', 10),
        'documents.download' => env('RATE_LIMIT_DOCUMENT_DOWNLOAD', 20),
        'reports.store' => env('RATE_LIMIT_REPORT_CREATE', 10),
        'notifications.broadcast' => env('RATE_LIMIT_BROADCAST', 5),

        // Messaging (to prevent spam)
        'messages.send' => env('RATE_LIMIT_MESSAGE_SEND', 20),
        'conversations.create' => env('RATE_LIMIT_CONVERSATION_CREATE', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Decay Time (in minutes)
    |--------------------------------------------------------------------------
    |
    | The time window for rate limiting. After this time, the counter resets.
    |
    */

    'decay_minutes' => env('RATE_LIMIT_DECAY_MINUTES', 1),

    /*
    |--------------------------------------------------------------------------
    | Response Headers
    |--------------------------------------------------------------------------
    |
    | Include rate limit information in response headers.
    |
    */

    'headers' => [
        'enabled' => env('RATE_LIMIT_HEADERS_ENABLED', true),
        'limit' => 'X-RateLimit-Limit',
        'remaining' => 'X-RateLimit-Remaining',
        'reset' => 'X-RateLimit-Reset',
        'retry_after' => 'Retry-After',
    ],

    /*
    |--------------------------------------------------------------------------
    | Skip Rate Limiting
    |--------------------------------------------------------------------------
    |
    | IP addresses or user IDs that should skip rate limiting.
    | Useful for internal services or monitoring tools.
    |
    */

    'skip' => [
        'ips' => array_filter(explode(',', env('RATE_LIMIT_SKIP_IPS', ''))),
        'user_ids' => array_filter(explode(',', env('RATE_LIMIT_SKIP_USER_IDS', ''))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Store
    |--------------------------------------------------------------------------
    |
    | The cache store to use for rate limiting data.
    | Defaults to the application's default cache store.
    |
    */

    'cache_store' => env('RATE_LIMIT_CACHE_STORE', env('CACHE_STORE', 'database')),

];
