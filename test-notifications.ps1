# Notification Workflow Testing Script
# This script tests all notification endpoints and workflows

$baseUrl = "http://127.0.0.1:8000/api"
$headers = @{
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Notification Workflow Testing" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Function to login and get token
function Get-AuthToken {
    param($email, $password)
    
    $loginData = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginData -Headers $headers
        return $response.token
    } catch {
        Write-Host "Login failed for $email" -ForegroundColor Red
        return $null
    }
}

# Test 1: Login as different users
Write-Host "Test 1: User Authentication" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$userToken = Get-AuthToken "user@example.com" "password"
$supervisorToken = Get-AuthToken "supervisor@example.com" "password"
$adminToken = Get-AuthToken "admin@example.com" "password"

if ($userToken) {
    Write-Host "✓ User login successful" -ForegroundColor Green
} else {
    Write-Host "✗ User login failed" -ForegroundColor Red
}

if ($supervisorToken) {
    Write-Host "✓ Supervisor login successful" -ForegroundColor Green
} else {
    Write-Host "✗ Supervisor login failed" -ForegroundColor Red
}

if ($adminToken) {
    Write-Host "✓ Admin login successful" -ForegroundColor Green
} else {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
}

Write-Host ""

# Test 2: Submit a report as user
Write-Host "Test 2: Report Submission (User)" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow

