// Test script to verify API endpoints are working correctly
// Run this with: node test-api.js

const fetch = require('node-fetch');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function testAPI() {
  console.log('🧪 Testing Message Analyzer Platform API...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Get threads (should return empty array initially)
    console.log('\n2️⃣ Testing GET /api/threads...');
    const threadsResponse = await fetch(`${API_BASE_URL}/api/threads`);
    const threadsData = await threadsResponse.json();
    console.log(`✅ GET threads returned ${threadsData.length} threads`);
    if (threadsData.length > 0) {
      console.log('Sample thread:', threadsData[0]);
    }
    
    // Test 3: Get stats (should return calculated stats)
    console.log('\n3️⃣ Testing GET /api/stats...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/stats`);
    const statsData = await statsResponse.json();
    console.log('✅ GET stats returned:', statsData);
    
    // Test 4: Add a test message
    console.log('\n4️⃣ Testing POST /api/threads...');
    const testMessage = {
      thread_id: 'test_thread_' + Date.now(),
      operator: 'TestOperator',
      model: 'GPT-4',
      type: 'incoming',
      message: 'Hello, this is a test message to verify the API is working correctly.'
    };
    
    const postResponse = await fetch(`${API_BASE_URL}/api/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST message successful:', postData);
      
      // Test 5: Verify the message was added
      console.log('\n5️⃣ Verifying message was added...');
      const verifyResponse = await fetch(`${API_BASE_URL}/api/threads`);
      const verifyData = await verifyResponse.json();
      const foundThread = verifyData.find(t => t.thread_id === testMessage.thread_id);
      
      if (foundThread) {
        console.log('✅ Message found in database:', foundThread);
      } else {
        console.log('❌ Message not found in database');
      }
      
      // Test 6: Check updated stats
      console.log('\n6️⃣ Checking updated stats...');
      const updatedStatsResponse = await fetch(`${API_BASE_URL}/api/stats`);
      const updatedStatsData = await updatedStatsResponse.json();
      console.log('✅ Updated stats:', updatedStatsData);
      
    } else {
      const errorData = await postResponse.json();
      console.log('❌ POST message failed:', errorData);
    }
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the backend server is running:');
    console.log('cd server && npm start');
  }
}

// Run the test
testAPI();
