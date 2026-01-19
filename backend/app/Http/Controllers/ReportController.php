<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\NotificationController;

class ReportController extends Controller
{
    /**
     * Display a listing of reports
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Report::with(['user', 'vetter', 'approver']);

        // Role-based filtering
        if ($user->hasRole('user')) {
            // Users only see their own reports
            $query->forUser($user->id);
        } elseif ($user->hasRole('supervisor')) {
            // Supervisors see pending and vetted reports (for vetting)
            // They can also see reports they've vetted
            $query->where(function($q) use ($user) {
                $q->whereIn('status', ['pending', 'vetted', 'approved', 'rejected'])
                  ->orWhere('vetted_by', $user->id);
            });
        }
        // Admins and super_admins see all reports

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->status($request->status);
        }

        // Filter by interval type
        if ($request->has('interval_type') && $request->interval_type !== 'all') {
            $query->intervalType($request->interval_type);
        }

        // Filter by report type
        if ($request->has('report_type') && $request->report_type !== 'all') {
            $query->reportType($request->report_type);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        // Search by remarks
        if ($request->has('search') && $request->search) {
            $query->where('remarks', 'like', '%' . $request->search . '%');
        }

        // Sort by report_date descending by default
        $reports = $query->orderBy('report_date', 'desc')
                        ->orderBy('created_at', 'desc')
                        ->paginate(15);

        return response()->json($reports);
    }

    /**
     * Store a newly created report
     */
    public function store(Request $request)
    {
        // Only users can submit reports
        if (!$request->user()->hasRole('user')) {
            return response()->json([
                'message' => 'Only users can submit reports.'
            ], 403);
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'report_type' => 'required|in:passport_returns,visa_returns',
            'interval_type' => 'required|in:daily,monthly,quarterly',
            'report_date' => 'required|date|before_or_equal:today',
            'passport_count' => 'nullable|integer|min:0',
            'visa_count' => 'nullable|integer|min:0',
            'remarks' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate that at least one count is provided
        if (!$request->passport_count && !$request->visa_count) {
            return response()->json([
                'message' => 'At least one of passport_count or visa_count must be provided',
                'errors' => [
                    'passport_count' => ['At least one count is required'],
                    'visa_count' => ['At least one count is required']
                ]
            ], 422);
        }

        try {
            // Create report
            $report = Report::create([
                'user_id' => $request->user()->id,
                'report_type' => $request->report_type,
                'interval_type' => $request->interval_type,
                'report_date' => $request->report_date,
                'passport_count' => $request->passport_count,
                'visa_count' => $request->visa_count,
                'remarks' => $request->remarks,
                'status' => 'pending',
            ]);

            // Send notification to supervisors
            NotificationController::notifyReportStatusChange($report, 'submitted', $request->user());

            return response()->json([
                'message' => 'Report submitted successfully',
                'report' => $report->load(['user', 'vetter', 'approver'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to submit report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified report
     */
    public function show(Request $request, Report $report)
    {
        $user = $request->user();

        // Check authorization
        if ($user->hasRole('user') && $report->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized to view this report'
            ], 403);
        }

        return response()->json([
            'report' => $report->load(['user', 'vetter', 'approver'])
        ]);
    }

    /**
     * Update the specified report (only pending reports by owner)
     */
    public function update(Request $request, Report $report)
    {
        // Check authorization
        if ($report->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized to update this report'
            ], 403);
        }

        // Only pending reports can be updated
        if (!$report->canBeEdited()) {
            return response()->json([
                'message' => 'Only pending reports can be updated'
            ], 403);
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'report_type' => 'sometimes|in:passport_returns,visa_returns',
            'interval_type' => 'sometimes|in:daily,monthly,quarterly',
            'report_date' => 'sometimes|date|before_or_equal:today',
            'passport_count' => 'nullable|integer|min:0',
            'visa_count' => 'nullable|integer|min:0',
            'remarks' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $report->update($request->only([
                'report_type',
                'interval_type',
                'report_date',
                'passport_count',
                'visa_count',
                'remarks'
            ]));

            return response()->json([
                'message' => 'Report updated successfully',
                'report' => $report->load(['user', 'vetter', 'approver'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified report
     */
    public function destroy(Request $request, Report $report)
    {
        // Check authorization
        if (!$request->user()->isAdmin() && $report->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized to delete this report'
            ], 403);
        }

        // Users can only delete pending reports
        if (!$request->user()->isAdmin() && !$report->canBeDeleted()) {
            return response()->json([
                'message' => 'Only pending reports can be deleted'
            ], 403);
        }

        try {
            $report->delete();

            return response()->json([
                'message' => 'Report deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vet a report (supervisors only)
     */
    public function vet(Request $request, Report $report)
    {
        // Check authorization
        if (!$request->user()->isSupervisor()) {
            return response()->json([
                'message' => 'Only supervisors can vet reports'
            ], 403);
        }

        // Only pending reports can be vetted
        if (!$report->canBeVetted()) {
            return response()->json([
                'message' => 'Only pending reports can be vetted'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'comments' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $report->update([
                'status' => 'vetted',
                'vetted_by' => $request->user()->id,
                'vetted_at' => now(),
                'vet_comments' => $request->comments,
            ]);

            // Send notifications
            NotificationController::notifyReportStatusChange($report, 'vetted', $request->user());

            return response()->json([
                'message' => 'Report vetted successfully',
                'report' => $report->load(['user', 'vetter', 'approver'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to vet report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a report (admins only)
     */
    public function approve(Request $request, Report $report)
    {
        // Check authorization
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Only admins can approve reports'
            ], 403);
        }

        // Only vetted reports can be approved
        if (!$report->canBeApproved()) {
            return response()->json([
                'message' => 'Only vetted reports can be approved'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'comments' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $report->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'approval_comments' => $request->comments,
            ]);

            // Send notification
            NotificationController::notifyReportStatusChange($report, 'approved', $request->user());

            return response()->json([
                'message' => 'Report approved successfully',
                'report' => $report->load(['user', 'vetter', 'approver'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a report (supervisors and admins)
     */
    public function reject(Request $request, Report $report)
    {
        // Check authorization
        if (!$request->user()->isSupervisor()) {
            return response()->json([
                'message' => 'Only supervisors and admins can reject reports'
            ], 403);
        }

        // Cannot reject already approved reports
        if ($report->isApproved()) {
            return response()->json([
                'message' => 'Approved reports cannot be rejected'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'comments' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [
                'status' => 'rejected',
            ];

            // If supervisor is rejecting
            if ($request->user()->hasRole('supervisor')) {
                $updateData['vetted_by'] = $request->user()->id;
                $updateData['vetted_at'] = now();
                $updateData['vet_comments'] = $request->comments;
            } 
            // If admin is rejecting
            else {
                $updateData['approved_by'] = $request->user()->id;
                $updateData['approved_at'] = now();
                $updateData['approval_comments'] = $request->comments;
            }

            $report->update($updateData);

            // Send notification
            NotificationController::notifyReportStatusChange($report, 'rejected', $request->user());

            return response()->json([
                'message' => 'Report rejected',
                'report' => $report->load(['user', 'vetter', 'approver'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get report statistics
     */
    public function statistics(Request $request)
    {
        $user = $request->user();
        
        $query = Report::query();

        // Filter based on role
        if ($user->hasRole('user')) {
            $query->forUser($user->id);
        }

        $stats = [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->status('pending')->count(),
            'vetted' => (clone $query)->status('vetted')->count(),
            'approved' => (clone $query)->status('approved')->count(),
            'rejected' => (clone $query)->status('rejected')->count(),
            'by_interval' => [
                'daily' => (clone $query)->intervalType('daily')->count(),
                'monthly' => (clone $query)->intervalType('monthly')->count(),
                'quarterly' => (clone $query)->intervalType('quarterly')->count(),
            ],
            'by_type' => [
                'passport_returns' => (clone $query)->reportType('passport_returns')->count(),
                'visa_returns' => (clone $query)->reportType('visa_returns')->count(),
            ],
        ];

        return response()->json($stats);
    }
}
