#!/usr/bin/env node

/**
 * Test script for automatic webhook trigger functionality
 * 
 * This script tests the automatic webhook trigger by:
 * 1. Creating a new thread with messages
 * 2. Adding messages until the criteria is met (3 outgoing + 3 incoming)
 * 3. Verifying the webhook is triggered
 * 
 * Usage: node test-auto-webhook.js
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
const TEST_THREAD_ID = `test_auto_webhook_${Date.now()}`;
const TEST_OPERATOR = 'TestOperator';
const TEST_MODEL = 'GPT-4';

// Test data - conversation that will trigger the webhook
const testMessages = [
  { type: 'incoming', message: 'Hello, I need help with my account' },
  { type: 'outgoing', message: 'Hi! I\'d be happy to help you with your account. What seems to be the issue?' },
  { type: 'incoming', message: 'I can\'t seem to access my premium features' },
  { type: 'outgoing', message: 'Let me check your account status for you. Can you provide your username?' },
  { type: 'incoming', message: 'My username is john_doe123' },
  { type: 'outgoing', message: 'Thank you! I can see your account and the premium features should be active. Let me verify the settings.' },
  { type: 'incoming', message: 'That would be great, thank you so much!' },
  { type: 'outgoing', message: 'You\'re welcome! I\'ve reset your premium access. You should be able to use all features now.' }
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
    console.log(`✅ Message sent: ${type} - "${message.substring(0, 50)}..."`);
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
    
    if (thread) {
      console.log(`📊 Thread ${threadId} stats:`, {
        message_count: thread.message_count,
        operator: thread.operator,
        model: thread.model,
        responded: thread.responded,
        last_message_relative: thread.last_message_relative
      });
      return thread;
    } else {
      console.log(`⚠️ Thread ${threadId} not found in threads list`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Failed to get thread stats: ${error.message}`);
    return null;
  }
}

async function testAutoWebhookTrigger() {
  console.log('🧪 Starting automatic webhook trigger test');
  console.log(`📝 Test thread ID: ${TEST_THREAD_ID}`);
  console.log(`👤 Test operator: ${TEST_OPERATOR}`);
  console.log(`🤖 Test model: ${TEST_MODEL}`);
  console.log('');

  try {
    // Send messages one by one and check when webhook should trigger
    for (let i = 0; i < testMessages.length; i++) {
      const msg = testMessages[i];
      console.log(`\n📤 Sending message ${i + 1}/${testMessages.length}:`);
      
      await sendMessage(
        TEST_THREAD_ID,
        TEST_OPERATOR,
        TEST_MODEL,
        msg.type,
        msg.message,
        i === testMessages.length - 1 ? 'Yes' : null // Mark as converted on last message
      );

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get thread stats to see current state
      const threadStats = await getThreadStats(TEST_THREAD_ID);
      
      if (threadStats) {
        // Count message types from the messages array
        const outgoingCount = threadStats.messages.filter(m => m.type === 'outgoing').length;
        const incomingCount = threadStats.messages.filter(m => m.type === 'incoming').length;
        
        console.log(`📈 Current counts: ${outgoingCount} outgoing, ${incomingCount} incoming`);
        
        // Check if criteria is met
        if (outgoingCount >= 3 && incomingCount >= 3) {
          console.log('🚀 CRITERIA MET! Webhook should have been triggered automatically');
          console.log('📋 Check the server logs for webhook sending confirmation');
        } else {
          console.log(`⏳ Criteria not yet met (need 3+ outgoing and 3+ incoming)`);
        }
      }

      // Wait between messages to see the progression
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Test completed!');
    console.log('📋 Summary:');
    console.log(`   - Thread ID: ${TEST_THREAD_ID}`);
    console.log(`   - Total messages sent: ${testMessages.length}`);
    console.log(`   - Expected webhook trigger: After 6th message (3 outgoing + 3 incoming)`);
    console.log('   - Check server logs for webhook activity');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      console.log('✅ Server is running and healthy');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure it\'s running on port 5000');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking server health...');
  const serverHealthy = await checkServerHealth();
  
  if (!serverHealthy) {
    console.log('\n💡 To start the server, run:');
    console.log('   cd server && npm start');
    console.log('   or');
    console.log('   node server/index.js');
    process.exit(1);
  }

  console.log('\n🚀 Starting automatic webhook trigger test...\n');
  await testAutoWebhookTrigger();
}

// Run the test
main().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
