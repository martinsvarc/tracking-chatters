#!/bin/bash

# Test script for AI Analysis feature using curl
# Make sure the server is running before executing this script

API_BASE_URL="http://localhost:5000"
WEBHOOK_URL="https://n8n.automatedsolarbiz.com/webhook/b69cd496-1b6d-42f5-88c8-4af3697c2db8"

echo "🧪 Testing AI Analysis feature with curl..."
echo ""

# Test 1: POST /api/analyze
echo "1. Testing POST /api/analyze endpoint..."
curl -X POST "${API_BASE_URL}/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "operators": ["Sarah", "Emma"],
      "models": ["GPT-4", "GPT-3.5"],
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "numberOfChats": 5,
    "threadDepth": 10
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 2: PUT /api/threads/:id
echo "2. Testing PUT /api/threads/:id endpoint..."
curl -X PUT "${API_BASE_URL}/api/threads/test_thread_001" \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledgment_score": 85,
    "affection_score": 92,
    "personalization_score": 78
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 3: Direct webhook test
echo "3. Testing webhook directly..."
curl -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "thread_id": "test_thread_001",
      "operator": "Sarah",
      "model": "GPT-4",
      "messages": [
        {
          "type": "incoming",
          "message": "Hello, I need help with my account",
          "date": "2024-01-15T14:30:00Z"
        },
        {
          "type": "outgoing",
          "message": "Hi! I would be happy to help you with your account. What seems to be the issue?",
          "date": "2024-01-15T14:31:00Z"
        }
      ],
      "converted": "Yes",
      "last_message": "2024-01-15T14:31:00Z",
      "avg_response_time": 45,
      "responded": "Yes"
    }
  ]' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ All tests completed!"
echo ""
echo "Expected results:"
echo "- Analyze endpoint should return success with threadsAnalyzed count"
echo "- Update endpoint should return success with updated thread data"
echo "- Webhook should return 200 OK status"
