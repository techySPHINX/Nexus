import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import {
  randomString,
  randomIntBetween,
  randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics for comprehensive monitoring
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulRequests = new Counter('successful_requests');
const dbQueryTime = new Trend('db_query_time');
const authFailures = new Counter('auth_failures');
const concurrentUsers = new Gauge('concurrent_users');
const businessLogicErrors = new Counter('business_logic_errors');
const cacheHitRate = new Rate('cache_hit_rate');

// Test configuration with comprehensive load patterns
export const options = {
  stages: [
    { duration: '1m', target: 20 }, // Warm-up: 20 users
    { duration: '2m', target: 50 }, // Gradual increase: 50 users
    { duration: '3m', target: 100 }, // Normal load: 100 users
    { duration: '2m', target: 200 }, // Peak load: 200 users
    { duration: '1m', target: 300 }, // Spike: 300 users
    { duration: '3m', target: 150 }, // Sustained load: 150 users
    { duration: '1m', target: 50 }, // Cool down: 50 users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000', 'p(99.9)<2000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
    'http_req_duration{endpoint:auth}': ['p(95)<300'],
    'http_req_duration{endpoint:messaging}': ['p(95)<400'],
    'http_req_duration{endpoint:posts}': ['p(95)<500'],
    'http_req_duration{endpoint:search}': ['p(95)<600'],
    business_logic_errors: ['count<10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

// Realistic test data pools
const userRoles = ['STUDENT', 'ALUM', 'MENTOR'];
const departments = ['CSE', 'ECE', 'ME', 'EE', 'IT', 'CIVIL'];
const branches = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Electrical',
];
const skillsList = [
  'JavaScript',
  'Python',
  'Java',
  'React',
  'Node.js',
  'AWS',
  'Docker',
  'Kubernetes',
  'MongoDB',
  'PostgreSQL',
];
const postTypes = ['UPDATE', 'QUESTION', 'ANNOUNCEMENT', 'DISCUSSION'];
const interests = [
  'AI/ML',
  'Web Development',
  'Mobile Apps',
  'Cloud Computing',
  'DevOps',
  'Cybersecurity',
];

// Test data generator
function generateTestUser(index) {
  const timestamp = Date.now();
  const role = randomItem(userRoles);
  return {
    email: `loadtest-${role.toLowerCase()}-${index}-${timestamp}@kiit.ac.in`,
    password: 'SecurePass123!@#',
    name: `LoadTest ${role} User ${index}`,
    role: role,
    graduationYear: role === 'STUDENT' ? 2025 : 2020,
  };
}

export function setup() {
  console.log('Setting up advanced load test environment...');

  // Create multiple test users for different scenarios
  const testUsers = [];
  const tokens = [];

  for (let i = 0; i < 5; i++) {
    const user = generateTestUser(i);

    // Register user
    const signupRes = http.post(
      `${BASE_URL}${API_PREFIX}/auth/signup`,
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (signupRes.status === 201 || signupRes.status === 409) {
      // Login
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
        const token = body.access_token || body.data?.access_token;
        tokens.push(token);
        testUsers.push({ ...user, token });
      }
    }

    sleep(0.5); // Avoid rate limiting during setup
  }

  console.log(`Setup complete. Created ${testUsers.length} test users.`);
  return { testUsers, tokens };
}

export default function (data) {
  // Randomly select user for this iteration
  const userIndex = randomIntBetween(0, data.testUsers.length - 1);
  const token = data.tokens[userIndex];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  concurrentUsers.add(1);

  // Simulate realistic user behavior patterns (80% normal, 15% power users, 5% edge cases)
  const userBehavior = randomIntBetween(1, 100);

  if (userBehavior <= 80) {
    // Normal user behavior
    normalUserWorkflow(headers);
  } else if (userBehavior <= 95) {
    // Power user behavior (more interactions)
    powerUserWorkflow(headers);
  } else {
    // Edge case scenarios
    edgeCaseWorkflow(headers);
  }

  concurrentUsers.add(-1);
}

// Normal user workflow - typical daily usage
function normalUserWorkflow(headers) {
  group('Normal User - Profile & Feed', function () {
    // View own profile
    let res = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
      tags: { endpoint: 'profile' },
    });
    validateResponse(res, 'Profile retrieval', [200]);
    sleep(randomIntBetween(1, 3));

    // Browse posts feed with pagination
    const page = randomIntBetween(1, 5);
    res = http.get(`${BASE_URL}${API_PREFIX}/post?page=${page}&limit=20`, {
      headers,
      tags: { endpoint: 'posts' },
    });
    const postsSuccess = check(res, {
      'Posts feed loaded': (r) => r.status === 200,
      'Posts contain data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.posts && Array.isArray(body.posts);
        } catch {
          return false;
        }
      },
    });
    if (!postsSuccess) businessLogicErrors.add(1);
    sleep(randomIntBetween(2, 4));
  });

  group('Normal User - Social Interactions', function () {
    // Check notifications
    let res = http.get(`${BASE_URL}${API_PREFIX}/notification`, {
      headers,
      tags: { endpoint: 'notifications' },
    });
    validateResponse(res, 'Notifications', [200]);
    sleep(1);

    // View connections
    res = http.get(`${BASE_URL}${API_PREFIX}/connection`, {
      headers,
      tags: { endpoint: 'connections' },
    });
    validateResponse(res, 'Connections', [200]);
    sleep(randomIntBetween(1, 2));

    // Browse referrals
    res = http.get(`${BASE_URL}${API_PREFIX}/referral?page=1&limit=10`, {
      headers,
      tags: { endpoint: 'referrals' },
    });
    validateResponse(res, 'Referrals', [200]);
    sleep(2);
  });
}

