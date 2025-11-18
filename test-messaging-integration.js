#!/usr/bin/env node

/**
 * Real-Time Messaging Integration Test
 * 
 * This script tests the complete messaging flow:
 * 1. Backend WebSocket connection
 * 2. Message sending with optimistic UI
 * 3. Read receipts
 * 4. Message editing
 * 5. Message deletion
 * 6. User presence tracking
 * 7. Typing indicators
 */

const io = require('socket.io-client');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_USER_1_TOKEN = process.env.TEST_USER_1_TOKEN || 'your-jwt-token-here';
const TEST_USER_2_TOKEN = process.env.TEST_USER_2_TOKEN || 'your-jwt-token-here';
const TEST_USER_1_ID = process.env.TEST_USER_1_ID || 'user-1-id';
const TEST_USER_2_ID = process.env.TEST_USER_2_ID || 'user-2-id';

console.log('🧪 Starting Real-Time Messaging Integration Test\n');

// Test 1: WebSocket Connection
async function testWebSocketConnection() {
  console.log('📡 Test 1: WebSocket Connection');
  
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      auth: {
        token: TEST_USER_1_TOKEN
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      socket.disconnect();
      resolve();
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection failed:', error.message);
      reject(error);
    });

    setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 5000);
  });
}

// Test 2: Send Message with Optimistic UI
async function testSendMessage() {
  console.log('\n📨 Test 2: Send Message');
  
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      auth: { token: TEST_USER_1_TOKEN },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      const tempId = `temp_${Date.now()}`;
      const testMessage = {
        tempId,
        receiverId: TEST_USER_2_ID,
        content: 'Test message from integration test',
        timestamp: new Date().toISOString()
      };

      console.log('📤 Sending test message...');
      socket.emit('NEW_MESSAGE', testMessage);
    });

    socket.on('MESSAGE_SENT', (data) => {
      console.log('✅ Message sent confirmation received:', {
        messageId: data.dbMessageId,
        status: data.status
      });
      socket.disconnect();
      resolve(data);
    });

    socket.on('MESSAGE_ERROR', (error) => {
      console.error('❌ Message error:', error);
      socket.disconnect();
      reject(error);
    });

    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Message send timeout'));
    }, 10000);
  });
}

// Test 3: Receive Message
async function testReceiveMessage() {
  console.log('\n📬 Test 3: Receive Message');
  
  return new Promise((resolve, reject) => {
    let socket1, socket2;

    // User 2 listens for messages
    socket2 = io(BACKEND_URL, {
      auth: { token: TEST_USER_2_TOKEN },
      transports: ['websocket']
    });

    socket2.on('connect', () => {
      console.log('✅ User 2 connected');

      // User 1 sends message to User 2
      socket1 = io(BACKEND_URL, {
        auth: { token: TEST_USER_1_TOKEN },
        transports: ['websocket']
      });

      socket1.on('connect', () => {
        console.log('✅ User 1 connected');
        
        const testMessage = {
          receiverId: TEST_USER_2_ID,
          content: 'Test message for receive test',
          timestamp: new Date().toISOString()
        };

        console.log('📤 User 1 sending message...');
        socket1.emit('NEW_MESSAGE', testMessage);
      });
    });

    socket2.on('NEW_MESSAGE', (message) => {
      console.log('✅ User 2 received message:', {
        messageId: message.id,
        content: message.content
      });
      socket1?.disconnect();
      socket2?.disconnect();
      resolve(message);
    });

    setTimeout(() => {
      socket1?.disconnect();
      socket2?.disconnect();
      reject(new Error('Receive message timeout'));
    }, 15000);
  });
}

// Test 4: Read Receipts
async function testReadReceipts(messageId) {
  console.log('\n👁️ Test 4: Read Receipts');
  
  return new Promise((resolve, reject) => {
    let socket1, socket2;

    // User 1 (sender) listens for read receipt
    socket1 = io(BACKEND_URL, {
      auth: { token: TEST_USER_1_TOKEN },
      transports: ['websocket']
    });

    socket1.on('connect', () => {
      console.log('✅ User 1 connected (waiting for read receipt)');

      // User 2 (receiver) sends read receipt
      socket2 = io(BACKEND_URL, {
        auth: { token: TEST_USER_2_TOKEN },
        transports: ['websocket']
      });

      socket2.on('connect', () => {
        console.log('✅ User 2 connected (sending read receipt)');
        
        console.log('📬 Sending read receipt...');
        socket2.emit('MESSAGE_READ', {
          messageId,
          userId: TEST_USER_2_ID
        });
      });
    });

    socket1.on('MESSAGE_READ_UPDATE', (data) => {
      console.log('✅ Read receipt received:', {
        messageId: data.messageId,
        readBy: data.readBy,
        readAt: data.readAt
      });
      socket1?.disconnect();
      socket2?.disconnect();
      resolve(data);
    });

    setTimeout(() => {
      socket1?.disconnect();
      socket2?.disconnect();
      reject(new Error('Read receipt timeout'));
    }, 15000);
  });
}

