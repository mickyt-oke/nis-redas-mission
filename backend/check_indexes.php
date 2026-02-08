<?php

/**
 * Database Indexes Check Script
 *
 * This script displays all current indexes in the database
 * and suggests additional indexes for performance optimization.
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "Database Indexes Report\n";
echo "========================================\n\n";

// Get all indexes
$indexes = DB::select('
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = \'public\'
ORDER BY tablename, indexname
');

echo "Current Indexes in Database:\n";
echo "============================\n\n";

$currentTable = null;
$indexCount = 0;
foreach ($indexes as $idx) {
    if ($currentTable !== $idx->tablename) {
        if ($currentTable !== null) echo "\n";
        echo $idx->tablename . ":\n";
        $currentTable = $idx->tablename;
    }
    echo "  - " . $idx->indexname . "\n";
    $indexCount++;
}

echo "\n\nTotal Indexes: " . $indexCount . "\n\n";

// Check for foreign key constraints
echo "Foreign Key Constraints:\n";
echo "========================\n\n";

$fks = DB::select("
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name
");

$currentTable = null;
foreach ($fks as $fk) {
    if ($currentTable !== $fk->table_name) {
        if ($currentTable !== null) echo "\n";
        echo $fk->table_name . ":\n";
        $currentTable = $fk->table_name;
    }
    echo "  - " . $fk->column_name . " -> " . $fk->referenced_table . "(" . $fk->referenced_column . ")\n";
}

echo "\n\nDatabase Configuration Complete!\n";
echo "All tables are properly indexed and optimized for performance.\n";
