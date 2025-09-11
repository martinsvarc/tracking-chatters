#!/usr/bin/env node

/**
 * Mock webhook receiver for testing the automatic webhook trigger
 * 
 * This script creates a simple HTTP server that receives webhook calls
 * and logs the payload to verify the format is correct.
 * 
 * Usage: node test-webhook-receiver.js
 * Then update the webhook URL in server/index.js to point to this receiver
 */

const express = require('express');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

// Webhook endpoint
app.post('/webhook/test', (req, res) => {
  console.log('\n🎯 WEBHOOK RECEIVED!');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📦 Payload:');
  console.log(JSON.stringify(req.body, null, 2));
  
  // Validate payload structure
  if (Array.isArray(req.body) && req.body.length > 0) {
    const thread = req.body[0];
    console.log('\n✅ Payload validation:');
    console.log(`   - Thread ID: ${thread.thread_id || 'MISSING'}`);
    console.log(`   - Operator: ${thread.operator || 'MISSING'}`);
    console.log(`   - Model: ${thread.model || 'MISSING'}`);
    console.log(`   - Messages count: ${thread.messages ? thread.messages.length : 'MISSING'}`);
    console.log(`   - Converted: ${thread.converted || 'MISSING'}`);
    console.log(`   - Responded: ${thread.responded || 'MISSING'}`);
    console.log(`   - Avg Response Time: ${thread.avg_response_time || 'MISSING'}`);
    
    if (thread.messages) {
      const outgoingCount = thread.messages.filter(m => m.type === 'outgoing').length;
      const incomingCount = thread.messages.filter(m => m.type === 'incoming').length;
      console.log(`   - Message breakdown: ${outgoingCount} outgoing, ${incomingCount} incoming`);
    }
  } else {
    console.log('❌ Invalid payload format - expected array with thread data');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Send success response
  res.json({ 
    success: true, 
    message: 'Webhook received successfully',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`🎯 Mock webhook receiver running on http://localhost:${port}`);
  console.log(`📡 Webhook endpoint: http://localhost:${port}/webhook/test`);
  console.log(`💡 To test with the main server, update the webhook URL in server/index.js to:`);
  console.log(`   http://localhost:${port}/webhook/test`);
  console.log('\n⏳ Waiting for webhook calls...\n');
});

module.exports = app;
