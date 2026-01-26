import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import {
  randomString,
  randomIntBetween,
  randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Advanced soak test metrics - focus on long-term stability
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const memoryLeakIndicator = new Trend('response_time_drift');
const resourceExhaustion = new Counter('resource_exhaustion');
const degradationOverTime = new Trend('performance_degradation');
const successRate = new Rate('success_rate');
const connectionErrors = new Counter('connection_errors');
const timeoutErrors = new Counter('timeout_errors');

// Soak test configuration - extended duration to detect memory leaks and degradation
export const options = {
  stages: [
    { duration: '3m', target: 30 }, // Warm-up: 30 users
    { duration: '5m', target: 75 }, // Ramp to 75 users
    { duration: '2h', target: 75 }, // Soak: 2 hours at 75 users (main test period)
    { duration: '10m', target: 100 }, // Stress test during soak
    { duration: '2h', target: 100 }, // Extended soak at 100 users
    { duration: '5m', target: 50 }, // Cool down
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
    http_req_failed: ['rate<0.005'], // Very strict for soak test
    errors: ['rate<0.02'],
    'http_req_duration{phase:hour_1}': ['p(95)<500'],
    'http_req_duration{phase:hour_2}': ['p(95)<550'], // Allow slight degradation
    'http_req_duration{phase:hour_3}': ['p(95)<600'],
    'http_req_duration{phase:hour_4}': ['p(95)<650'],
    success_rate: ['rate>0.99'], // 99% success rate required
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// Track test progress and performance drift
let testStartTime;
let baselineResponseTime = 0;
let iterationCount = 0;

// Realistic user behaviors for extended testing
const userProfiles = {
  casual: { weight: 40, sleepRange: [5, 10] }, // 40% casual users, slow interactions
  regular: { weight: 35, sleepRange: [2, 5] }, // 35% regular users
  active: { weight: 20, sleepRange: [1, 3] }, // 20% active users
  powerUser: { weight: 5, sleepRange: [0.5, 2] }, // 5% power users, rapid interactions
};

export function setup() {
  console.log(
    '🔬 Advanced Soak Test - Long-Duration Stability & Memory Leak Detection',
  );
  console.log('Duration: 4+ hours of continuous load');
  console.log(
    'Purpose: Detect memory leaks, resource exhaustion, and performance degradation\n',
  );

  testStartTime = Date.now();

  // Create diverse test users for realistic long-term scenarios
  const testUsers = [];
  const roles = ['STUDENT', 'ALUM', 'MENTOR', 'ADMIN'];

  for (let i = 0; i < 10; i++) {
    const role = roles[i % roles.length];
    const user = {
      email: `soak-${role.toLowerCase()}-${i}-${Date.now()}@kiit.ac.in`,
      password: 'SoakTest123!@#',
      name: `Soak Test ${role} ${i}`,
      role: role,
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
        testUsers.push({
          ...user,
          token: body.access_token || body.data?.access_token,
        });
      }
    }

    sleep(0.5);
  }

  console.log(`Setup complete. Created ${testUsers.length} test users.`);
  return { testUsers, startTime: testStartTime };
}

export default function (data) {
  iterationCount++;
  const elapsedHours = (Date.now() - data.startTime) / (1000 * 60 * 60);

  // Determine test phase
  let phase = 'hour_1';
  if (elapsedHours > 1 && elapsedHours <= 2) phase = 'hour_2';
  else if (elapsedHours > 2 && elapsedHours <= 3) phase = 'hour_3';
  else if (elapsedHours > 3) phase = 'hour_4';

  // Select random user
  const userIndex = randomIntBetween(0, data.testUsers.length - 1);
  const token = data.testUsers[userIndex].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Determine user profile type
  const profileType = selectUserProfile();

  // Execute realistic user journey based on profile
  switch (profileType) {
    case 'casual':
      casualUserJourney(headers, phase);
      break;
    case 'regular':
      regularUserJourney(headers, phase);
      break;
    case 'active':
      activeUserJourney(headers, phase);
      break;
    case 'powerUser':
      powerUserJourney(headers, phase);
      break;
  }

  // Monitor performance drift over time
  if (iterationCount % 100 === 0) {
    checkPerformanceDrift(phase);
  }
}

function selectUserProfile() {
  const rand = randomIntBetween(1, 100);
  if (rand <= 40) return 'casual';
  if (rand <= 75) return 'regular';
  if (rand <= 95) return 'active';
  return 'powerUser';
}

function casualUserJourney(headers, phase) {
  group('Casual User Journey', function () {
    // Simple browsing behavior
    let res = http.get(`${BASE_URL}${API_PREFIX}/post?page=1&limit=10`, {
      headers,
      tags: { phase, profile: 'casual' },
    });
    trackResponse(res, 'Browse posts', phase);
    sleep(randomIntBetween(5, 10));

    // Check notifications occasionally
    res = http.get(`${BASE_URL}${API_PREFIX}/notification`, {
      headers,
      tags: { phase, profile: 'casual' },
    });
    trackResponse(res, 'Check notifications', phase);
    sleep(randomIntBetween(5, 8));

    // View profile
    res = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
      tags: { phase, profile: 'casual' },
    });
    trackResponse(res, 'View profile', phase);
    sleep(randomIntBetween(6, 10));
  });
}

