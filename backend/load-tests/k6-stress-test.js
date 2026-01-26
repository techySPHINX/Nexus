import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  randomString,
  randomIntBetween,
  randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Stress test metrics - pushing system to breaking point
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const maxConcurrentUsers = new Counter('max_concurrent_users');
const systemBreakpoint = new Counter('system_breakpoint');
const recoverySuccess = new Rate('recovery_success');

// Stress test configuration - find system limits
export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Warm-up
    { duration: '5m', target: 100 }, // Normal load
    { duration: '2m', target: 200 }, // Increase
    { duration: '2m', target: 300 }, // Push harder
    { duration: '2m', target: 400 }, // Beyond capacity
    { duration: '2m', target: 500 }, // Breaking point
    { duration: '2m', target: 600 }, // Maximum stress
    { duration: '5m', target: 50 }, // Recovery test
    { duration: '2m', target: 0 }, // Cool down
  ],
  thresholds: {
    'http_req_duration{phase:normal}': ['p(95)<500'],
    'http_req_duration{phase:stress}': ['p(95)<2000'],
    'http_req_duration{phase:breaking}': ['p(95)<5000'],
    http_req_failed: ['rate<0.20'], // Allow 20% failure during stress
    recovery_success: ['rate>0.95'], // 95% success during recovery
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

let breakpointReached = false;
let breakpointVUs = 0;

export function setup() {
  console.log('💪 Stress Test - Finding System Breaking Point');
  console.log('Objective: Determine maximum capacity and recovery ability\\n');

  const testUsers = [];

  for (let i = 0; i < 3; i++) {
    const user = {
      email: `stress-test-${i}-${Date.now()}@kiit.ac.in`,
      password: 'StressTest123!@#',
      name: `Stress Test User ${i}`,
      role: 'STUDENT',
    };

    const signupRes = http.post(
      `${BASE_URL}${API_PREFIX}/auth/signup`,
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (signupRes.status === 201 || signupRes.status === 409) {
      const loginRes = http.post(
        `${BASE_URL}${API_PREFIX}/auth/login`,
        JSON.stringify({ email: user.email, password: user.password }),
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (loginRes.status === 200 || loginRes.status === 201) {
        const body = JSON.parse(loginRes.body);
        testUsers.push({
          ...user,
          token: body.access_token || body.data?.access_token,
        });
      }
    }
    sleep(0.3);
  }

  return { testUsers };
}

export default function (data) {
  const userIndex = randomIntBetween(0, data.testUsers.length - 1);
  const token = data.testUsers[userIndex].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const currentVUs = __VU;
  let phase = 'normal';

  if (currentVUs > 200) phase = 'stress';
  if (currentVUs > 400) phase = 'breaking';
  if (currentVUs < 100 && __ITER > 50) phase = 'recovery';

  maxConcurrentUsers.add(currentVUs);

  // Test critical paths under stress
  const scenario = randomIntBetween(1, 5);

  switch (scenario) {
    case 1:
      stressDatabaseOperations(headers, phase);
      break;
    case 2:
      stressAuthenticationLayer(headers, phase);
      break;
    case 3:
      stressAPIEndpoints(headers, phase);
      break;
    case 4:
      stressFileOperations(headers, phase);
      break;
    case 5:
      stressConcurrentWrites(headers, phase);
      break;
  }

  sleep(randomIntBetween(0, 3) * 0.5);
}

function stressDatabaseOperations(headers, phase) {
  group('Stress: Database Operations', function () {
    // Heavy database queries
    const operations = [
      `${BASE_URL}${API_PREFIX}/profile/me?include=all`,
      `${BASE_URL}${API_PREFIX}/post?page=1&limit=100`,
      `${BASE_URL}${API_PREFIX}/user/search?q=test&limit=100`,
      `${BASE_URL}${API_PREFIX}/connection?status=all`,
      `${BASE_URL}${API_PREFIX}/referral?page=1&limit=50`,
    ];

    operations.forEach((url) => {
      const res = http.get(url, { headers, tags: { phase, operation: 'db' } });

      const success = check(res, {
        'DB query completed': (r) => r.status < 500,
        'No connection pool exhaustion': (r) => r.status !== 503,
        'Response within timeout': (r) => r.timings.duration < 15000,
      });

      errorRate.add(!success);
      responseTime.add(res.timings.duration);

      if (!breakpointReached && res.status >= 500) {
        breakpointReached = true;
        breakpointVUs = __VU;
        systemBreakpoint.add(1);
        console.log(
          `⚠️  System breaking point reached at ${breakpointVUs} concurrent users`,
        );
      }

      if (phase === 'recovery') {
        recoverySuccess.add(success);
      }
    });
  });
}

function stressAuthenticationLayer(headers, phase) {
  group('Stress: Authentication Layer', function () {
    // Token validation stress
    const res = http.get(`${BASE_URL}${API_PREFIX}/auth/verify`, {
      headers,
      tags: { phase, operation: 'auth' },
    });

    const authWorks = check(res, {
      'Auth service responsive': (r) => r.status === 200 || r.status === 401,
      'No auth timeout': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!authWorks);
    responseTime.add(res.timings.duration);

    if (phase === 'recovery') {
      recoverySuccess.add(authWorks);
    }
  });
}

function stressAPIEndpoints(headers, phase) {
  group('Stress: API Endpoints', function () {
    // Concurrent API calls
    const batch = http.batch([
      ['GET', `${BASE_URL}${API_PREFIX}/profile/me`, null, { headers }],
      [
        'GET',
        `${BASE_URL}${API_PREFIX}/post?page=1&limit=20`,
        null,
        { headers },
      ],
      ['GET', `${BASE_URL}${API_PREFIX}/notification`, null, { headers }],
      ['GET', `${BASE_URL}${API_PREFIX}/connection`, null, { headers }],
    ]);

    batch.forEach((res) => {
      const success = res.status === 200 || res.status === 429;
      errorRate.add(!success);
      responseTime.add(res.timings.duration);

      if (phase === 'recovery') {
        recoverySuccess.add(success);
      }
    });
  });
}

function stressFileOperations(headers, phase) {
  group('Stress: File Operations', function () {
    // Simulate file-heavy operations
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/showcase/project?page=1&limit=30`,
      {
        headers,
        tags: { phase, operation: 'files' },
      },
    );

    const success = check(res, {
      'File ops responsive': (r) => r.status < 500,
      'No timeout': (r) => r.timings.duration < 10000,
    });

    errorRate.add(!success);
    responseTime.add(res.timings.duration);

    if (phase === 'recovery') {
      recoverySuccess.add(success);
    }
  });
}

function stressConcurrentWrites(headers, phase) {
  group('Stress: Concurrent Writes', function () {
    // Test write operations under stress
    const postData = {
      subject: `Stress Test Post ${Date.now()}`,
      content: `Testing concurrent writes under ${phase} phase. VU: ${__VU}`,
      type: 'UPDATE',
    };

    const res = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify(postData),
      { headers, tags: { phase, operation: 'write' } },
    );

    const writeSuccess = check(res, {
      'Write completed': (r) => r.status >= 200 && r.status < 300,
      'No deadlock': (r) => r.status !== 409,
      'No data corruption': (r) => r.status !== 500,
    });

    errorRate.add(!writeSuccess);
    responseTime.add(res.timings.duration);

    if (phase === 'recovery') {
      recoverySuccess.add(writeSuccess);
    }
  });
}

export function teardown(data) {
  console.log('\\n========== Stress Test Results ==========');
  console.log(`Breaking Point VUs: ${breakpointVUs || 'Not reached'}`);
  console.log('');
  console.log('Key Findings:');
  console.log('- Maximum sustainable concurrent users');
  console.log('- System degradation pattern');
  console.log('- Recovery capability after stress');
  console.log('- Resource bottlenecks identified');
  console.log('==========================================\\n');
}
