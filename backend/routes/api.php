<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\EventController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication routes with strict rate limiting
Route::middleware(['throttle.auth'])->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

// Protected routes with authentication
Route::middleware('auth:sanctum')->group(function () {
    // Auth endpoints
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/me', [AuthController::class, 'me'])->name('me');

    // Read-heavy endpoints (GET requests) with caching
    Route::middleware(['throttle.read', 'cache.response:5'])->group(function () {
        // Missions - Read
        Route::get('/missions', [MissionController::class, 'index'])->name('missions.index');
        Route::get('/missions/{mission}', [MissionController::class, 'show'])->name('missions.show');
        Route::get('/mission-staff', [MissionController::class, 'getMissionStaff'])->name('missions.staff');

        // Applications - Read
        Route::get('/applications', [ApplicationController::class, 'index'])->name('applications.index');
        Route::get('/applications/{application}', [ApplicationController::class, 'show'])->name('applications.show');

        // Users - Read
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::get('/users/search', [MessageController::class, 'searchUsers'])->name('users.search');

        // Documents - Read
        Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
        Route::get('/documents/statistics', [DocumentController::class, 'statistics'])->name('documents.statistics');
        Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');

        // Reports - Read
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/statistics', [ReportController::class, 'statistics'])->name('reports.statistics');
        Route::get('/reports/{report}', [ReportController::class, 'show'])->name('reports.show');

        // Notifications - Read
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');

        // Messages - Read
        Route::get('/conversations', [MessageController::class, 'getConversations'])->name('conversations.index');
        Route::get('/conversations/{userId}', [MessageController::class, 'getOrCreateConversation'])->name('conversations.show');
        Route::get('/conversations/{conversation}/messages', [MessageController::class, 'getMessages'])->name('conversations.messages');
        Route::get('/messages/unread-count', [MessageController::class, 'getUnreadCount'])->name('messages.unread-count');

        // Events - Read
        Route::get('/events', [EventController::class, 'index'])->name('events.index');
        Route::get('/events/upcoming', [EventController::class, 'upcoming'])->name('events.upcoming');
        Route::get('/events/statistics', [EventController::class, 'statistics'])->name('events.statistics');
        Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
    });

    // Write operations (POST/PUT/DELETE)
    Route::middleware(['throttle.write'])->group(function () {
        // Missions - Write
        Route::post('/missions', [MissionController::class, 'store'])->name('missions.store');
        Route::put('/missions/{mission}', [MissionController::class, 'update'])->name('missions.update');
        Route::delete('/missions/{mission}', [MissionController::class, 'destroy'])->name('missions.destroy');
        Route::post('/missions/{mission}/staff', [MissionController::class, 'addStaff'])->name('missions.staff.add');
        Route::delete('/missions/{mission}/staff', [MissionController::class, 'removeStaff'])->name('missions.staff.remove');

        // Applications - Write
        Route::post('/applications', [ApplicationController::class, 'store'])->name('applications.store');
        Route::put('/applications/{application}', [ApplicationController::class, 'update'])->name('applications.update');
        Route::post('/applications/{application}/submit', [ApplicationController::class, 'submit'])->name('applications.submit');
        Route::post('/applications/{application}/review', [ApplicationController::class, 'review'])->name('applications.review');
        Route::delete('/applications/{application}', [ApplicationController::class, 'destroy'])->name('applications.destroy');

        // Users - Write
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::put('/users/{user}/role', [UserController::class, 'updateRole'])->name('users.update-role');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Documents - Approve/Reject
        Route::post('/documents/{document}/approve', [DocumentController::class, 'approve'])->name('documents.approve');
        Route::post('/documents/{document}/reject', [DocumentController::class, 'reject'])->name('documents.reject');
        Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

        // Reports - Write
        Route::put('/reports/{report}', [ReportController::class, 'update'])->name('reports.update');
        Route::post('/reports/{report}/vet', [ReportController::class, 'vet'])->name('reports.vet');
        Route::post('/reports/{report}/approve', [ReportController::class, 'approve'])->name('reports.approve');
        Route::post('/reports/{report}/reject', [ReportController::class, 'reject'])->name('reports.reject');
        Route::delete('/reports/{report}', [ReportController::class, 'destroy'])->name('reports.destroy');

        // Notifications - Write
        Route::post('/notifications', [NotificationController::class, 'store'])->name('notifications.store');
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
        Route::post('/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('/notifications/read/all', [NotificationController::class, 'deleteAllRead'])->name('notifications.delete-all-read');

        // Messages - Write
        Route::post('/conversations/{conversation}/messages', [MessageController::class, 'sendMessage'])->name('messages.send');
        Route::put('/messages/{message}', [MessageController::class, 'updateMessage'])->name('messages.update');
        Route::delete('/messages/{message}', [MessageController::class, 'deleteMessage'])->name('messages.delete');
        Route::post('/conversations/{conversation}/mark-read', [MessageController::class, 'markAsRead'])->name('conversations.mark-read');

        // Events - Write
        Route::post('/events', [EventController::class, 'store'])->name('events.store');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('events.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
    });

    // Heavy operations with stricter limits
    Route::middleware(['throttle.heavy'])->group(function () {
        // Document uploads and downloads
        Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
        Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');

        // Report creation
        Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');

        // Broadcast notifications
        Route::post('/notifications/broadcast', [NotificationController::class, 'broadcast'])->name('notifications.broadcast');
    });
});