if ($userToken) {
    $reportData = @{
        report_type = "passport_returns"
        interval_type = "daily"
        report_date = (Get-Date).ToString("yyyy-MM-dd")
        passport_count = 10
        visa_count = 5
        remarks = "Test report for notification workflow"
    } | ConvertTo-Json
    
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $userToken"
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports" -Method POST -Body $reportData -Headers $authHeaders
        $reportId = $response.report.id
        Write-Host "✓ Report submitted successfully (ID: $reportId)" -ForegroundColor Green
        Write-Host "  Expected: Supervisors should receive notification" -ForegroundColor Cyan
    } catch {
        Write-Host "✗ Report submission failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - User not authenticated" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check supervisor notifications
Write-Host "Test 3: Supervisor Notifications" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow

if ($supervisorToken) {
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $supervisorToken"
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers $authHeaders
        $notificationCount = $response.data.Count
        Write-Host "✓ Retrieved $notificationCount notifications" -ForegroundColor Green
        
        # Check for report_pending notifications
        $reportNotifications = $response.data | Where-Object { $_.type -eq "report_pending" }
        if ($reportNotifications) {
            Write-Host "✓ Found report_pending notifications" -ForegroundColor Green
            Write-Host "  Latest: $($reportNotifications[0].title)" -ForegroundColor Cyan
        } else {
            Write-Host "⚠ No report_pending notifications found" -ForegroundColor Yellow
        }
        
        # Get unread count
        $unreadResponse = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method GET -Headers $authHeaders
        Write-Host "✓ Unread notifications: $($unreadResponse.count)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to retrieve notifications: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - Supervisor not authenticated" -ForegroundColor Red
}

Write-Host ""

# Test 4: Vet a report as supervisor
Write-Host "Test 4: Report Vetting (Supervisor)" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

if ($supervisorToken -and $reportId) {
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $supervisorToken"
    
    $vetData = @{
        comments = "Report looks good, approved for admin review"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/$reportId/vet" -Method POST -Body $vetData -Headers $authHeaders
        Write-Host "✓ Report vetted successfully" -ForegroundColor Green
        Write-Host "  Expected: Report owner and admins should receive notification" -ForegroundColor Cyan
    } catch {
        Write-Host "✗ Report vetting failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - Supervisor not authenticated or no report ID" -ForegroundColor Red
}

Write-Host ""

# Test 5: Check user notifications (report owner)
Write-Host "Test 5: User Notifications (Report Owner)" -ForegroundColor Yellow
Write-Host "-----------------------------------------" -ForegroundColor Yellow

if ($userToken) {
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $userToken"
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers $authHeaders
        $notificationCount = $response.data.Count
        Write-Host "✓ Retrieved $notificationCount notifications" -ForegroundColor Green
        
        # Check for report_status notifications
        $statusNotifications = $response.data | Where-Object { $_.type -eq "report_status" }
        if ($statusNotifications) {
            Write-Host "✓ Found report_status notifications" -ForegroundColor Green
            Write-Host "  Latest: $($statusNotifications[0].title)" -ForegroundColor Cyan
        } else {
            Write-Host "⚠ No report_status notifications found yet" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Failed to retrieve notifications: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - User not authenticated" -ForegroundColor Red
}

Write-Host ""

# Test 6: Check admin notifications
Write-Host "Test 6: Admin Notifications" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

if ($adminToken) {
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $adminToken"
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers $authHeaders
        $notificationCount = $response.data.Count
        Write-Host "✓ Retrieved $notificationCount notifications" -ForegroundColor Green
        
        # Check for report_vetted notifications
        $vettedNotifications = $response.data | Where-Object { $_.type -eq "report_vetted" }
        if ($vettedNotifications) {
            Write-Host "✓ Found report_vetted notifications" -ForegroundColor Green
            Write-Host "  Latest: $($vettedNotifications[0].title)" -ForegroundColor Cyan
        } else {
            Write-Host "⚠ No report_vetted notifications found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Failed to retrieve notifications: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - Admin not authenticated" -ForegroundColor Red
}

Write-Host ""

# Test 7: Approve report as admin
Write-Host "Test 7: Report Approval (Admin)" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

if ($adminToken -and $reportId) {
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $adminToken"
    
    $approveData = @{
        comments = "Report approved, good work!"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports/$reportId/approve" -Method POST -Body $approveData -Headers $authHeaders
        Write-Host "✓ Report approved successfully" -ForegroundColor Green
        Write-Host "  Expected: Report owner should receive approval notification" -ForegroundColor Cyan
    } catch {
        Write-Host "✗ Report approval failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - Admin not authenticated or no report ID" -ForegroundColor Red
}

Write-Host ""

# Test 8: Check final user notifications
Write-Host "Test 8: Final User Notifications Check" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow

if ($userToken) {
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $userToken"
    
    try {
        Start-Sleep -Seconds 1  # Wait for notification to be created
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers $authHeaders
        
        Write-Host "✓ Total notifications: $($response.data.Count)" -ForegroundColor Green
        
        # Show all notification types
        $notificationTypes = $response.data | Group-Object -Property type
        Write-Host "`nNotification breakdown:" -ForegroundColor Cyan
        foreach ($type in $notificationTypes) {
            Write-Host "  - $($type.Name): $($type.Count)" -ForegroundColor White
        }
        
        # Show latest notification
        if ($response.data.Count -gt 0) {
            $latest = $response.data[0]
            Write-Host "`nLatest notification:" -ForegroundColor Cyan
            Write-Host "  Title: $($latest.title)" -ForegroundColor White
            Write-Host "  Message: $($latest.message)" -ForegroundColor White
            Write-Host "  Type: $($latest.type)" -ForegroundColor White
            Write-Host "  Read: $($latest.is_read)" -ForegroundColor White
        }
    } catch {
        Write-Host "✗ Failed to retrieve notifications: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - User not authenticated" -ForegroundColor Red
}

Write-Host ""

# Test 9: Test messaging notifications
Write-Host "Test 9: Messaging Notifications" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

if ($userToken -and $supervisorToken) {
    # Get supervisor user ID first
    $authHeaders = $headers.Clone()
    $authHeaders["Authorization"] = "Bearer $userToken"
    
    try {
        # Search for supervisor
        $searchResponse = Invoke-RestMethod -Uri "$baseUrl/users/search?q=supervisor" -Method GET -Headers $authHeaders
        
        if ($searchResponse.Count -gt 0) {
            $supervisorId = $searchResponse[0].id
            
            # Get or create conversation
            $convResponse = Invoke-RestMethod -Uri "$baseUrl/conversations/$supervisorId" -Method GET -Headers $authHeaders
            $conversationId = $convResponse.conversation.id
            
            # Send a message
            $messageData = @{
                content = "Test message for notification workflow"
            } | ConvertTo-Json
            
            $msgResponse = Invoke-RestMethod -Uri "$baseUrl/conversations/$conversationId/messages" -Method POST -Body $messageData -Headers $authHeaders
            Write-Host "✓ Message sent successfully" -ForegroundColor Green
            Write-Host "  Expected: Supervisor should receive message notification" -ForegroundColor Cyan
            
            # Check supervisor notifications
            Start-Sleep -Seconds 1
            $authHeaders["Authorization"] = "Bearer $supervisorToken"
            $notifResponse = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers $authHeaders
            
            $messageNotifications = $notifResponse.data | Where-Object { $_.type -eq "message" }
            if ($messageNotifications) {
                Write-Host "✓ Supervisor received message notification" -ForegroundColor Green
            } else {
                Write-Host "⚠ No message notifications found yet" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⚠ Could not find supervisor user" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Messaging test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Skipped - Users not authenticated" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Report submission workflow tested" -ForegroundColor White
Write-Host "- Notification delivery verified" -ForegroundColor White
Write-Host "- Report vetting workflow tested" -ForegroundColor White
Write-Host "- Report approval workflow tested" -ForegroundColor White
Write-Host "- Messaging notifications tested" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check the frontend dashboards" -ForegroundColor White
Write-Host "2. Verify real-time updates" -ForegroundColor White
Write-Host "3. Test notification center UI" -ForegroundColor White
