import http from 'k6/http';
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '2m', target: 0 },      // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    ws_connecting: ['p(95)<1000'],    // 95% of WebSocket connections under 1s
    ws_msgs_received: ['rate>0.8'],  // 80% message delivery rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';

// Test data
const users = [
  { id: 'user1', email: 'user1@test.com', password: 'password123' },
  { id: 'user2', email: 'user2@test.com', password: 'password123' },
  { id: 'user3', email: 'user3@test.com', password: 'password123' },
  { id: 'user4', email: 'user4@test.com', password: 'password123' },
  { id: 'user5', email: 'user5@test.com', password: 'password123' },
];

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];
  const targetUser = users[Math.floor(Math.random() * users.length)];
  
  // Skip if same user
  if (user.id === targetUser.id) return;

  // Test authentication
  const authResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password,
  });

  check(authResponse, {
    'auth status is 200': (r) => r.status === 200,
    'auth response time < 200ms': (r) => r.timings.duration < 200,
  });

  if (authResponse.status !== 200) {
    console.error('Authentication failed:', authResponse.body);
    return;
  }

  const authData = JSON.parse(authResponse.body);
  const token = authData.access_token;
  const userId = authData.user.id;

  // Test WebSocket connection
  const wsUrl = `${WS_URL}/ws?userId=${userId}&token=${token}`;
  const ws = new WebSocket(wsUrl);

  ws.addEventListener('open', () => {
    console.log(`WebSocket connected for user ${userId}`);
    
    // Send authentication
    ws.send(JSON.stringify({
      userId: userId,
      token: token,
    }));
  });

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'CONNECTION_SUCCESS') {
      console.log(`User ${userId} authenticated successfully`);
      
      // Send test messages
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const message = {
            receiverId: targetUser.id,
            content: `Test message ${i + 1} from ${userId} at ${new Date().toISOString()}`,
            messageType: 'TEXT',
          };
          
          ws.send(JSON.stringify({
            type: 'NEW_MESSAGE',
            data: message,
          }));
        }, i * 1000);
      }
    }
    
    if (data.type === 'NEW_MESSAGE') {
      console.log(`Message received by ${userId}:`, data.content?.substring(0, 50));
    }
  });

  ws.addEventListener('error', (event) => {
    console.error(`WebSocket error for user ${userId}:`, event);
  });

  // Test REST API endpoints
  testRestEndpoints(userId, token);

  // Keep connection alive for a while
  sleep(30);

  // Close WebSocket
  ws.close();
}

function testRestEndpoints(userId, token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test getting conversations
  const conversationsResponse = http.get(`${BASE_URL}/api/messaging/conversations`, {
    headers: headers,
  });

  check(conversationsResponse, {
    'conversations status is 200': (r) => r.status === 200,
    'conversations response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test getting messages
  const messagesResponse = http.get(`${BASE_URL}/api/messaging/messages?limit=20`, {
    headers: headers,
  });

  check(messagesResponse, {
    'messages status is 200': (r) => r.status === 200,
    'messages response time < 300ms': (r) => r.timings.duration < 300,
  });

  // Test sending message via REST
  const messageData = {
    receiverId: users[Math.floor(Math.random() * users.length)].id,
    content: `REST test message from ${userId} at ${new Date().toISOString()}`,
    messageType: 'TEXT',
  };

  const sendMessageResponse = http.post(`${BASE_URL}/api/messaging/send`, 
    JSON.stringify(messageData),
    { headers: headers }
  );

  check(sendMessageResponse, {
    'send message status is 201': (r) => r.status === 201,
    'send message response time < 200ms': (r) => r.timings.duration < 200,
  });
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.html': htmlReport(data),
  };
}

function htmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chat Application Load Test Results</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          .pass { background-color: #d4edda; }
          .fail { background-color: #f8d7da; }
        </style>
      </head>
      <body>
        <h1>Chat Application Load Test Results</h1>
        <div class="metric">
          <h3>Test Summary</h3>
          <p><strong>Duration:</strong> ${data.state.testRunDurationMs / 1000}s</p>
          <p><strong>VUs:</strong> ${data.metrics.vus.values.max}</p>
          <p><strong>Iterations:</strong> ${data.metrics.iterations.values.count}</p>
        </div>
        <div class="metric ${data.metrics.http_req_duration.values.p95 < 200 ? 'pass' : 'fail'}">
          <h3>HTTP Response Time</h3>
          <p><strong>P95:</strong> ${data.metrics.http_req_duration.values.p95}ms</p>
          <p><strong>P99:</strong> ${data.metrics.http_req_duration.values.p99}ms</p>
          <p><strong>Average:</strong> ${data.metrics.http_req_duration.values.avg}ms</p>
        </div>
        <div class="metric ${data.metrics.ws_connecting.values.p95 < 1000 ? 'pass' : 'fail'}">
          <h3>WebSocket Connection Time</h3>
          <p><strong>P95:</strong> ${data.metrics.ws_connecting.values.p95}ms</p>
          <p><strong>Average:</strong> ${data.metrics.ws_connecting.values.avg}ms</p>
        </div>
        <div class="metric ${data.metrics.ws_msgs_received.values.rate > 0.8 ? 'pass' : 'fail'}">
          <h3>Message Delivery Rate</h3>
          <p><strong>Rate:</strong> ${(data.metrics.ws_msgs_received.values.rate * 100).toFixed(2)}%</p>
        </div>
      </body>
    </html>
  `;
}
