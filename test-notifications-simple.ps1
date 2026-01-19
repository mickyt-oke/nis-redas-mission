# Notification Workflow Testing Script
$baseUrl = "http://127.0.0.1:8000/api"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Notification Workflow Testing" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Function to login
function Get-AuthToken {
    param($email, $password)
    
    $body = @{
        email = $email
        password = $password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $body -ContentType "application/json"
        return $response.token
    }
    catch {
        Write-Host "Login failed for $email : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Login
Write-Host "Test 1: User Authentication" -ForegroundColor Yellow
$userToken = Get-AuthToken "user@example.com" "password"
$supervisorToken = Get-AuthToken "supervisor@example.com" "password"
$adminToken = Get-AuthToken "admin@example.com" "password"

if ($userToken) { Write-Host "✓ User login successful" -ForegroundColor Green }
if ($supervisorToken) { Write-Host "✓ Supervisor login successful" -ForegroundColor Green }
if ($adminToken) { Write-Host "✓ Admin login successful" -ForegroundColor Green }
Write-Host ""

# Test 2: Submit Report
Write-Host "Test 2: Submit Report (User)" -ForegroundColor Yellow
if ($userToken) {
    $reportData = @{
        report_type = "passport_returns"
        interval_type = "daily"
        report_date = (Get-Date).ToString("yyyy-MM-dd")
        passport_count = 10
        visa_count = 5
        remarks = "Test report for notification"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reports" -Method POST -Body $reportData -ContentType "application/json" -Headers @{Authorization="Bearer $userToken"}
        $script:reportId = $response.report.id
        Write-Host "✓ Report submitted (ID: $($script:reportId))" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Check Supervisor Notifications
Write-Host "Test 3: Supervisor Notifications" -ForegroundColor Yellow
if ($supervisorToken) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers @{Authorization="Bearer $supervisorToken"}
        Write-Host "✓ Retrieved $($response.data.Count) notifications" -ForegroundColor Green
        
        $unread = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method GET -Headers @{Authorization="Bearer $supervisorToken"}
        Write-Host "✓ Unread count: $($unread.count)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Vet Report
Write-Host "Test 4: Vet Report (Supervisor)" -ForegroundColor Yellow
if ($supervisorToken -and $script:reportId) {
    $vetData = @{
        comments = "Looks good"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$baseUrl/reports/$($script:reportId)/vet" -Method POST -Body $vetData -ContentType "application/json" -Headers @{Authorization="Bearer $supervisorToken"}
        Write-Host "✓ Report vetted successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Check User Notifications
Write-Host "Test 5: User Notifications" -ForegroundColor Yellow
if ($userToken) {
    try {
        Start-Sleep -Seconds 1
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers @{Authorization="Bearer $userToken"}
        Write-Host "✓ User has $($response.data.Count) notifications" -ForegroundColor Green
        
        if ($response.data.Count -gt 0) {
            Write-Host "  Latest: $($response.data[0].title)" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Check Admin Notifications
Write-Host "Test 6: Admin Notifications" -ForegroundColor Yellow
if ($adminToken) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers @{Authorization="Bearer $adminToken"}
        Write-Host "✓ Admin has $($response.data.Count) notifications" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 7: Approve Report
Write-Host "Test 7: Approve Report (Admin)" -ForegroundColor Yellow
if ($adminToken -and $script:reportId) {
    $approveData = @{
        comments = "Approved!"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$baseUrl/reports/$($script:reportId)/approve" -Method POST -Body $approveData -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"}
        Write-Host "✓ Report approved successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 8: Final Check
Write-Host "Test 8: Final Notification Check" -ForegroundColor Yellow
if ($userToken) {
    try {
        Start-Sleep -Seconds 1
        $response = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET -Headers @{Authorization="Bearer $userToken"}
        Write-Host "✓ Final count: $($response.data.Count) notifications" -ForegroundColor Green
        
        $types = $response.data | Group-Object -Property type
        foreach ($type in $types) {
            Write-Host "  - $($type.Name): $($type.Count)" -ForegroundColor White
        }
    }
    catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
