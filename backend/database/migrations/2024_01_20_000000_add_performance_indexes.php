<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Users table indexes
        $this->addIndexIfNotExists('users', 'email');
        $this->addIndexIfNotExists('users', 'role');
        $this->addIndexIfNotExists('users', ['role', 'created_at']);
        $this->addIndexIfNotExists('users', 'created_at');

        // Missions table indexes
        if (Schema::hasTable('missions')) {
            $this->addIndexIfNotExists('missions', 'status');
            $this->addIndexIfNotExists('missions', 'created_by');
            $this->addIndexIfNotExists('missions', ['status', 'start_date']);
            $this->addIndexIfNotExists('missions', ['status', 'end_date']);
            $this->addIndexIfNotExists('missions', 'start_date');
            $this->addIndexIfNotExists('missions', 'end_date');
            $this->addIndexIfNotExists('missions', 'created_at');
        }

        // Applications table indexes
        if (Schema::hasTable('applications')) {
            $this->addIndexIfNotExists('applications', 'user_id');
            $this->addIndexIfNotExists('applications', 'mission_id');
            $this->addIndexIfNotExists('applications', 'status');
            $this->addIndexIfNotExists('applications', ['user_id', 'status']);
            $this->addIndexIfNotExists('applications', ['mission_id', 'status']);
            $this->addIndexIfNotExists('applications', 'created_at');
        }

        // Documents table indexes
        if (Schema::hasTable('documents')) {
            $this->addIndexIfNotExists('documents', ['status', 'created_at']);
            $this->addIndexIfNotExists('documents', 'created_at');
            $this->addIndexIfNotExists('documents', 'mission_id');
            $this->addIndexIfNotExists('documents', 'reviewed_by');
        }

        // Reports table indexes
        if (Schema::hasTable('reports')) {
            $this->addIndexIfNotExists('reports', ['status', 'created_at']);
            $this->addIndexIfNotExists('reports', 'created_at');
            $this->addIndexIfNotExists('reports', 'vetted_by');
            $this->addIndexIfNotExists('reports', 'approved_by');
            $this->addIndexIfNotExists('reports', ['report_type', 'status']);
        }

        // Notifications table indexes (user_id, is_read, created_at already indexed)
        if (Schema::hasTable('notifications')) {
            $this->addIndexIfNotExists('notifications', 'type');
            $this->addIndexIfNotExists('notifications', 'read_at');
        }

        // Messages table indexes (conversation_id and user_id already indexed)
        if (Schema::hasTable('messages')) {
            $this->addIndexIfNotExists('messages', 'created_at');
            $this->addIndexIfNotExists('messages', 'is_edited');
        }

        // Conversations table indexes (created_at already indexed)
        if (Schema::hasTable('conversations')) {
            $this->addIndexIfNotExists('conversations', 'type');
        }

        // Conversation user pivot table indexes
        if (Schema::hasTable('conversation_user')) {
            $this->addIndexIfNotExists('conversation_user', 'last_read_at');
            $this->addIndexIfNotExists('conversation_user', 'created_at');
        }

        // Events table indexes
        if (Schema::hasTable('events')) {
            $this->addIndexIfNotExists('events', 'created_by');
            $this->addIndexIfNotExists('events', 'start_date');
            $this->addIndexIfNotExists('events', 'end_date');
            $this->addIndexIfNotExists('events', ['start_date', 'end_date']);
            $this->addIndexIfNotExists('events', 'created_at');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Users table indexes
        $this->dropIndexIfExists('users', 'email');
        $this->dropIndexIfExists('users', 'role');
        $this->dropIndexIfExists('users', ['role', 'created_at']);
        $this->dropIndexIfExists('users', 'created_at');

        // Missions table indexes
        if (Schema::hasTable('missions')) {
            $this->dropIndexIfExists('missions', 'status');
            $this->dropIndexIfExists('missions', 'created_by');
            $this->dropIndexIfExists('missions', ['status', 'start_date']);
            $this->dropIndexIfExists('missions', ['status', 'end_date']);
            $this->dropIndexIfExists('missions', 'start_date');
            $this->dropIndexIfExists('missions', 'end_date');
            $this->dropIndexIfExists('missions', 'created_at');
        }

        // Applications table indexes
        if (Schema::hasTable('applications')) {
            $this->dropIndexIfExists('applications', 'user_id');
            $this->dropIndexIfExists('applications', 'mission_id');
            $this->dropIndexIfExists('applications', 'status');
            $this->dropIndexIfExists('applications', ['user_id', 'status']);
            $this->dropIndexIfExists('applications', ['mission_id', 'status']);
            $this->dropIndexIfExists('applications', 'created_at');
        }

        // Documents table indexes
        if (Schema::hasTable('documents')) {
            $this->dropIndexIfExists('documents', ['status', 'created_at']);
            $this->dropIndexIfExists('documents', 'created_at');
            $this->dropIndexIfExists('documents', 'mission_id');
            $this->dropIndexIfExists('documents', 'reviewed_by');
        }

        // Reports table indexes
        if (Schema::hasTable('reports')) {
            $this->dropIndexIfExists('reports', ['status', 'created_at']);
            $this->dropIndexIfExists('reports', 'created_at');
            $this->dropIndexIfExists('reports', 'vetted_by');
            $this->dropIndexIfExists('reports', 'approved_by');
            $this->dropIndexIfExists('reports', ['report_type', 'status']);
        }

        // Notifications table indexes
        if (Schema::hasTable('notifications')) {
            $this->dropIndexIfExists('notifications', 'type');
            $this->dropIndexIfExists('notifications', 'read_at');
        }

        // Messages table indexes
        if (Schema::hasTable('messages')) {
            $this->dropIndexIfExists('messages', 'created_at');
            $this->dropIndexIfExists('messages', 'is_edited');
        }

        // Conversations table indexes
        if (Schema::hasTable('conversations')) {
            $this->dropIndexIfExists('conversations', 'type');
        }

        // Conversation user pivot table indexes
        if (Schema::hasTable('conversation_user')) {
            $this->dropIndexIfExists('conversation_user', 'last_read_at');
            $this->dropIndexIfExists('conversation_user', 'created_at');
        }

        // Events table indexes
        if (Schema::hasTable('events')) {
            $this->dropIndexIfExists('events', 'created_by');
            $this->dropIndexIfExists('events', 'start_date');
            $this->dropIndexIfExists('events', 'end_date');
            $this->dropIndexIfExists('events', ['start_date', 'end_date']);
            $this->dropIndexIfExists('events', 'created_at');
        }
    }

    /**
     * Add index if it doesn't exist
     */
    private function addIndexIfNotExists(string $table, string|array $columns): void
    {
        $columns = is_array($columns) ? $columns : [$columns];
        $indexName = $table . '_' . implode('_', $columns) . '_index';

        $exists = DB::select(
            "SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ?",
            [$table, $indexName]
        );

        if (empty($exists)) {
            Schema::table($table, function (Blueprint $table) use ($columns) {
                $table->index($columns);
            });
        }
    }

    /**
     * Drop index if it exists
     */
    private function dropIndexIfExists(string $table, string|array $columns): void
    {
        $columns = is_array($columns) ? $columns : [$columns];
        $indexName = $table . '_' . implode('_', $columns) . '_index';

        $exists = DB::select(
            "SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ?",
            [$table, $indexName]
        );

        if (!empty($exists)) {
            Schema::table($table, function (Blueprint $table) use ($columns) {
                $table->dropIndex($columns);
            });
        }
    }
};
