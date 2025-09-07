// Test script to verify the "responded" field fixes
// Run this with: node test-responded-fix.js

const fetch = require('node-fetch');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function testRespondedFieldFix() {
  console.log('🧪 Testing "responded" field fixes...\n');
  
  try {
    // Test 1: Create a thread with incoming message (should be "Yes")
    console.log('1️⃣ Testing thread with incoming last message...');
    const incomingThread = {
      thread_id: 'test_incoming_' + Date.now(),
      operator: 'TestOp',
      model: 'GPT-4',
      type: 'incoming',
      message: 'Hello, I need help with my account.'
    };
    
    const incomingResponse = await fetch(`${API_BASE_URL}/api/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incomingThread)
    });
    
    if (incomingResponse.ok) {
      console.log('✅ Incoming message thread created');
    }
    
    // Test 2: Create a thread with outgoing message (should be "No")
    console.log('\n2️⃣ Testing thread with outgoing last message...');
    const outgoingThread = {
      thread_id: 'test_outgoing_' + Date.now(),
      operator: 'TestOp',
      model: 'GPT-4',
      type: 'outgoing',
      message: 'Hello! I\'d be happy to help you with your account.'
    };
    
    const outgoingResponse = await fetch(`${API_BASE_URL}/api/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outgoingThread)
    });
    
    if (outgoingResponse.ok) {
      console.log('✅ Outgoing message thread created');
    }
    
    // Test 3: Create a conversation with both message types
    console.log('\n3️⃣ Testing conversation with both message types...');
    const conversationThread = 'test_conversation_' + Date.now();
    
    // Add incoming message
    await fetch(`${API_BASE_URL}/api/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id: conversationThread,
        operator: 'TestOp',
        model: 'GPT-4',
        type: 'incoming',
        message: 'I have a question about your service.'
      })
    });
    
    // Add outgoing message (this should make responded = "No")
    await fetch(`${API_BASE_URL}/api/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id: conversationThread,
        operator: 'TestOp',
        model: 'GPT-4',
        type: 'outgoing',
        message: 'I\'d be happy to help! What would you like to know?'
      })
    });
    
    console.log('✅ Conversation thread created with both message types');
    
    // Test 4: Fetch all threads and verify responded values
    console.log('\n4️⃣ Verifying responded field values...');
    const threadsResponse = await fetch(`${API_BASE_URL}/api/threads`);
    const threads = await threadsResponse.json();
    
    console.log('\n📊 Thread Analysis:');
    threads.forEach(thread => {
      if (thread.thread_id.startsWith('test_')) {
        console.log(`Thread: ${thread.thread_id}`);
        console.log(`  Responded: ${thread.responded}`);
        console.log(`  Last Message: ${thread.last_message_relative}`);
        console.log(`  Message Count: ${thread.message_count}`);
        
        if (thread.messages && thread.messages.length > 0) {
          const lastMessage = thread.messages[thread.messages.length - 1];
          console.log(`  Last Message Type: ${lastMessage.type}`);
          console.log(`  Last Message Content: ${lastMessage.message.substring(0, 50)}...`);
        }
        console.log('');
      }
    });
    
    // Test 5: Verify the logic
    console.log('5️⃣ Verifying logic correctness...');
    let correctCount = 0;
    let totalCount = 0;
    
    threads.forEach(thread => {
      if (thread.thread_id.startsWith('test_')) {
        totalCount++;
        const lastMessage = thread.messages && thread.messages.length > 0 
          ? thread.messages[thread.messages.length - 1] 
          : null;
        
        if (lastMessage) {
          const expectedResponded = lastMessage.type === 'incoming' ? 'Yes' : 'No';
          const isCorrect = thread.responded === expectedResponded;
          
          if (isCorrect) {
            correctCount++;
            console.log(`✅ ${thread.thread_id}: ${thread.responded} (correct for ${lastMessage.type})`);
          } else {
            console.log(`❌ ${thread.thread_id}: ${thread.responded} (expected ${expectedResponded} for ${lastMessage.type})`);
          }
        }
      }
    });
    
    console.log(`\n📈 Results: ${correctCount}/${totalCount} threads have correct responded values`);
    
    if (correctCount === totalCount) {
      console.log('🎉 All tests passed! The responded field fix is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the backend server is running:');
    console.log('cd server && npm start');
  }
}

// Run the test
testRespondedFieldFix();
