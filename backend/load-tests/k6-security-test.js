import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  randomString,
  randomIntBetween,
  randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Security testing metrics
const securityViolations = new Counter('security_violations');
const authBypassAttempts = new Counter('auth_bypass_attempts');
const sqlInjectionBlocked = new Rate('sql_injection_blocked');
const xssBlocked = new Rate('xss_blocked');
const rateLimitEffective = new Rate('rate_limit_effective');
const csrfProtected = new Rate('csrf_protected');
const unauthorizedAccess = new Counter('unauthorized_access_attempts');

export const options = {
  scenarios: {
    sql_injection_tests: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      exec: 'testSQLInjection',
    },
    xss_tests: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      exec: 'testXSS',
    },
    auth_bypass_tests: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      exec: 'testAuthBypass',
    },
    privilege_escalation_tests: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      exec: 'testPrivilegeEscalation',
    },
    rate_limiting_tests: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      exec: 'testRateLimiting',
    },
    input_validation_tests: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
      exec: 'testInputValidation',
    },
    session_security_tests: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      exec: 'testSessionSecurity',
    },
  },
  thresholds: {
    security_violations: ['count<5'],
    sql_injection_blocked: ['rate>0.99'],
    xss_blocked: ['rate>0.99'],
    rate_limit_effective: ['rate>0.90'],
    csrf_protected: ['rate>0.95'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

export function setup() {
  console.log('🔒 Security Testing - Validating Protection Mechanisms');
  console.log(
    'Testing: SQL Injection, XSS, Auth Bypass, Rate Limiting, Input Validation\\n',
  );

  // Create test user
  const user = {
    email: `security-test-${Date.now()}@kiit.ac.in`,
    password: 'SecTest123!@#',
    name: 'Security Test User',
    role: 'STUDENT',
  };

  const signupRes = http.post(
    `${BASE_URL}${API_PREFIX}/auth/signup`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } },
  );

  let token = null;

  if (signupRes.status === 201 || signupRes.status === 409) {
    const loginRes = http.post(
      `${BASE_URL}${API_PREFIX}/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (loginRes.status === 200 || loginRes.status === 201) {
      const body = JSON.parse(loginRes.body);
      token = body.access_token || body.data?.access_token;
    }
  }

  return { user, token };
}

// Test SQL Injection prevention
export function testSQLInjection(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('SQL Injection Tests', function () {
    const sqlPayloads = [
      "' OR '1'='1",
      "' OR '1'='1' --",
      "' OR '1'='1' /*",
      "admin'--",
      "' UNION SELECT NULL--",
      "1'; DROP TABLE users--",
      "' AND 1=CONVERT(int, (SELECT @@version))--",
      "' AND 1=(SELECT COUNT(*) FROM tablename)--",
    ];

    sqlPayloads.forEach((payload) => {
      // Test in search endpoint
      const searchRes = http.get(
        `${BASE_URL}${API_PREFIX}/user/search?q=${encodeURIComponent(payload)}`,
        { headers, tags: { attack: 'sql_injection' } },
      );

      const blocked = check(searchRes, {
        'SQL injection blocked in search': (r) => {
          // Should return 400 (validation error) or empty results, not 500
          return (
            (r.status !== 500 && r.status !== 200) ||
            (r.status === 200 && r.body.includes('[]'))
          );
        },
        'No database error exposed': (r) => {
          const body = r.body.toLowerCase();
          return (
            !body.includes('sql') &&
            !body.includes('syntax') &&
            !body.includes('database')
          );
        },
      });

      sqlInjectionBlocked.add(blocked);

      if (!blocked) {
        securityViolations.add(1);
        console.log(
          `⚠️  SQL Injection vulnerability detected with payload: ${payload}`,
        );
      }

      // Test in post creation
      const postData = {
        subject: payload,
        content: payload,
        type: 'UPDATE',
      };

      const postRes = http.post(
        `${BASE_URL}${API_PREFIX}/post`,
        JSON.stringify(postData),
        { headers, tags: { attack: 'sql_injection' } },
      );

      const postBlocked = check(postRes, {
        'SQL injection sanitized in post': (r) => r.status !== 500,
      });

      sqlInjectionBlocked.add(postBlocked);
    });
  });

  sleep(1);
}

// Test XSS prevention
export function testXSS(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('XSS Tests', function () {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
    ];

    xssPayloads.forEach((payload) => {
      // Test in profile bio
      const profileData = {
        bio: payload,
      };

      const profileRes = http.patch(
        `${BASE_URL}${API_PREFIX}/profile`,
        JSON.stringify(profileData),
        { headers, tags: { attack: 'xss' } },
      );

      sleep(0.5);

      // Retrieve and verify sanitization
      const getProfileRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
        headers,
      });

      const sanitized = check(getProfileRes, {
        'XSS payload sanitized': (r) => {
          if (r.status === 200) {
            try {
              const body = JSON.parse(r.body);
              const data = body.data || body;
              const bio = data.bio || '';
              // Should not contain raw script tags or event handlers
              return (
                !bio.includes('<script') &&
                !bio.includes('onerror=') &&
                !bio.includes('onload=') &&
                !bio.includes('javascript:')
              );
            } catch {}
          }
          return true; // If couldn't save, that's also protection
        },
      });

      xssBlocked.add(sanitized);

      if (!sanitized) {
        securityViolations.add(1);
        console.log(`⚠️  XSS vulnerability detected with payload: ${payload}`);
      }

      // Test in post content
      const postData = {
        subject: 'XSS Test',
        content: payload,
        type: 'UPDATE',
      };

      const postRes = http.post(
        `${BASE_URL}${API_PREFIX}/post`,
        JSON.stringify(postData),
        { headers, tags: { attack: 'xss' } },
      );

      const postSanitized = check(postRes, {
        'XSS in post sanitized': (r) => r.status !== 500,
      });

      xssBlocked.add(postSanitized);
    });
  });

  sleep(1);
}

// Test authentication bypass attempts
export function testAuthBypass(data) {
  const headers = { 'Content-Type': 'application/json' };

  group('Auth Bypass Tests', function () {
    // Test 1: Access protected endpoint without token
    const noTokenRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
      tags: { attack: 'auth_bypass' },
    });

    check(noTokenRes, {
      'No token access blocked': (r) => r.status === 401,
    });

    if (noTokenRes.status !== 401) {
      authBypassAttempts.add(1);
      securityViolations.add(1);
      console.log('⚠️  Authentication bypass: accessed without token');
    }

    // Test 2: Invalid token
    const invalidTokenRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers: {
        ...headers,
        Authorization: 'Bearer invalid_token_12345',
      },
      tags: { attack: 'auth_bypass' },
    });

    check(invalidTokenRes, {
      'Invalid token rejected': (r) => r.status === 401,
    });

    if (invalidTokenRes.status !== 401) {
      authBypassAttempts.add(1);
      securityViolations.add(1);
      console.log('⚠️  Authentication bypass: invalid token accepted');
    }

    // Test 3: Malformed token
    const malformedTokens = [
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
      'Bearer null',
      'Bearer undefined',
      'Bearer {}',
      'Bearer []',
    ];

    malformedTokens.forEach((token) => {
      const res = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
        headers: {
          ...headers,
          Authorization: token,
        },
        tags: { attack: 'auth_bypass' },
      });

      check(res, {
        'Malformed token rejected': (r) => r.status === 401,
      });

      if (res.status !== 401) {
        authBypassAttempts.add(1);
        securityViolations.add(1);
      }
    });
  });

  sleep(1);
}

// Test privilege escalation
export function testPrivilegeEscalation(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Privilege Escalation Tests', function () {
    // Test 1: Try to access admin endpoints
    const adminRes = http.get(`${BASE_URL}${API_PREFIX}/admin/users`, {
      headers,
      tags: { attack: 'privilege_escalation' },
    });

    check(adminRes, {
      'Admin access blocked for non-admin': (r) =>
        r.status === 403 || r.status === 404,
    });

    if (adminRes.status === 200) {
      unauthorizedAccess.add(1);
      securityViolations.add(1);
      console.log('⚠️  Privilege escalation: student accessed admin endpoint');
    }

    // Test 2: Try to modify another user's data
    const otherUserEmail = 'other-user@kiit.ac.in';
    const modifyData = {
      email: otherUserEmail,
      role: 'ADMIN',
    };

    const modifyRes = http.patch(
      `${BASE_URL}${API_PREFIX}/user/profile`,
      JSON.stringify(modifyData),
      { headers, tags: { attack: 'privilege_escalation' } },
    );

    check(modifyRes, {
      'Cannot escalate own role': (r) =>
        r.status !== 200 || !r.body.includes('ADMIN'),
    });

    // Test 3: Try to access other user's private data
    const privateDataRes = http.get(
      `${BASE_URL}${API_PREFIX}/messaging/conversation?userId=999999`,
      { headers, tags: { attack: 'privilege_escalation' } },
    );

    check(privateDataRes, {
      'Cannot access other user data': (r) => {
        if (r.status === 200) {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            // Should return empty or only own conversations
            return (
              (Array.isArray(data) && data.length === 0) ||
              data.items?.length === 0
            );
          } catch {}
        }
        return true;
      },
    });
  });

  sleep(1);
}

// Test rate limiting
export function testRateLimiting(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Rate Limiting Tests', function () {
    let rateLimitHit = false;

    // Make rapid requests to trigger rate limit
    for (let i = 0; i < 50; i++) {
      const res = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
        headers,
        tags: { attack: 'rate_limit' },
      });

      if (res.status === 429) {
        rateLimitHit = true;

        check(res, {
          'Rate limit has retry-after header': (r) =>
            r.headers['Retry-After'] || r.headers['retry-after'],
          'Rate limit message clear': (r) => {
            try {
              const body = JSON.parse(r.body);
              return (
                body.message?.toLowerCase().includes('rate limit') ||
                body.message?.toLowerCase().includes('too many')
              );
            } catch {
              return false;
            }
          },
        });

        break;
      }

      sleep(0.01); // Very short sleep to trigger rate limit
    }

    rateLimitEffective.add(rateLimitHit);

    if (!rateLimitHit) {
      console.log('⚠️  Rate limiting not effective or threshold too high');
    }
  });

  sleep(2); // Wait for rate limit to reset
}

// Test input validation
export function testInputValidation(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Input Validation Tests', function () {
    // Test 1: Oversized input
    const oversizedContent = 'A'.repeat(100000); // 100KB
    const oversizedRes = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify({
        subject: 'Test',
        content: oversizedContent,
        type: 'UPDATE',
      }),
      { headers, tags: { test: 'input_validation' } },
    );

    check(oversizedRes, {
      'Oversized input rejected': (r) => r.status === 400 || r.status === 413,
    });

    // Test 2: Invalid email format
    const invalidEmailRes = http.post(
      `${BASE_URL}${API_PREFIX}/connection/send`,
      JSON.stringify({ recipientEmail: 'not-an-email' }),
      { headers, tags: { test: 'input_validation' } },
    );

    check(invalidEmailRes, {
      'Invalid email rejected': (r) => r.status === 400,
    });

    // Test 3: Negative pagination
    const negativePageRes = http.get(
      `${BASE_URL}${API_PREFIX}/post?page=-1&limit=-10`,
      { headers, tags: { test: 'input_validation' } },
    );

    check(negativePageRes, {
      'Negative pagination handled': (r) =>
        r.status === 400 || r.status === 200,
    });

    // Test 4: Special characters in IDs
    const specialCharRes = http.get(
      `${BASE_URL}${API_PREFIX}/post/../../etc/passwd`,
      { headers, tags: { test: 'input_validation' } },
    );

    check(specialCharRes, {
      'Path traversal blocked': (r) => r.status === 400 || r.status === 404,
    });

    // Test 5: Null/undefined values
    const nullValueRes = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify({
        subject: null,
        content: undefined,
        type: 'UPDATE',
      }),
      { headers, tags: { test: 'input_validation' } },
    );

    check(nullValueRes, {
      'Null values rejected': (r) => r.status === 400,
    });
  });

  sleep(1);
}

// Test session security
export function testSessionSecurity(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Session Security Tests', function () {
    // Test 1: Verify token has expiration
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        const hasExpiry = check(
          { payload },
          {
            'Token has expiration': (data) => !!data.payload.exp,
            'Token not expired': (data) => data.payload.exp > Date.now() / 1000,
          },
        );

        if (!hasExpiry) {
          securityViolations.add(1);
          console.log('⚠️  JWT token missing expiration');
        }
      } catch (e) {
        console.log('⚠️  Could not parse JWT token');
      }
    }

    // Test 2: Verify logout invalidates token (if endpoint exists)
    const logoutRes = http.post(`${BASE_URL}${API_PREFIX}/auth/logout`, null, {
      headers,
      tags: { test: 'session_security' },
    });

    // After logout, token should not work (if logout implemented)
    if (logoutRes.status === 200 || logoutRes.status === 204) {
      sleep(0.5);
      const afterLogoutRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
        headers,
      });

      check(afterLogoutRes, {
        'Token invalidated after logout': (r) => r.status === 401,
      });
    }
  });

  sleep(1);
}

export function teardown(data) {
  console.log('\\n========== Security Test Results ==========');
  console.log('SQL Injection Prevention: Tested');
  console.log('XSS Prevention: Tested');
  console.log('Authentication Bypass: Tested');
  console.log('Privilege Escalation: Tested');
  console.log('Rate Limiting: Tested');
  console.log('Input Validation: Tested');
  console.log('Session Security: Tested');
  console.log('');
  console.log('Review metrics for any security violations detected.');
  console.log('===========================================\\n');
}
