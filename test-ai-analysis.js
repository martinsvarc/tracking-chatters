#!/usr/bin/env node

/**
 * Test script for AI Analysis feature
 * Tests the POST /api/analyze endpoint and PUT /api/threads/:id endpoint
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const WEBHOOK_URL = 'https://n8n.automatedsolarbiz.com/webhook/b69cd496-1b6d-42f5-88c8-4af3697c2db8';

// Test data
const testFilters = {
  operators: ['Sarah', 'Emma'],
  models: ['GPT-4', 'GPT-3.5'],
  startDate: '2024-01-01',
  endDate: '2024-12-31'
};

const testAnalysisRequest = {
  filters: testFilters,
  numberOfChats: 5,
  threadDepth: 10
};

const testUpdateRequest = {
  acknowledgment_score: 85,
  affection_score: 92,
  personalization_score: 78
};

async function testAnalyzeEndpoint() {
  console.log('🧪 Testing POST /api/analyze endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAnalysisRequest)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Analyze endpoint test passed!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('❌ Analyze endpoint test failed!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Analyze endpoint test error:', error.message);
    return null;
  }
}

async function testUpdateEndpoint(threadId = 'test_thread_001') {
  console.log('🧪 Testing PUT /api/threads/:id endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/threads/${threadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUpdateRequest)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Update endpoint test passed!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('❌ Update endpoint test failed!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Update endpoint test error:', error.message);
    return null;
  }
}

async function testWebhookDirectly() {
  console.log('🧪 Testing webhook directly...');
  
  const testPayload = [
    {
      thread_id: 'test_thread_001',
      operator: 'Sarah',
      model: 'GPT-4',
      messages: [
        {
          type: 'incoming',
          message: 'Hello, I need help with my account',
          date: new Date().toISOString()
        },
        {
          type: 'outgoing',
          message: 'Hi! I\'d be happy to help you with your account. What seems to be the issue?',
          date: new Date().toISOString()
        }
      ],
      converted: 'Yes',
      last_message: new Date().toISOString(),
      avg_response_time: 45,
      responded: 'Yes'
    }
  ];
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      console.log('✅ Webhook test passed!');
      console.log('Status:', response.status);
      return true;
    } else {
      console.log('❌ Webhook test failed!');
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Analysis feature tests...\n');
  
  // Test 1: Analyze endpoint
  const analyzeResult = await testAnalyzeEndpoint();
  console.log('');
  
  // Test 2: Update endpoint
  const updateResult = await testUpdateEndpoint();
  console.log('');
  
  // Test 3: Webhook directly
  const webhookResult = await testWebhookDirectly();
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`- Analyze endpoint: ${analyzeResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Update endpoint: ${updateResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Webhook direct: ${webhookResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = analyzeResult && updateResult && webhookResult;
  console.log(`\n🎯 Overall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 AI Analysis feature is working correctly!');
    console.log('You can now:');
    console.log('1. Use the "Run AI Analysis" button in the modal');
    console.log('2. Update thread scores via PUT /api/threads/:id');
    console.log('3. The webhook will receive properly formatted data');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the server logs and configuration.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAnalyzeEndpoint,
  testUpdateEndpoint,
  testWebhookDirectly,
  runAllTests
};