function regularUserJourney(headers, phase) {
  group('Regular User Journey', function () {
    // Browse posts
    let res = http.get(
      `${BASE_URL}${API_PREFIX}/post?page=${randomIntBetween(1, 3)}&limit=20`,
      {
        headers,
        tags: { phase, profile: 'regular' },
      },
    );
    trackResponse(res, 'Browse posts', phase);
    sleep(randomIntBetween(2, 4));

    // Check connections
    res = http.get(`${BASE_URL}${API_PREFIX}/connection`, {
      headers,
      tags: { phase, profile: 'regular' },
    });
    trackResponse(res, 'View connections', phase);
    sleep(randomIntBetween(2, 3));

    // Browse referrals
    res = http.get(`${BASE_URL}${API_PREFIX}/referral?page=1&limit=10`, {
      headers,
      tags: { phase, profile: 'regular' },
    });
    trackResponse(res, 'Browse referrals', phase);
    sleep(randomIntBetween(3, 5));

    // Check notifications
    res = http.get(`${BASE_URL}${API_PREFIX}/notification?unread=true`, {
      headers,
      tags: { phase, profile: 'regular' },
    });
    trackResponse(res, 'Check notifications', phase);
    sleep(randomIntBetween(2, 4));
  });
}

function activeUserJourney(headers, phase) {
  group('Active User Journey', function () {
    // Create content
    let res = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify({
        subject: `Soak Test Post ${Date.now()}`,
        content: `Testing system stability over extended duration. Iteration: ${iterationCount}. ${randomString(150)}`,
        type: 'UPDATE',
      }),
      { headers, tags: { phase, profile: 'active' } },
    );
    trackResponse(res, 'Create post', phase);
    sleep(randomIntBetween(1, 2));

    // Search for users
    res = http.get(
      `${BASE_URL}${API_PREFIX}/user/search?q=${randomItem(['developer', 'student', 'alumni'])}&limit=20`,
      { headers, tags: { phase, profile: 'active' } },
    );
    trackResponse(res, 'Search users', phase);
    sleep(randomIntBetween(1, 2));

    // Update profile
    res = http.patch(
      `${BASE_URL}${API_PREFIX}/profile`,
      JSON.stringify({
        bio: `Active user bio update ${Date.now()}`,
        interests: 'Long-running tests, Performance, Stability',
      }),
      { headers, tags: { phase, profile: 'active' } },
    );
    trackResponse(res, 'Update profile', phase);
    sleep(randomIntBetween(1, 3));

    // Browse multiple pages
    for (let i = 1; i <= 3; i++) {
      res = http.get(`${BASE_URL}${API_PREFIX}/post?page=${i}&limit=15`, {
        headers,
        tags: { phase, profile: 'active' },
      });
      trackResponse(res, `Browse page ${i}`, phase);
      sleep(randomIntBetween(1, 2));
    }
  });
}

