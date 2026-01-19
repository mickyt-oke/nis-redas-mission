# Simple API Test Script
$baseUrl = "http://127.0.0.1:8000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "API & Notification Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Login as User
Write-Host "Test 1: Login as User" -ForegroundColor Yellow
$loginBody = '{"email":"user@example.com","password":"password"}'
try {
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json"
    $userToken = $userResponse.token
    Write-Host "SUCCESS: User logged in" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: Login as Supervisor
Write-Host "`nTest 2: Login as Supervisor" -ForegroundColor Yellow
$loginBody = '{"email":"supervisor@example.com","password":"password"}'
try {
    $supResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json"
    $supToken = $supResponse.token
    Write-Host "SUCCESS: Supervisor logged in" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Login as Admin
Write-Host "`nTest 3: Login as Admin" -ForegroundColor Yellow
$loginBody = '{"email":"admin@example.com","password":"password"}'
try {
    $adminResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json"
    $adminToken = $adminResponse.token
    Write-Host "SUCCESS: Admin logged in" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Submit Report
Write-Host "`nTest 4: Submit Report" -ForegroundColor Yellow
$reportBody = @"
{
    "report_type": "passport_returns",
    "interval_type": "daily",
    "report_date": "2024-01-15",
    "passport_count": 10,
    "visa_count": 5,
    "remarks": "Test report"
}
"@
try {
    $reportResponse = Invoke-RestMethod -Uri "$baseUrl/reports" -Method POST -Body $reportBody -ContentType "application/json" -Headers @{Authorization="Bearer $userToken"}
    $reportId = $reportResponse.report.id
    Write-Host "SUCCESS: Report created (ID: $reportId)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check Supervisor Notifications
Write-Host "`nTest 5: Check Supervisor Notifications" -ForegroundColor Yellow
try {
    $notifResponse = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers @{Authorization="Bearer $supToken"}
    Write-Host "SUCCESS: Found $($notifResponse.data.Count) notifications" -ForegroundColor Green
    if ($notifResponse.data.Count -gt 0) {
        Write-Host "  Latest: $($notifResponse.data[0].title)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Unread Count
Write-Host "`nTest 6: Get Unread Count" -ForegroundColor Yellow
try {
    $unreadResponse = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method GET -Headers @{Authorization="Bearer $supToken"}
    Write-Host "SUCCESS: Unread count = $($unreadResponse.count)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Vet Report
if ($reportId) {
    Write-Host "`nTest 7: Vet Report" -ForegroundColor Yellow
    $vetBody = '{"comments":"Looks good"}'
    try {
        Invoke-RestMethod -Uri "$baseUrl/reports/$reportId/vet" -Method POST -Body $vetBody -ContentType "application/json" -Headers @{Authorization="Bearer $supToken"} | Out-Null
        Write-Host "SUCCESS: Report vetted" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 8: Check User Notifications
Write-Host "`nTest 8: Check User Notifications" -ForegroundColor Yellow
Start-Sleep -Seconds 1
try {
    $userNotifResponse = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers @{Authorization="Bearer $userToken"}
    Write-Host "SUCCESS: User has $($userNotifResponse.data.Count) notifications" -ForegroundColor Green
    if ($userNotifResponse.data.Count -gt 0) {
        Write-Host "  Latest: $($userNotifResponse.data[0].title)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Approve Report
if ($reportId) {
    Write-Host "`nTest 9: Approve Report" -ForegroundColor Yellow
    $approveBody = '{"comments":"Approved"}'
    try {
        Invoke-RestMethod -Uri "$baseUrl/reports/$reportId/approve" -Method POST -Body $approveBody -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} | Out-Null
        Write-Host "SUCCESS: Report approved" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 10: Final Notification Check
Write-Host "`nTest 10: Final Notification Check" -ForegroundColor Yellow
Start-Sleep -Seconds 1
try {
    $finalResponse = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers @{Authorization="Bearer $userToken"}
    Write-Host "SUCCESS: User has $($finalResponse.data.Count) total notifications" -ForegroundColor Green
    
    $types = $finalResponse.data | Group-Object -Property type
    Write-Host "`nNotification Types:" -ForegroundColor Cyan
    foreach ($type in $types) {
        Write-Host "  $($type.Name): $($type.Count)" -ForegroundColor White
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
