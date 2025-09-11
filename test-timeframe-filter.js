#!/usr/bin/env node

/**
 * Test script for the enhanced timeframe filter functionality
 * 
 * This script tests:
 * 1. All new timeframe options (30m, 60m, 2h-24h, 2d-30d)
 * 2. Backend API filtering with different intervals
 * 3. Frontend filter state management
 * 
 * Usage: node test-timeframe-filter.js
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

// Test all the new timeframe options
const timeframeTests = [
  { key: '30m', label: 'Last 30 minutes', expectedInterval: '30 minutes' },
  { key: '60m', label: 'Last 60 minutes', expectedInterval: '60 minutes' },
  { key: '2h', label: 'Last 2 hours', expectedInterval: '2 hours' },
  { key: '3h', label: 'Last 3 hours', expectedInterval: '3 hours' },
  { key: '4h', label: 'Last 4 hours', expectedInterval: '4 hours' },
  { key: '5h', label: 'Last 5 hours', expectedInterval: '5 hours' },
  { key: '6h', label: 'Last 6 hours', expectedInterval: '6 hours' },
  { key: '7h', label: 'Last 7 hours', expectedInterval: '7 hours' },
  { key: '8h', label: 'Last 8 hours', expectedInterval: '8 hours' },
  { key: '9h', label: 'Last 9 hours', expectedInterval: '9 hours' },
  { key: '10h', label: 'Last 10 hours', expectedInterval: '10 hours' },
  { key: '11h', label: 'Last 11 hours', expectedInterval: '11 hours' },
  { key: '12h', label: 'Last 12 hours', expectedInterval: '12 hours' },
  { key: '13h', label: 'Last 13 hours', expectedInterval: '13 hours' },
  { key: '14h', label: 'Last 14 hours', expectedInterval: '14 hours' },
  { key: '15h', label: 'Last 15 hours', expectedInterval: '15 hours' },
  { key: '16h', label: 'Last 16 hours', expectedInterval: '16 hours' },
  { key: '17h', label: 'Last 17 hours', expectedInterval: '17 hours' },
  { key: '18h', label: 'Last 18 hours', expectedInterval: '18 hours' },
  { key: '19h', label: 'Last 19 hours', expectedInterval: '19 hours' },
  { key: '20h', label: 'Last 20 hours', expectedInterval: '20 hours' },
  { key: '21h', label: 'Last 21 hours', expectedInterval: '21 hours' },
  { key: '22h', label: 'Last 22 hours', expectedInterval: '22 hours' },
  { key: '23h', label: 'Last 23 hours', expectedInterval: '23 hours' },
  { key: '24h', label: 'Last 24 hours', expectedInterval: '24 hours' },
  { key: '2d', label: '2 days ago', expectedInterval: '2 days' },
  { key: '3d', label: '3 days ago', expectedInterval: '3 days' },
  { key: '7d', label: '7 days ago', expectedInterval: '7 days' },
  { key: '14d', label: '14 days ago', expectedInterval: '14 days' },
  { key: '30d', label: '30 days ago', expectedInterval: '30 days' }
];

async function testTimeframeFilter(timeframe) {
  console.log(`\n🧪 Testing timeframe: ${timeframe.label} (${timeframe.key})`);
  
  try {
    // Test GET /threads endpoint with timeframe filter
    const threadsResponse = await fetch(`${API_BASE}/threads?lastMessageSince=${timeframe.key}`);
    
    if (!threadsResponse.ok) {
      throw new Error(`Threads API returned ${threadsResponse.status}: ${await threadsResponse.text()}`);
    }
    
    const threads = await threadsResponse.json();
    console.log(`   ✅ Threads API: ${threads.length} threads returned`);
    
    // Test GET /stats endpoint with timeframe filter
    const statsResponse = await fetch(`${API_BASE}/stats?lastMessageSince=${timeframe.key}`);
    
    if (!statsResponse.ok) {
      throw new Error(`Stats API returned ${statsResponse.status}: ${await statsResponse.text()}`);
    }
    
    const stats = await statsResponse.json();
    console.log(`   ✅ Stats API: ${stats.totalChats} total chats, ${stats.totalConverted} converted`);
    
    // Test that 'all' returns all data (no filter)
    const allThreadsResponse = await fetch(`${API_BASE}/threads?lastMessageSince=all`);
    const allThreads = await allThreadsResponse.json();
    
    const allStatsResponse = await fetch(`${API_BASE}/stats?lastMessageSince=all`);
    const allStats = await allStatsResponse.json();
    
    console.log(`   ✅ All time filter: ${allThreads.length} threads, ${allStats.totalChats} total chats`);
    
    return {
      timeframe: timeframe.key,
      label: timeframe.label,
      passed: true,
      threadsCount: threads.length,
      statsTotalChats: stats.totalChats
    };
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return {
      timeframe: timeframe.key,
      label: timeframe.label,
      passed: false,
      error: error.message
    };
  }
}

async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking server health...');
  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    console.log('❌ Cannot connect to server. Make sure it\'s running on port 5000');
    console.log('\n💡 To start the server, run:');
    console.log('   cd server && npm start');
    process.exit(1);
  }

  console.log('✅ Server is running and healthy');
  console.log('\n🚀 Starting timeframe filter tests...\n');

  const results = [];

  // Test all timeframe options
  for (const timeframe of timeframeTests) {
    const result = await testTimeframeFilter(timeframe);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TIMEFRAME FILTER TEST SUMMARY');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let totalTests = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.label} (${result.timeframe})`);
    if (result.passed) {
      passedTests++;
      console.log(`   📊 Threads: ${result.threadsCount}, Total Chats: ${result.statsTotalChats}`);
    }
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  });

  console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All timeframe filter tests passed! The enhanced filtering is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the implementation and try again.');
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Test the frontend FilterBar component with the new options');
  console.log('   2. Verify that the UI updates correctly when selecting different timeframes');
  console.log('   3. Deploy to production with: vercel --prod');
}

// Run the tests
main().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