function powerUserJourney(headers, phase) {
  group('Power User Journey', function () {
    // Intensive operations
    const operations = [
      // Multiple post creations
      () => {
        for (let i = 0; i < 3; i++) {
          const res = http.post(
            `${BASE_URL}${API_PREFIX}/post`,
            JSON.stringify({
              subject: `Power User Post ${i} - ${Date.now()}`,
              content: `Intensive testing post ${i}. ${randomString(200)}`,
              type: randomItem(['UPDATE', 'QUESTION', 'DISCUSSION']),
            }),
            { headers, tags: { phase, profile: 'powerUser' } },
          );
          trackResponse(res, `Create post ${i}`, phase);
          sleep(0.5);
        }
      },

      // Batch read operations
      () => {
        const batch = http.batch([
          ['GET', `${BASE_URL}${API_PREFIX}/profile/me`, null, { headers }],
          ['GET', `${BASE_URL}${API_PREFIX}/notification`, null, { headers }],
          ['GET', `${BASE_URL}${API_PREFIX}/connection`, null, { headers }],
          [
            'GET',
            `${BASE_URL}${API_PREFIX}/referral?page=1&limit=10`,
            null,
            { headers },
          ],
          [
            'GET',
            `${BASE_URL}${API_PREFIX}/post?page=1&limit=20`,
            null,
            { headers },
          ],
        ]);

        batch.forEach((res, index) => {
          trackResponse(res, `Batch request ${index}`, phase);
        });
        sleep(1);
      },

      // Complex search
      () => {
        const res = http.get(
          `${BASE_URL}${API_PREFIX}/user/search?q=engineering&role=STUDENT&branch=CSE&limit=50`,
          { headers, tags: { phase, profile: 'powerUser' } },
        );
        trackResponse(res, 'Complex search', phase);
        sleep(0.5);
      },

      // Messaging operations
      () => {
        const res = http.get(
          `${BASE_URL}${API_PREFIX}/messaging/conversations`,
          {
            headers,
            tags: { phase, profile: 'powerUser' },
          },
        );
        trackResponse(res, 'Get conversations', phase);
        sleep(0.5);
      },
    ];

    // Execute random operations
    const numOperations = randomIntBetween(2, 4);
    for (let i = 0; i < numOperations; i++) {
      const operation = randomItem(operations);
      operation();
      sleep(randomIntBetween(0.5, 1.5));
    }
  });
}

function trackResponse(res, operation, phase) {
  const success = check(res, {
    [`${operation}: success`]: (r) => r.status >= 200 && r.status < 300,
    [`${operation}: no timeout`]: (r) => r.timings.duration < 10000,
    [`${operation}: no server error`]: (r) => r.status < 500,
  });

  // Track various error types
  if (res.status === 0 || res.error_code > 0) {
    connectionErrors.add(1);
  }

  if (res.timings.duration > 10000) {
    timeoutErrors.add(1);
  }

  if (res.status === 503 || res.status === 504) {
    resourceExhaustion.add(1);
  }

  errorRate.add(!success);
  successRate.add(success);
  responseTime.add(res.timings.duration);

  // Track baseline for first 100 requests
  if (iterationCount <= 100 && res.status === 200) {
    baselineResponseTime = (baselineResponseTime + res.timings.duration) / 2;
  }

  // Calculate performance drift
  if (iterationCount > 100 && res.status === 200) {
    const drift =
      ((res.timings.duration - baselineResponseTime) / baselineResponseTime) *
      100;
    memoryLeakIndicator.add(drift);
    degradationOverTime.add(res.timings.duration);
  }
}

function checkPerformanceDrift(phase) {
  // This runs every 100 iterations to check for performance degradation
  // In a real scenario, you'd query system metrics here
  const currentTime = Date.now();
  const elapsedMinutes = (currentTime - testStartTime) / (1000 * 60);

  console.log(
    `[${phase}] Performance check at ${elapsedMinutes.toFixed(1)} minutes`,
  );
}

export function teardown(data) {
  const totalDuration = (Date.now() - data.startTime) / (1000 * 60 * 60);

  console.log('\n========== Advanced Soak Test Results ==========');
  console.log(`Total Duration: ${totalDuration.toFixed(2)} hours`);
  console.log(`Total Iterations: ${iterationCount}`);
  console.log('');
  console.log('Analysis Focus Areas:');
  console.log('✓ Response time drift over time (memory leak indicator)');
  console.log('✓ Error rate consistency across all phases');
  console.log('✓ Resource exhaustion incidents');
  console.log('✓ Connection pool stability');
  console.log('✓ Database connection management');
  console.log('✓ Cache effectiveness over time');
  console.log('');
  console.log('Key Metrics to Review:');
  console.log('- response_time_drift (should be < 10% increase)');
  console.log('- resource_exhaustion (should be 0)');
  console.log('- connection_errors (should be minimal)');
  console.log('- success_rate (should maintain > 99%)');
  console.log('==================================================\n');
}
