const io = require('socket.io-client');
const { performance } = require('perf_hooks');
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Comprehensive Load Test for Redis-backed Chat System
 * Tests 5000 concurrent connections and message throughput
 */

class ChatLoadTest {
  constructor(options = {}) {
    this.options = {
      serverUrl: options.serverUrl || BACKEND_URL,
      namespace: options.namespace || '/ws',
      maxConnections: options.maxConnections || 5000,
      rampUpTime: options.rampUpTime || 60, // seconds
      testDuration: options.testDuration || 300, // seconds
      messageRate: options.messageRate || 10, // messages per second per user
      ...options
    };

    this.metrics = {
      connections: {
        attempted: 0,
        successful: 0,
        failed: 0,
        active: 0,
        disconnected: 0
      },
      messages: {
        sent: 0,
        received: 0,
        failed: 0,
        duplicates: 0,
        rateLimited: 0
      },
      performance: {
        connectionTimes: [],
        messageLatencies: [],
        startTime: null,
        endTime: null
      },
      redis: {
        operations: 0,
        errors: 0
      }
    };

    this.sockets = [];
    this.testUsers = [];
    this.isRunning = false;
    this.testResults = {};
  }

  /**
   * Generate test users with unique IDs
   */
  generateTestUsers(count) {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        id: `test-user-${i}-${Date.now()}`,
        email: `test${i}@loadtest.com`,
        name: `Test User ${i}`
      });
    }
    return users;
  }

  /**
   * Create a mock JWT token for testing
   */
  createMockToken(user) {
    // Simple base64 encoded mock token
    const payload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Connect a single user
   */
  async connectUser(user, delay = 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const startTime = performance.now();
        
        const socket = io(`${this.options.serverUrl}${this.options.namespace}`, {
          transports: ['websocket'],
          auth: {
            token: this.createMockToken(user)
          },
          timeout: 10000,
          forceNew: true
        });

        socket.on('connect', () => {
          const connectionTime = performance.now() - startTime;
          this.metrics.connections.successful++;
          this.metrics.connections.active++;
          this.metrics.performance.connectionTimes.push(connectionTime);
          
          console.log(`✅ User ${user.id} connected in ${connectionTime.toFixed(2)}ms`);
          resolve(socket);
        });

        socket.on('connect_error', (error) => {
          this.metrics.connections.failed++;
          console.log(`❌ User ${user.id} connection failed:`, error.message);
          reject(error);
        });

        socket.on('disconnect', () => {
          this.metrics.connections.active--;
          this.metrics.connections.disconnected++;
          console.log(`👋 User ${user.id} disconnected`);
        });

        socket.on('RATE_LIMIT_EXCEEDED', (data) => {
          this.metrics.messages.rateLimited++;
          console.log(`🚫 Rate limit exceeded for ${user.id}:`, data);
        });

        socket.on('NEW_MESSAGE', (message) => {
          this.metrics.messages.received++;
          const latency = performance.now() - message.timestamp;
          this.metrics.performance.messageLatencies.push(latency);
        });

        socket.on('MESSAGE_ERROR', (error) => {
          this.metrics.messages.failed++;
          console.log(`❌ Message error for ${user.id}:`, error);
        });

        socket.user = user;
        this.sockets.push(socket);
        this.metrics.connections.attempted++;
      }, delay);
    });
  }

  /**
   * Send messages from a user
   */
  async sendMessages(socket, user, duration) {
    const messageInterval = 1000 / this.options.messageRate; // ms between messages
    const endTime = Date.now() + (duration * 1000);
    
    const sendMessage = () => {
      if (Date.now() >= endTime || !socket.connected) {
        return;
      }

      const message = {
        receiverId: this.getRandomReceiver(user.id),
        content: `Load test message from ${user.id} at ${new Date().toISOString()}`
      };

      const startTime = performance.now();
      socket.emit('NEW_MESSAGE', message);
      this.metrics.messages.sent++;

      setTimeout(sendMessage, messageInterval);
    };

    sendMessage();
  }

  /**
   * Get a random receiver for message sending
   */
  getRandomReceiver(senderId) {
    const otherUsers = this.testUsers.filter(u => u.id !== senderId);
    if (otherUsers.length === 0) return senderId;
    return otherUsers[Math.floor(Math.random() * otherUsers.length)].id;
  }

  /**
   * Scenario A: Connection Load Test
   */
  async runConnectionTest() {
    console.log('\n🚀 Starting Scenario A: Connection Load Test');
    console.log(`Target: ${this.options.maxConnections} connections over ${this.options.rampUpTime} seconds`);
    
    this.metrics.performance.startTime = performance.now();
    this.testUsers = this.generateTestUsers(this.options.maxConnections);
    
    const connectionsPerSecond = this.options.maxConnections / this.options.rampUpTime;
    const delayBetweenConnections = 1000 / connectionsPerSecond;

    try {
      // Ramp up connections
      for (let i = 0; i < this.options.maxConnections; i++) {
        const user = this.testUsers[i];
        const delay = i * delayBetweenConnections;
        
        try {
          await this.connectUser(user, delay);
        } catch (error) {
          console.log(`Failed to connect user ${user.id}:`, error.message);
        }

        // Progress update every 100 connections
        if ((i + 1) % 100 === 0) {
          console.log(`📊 Progress: ${i + 1}/${this.options.maxConnections} connections attempted`);
          console.log(`   Active: ${this.metrics.connections.active}, Failed: ${this.metrics.connections.failed}`);
        }
      }

      // Wait for all connections to stabilize
      await new Promise(resolve => setTimeout(resolve, 5000));

      this.metrics.performance.endTime = performance.now();
      
      console.log('\n📊 Connection Test Results:');
      console.log(`   Total Attempted: ${this.metrics.connections.attempted}`);
      console.log(`   Successful: ${this.metrics.connections.successful}`);
      console.log(`   Failed: ${this.metrics.connections.failed}`);
      console.log(`   Success Rate: ${((this.metrics.connections.successful / this.metrics.connections.attempted) * 100).toFixed(2)}%`);
      console.log(`   Average Connection Time: ${this.calculateAverage(this.metrics.performance.connectionTimes).toFixed(2)}ms`);
      console.log(`   Active Connections: ${this.metrics.connections.active}`);

    } catch (error) {
      console.error('❌ Connection test failed:', error);
    }
  }

  /**
   * Scenario B: Message Throughput Test
   */
  async runThroughputTest() {
    console.log('\n💬 Starting Scenario B: Message Throughput Test');
    console.log(`Target: ${this.options.messageRate} messages/second per user`);
    
    const activeSockets = this.sockets.filter(s => s.connected);
    const testDuration = 60; // 1 minute of sustained messaging
    
    console.log(`📊 Testing with ${activeSockets.length} active connections`);
    
    try {
      // Start message sending for all users
      const messagePromises = activeSockets.map(socket => 
        this.sendMessages(socket, socket.user, testDuration)
      );

      // Monitor progress
      const monitorInterval = setInterval(() => {
        const messagesPerSecond = this.metrics.messages.sent / ((performance.now() - this.metrics.performance.startTime) / 1000);
        console.log(`📈 Current rate: ${messagesPerSecond.toFixed(2)} msg/sec, Total sent: ${this.metrics.messages.sent}`);
      }, 10000);

      // Wait for test completion
      await Promise.all(messagePromises);
      clearInterval(monitorInterval);

      console.log('\n📊 Throughput Test Results:');
      console.log(`   Messages Sent: ${this.metrics.messages.sent}`);
      console.log(`   Messages Received: ${this.metrics.messages.received}`);
      console.log(`   Messages Failed: ${this.metrics.messages.failed}`);
      console.log(`   Rate Limited: ${this.metrics.messages.rateLimited}`);
      console.log(`   Average Latency: ${this.calculateAverage(this.metrics.performance.messageLatencies).toFixed(2)}ms`);

    } catch (error) {
      console.error('❌ Throughput test failed:', error);
    }
  }

  /**
   * Scenario C: Redis Features Test
   */
  async runRedisFeatureTest() {
    console.log('\n🔧 Starting Scenario C: Redis Features Test');
    
    const testSocket = this.sockets.find(s => s.connected);
    if (!testSocket) {
      console.log('❌ No active connections for Redis feature test');
      return;
    }

    try {
      // Test 1: Message Deduplication
      console.log('🧪 Testing message deduplication...');
      const duplicateMessage = {
        receiverId: this.getRandomReceiver(testSocket.user.id),
        content: 'Duplicate test message'
      };
      
      testSocket.emit('NEW_MESSAGE', duplicateMessage);
      testSocket.emit('NEW_MESSAGE', duplicateMessage); // Send duplicate
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 2: Rate Limiting
      console.log('🧪 Testing rate limiting...');
      for (let i = 0; i < 150; i++) { // Exceed 100 msg/min limit
        testSocket.emit('NEW_MESSAGE', {
          receiverId: this.getRandomReceiver(testSocket.user.id),
          content: `Rate limit test message ${i}`
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 3: Presence Tracking
      console.log('🧪 Testing presence tracking...');
      testSocket.emit('GET_ONLINE_USERS');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('\n📊 Redis Features Test Results:');
      console.log(`   Rate Limited Messages: ${this.metrics.messages.rateLimited}`);
      console.log(`   Duplicate Messages: ${this.metrics.messages.duplicates}`);

    } catch (error) {
      console.error('❌ Redis feature test failed:', error);
    }
  }

  /**
   * Calculate average from array of numbers
   */
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const totalTime = (this.metrics.performance.endTime - this.metrics.performance.startTime) / 1000;
    const messagesPerSecond = this.metrics.messages.sent / totalTime;
    
    const report = {
      summary: {
        testDuration: totalTime,
        totalConnections: this.metrics.connections.attempted,
        successfulConnections: this.metrics.connections.successful,
        connectionSuccessRate: (this.metrics.connections.successful / this.metrics.connections.attempted) * 100,
        totalMessages: this.metrics.messages.sent,
        messagesPerSecond: messagesPerSecond,
        averageLatency: this.calculateAverage(this.metrics.performance.messageLatencies)
      },
      connections: this.metrics.connections,
      messages: this.metrics.messages,
      performance: {
        ...this.metrics.performance,
        connectionTimes: {
          average: this.calculateAverage(this.metrics.performance.connectionTimes),
          min: Math.min(...this.metrics.performance.connectionTimes),
          max: Math.max(...this.metrics.performance.connectionTimes)
        },
        messageLatencies: {
          average: this.calculateAverage(this.metrics.performance.messageLatencies),
          min: Math.min(...this.metrics.performance.messageLatencies),
          max: Math.max(...this.metrics.performance.messageLatencies)
        }
      }
    };

    return report;
  }

  /**
   * Clean up all connections
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    
    for (const socket of this.sockets) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Cleanup completed');
  }

  /**
   * Run all test scenarios
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Chat Load Test');
    console.log(`Target: ${this.options.maxConnections} concurrent connections`);
    console.log(`Server: ${this.options.serverUrl}${this.options.namespace}`);
    
    try {
      // Run all scenarios
      await this.runConnectionTest();
      await this.runThroughputTest();
      await this.runRedisFeatureTest();
      
      // Generate final report
      const report = this.generateReport();
      console.log('\n📊 FINAL TEST REPORT');
      console.log('==================');
      console.log(JSON.stringify(report, null, 2));
      
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use
module.exports = ChatLoadTest;

// Run tests if called directly
if (require.main === module) {
  const loadTest = new ChatLoadTest({
    maxConnections: 5000,
    rampUpTime: 60,
    messageRate: 10
  });

  loadTest.runAllTests()
    .then(report => {
      console.log('\n🎉 Load test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    });
}
