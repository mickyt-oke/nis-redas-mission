<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::forUser(Auth::id())
            ->orderBy('created_at', 'desc');

        // Filter by read/unread
        if ($request->has('filter')) {
            if ($request->filter === 'unread') {
                $query->unread();
            } elseif ($request->filter === 'read') {
                $query->read();
            }
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $notifications = $query->paginate($request->get('per_page', 20));

        return response()->json($notifications);
    }

    /**
     * Get unread notification count
     */
    public function unreadCount(): JsonResponse
    {
        $count = Notification::forUser(Auth::id())
            ->unread()
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        // Ensure the notification belongs to the authenticated user
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read',
            'notification' => $notification
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        $updated = Notification::forUser(Auth::id())
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
            'count' => $updated
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Notification $notification): JsonResponse
    {
        // Ensure the notification belongs to the authenticated user
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * Delete all read notifications
     */
    public function deleteAllRead(): JsonResponse
    {
        $deleted = Notification::forUser(Auth::id())
            ->read()
            ->delete();

        return response()->json([
            'message' => 'All read notifications deleted',
            'count' => $deleted
        ]);
    }

    /**
     * Create a notification (for testing or admin use)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'action_url' => 'nullable|string',
        ]);

        $notification = Notification::create($validated);

        return response()->json([
            'message' => 'Notification created',
            'notification' => $notification
        ], 201);
    }

    /**
     * Broadcast a notification to multiple users
     */
    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'type' => 'required|string',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'action_url' => 'nullable|string',
        ]);

        $notifications = [];
        foreach ($validated['user_ids'] as $userId) {
            $notifications[] = Notification::create([
                'user_id' => $userId,
                'type' => $validated['type'],
                'title' => $validated['title'],
                'message' => $validated['message'],
                'action_url' => $validated['action_url'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Notifications broadcasted',
            'count' => count($notifications)
        ], 201);
    }

    /**
     * Helper method to create notification for report status change
     */
    public static function notifyReportStatusChange($report, $action, $performedBy)
    {
        $titles = [
            'submitted' => 'New Report Submitted',
            'vetted' => 'Report Vetted',
            'approved' => 'Report Approved',
            'rejected' => 'Report Rejected',
        ];

        $messages = [
            'submitted' => "A new {$report->report_type_label} report has been submitted by {$performedBy->first_name} {$performedBy->last_name}.",
            'vetted' => "Your {$report->report_type_label} report has been vetted by {$performedBy->first_name} {$performedBy->last_name}.",
            'approved' => "Your {$report->report_type_label} report has been approved by {$performedBy->first_name} {$performedBy->last_name}.",
            'rejected' => "Your {$report->report_type_label} report has been rejected by {$performedBy->first_name} {$performedBy->last_name}.",
        ];

        // Notify report owner
        if ($action !== 'submitted') {
            Notification::create([
                'user_id' => $report->user_id,
                'type' => 'report_status',
                'title' => $titles[$action],
                'message' => $messages[$action],
                'action_url' => '/reporting',
            ]);
        }

        // Notify supervisors when report is submitted
        if ($action === 'submitted') {
            $supervisors = User::whereIn('role', ['supervisor', 'admin', 'super_admin'])->get();
            foreach ($supervisors as $supervisor) {
                Notification::create([
                    'user_id' => $supervisor->id,
                    'type' => 'report_pending',
                    'title' => $titles[$action],
                    'message' => $messages[$action],
                    'action_url' => '/reporting',
                ]);
            }
        }

        // Notify admins when report is vetted
        if ($action === 'vetted') {
            $admins = User::whereIn('role', ['admin', 'super_admin'])->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'report_vetted',
                    'title' => 'Report Ready for Approval',
                    'message' => "A {$report->report_type_label} report has been vetted and is ready for approval.",
                    'action_url' => '/reporting',
                ]);
            }
        }
    }

    /**
     * Helper method to create notification for new message
     */
    public static function notifyNewMessage($message, $conversation, $sender)
    {
        // Get all participants except the sender
        $participants = $conversation->users()->where('user_id', '!=', $sender->id)->get();

        foreach ($participants as $participant) {
            Notification::create([
                'user_id' => $participant->id,
                'type' => 'message',
                'title' => 'New Message',
                'message' => "{$sender->first_name} {$sender->last_name} sent you a message: " . substr($message->content, 0, 50) . (strlen($message->content) > 50 ? '...' : ''),
                'action_url' => '/messages',
            ]);
        }
    }
}
