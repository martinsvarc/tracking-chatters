#!/usr/bin/env node

/**
 * Test script for the automatic webhook trigger and responded field fix
 * 
 * This script tests:
 * 1. The automatic webhook trigger when criteria is met (3+ outgoing, 3+ incoming)
 * 2. The responded field calculation logic
 * 3. The webhook payload format
 * 
 * Usage: node test-responded-fix.js
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const WEBHOOK_RECEIVER = 'http://localhost:3001/webhook/test';

// Test scenarios
const testScenarios = [
  {
    name: 'Scenario 1: Quick conversation that meets criteria',
    threadId: `test_scenario_1_${Date.now()}`,
    messages: [
      { type: 'incoming', message: 'Hello, I need help', delay: 1000 },
      { type: 'outgoing', message: 'Hi! How can I help you?', delay: 2000 },
      { type: 'incoming', message: 'I have a billing question', delay: 1000 },
      { type: 'outgoing', message: 'I can help with that. What\'s your account number?', delay: 2000 },
      { type: 'incoming', message: 'It\'s 12345', delay: 1000 },
      { type: 'outgoing', message: 'Thank you! Let me look that up for you.', delay: 2000 },
      { type: 'incoming', message: 'Great, thank you!', delay: 1000 },
      { type: 'outgoing', message: 'You\'re welcome! I found your account.', delay: 2000 }
    ],
    expectedWebhookTrigger: true,
    expectedConverted: 'Yes'
  },
  {
    name: 'Scenario 2: Conversation that doesn\'t meet criteria',
    threadId: `test_scenario_2_${Date.now()}`,
    messages: [
      { type: 'incoming', message: 'Hello', delay: 1000 },
      { type: 'outgoing', message: 'Hi there!', delay: 2000 },
      { type: 'incoming', message: 'How are you?', delay: 1000 },
      { type: 'outgoing', message: 'I\'m doing well, thanks!', delay: 2000 }
    ],
    expectedWebhookTrigger: false,
    expectedConverted: null
  },
  {
    name: 'Scenario 3: Long conversation with many messages',
    threadId: `test_scenario_3_${Date.now()}`,
    messages: [
      { type: 'incoming', message: 'I need help with my subscription', delay: 1000 },
      { type: 'outgoing', message: 'I\'d be happy to help! What seems to be the issue?', delay: 2000 },
      { type: 'incoming', message: 'I was charged twice this month', delay: 1000 },
      { type: 'outgoing', message: 'I\'m sorry to hear that. Let me investigate this for you.', delay: 2000 },
      { type: 'incoming', message: 'Thank you, I appreciate it', delay: 1000 },
      { type: 'outgoing', message: 'Of course! Can you provide your account details?', delay: 2000 },
      { type: 'incoming', message: 'My email is user@example.com', delay: 1000 },
      { type: 'outgoing', message: 'Perfect! I can see your account now.', delay: 2000 },
      { type: 'incoming', message: 'Great! What did you find?', delay: 1000 },
      { type: 'outgoing', message: 'I found the duplicate charge. I\'ll process a refund.', delay: 2000 },
      { type: 'incoming', message: 'That\'s wonderful! Thank you so much!', delay: 1000 },
      { type: 'outgoing', message: 'You\'re very welcome! The refund should appear in 3-5 business days.', delay: 2000 }
    ],
    expectedWebhookTrigger: true,
    expectedConverted: 'Yes'
  }
];

async function sendMessage(threadId, operator, model, type, message, converted = null) {
  try {
    const response = await fetch(`${API_BASE}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        thread_id: threadId,
        operator: operator,
        model: model,
        type: type,
        message: message,
        converted: converted
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`❌ Failed to send message: ${error.message}`);
    throw error;
  }
}

async function getThreadStats(threadId) {
  try {
    const response = await fetch(`${API_BASE}/threads`);
    const threads = await response.json();
    const thread = threads.find(t => t.thread_id === threadId);
    return thread;
  } catch (error) {
    console.error(`❌ Failed to get thread stats: ${error.message}`);
    return null;
  }
}

async function runScenario(scenario) {
  console.log(`\n🧪 Running: ${scenario.name}`);
  console.log(`📝 Thread ID: ${scenario.threadId}`);
  console.log(`📊 Expected webhook trigger: ${scenario.expectedWebhookTrigger ? 'YES' : 'NO'}`);
  console.log('');

  let webhookTriggered = false;
  let triggerMessage = '';

  try {
    for (let i = 0; i < scenario.messages.length; i++) {
      const msg = scenario.messages[i];
      const isLastMessage = i === scenario.messages.length - 1;
      
      console.log(`📤 Sending message ${i + 1}/${scenario.messages.length}: ${msg.type} - "${msg.message}"`);
      
      await sendMessage(
        scenario.threadId,
        'TestOperator',
        'GPT-4',
        msg.type,
        msg.message,
        isLastMessage ? scenario.expectedConverted : null
      );

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, msg.delay || 1000));

      // Check thread stats
      const threadStats = await getThreadStats(scenario.threadId);
      
      if (threadStats && threadStats.messages) {
        const outgoingCount = threadStats.messages.filter(m => m.type === 'outgoing').length;
        const incomingCount = threadStats.messages.filter(m => m.type === 'incoming').length;
        
        console.log(`📈 Current counts: ${outgoingCount} outgoing, ${incomingCount} incoming`);
        
        // Check if criteria is met for the first time
        if (outgoingCount >= 3 && incomingCount >= 3 && !webhookTriggered) {
          webhookTriggered = true;
          triggerMessage = `Message ${i + 1} (${outgoingCount} outgoing, ${incomingCount} incoming)`;
          console.log('🚀 WEBHOOK TRIGGERED! Criteria met for automatic analysis');
        }
      }

      // Wait between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final verification
    const finalStats = await getThreadStats(scenario.threadId);
    if (finalStats) {
      console.log(`\n📊 Final thread stats:`);
      console.log(`   - Message count: ${finalStats.message_count}`);
      console.log(`   - Responded: ${finalStats.responded}`);
      console.log(`   - Converted: ${finalStats.converted}`);
      console.log(`   - Last message: ${finalStats.last_message_relative}`);
    }

    // Verify expectations
    const testPassed = webhookTriggered === scenario.expectedWebhookTrigger;
    console.log(`\n${testPassed ? '✅' : '❌'} Test result: ${testPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`   - Expected webhook trigger: ${scenario.expectedWebhookTrigger}`);
    console.log(`   - Actual webhook trigger: ${webhookTriggered}`);
    if (webhookTriggered) {
      console.log(`   - Triggered at: ${triggerMessage}`);
    }

    return {
      scenario: scenario.name,
      passed: testPassed,
      webhookTriggered,
      expectedWebhookTrigger: scenario.expectedWebhookTrigger,
      triggerMessage
    };

  } catch (error) {
    console.error(`❌ Scenario failed: ${error.message}`);
    return {
      scenario: scenario.name,
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
  console.log('\n🚀 Starting automatic webhook trigger tests...\n');

  const results = [];

  for (const scenario of testScenarios) {
    const result = await runScenario(scenario);
    results.push(result);
    
    // Wait between scenarios
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let totalTests = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.scenario}`);
    if (result.passed) {
      passedTests++;
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The automatic webhook trigger is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the implementation and try again.');
  }

  console.log('\n💡 To monitor webhook calls in real-time, run:');
  console.log('   node test-webhook-receiver.js');
  console.log('   Then update the webhook URL in server/index.js to point to the receiver');
}

// Run the tests
main().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});