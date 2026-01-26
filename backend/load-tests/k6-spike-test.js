import { Test } from '@k6/core';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Spike test configuration - sudden traffic surge
export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Start with 10 users
    { duration: '5s', target: 500 }, // Spike to 500 users immediately
    { duration: '30s', target: 500 }, // Stay at 500 for 30s
    { duration: '10s', target: 10 }, // Drop back down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // More lenient during spike
    http_req_failed: ['rate<0.05'], // Allow 5% error during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  const signupRes = http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify({
      email: `spike-${Date.now()}@kiit.ac.in`,
      password: 'Test123!@#',
      name: 'Spike Test User',
      role: 'STUDENT',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (signupRes.status === 201 || signupRes.status === 409) {
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: `spike-${Date.now()}@kiit.ac.in`,
        password: 'Test123!@#',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const body = JSON.parse(loginRes.body);
    return { token: body.access_token || body.data?.access_token };
  }

  return { token: '' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Mix of different endpoints
  const endpoints = [
    '/api/users/me',
    '/api/posts?page=1&limit=10',
    '/api/connection',
    '/api/notification',
    '/api/referral?page=1&limit=10',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`, { headers });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
  responseTime.add(res.timings.duration);

  sleep(0.5); // Short sleep during spike test
}