// Power user workflow - heavy usage patterns
function powerUserWorkflow(headers) {
  group('Power User - Content Creation', function () {
    // Create a post
    const postData = {
      subject: `Load Test Post ${Date.now()}`,
      content: `This is a test post created during load testing. ${randomString(100)}`,
      type: randomItem(postTypes),
    };

    let res = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify(postData),
      { headers, tags: { endpoint: 'posts' } },
    );

    const postCreated = check(res, {
      'Post created successfully': (r) => r.status === 201 || r.status === 200,
      'Post has ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined;
        } catch {
          return false;
        }
      },
    });
    if (!postCreated) businessLogicErrors.add(1);
    sleep(1);

    // Update profile
    const profileUpdate = {
      bio: `Updated bio ${Date.now()}`,
      location: 'Bhubaneswar',
      interests: randomItem(interests),
    };

    res = http.patch(
      `${BASE_URL}${API_PREFIX}/profile`,
      JSON.stringify(profileUpdate),
      { headers, tags: { endpoint: 'profile' } },
    );
    validateResponse(res, 'Profile update', [200]);
    sleep(1);
  });

  group('Power User - Search & Discovery', function () {
    // Search users
    const searchQuery = randomItem([
      'student',
      'alumni',
      'mentor',
      'developer',
    ]);
    let res = http.get(
      `${BASE_URL}${API_PREFIX}/user/search?q=${searchQuery}&limit=20`,
      { headers, tags: { endpoint: 'search' } },
    );
    validateResponse(res, 'User search', [200]);
    sleep(1);

    // Browse mentorship listings
    res = http.get(
      `${BASE_URL}${API_PREFIX}/mentorship/listings?page=1&limit=15`,
      { headers, tags: { endpoint: 'mentorship' } },
    );
    validateResponse(res, 'Mentorship listings', [200]);
    sleep(1);

    // View showcase projects
    res = http.get(
      `${BASE_URL}${API_PREFIX}/showcase/project?page=1&limit=10`,
      { headers, tags: { endpoint: 'showcase' } },
    );
    validateResponse(res, 'Showcase projects', [200]);
    sleep(2);
  });

  group('Power User - Messaging', function () {
    // Get conversations
    let res = http.get(`${BASE_URL}${API_PREFIX}/messaging/conversations`, {
      headers,
      tags: { endpoint: 'messaging' },
    });
    validateResponse(res, 'Get conversations', [200]);
    sleep(1);
  });
}

