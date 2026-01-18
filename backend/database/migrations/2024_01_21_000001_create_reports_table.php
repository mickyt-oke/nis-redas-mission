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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('report_type', ['passport_returns', 'visa_returns']);
            $table->enum('interval_type', ['daily', 'monthly', 'quarterly']);
            $table->date('report_date');
            $table->integer('passport_count')->nullable();
            $table->integer('visa_count')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['pending', 'vetted', 'approved', 'rejected'])->default('pending');
            
            // Vetting fields
            $table->foreignId('vetted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('vetted_at')->nullable();
            $table->text('vet_comments')->nullable();
            
            // Approval fields
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_comments')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            // Indexes for better query performance
            $table->index('user_id');
            $table->index('status');
            $table->index('interval_type');
            $table->index('report_type');
            $table->index('report_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
