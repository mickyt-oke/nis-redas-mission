<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            // Check if start_date column doesn't exist before adding
            if (!Schema::hasColumn('missions', 'start_date')) {
                $table->date('start_date')->nullable()->after('description');
            }

            // Also add end_date if it doesn't exist
            if (!Schema::hasColumn('missions', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            if (Schema::hasColumn('missions', 'start_date')) {
                $table->dropColumn('start_date');
            }

            if (Schema::hasColumn('missions', 'end_date')) {
                $table->dropColumn('end_date');
            }
        });
    }
};
