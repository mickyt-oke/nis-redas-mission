<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'report_type',
        'interval_type',
        'report_date',
        'passport_count',
        'visa_count',
        'remarks',
        'status',
        'vetted_by',
        'vetted_at',
        'vet_comments',
        'approved_by',
        'approved_at',
        'approval_comments',
    ];

    protected $casts = [
        'report_date' => 'date',
        'vetted_at' => 'datetime',
        'approved_at' => 'datetime',
        'passport_count' => 'integer',
        'visa_count' => 'integer',
    ];

    protected $appends = [
        'status_label',
        'interval_label',
        'report_type_label',
    ];

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vetter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vetted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scopes
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeIntervalType($query, $intervalType)
    {
        return $query->where('interval_type', $intervalType);
    }

    public function scopeReportType($query, $reportType)
    {
        return $query->where('report_type', $reportType);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('report_date', [$startDate, $endDate]);
    }

    /**
     * Helper methods
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isVetted(): bool
    {
        return $this->status === 'vetted';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function canBeVetted(): bool
    {
        return $this->isPending();
    }

    public function canBeApproved(): bool
    {
        return $this->isVetted();
    }

    public function canBeEdited(): bool
    {
        return $this->isPending();
    }

    public function canBeDeleted(): bool
    {
        return $this->isPending();
    }

    /**
     * Accessors
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending Review',
            'vetted' => 'Vetted',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            default => ucfirst($this->status),
        };
    }

    public function getIntervalLabelAttribute(): string
    {
        return match($this->interval_type) {
            'daily' => 'Daily',
            'monthly' => 'Monthly',
            'quarterly' => 'Quarterly',
            default => ucfirst($this->interval_type),
        };
    }

    public function getReportTypeLabelAttribute(): string
    {
        return match($this->report_type) {
            'passport_returns' => 'Passport Returns',
            'visa_returns' => 'Visa Returns',
            default => ucfirst(str_replace('_', ' ', $this->report_type)),
        };
    }
}
