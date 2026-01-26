import { Test } from '@k6/core';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Soak test - run for extended period to detect memory leaks
export const options = {
  stages: [
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '30m', target: 50 }, // Stay at 50 users for 30 minutes
    { duration: '1m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  const signupRes = http.post(
    `${BASE_URL}/api/auth/signup`,
    JSON.stringify({
      email: `soak-${Date.now()}@kiit.ac.in`,
      password: 'Test123!@#',
      name: 'Soak Test User',
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
        email: `soak-${Date.now()}@kiit.ac.in`,
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

  // Simulate realistic user behavior

  // Check profile
  http.get(`${BASE_URL}/api/users/me`, { headers });
  sleep(2);

  // Browse posts
  http.get(`${BASE_URL}/api/posts?page=1&limit=20`, { headers });
  sleep(3);

  // Check notifications
  http.get(`${BASE_URL}/api/notification`, { headers });
  sleep(2);

  // View connections
  http.get(`${BASE_URL}/api/connection`, { headers });
  sleep(4);

  // Browse referrals
  http.get(`${BASE_URL}/api/referral?page=1&limit=10`, { headers });
  sleep(3);
}