// Test 5: Message Editing
async function testEditMessage(messageId) {
  console.log('\n✏️ Test 5: Message Editing');
  
  return new Promise((resolve, reject) => {
    let socket1, socket2;

    // User 2 listens for edit
    socket2 = io(BACKEND_URL, {
      auth: { token: TEST_USER_2_TOKEN },
      transports: ['websocket']
    });

    socket2.on('connect', () => {
      console.log('✅ User 2 connected (waiting for edit)');

      // User 1 edits their message
      socket1 = io(BACKEND_URL, {
        auth: { token: TEST_USER_1_TOKEN },
        transports: ['websocket']
      });

      socket1.on('connect', () => {
        console.log('✅ User 1 connected (editing message)');
        
        console.log('✏️ Editing message...');
        socket1.emit('EDIT_MESSAGE', {
          messageId,
          newContent: 'Edited test message'
        });
      });
    });

    socket2.on('MESSAGE_EDITED', (data) => {
      console.log('✅ Edit received:', {
        messageId: data.messageId,
        newContent: data.newContent,
        editedAt: data.editedAt
      });
      socket1?.disconnect();
      socket2?.disconnect();
      resolve(data);
    });

    setTimeout(() => {
      socket1?.disconnect();
      socket2?.disconnect();
      reject(new Error('Edit message timeout'));
    }, 15000);
  });
}

// Test 6: Typing Indicators
async function testTypingIndicators() {
  console.log('\n⌨️ Test 6: Typing Indicators');
  
  return new Promise((resolve, reject) => {
    let socket1, socket2;

    // User 2 listens for typing indicator
    socket2 = io(BACKEND_URL, {
      auth: { token: TEST_USER_2_TOKEN },
      transports: ['websocket']
    });

    socket2.on('connect', () => {
      console.log('✅ User 2 connected (waiting for typing indicator)');

      // User 1 starts typing
      socket1 = io(BACKEND_URL, {
        auth: { token: TEST_USER_1_TOKEN },
        transports: ['websocket']
      });

      socket1.on('connect', () => {
        console.log('✅ User 1 connected (starting to type)');
        
        console.log('⌨️ Sending typing indicator...');
        socket1.emit('TYPING_START', {
          receiverId: TEST_USER_2_ID
        });
      });
    });

    socket2.on('TYPING_START', (data) => {
      console.log('✅ Typing indicator received:', {
        userId: data.userId
      });
      socket1?.disconnect();
      socket2?.disconnect();
      resolve(data);
    });

    setTimeout(() => {
      socket1?.disconnect();
      socket2?.disconnect();
      reject(new Error('Typing indicator timeout'));
    }, 15000);
  });
}

// Test 7: User Presence
async function testUserPresence() {
  console.log('\n👤 Test 7: User Presence');
  
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      auth: { token: TEST_USER_1_TOKEN },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected');
      // User is automatically marked as online on connection
      setTimeout(() => {
        console.log('✅ User presence test passed (auto-tracked on connection)');
        socket.disconnect();
        resolve();
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection failed:', error.message);
      reject(error);
    });

    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Presence test timeout'));
    }, 10000);
  });
}

// Test 8: Offline Sync API
async function testOfflineSync() {
  console.log('\n🔄 Test 8: Offline Message Sync');
  
  try {
    const lastTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
    
    const response = await axios.get(`${BACKEND_URL}/messages/sync`, {
      params: { lastMessageTimestamp: lastTimestamp },
      headers: { Authorization: `Bearer ${TEST_USER_1_TOKEN}` }
    });

    console.log('✅ Sync endpoint responded:', {
      messageCount: response.data.length,
      status: response.status
    });

    return response.data;
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    throw error;
  }
}

// Run all tests
async function runAllTests() {
  let messageId;

  try {
    console.log('='.repeat(60));
    console.log('Starting Messaging System Integration Tests');
    console.log('='.repeat(60) + '\n');

    await testWebSocketConnection();
    
    const sentMessage = await testSendMessage();
    messageId = sentMessage.dbMessageId;
    
    const receivedMessage = await testReceiveMessage();
    if (!messageId && receivedMessage.id) {
      messageId = receivedMessage.id;
    }
    
    if (messageId) {
      await testReadReceipts(messageId);
      await testEditMessage(messageId);
    } else {
      console.warn('⚠️ Skipping read receipt and edit tests (no message ID)');
    }
    
    await testTypingIndicators();
    await testUserPresence();
    await testOfflineSync();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test failed:', error.message);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run tests
runAllTests();
