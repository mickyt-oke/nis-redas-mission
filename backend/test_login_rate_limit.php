<?php

/**
 * Simple Login Rate Limiting Test
 *
 * Tests the login endpoint specifically to identify issues.
 */

$baseUrl = 'http://localhost:8000/api';

echo "🔐 Testing Login Endpoint Rate Limiting\n";
echo str_repeat("=", 60) . "\n\n";

// Test credentials
$credentials = [
    'email' => 'super_admin@example.com',
    'password' => 'Admin@123', // Assuming default password from seeding
];

echo "Testing with credentials: {$credentials['email']}\n";
echo "Sending 7 requests (limit is 5 per minute)\n\n";

$results = [];
for ($i = 1; $i <= 7; $i++) {
    echo "Request $i... ";

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "$baseUrl/login",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($credentials),
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Parse headers and body
    list($headers, $body) = explode("\r\n\r\n", $response, 2);

    // Extract rate limit headers
    preg_match('/X-RateLimit-Limit: (\d+)/', $headers, $limit);
    preg_match('/X-RateLimit-Remaining: (\d+)/', $headers, $remaining);
    preg_match('/Retry-After: (\d+)/', $headers, $retryAfter);
    preg_match('/X-RateLimit-Reset: (\d+)/', $headers, $reset);

    $result = [
        'status' => $httpCode,
        'limit' => $limit[1] ?? 'N/A',
        'remaining' => $remaining[1] ?? 'N/A',
        'retry_after' => $retryAfter[1] ?? 'N/A',
        'reset' => $reset[1] ?? 'N/A',
    ];

    $results[] = $result;

    echo "Status: $httpCode | Limit: {$result['limit']} | Remaining: {$result['remaining']}\n";

    // Small delay between requests
    usleep(100000); // 0.1 seconds
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "Results Summary:\n";
echo str_repeat("=", 60) . "\n\n";

// Display table
echo sprintf("%-5s %-8s %-8s %-12s %-10s\n", "Req#", "Status", "Limit", "Remaining", "Retry-After");
echo str_repeat("-", 50) . "\n";

foreach ($results as $i => $result) {
    $req = $i + 1;
    $status = $result['status'];
    $limit = $result['limit'];
    $remaining = $result['remaining'];
    $retry = $result['retry_after'] !== 'N/A' ? $result['retry_after'] . 's' : 'N/A';
    echo sprintf("%-5d %-8s %-8s %-12s %-10s\n", $req, $status, $limit, $remaining, $retry);
}

echo "\n";

// Check for 429 response
$status_429_found = false;
foreach ($results as $result) {
    if ($result['status'] == 429) {
        $status_429_found = true;
        break;
    }
}

if ($status_429_found) {
    echo "✅ Rate limiting is working! 429 status code detected.\n";
} else {
    echo "❌ Rate limiting NOT working. No 429 status code found.\n";
    echo "   The rate limit should trigger on the 6th request.\n";
}

echo "\n";
