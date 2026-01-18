# API Testing Script for Reporting Feature

Write-Host "=== Testing Reporting API Endpoints ===" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://127.0.0.1:8000/api"

# Test 1: Login as User
Write-Host "Test 1: Login as User" -ForegroundColor Cyan
$loginBody = @{
    email = "user@example.com"
    password = "password"
} | ConvertTo-Json

try {
    $userResponse = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
    $userData = $userResponse.Content | ConvertFrom-Json
    $userToken = $userData.token
    Write-Host "[OK] User login successful" -ForegroundColor Green
    Write-Host "  Token: $($userToken.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] User login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: Create Report as User
Write-Host "`nTest 2: Create Report as User" -ForegroundColor Cyan
$reportBody = @{
    report_type = "passport_returns"
    interval_type = "daily"
    report_date = "2024-01-20"
    passport_count = 15
    visa_count = 10
    remarks = "Test daily report"
} | ConvertTo-Json

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/reports" -Method POST -Body $reportBody -ContentType 'application/json' -Headers @{Authorization="Bearer $userToken"} -UseBasicParsing
    $reportData = $createResponse.Content | ConvertFrom-Json
    $reportId = $reportData.report.id
    Write-Host "[OK] Report created successfully" -ForegroundColor Green
    Write-Host "  Report ID: $reportId" -ForegroundColor Gray
    Write-Host "  Status: $($reportData.report.status)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Report creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get Reports Statistics as User
Write-Host "`nTest 3: Get Reports Statistics" -ForegroundColor Cyan
try {
    $statsResponse = Invoke-WebRequest -Uri "$baseUrl/reports/statistics" -Method GET -Headers @{Authorization="Bearer $userToken"} -UseBasicParsing
    $stats = $statsResponse.Content | ConvertFrom-Json
    Write-Host "[OK] Statistics retrieved successfully" -ForegroundColor Green
    Write-Host "  Total: $($stats.total)" -ForegroundColor Gray
    Write-Host "  Pending: $($stats.pending)" -ForegroundColor Gray
    Write-Host "  Vetted: $($stats.vetted)" -ForegroundColor Gray
    Write-Host "  Approved: $($stats.approved)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Statistics retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Reports List as User
Write-Host "`nTest 4: Get Reports List" -ForegroundColor Cyan
try {
    $listResponse = Invoke-WebRequest -Uri "$baseUrl/reports" -Method GET -Headers @{Authorization="Bearer $userToken"} -UseBasicParsing
    $reports = $listResponse.Content | ConvertFrom-Json
    Write-Host "[OK] Reports list retrieved successfully" -ForegroundColor Green
    Write-Host "  Count: $($reports.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Reports list retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Login as Supervisor
Write-Host "`nTest 5: Login as Supervisor" -ForegroundColor Cyan
$supervisorLoginBody = @{
    email = "supervisor@example.com"
    password = "password"
} | ConvertTo-Json

try {
    $supervisorResponse = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -Body $supervisorLoginBody -ContentType 'application/json' -UseBasicParsing
    $supervisorData = $supervisorResponse.Content | ConvertFrom-Json
    $supervisorToken = $supervisorData.token
    Write-Host "[OK] Supervisor login successful" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Supervisor login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Vet Report as Supervisor
if ($reportId) {
    Write-Host "`nTest 6: Vet Report as Supervisor" -ForegroundColor Cyan
    $vetBody = @{
        comments = "Report looks good, vetted successfully"
    } | ConvertTo-Json

    try {
        $vetResponse = Invoke-WebRequest -Uri "$baseUrl/reports/$reportId/vet" -Method POST -Body $vetBody -ContentType 'application/json' -Headers @{Authorization="Bearer $supervisorToken"} -UseBasicParsing
        $vettedReport = $vetResponse.Content | ConvertFrom-Json
        Write-Host "[OK] Report vetted successfully" -ForegroundColor Green
        Write-Host "  Status: $($vettedReport.report.status)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Report vetting failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 7: Login as Admin
Write-Host "`nTest 7: Login as Admin" -ForegroundColor Cyan
$adminLoginBody = @{
    email = "admin@example.com"
    password = "password"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -Body $adminLoginBody -ContentType 'application/json' -UseBasicParsing
    $adminData = $adminResponse.Content | ConvertFrom-Json
    $adminToken = $adminData.token
    Write-Host "[OK] Admin login successful" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Approve Report as Admin
if ($reportId) {
    Write-Host "`nTest 8: Approve Report as Admin" -ForegroundColor Cyan
    $approveBody = @{
        comments = "Report approved, all data verified"
    } | ConvertTo-Json

    try {
        $approveResponse = Invoke-WebRequest -Uri "$baseUrl/reports/$reportId/approve" -Method POST -Body $approveBody -ContentType 'application/json' -Headers @{Authorization="Bearer $adminToken"} -UseBasicParsing
        $approvedReport = $approveResponse.Content | ConvertFrom-Json
        Write-Host "[OK] Report approved successfully" -ForegroundColor Green
        Write-Host "  Status: $($approvedReport.report.status)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Report approval failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 9: Test Validation - Missing Required Fields
Write-Host "`nTest 9: Test Validation - Missing Required Fields" -ForegroundColor Cyan
$invalidBody = @{
    report_type = "passport_returns"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-WebRequest -Uri "$baseUrl/reports" -Method POST -Body $invalidBody -ContentType 'application/json' -Headers @{Authorization="Bearer $userToken"} -UseBasicParsing
    Write-Host "[FAIL] Validation should have failed but did not" -ForegroundColor Red
} catch {
    Write-Host "[OK] Validation correctly rejected invalid data" -ForegroundColor Green
}

# Test 10: Test Authorization - User trying to vet
Write-Host "`nTest 10: Test Authorization - User trying to vet" -ForegroundColor Cyan
if ($reportId) {
    $vetBody = @{
        comments = "Trying to vet as user"
    } | ConvertTo-Json

    try {
        $unauthorizedResponse = Invoke-WebRequest -Uri "$baseUrl/reports/$reportId/vet" -Method POST -Body $vetBody -ContentType 'application/json' -Headers @{Authorization="Bearer $userToken"} -UseBasicParsing
        Write-Host "[FAIL] Authorization should have failed but did not" -ForegroundColor Red
    } catch {
        Write-Host "[OK] Authorization correctly prevented user from vetting" -ForegroundColor Green
    }
}

Write-Host "`n=== API Testing Complete ===" -ForegroundColor Green
