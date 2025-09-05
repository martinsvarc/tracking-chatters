# Test script for AI Analysis feature using PowerShell
# Make sure the server is running before executing this script

$API_BASE_URL = "http://localhost:5000"
$WEBHOOK_URL = "https://n8n.automatedsolarbiz.com/webhook/b69cd496-1b6d-42f5-88c8-4af3697c2db8"

Write-Host "🧪 Testing AI Analysis feature with PowerShell..." -ForegroundColor Cyan
Write-Host ""

# Test 1: POST /api/analyze
Write-Host "1. Testing POST /api/analyze endpoint..." -ForegroundColor Yellow
try {
    $analyzeBody = @{
        filters = @{
            operators = @("Sarah", "Emma")
            models = @("GPT-4", "GPT-3.5")
            startDate = "2024-01-01"
            endDate = "2024-12-31"
        }
        numberOfChats = 5
        threadDepth = 10
    } | ConvertTo-Json -Depth 3

    $analyzeResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/analyze" -Method POST -Body $analyzeBody -ContentType "application/json"
    Write-Host "✅ Analyze endpoint test passed!" -ForegroundColor Green
    Write-Host "Response: $($analyzeResponse | ConvertTo-Json -Depth 3)" -ForegroundColor White
} catch {
    Write-Host "❌ Analyze endpoint test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Test 2: PUT /api/threads/:id
Write-Host "2. Testing PUT /api/threads/:id endpoint..." -ForegroundColor Yellow
try {
    $updateBody = @{
        acknowledgment_score = 85
        affection_score = 92
        personalization_score = 78
    } | ConvertTo-Json

    $updateResponse = Invoke-RestMethod -Uri "$API_BASE_URL/api/threads/test_thread_001" -Method PUT -Body $updateBody -ContentType "application/json"
    Write-Host "✅ Update endpoint test passed!" -ForegroundColor Green
    Write-Host "Response: $($updateResponse | ConvertTo-Json -Depth 3)" -ForegroundColor White
} catch {
    Write-Host "❌ Update endpoint test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Test 3: Direct webhook test
Write-Host "3. Testing webhook directly..." -ForegroundColor Yellow
try {
    $webhookBody = @(
        @{
            thread_id = "test_thread_001"
            operator = "Sarah"
            model = "GPT-4"
            messages = @(
                @{
                    type = "incoming"
                    message = "Hello, I need help with my account"
                    date = "2024-01-15T14:30:00Z"
                },
                @{
                    type = "outgoing"
                    message = "Hi! I would be happy to help you with your account. What seems to be the issue?"
                    date = "2024-01-15T14:31:00Z"
                }
            )
            converted = "Yes"
            last_message = "2024-01-15T14:31:00Z"
            avg_response_time = 45
            responded = "Yes"
        }
    ) | ConvertTo-Json -Depth 4

    $webhookResponse = Invoke-RestMethod -Uri $WEBHOOK_URL -Method POST -Body $webhookBody -ContentType "application/json"
    Write-Host "✅ Webhook test passed!" -ForegroundColor Green
    Write-Host "Response: $($webhookResponse | ConvertTo-Json -Depth 3)" -ForegroundColor White
} catch {
    Write-Host "❌ Webhook test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected results:" -ForegroundColor White
Write-Host "- Analyze endpoint should return success with threadsAnalyzed count" -ForegroundColor Gray
Write-Host "- Update endpoint should return success with updated thread data" -ForegroundColor Gray
Write-Host "- Webhook should return 200 OK status" -ForegroundColor Gray
