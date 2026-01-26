import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import {
  randomString,
  randomIntBetween,
  randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Advanced metrics for spike testing
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const throughput = new Counter('requests_total');
const degradationRate = new Rate('degradation_rate');
const recoveryTime = new Trend('recovery_time');
const circuitBreakerTrips = new Counter('circuit_breaker_trips');

// Spike test configuration - extreme sudden load with recovery analysis
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Baseline: 10 users
    { duration: '10s', target: 1000 }, // SPIKE: 1000 users in 10 seconds!
    { duration: '1m', target: 1000 }, // Sustain spike: 1 minute
    { duration: '10s', target: 1500 }, // Second spike: 1500 users
    { duration: '30s', target: 1500 }, // Sustain peak
    { duration: '20s', target: 100 }, // Rapid drop
    { duration: '1m', target: 100 }, // Recovery period
    { duration: '30s', target: 0 }, // Complete shutdown
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // More lenient during spike
    http_req_failed: ['rate<0.10'], // Allow 10% error during extreme spike
    degradation_rate: ['rate<0.15'], // Track service degradation
    'http_req_duration{phase:baseline}': ['p(95)<500'],
    'http_req_duration{phase:spike}': ['p(95)<3000'],
    'http_req_duration{phase:recovery}': ['p(95)<800'], // Recovery should be quick
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// Test phases for tracking
let currentPhase = 'baseline';

export function setup() {
  console.log('🚀 Advanced Spike Test - Extreme Load Simulation');
  console.log('Testing system behavior under sudden extreme load...\n');

  const user = {
    email: `spike-advanced-${Date.now()}@kiit.ac.in`,
    password: 'SpikeTest123!@#',
    name: 'Advanced Spike Test User',
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
      JSON.stringify({
        email: user.email,
        password: user.password,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (loginRes.status === 200 || loginRes.status === 201) {
      const body = JSON.parse(loginRes.body);
      return {
        token: body.access_token || body.data?.access_token,
        startTime: Date.now(),
      };
    }
  }

  return { token: '', startTime: Date.now() };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Determine current phase based on VU count
  const vu = __VU;
  if (vu <= 100) {
    currentPhase = 'baseline';
  } else if (vu <= 1000) {
    currentPhase = 'spike';
  } else if (vu > 1000) {
    currentPhase = 'extreme';
  }

  // Mix of critical endpoints (testing various system components)
  const scenario = randomIntBetween(1, 10);

  switch (scenario) {
    case 1:
    case 2:
    case 3:
      // Most common: Read operations (70% of traffic)
      lightReadOperations(headers);
      break;
    case 4:
    case 5:
      // Moderate: Write operations (20% of traffic)
      writeOperations(headers);
      break;
    case 6:
    case 7:
      // Search and complex queries (15% of traffic)
      complexQueries(headers);
      break;
    case 8:
      // Database-intensive operations (5% of traffic)
      databaseIntensive(headers);
      break;
    case 9:
      // Real-time features (WebSocket simulation)
      realtimeFeatures(headers);
      break;
    case 10:
      // Authentication stress
      authenticationStress(headers);
      break;
  }

  throughput.add(1);
  sleep(randomIntBetween(0, 2) * 0.1); // Very short sleep during spike
}

function lightReadOperations(headers) {
  group('Light Read Operations', function () {
    const endpoints = [
      `${BASE_URL}${API_PREFIX}/profile/me`,
      `${BASE_URL}${API_PREFIX}/notification`,
      `${BASE_URL}${API_PREFIX}/connection`,
      `${BASE_URL}${API_PREFIX}/post?page=1&limit=10`,
      `${BASE_URL}${API_PREFIX}/referral?page=1&limit=5`,
    ];

    const endpoint = randomItem(endpoints);
    const startTime = Date.now();
    const res = http.get(endpoint, {
      headers,
      tags: { phase: currentPhase, operation: 'read' },
    });

    const responseOk = check(res, {
      'Read operation successful': (r) => r.status === 200,
      'Response time under 3s': (r) => r.timings.duration < 3000,
      'No server errors': (r) => r.status < 500,
    });

    errorRate.add(!responseOk);
    responseTime.add(res.timings.duration);

    // Track degradation (response > 1s is considered degraded)
    if (res.timings.duration > 1000) {
      degradationRate.add(1);
    } else {
      degradationRate.add(0);
    }

    // Check for circuit breaker pattern
    if (res.status === 503) {
      circuitBreakerTrips.add(1);
    }
  });
}

function writeOperations(headers) {
  group('Write Operations', function () {
    const operations = [
      () => {
        // Create post
        return http.post(
          `${BASE_URL}${API_PREFIX}/post`,
          JSON.stringify({
            subject: `Spike Test Post ${Date.now()}`,
            content: `Generated during spike test - ${randomString(50)}`,
            type: 'UPDATE',
          }),
          { headers, tags: { phase: currentPhase, operation: 'write' } },
        );
      },
      () => {
        // Update profile
        return http.patch(
          `${BASE_URL}${API_PREFIX}/profile`,
          JSON.stringify({
            bio: `Spike test bio ${Date.now()}`,
            interests: 'Testing, Performance, Load Testing',
          }),
          { headers, tags: { phase: currentPhase, operation: 'write' } },
        );
      },
      () => {
        // Mark notification as read
        return http.patch(
          `${BASE_URL}${API_PREFIX}/notification/mark-all-read`,
          null,
          { headers, tags: { phase: currentPhase, operation: 'write' } },
        );
      },
    ];

    const operation = randomItem(operations);
    const res = operation();

    const writeOk = check(res, {
      'Write operation completed': (r) => r.status >= 200 && r.status < 300,
      'Write response time acceptable': (r) => r.timings.duration < 5000,
      'No data corruption indicators': (r) =>
        r.status !== 409 && r.status !== 500,
    });

    errorRate.add(!writeOk);
    responseTime.add(res.timings.duration);
  });
}

function complexQueries(headers) {
  group('Complex Queries', function () {
    // Multi-parameter search
    const searchTerms = [
      'developer',
      'student',
      'machine learning',
      'web development',
    ];
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/user/search?q=${randomItem(searchTerms)}&role=STUDENT&limit=50`,
      { headers, tags: { phase: currentPhase, operation: 'search' } },
    );

    const searchOk = check(res, {
      'Search completed': (r) => r.status === 200 || r.status === 429,
      'Search results present': (r) => {
        try {
          if (r.status === 200) {
            const body = JSON.parse(r.body);
            return body !== null;
          }
          return true; // Rate limited is acceptable
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!searchOk);
    responseTime.add(res.timings.duration);
  });
}

function databaseIntensive(headers) {
  group('Database Intensive Operations', function () {
    // Get profile with all relations (heavy DB query)
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/profile/me?include=skills,endorsements,badges`,
      { headers, tags: { phase: currentPhase, operation: 'db-intensive' } },
    );

    const dbOk = check(res, {
      'DB intensive query completed': (r) =>
        r.status === 200 || r.status === 503,
      'Query timeout not exceeded': (r) => r.timings.duration < 10000,
    });

    errorRate.add(!dbOk);
    responseTime.add(res.timings.duration);

    if (res.status === 503) {
      circuitBreakerTrips.add(1);
    }
  });
}

function realtimeFeatures(headers) {
  group('Real-time Features', function () {
    // Simulate WebSocket-like polling
    const res = http.get(`${BASE_URL}${API_PREFIX}/notification?unread=true`, {
      headers,
      tags: { phase: currentPhase, operation: 'realtime' },
    });

    check(res, {
      'Real-time data fetched': (r) => r.status === 200,
      'Low latency maintained': (r) => r.timings.duration < 500,
    });

    errorRate.add(res.status !== 200);
    responseTime.add(res.timings.duration);
  });
}

function authenticationStress(headers) {
  group('Authentication Stress', function () {
    // Test token validation under load
    const res = http.get(`${BASE_URL}${API_PREFIX}/auth/verify`, {
      headers,
      tags: { phase: currentPhase, operation: 'auth' },
    });

    check(res, {
      'Auth verification works': (r) => r.status === 200 || r.status === 401,
      'Auth service responsive': (r) => r.timings.duration < 1000,
    });

    errorRate.add(res.status >= 500);
    responseTime.add(res.timings.duration);
  });
}

export function teardown(data) {
  const totalDuration = (Date.now() - data.startTime) / 1000;

  console.log('\n========== Advanced Spike Test Results ==========');
  console.log(`Total Test Duration: ${totalDuration.toFixed(2)}s`);
  console.log('Key Observations:');
  console.log('- Check error rates during spike phases');
  console.log('- Monitor recovery time after spike');
  console.log('- Verify no cascading failures');
  console.log('- Ensure data consistency maintained');
  console.log('==================================================\n');
}
