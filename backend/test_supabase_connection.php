<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Supabase Database Connection Test ===\n\n";

try {
    // Test 1: Basic connection
    echo "Test 1: Testing database connection...\n";
    $pdo = DB::connection()->getPdo();
    echo "✅ Database connection successful!\n\n";

    // Test 2: Query PostgreSQL version
    echo "Test 2: Querying PostgreSQL version...\n";
    $result = DB::select('SELECT version()');
    echo "✅ PostgreSQL Version: " . $result[0]->version . "\n\n";

    // Test 3: List tables
    echo "Test 3: Listing database tables...\n";
    $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 10");
    echo "✅ Found " . count($tables) . " tables (showing first 10):\n";
    foreach ($tables as $table) {
        echo "   - " . $table->tablename . "\n";
    }
    echo "\n";

    // Test 4: Check connection details
    echo "Test 4: Connection details...\n";
    $config = config('database.connections.pgsql');
    echo "✅ Host: " . $config['host'] . "\n";
    echo "✅ Database: " . $config['database'] . "\n";
    echo "✅ Port: " . $config['port'] . "\n";
    echo "✅ SSL Mode: " . $config['sslmode'] . "\n\n";

    echo "=== All Tests Passed! ===\n";
    echo "Your Laravel application is successfully connected to Supabase!\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