// Edge case scenarios - boundary conditions and error handling
function edgeCaseWorkflow(headers) {
  group('Edge Cases - Input Validation', function () {
    // Test pagination limits
    let res = http.get(`${BASE_URL}${API_PREFIX}/post?page=999&limit=100`, {
      headers,
      tags: { endpoint: 'posts' },
    });
    check(res, {
      'Large pagination handled': (r) => r.status === 200 || r.status === 400,
    });
    sleep(0.5);

    // Test invalid post creation (empty content)
    res = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify({ subject: 'Test', content: '' }),
      { headers, tags: { endpoint: 'posts' } },
    );
    check(res, {
      'Empty content rejected': (r) => r.status === 400 || r.status === 422,
    });
    sleep(0.5);

    // Test SQL injection attempt (should be sanitized)
    const maliciousQuery = "'; DROP TABLE users; --";
    res = http.get(
      `${BASE_URL}${API_PREFIX}/user/search?q=${encodeURIComponent(maliciousQuery)}`,
      { headers, tags: { endpoint: 'search' } },
    );
    const injectionBlocked = check(res, {
      'SQL injection blocked': (r) => r.status !== 500,
      'Returns empty or error': (r) => r.status === 200 || r.status === 400,
    });
    if (!injectionBlocked) businessLogicErrors.add(1);
    sleep(0.5);
  });

  group('Edge Cases - Concurrent Operations', function () {
    // Rapid successive requests (test rate limiting)
    const batch = http.batch([
      ['GET', `${BASE_URL}${API_PREFIX}/profile/me`, null, { headers }],
      ['GET', `${BASE_URL}${API_PREFIX}/notification`, null, { headers }],
      ['GET', `${BASE_URL}${API_PREFIX}/connection`, null, { headers }],
      [
        'GET',
        `${BASE_URL}${API_PREFIX}/post?page=1&limit=10`,
        null,
        { headers },
      ],
    ]);

    let throttled = false;
    batch.forEach((res, index) => {
      if (res.status === 429) throttled = true;
      check(res, {
        [`Batch request ${index} completed`]: (r) =>
          r.status === 200 || r.status === 429,
      });
    });

    if (throttled) {
      check(true, { 'Rate limiting active': () => true });
    }
    sleep(1);
  });

  group('Edge Cases - Resource Not Found', function () {
    // Non-existent profile
    let res = http.get(
      `${BASE_URL}${API_PREFIX}/profile/non-existent-user-id-12345`,
      { headers, tags: { endpoint: 'profile' } },
    );
    check(res, {
      'Non-existent profile returns 404': (r) => r.status === 404,
    });
    sleep(0.5);

    // Invalid post ID
    res = http.get(`${BASE_URL}${API_PREFIX}/post/invalid-post-id-67890`, {
      headers,
      tags: { endpoint: 'posts' },
    });
    check(res, {
      'Invalid post returns 404': (r) => r.status === 404 || r.status === 400,
    });
    sleep(0.5);
  });
}

// Helper function to validate responses
function validateResponse(res, description, validStatuses) {
  const success = check(res, {
    [`${description}: valid status`]: (r) => validStatuses.includes(r.status),
    [`${description}: has body`]: (r) => r.body && r.body.length > 0,
    [`${description}: response time acceptable`]: (r) =>
      r.timings.duration < 2000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);
  if (success) successfulRequests.add(1);

  return success;
}

export function teardown(data) {
  console.log('\n========== Advanced Load Test Summary ==========');
  console.log(`Test Users Created: ${data.testUsers.length}`);
  console.log('Test completed. Review metrics for detailed analysis.');
  console.log('=================================================\n');
}
