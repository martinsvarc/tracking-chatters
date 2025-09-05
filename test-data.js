// Test script to add sample data and verify the Message Analyzer Platform functionality
// Run this with: node test-data.js

const fetch = require('node-fetch');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Sample test data
const testMessages = [
  {
    thread_id: 'test_thread_001',
    operator: 'Sarah',
    model: 'GPT-4',
    type: 'incoming',
    message: 'Hello, I need help with my account. Can you assist me?'
  },
  {
    thread_id: 'test_thread_001',
    operator: 'Sarah',
    model: 'GPT-4',
    type: 'outgoing',
    message: 'Hello! I\'d be happy to help you with your account. What specific issue are you experiencing?'
  },
  {
    thread_id: 'test_thread_001',
    operator: 'Sarah',
    model: 'GPT-4',
    type: 'incoming',
    message: 'I can\'t log in and I\'m getting an error message.'
  },
  {
    thread_id: 'test_thread_001',
    operator: 'Sarah',
    model: 'GPT-4',
    type: 'outgoing',
    message: 'I understand your frustration with the login issue. Let me help you resolve this. Can you tell me what error message you\'re seeing exactly?'
  },
  {
    thread_id: 'test_thread_002',
    operator: 'Emma',
    model: 'Claude',
    type: 'incoming',
    message: 'Hi there! I\'m interested in your premium features.'
  },
  {
    thread_id: 'test_thread_002',
    operator: 'Emma',
    model: 'Claude',
    type: 'outgoing',
    message: 'Great to hear you\'re interested in our premium features! I\'d love to tell you more about what we offer. What specific features are you most curious about?'
  },
  {
    thread_id: 'test_thread_002',
    operator: 'Emma',
    model: 'Claude',
    type: 'incoming',
    message: 'I want to know about the advanced analytics and reporting capabilities.'
  },
  {
    thread_id: 'test_thread_002',
    operator: 'Emma',
    model: 'Claude',
    type: 'outgoing',
    message: 'Excellent choice! Our advanced analytics provide detailed insights into your data. You\'ll get real-time dashboards, custom reports, and predictive analytics. Would you like me to schedule a demo for you?'
  },
  {
    thread_id: 'test_thread_002',
    operator: 'Emma',
    model: 'Claude',
    type: 'incoming',
    message: 'Yes, that sounds perfect! When can we schedule it?'
  },
  {
    thread_id: 'test_thread_002',
    operator: 'Emma',
    model: 'Claude',
    type: 'outgoing',
    message: 'Wonderful! I\'m so excited to show you what we can do. How does tomorrow at 2 PM work for you? I\'ll send you a calendar invite with all the details.'
  }
];

async function addTestData() {
  console.log('Adding test data to Message Analyzer Platform...\n');
  
  try {
    // Add each message
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`Adding message ${i + 1}/${testMessages.length}: ${message.type} from ${message.operator}`);
      
      const response = await fetch(`${API_BASE_URL}/api/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✓ Message added successfully`);
    }
    
    // Mark one thread as converted
    console.log('\nMarking test_thread_002 as converted...');
    const convertResponse = await fetch(`${API_BASE_URL}/api/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        thread_id: 'test_thread_002',
        operator: 'Emma',
        model: 'Claude',
        type: 'outgoing',
        message: 'Thank you for your interest! I\'ve marked this as a successful conversion.',
        converted: 'Yes'
      })
    });
    
    if (convertResponse.ok) {
      console.log('✓ Thread marked as converted');
    }
    
    console.log('\n🎉 Test data added successfully!');
    console.log('\nYou can now:');
    console.log('1. Start the frontend: npm start');
    console.log('2. View the data in the Message Analyzer Platform');
    console.log('3. Check that all metrics are calculated correctly');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message);
    console.log('\nMake sure the backend server is running:');
    console.log('cd server && npm start');
  }
}

// Run the test
addTestData();
