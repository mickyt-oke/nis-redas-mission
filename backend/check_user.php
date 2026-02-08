<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking test user...\n";

try {
    $user = \App\Models\User::where('email', 'super_admin@example.com')->first();
    if ($user) {
        echo "✓ Found user: {$user->email}\n";
        echo "  Role: {$user->role}\n";
        echo "  ID: {$user->id}\n";
        echo "  Has password: " . (bool)$user->password . "\n";
    } else {
        echo "✗ User not found\n";

        // List all users
        $users = \App\Models\User::all();
        echo "\nAll users in database:\n";
        foreach ($users as $u) {
            echo "  - {$u->email} (role: {$u->role})\n";
        }
    }
} catch (\Exception $e) {
    echo "Error: {$e->getMessage()}\n";
    echo "File: {$e->getFile()}\n";
    echo "Line: {$e->getLine()}\n";
}
