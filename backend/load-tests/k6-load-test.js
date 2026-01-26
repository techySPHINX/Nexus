import { Test } from '@k6/core';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulRequests = new Counter('successful_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 200 }, // Spike to 200 users
    { duration: '2m', target: 100 }, // Scale down to 100
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.05'], // Custom error rate < 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
let authToken = '';

// Test data
const TEST_USER = {
  email: `loadtest-${Date.now()}@kiit.ac.in`,
  password: 'Test123!@#',
  name: 'Load Test User',
  role: 'STUDENT',
};

export function setup() {
  // Setup: Create test user and get auth token
  const signupRes = http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify(TEST_USER),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (signupRes.status === 201 || signupRes.status === 409) {
    // Login
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const loginBody = JSON.parse(loginRes.body);
    return { token: loginBody.access_token || loginBody.data?.access_token };
  }

  return { token: '' };
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Test 1: Get user profile
  {
    const res = http.get(`${BASE_URL}/api/users/me`, { headers });
    const success = check(res, {
      'GET /users/me status is 200': (r) => r.status === 200,
      'GET /users/me response time < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    if (success) successfulRequests.add(1);
  }

  sleep(1);

  // Test 2: Get posts feed
  {
    const res = http.get(`${BASE_URL}/api/posts?page=1&limit=20`, { headers });
    const success = check(res, {
      'GET /posts status is 200': (r) => r.status === 200,
      'GET /posts response time < 500ms': (r) => r.timings.duration < 500,
      'GET /posts returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data);
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    if (success) successfulRequests.add(1);
  }

  sleep(1);

  // Test 3: Get connections
  {
    const res = http.get(`${BASE_URL}/api/connection`, { headers });
    const success = check(res, {
      'GET /connection status is 200': (r) => r.status === 200,
      'GET /connection response time < 300ms': (r) => r.timings.duration < 300,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    if (success) successfulRequests.add(1);
  }

  sleep(1);

  // Test 4: Get notifications
  {
    const res = http.get(`${BASE_URL}/api/notification`, { headers });
    const success = check(res, {
      'GET /notification status is 200': (r) => r.status === 200,
      'GET /notification response time < 200ms': (r) =>
        r.timings.duration < 200,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);
    if (success) successfulRequests.add(1);
  }

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed');
}
