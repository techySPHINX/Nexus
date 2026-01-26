import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import {
  randomIntBetween,
  randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Real user behavior metrics
const userSessionDuration = new Trend('user_session_duration');
const pageViews = new Counter('page_views');
const bounceRate = new Rate('bounce_rate');
const conversionRate = new Rate('conversion_rate');
const featureAdoption = new Rate('feature_adoption');
const userSatisfaction = new Gauge('user_satisfaction_score');

export const options = {
  scenarios: {
    // Morning rush (8 AM - 10 AM)
    morning_users: {
      executor: 'ramping-vus',
      startTime: '0s',
      stages: [
        { duration: '10m', target: 50 },
        { duration: '30m', target: 100 },
        { duration: '10m', target: 80 },
      ],
      exec: 'morningUserBehavior',
    },
    // Lunch break (12 PM - 2 PM)
    lunch_users: {
      executor: 'ramping-vus',
      startTime: '50m',
      stages: [
        { duration: '5m', target: 30 },
        { duration: '20m', target: 60 },
        { duration: '5m', target: 20 },
      ],
      exec: 'lunchUserBehavior',
    },
    // Evening peak (5 PM - 8 PM)
    evening_users: {
      executor: 'ramping-vus',
      startTime: '80m',
      stages: [
        { duration: '15m', target: 80 },
        { duration: '45m', target: 150 },
        { duration: '30m', target: 100 },
        { duration: '10m', target: 50 },
      ],
      exec: 'eveningUserBehavior',
    },
    // Night owls (10 PM - 12 AM)
    night_users: {
      executor: 'ramping-vus',
      startTime: '180m',
      stages: [
        { duration: '20m', target: 40 },
        { duration: '40m', target: 50 },
        { duration: '20m', target: 20 },
      ],
      exec: 'nightUserBehavior',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],
    bounce_rate: ['rate<0.30'],
    conversion_rate: ['rate>0.20'],
    feature_adoption: ['rate>0.40'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

export function setup() {
  console.log('📊 Realistic User Behavior Simulation');
  console.log('Simulating real user patterns throughout the day\\n');

  const testUsers = [];
  const roles = ['STUDENT', 'ALUM', 'MENTOR'];

  for (let i = 0; i < 30; i++) {
    const role = roles[i % roles.length];
    const user = {
      email: `realistic-user-${i}-${Date.now()}@kiit.ac.in`,
      password: 'Realistic123!@#',
      name: `User ${i}`,
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

// Morning users: Quick check-ins, news reading, job hunting
export function morningUserBehavior(data) {
  const sessionStart = Date.now();
  const user = data.testUsers[__VU % data.testUsers.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user.token}`,
  };

  group('Morning User Session', function () {
    let bounced = true;
    let converted = false;

    // Landing - Check notifications
    const notifRes = http.get(`${BASE_URL}${API_PREFIX}/notification`, {
      headers,
    });
    pageViews.add(1);

    if (notifRes.status === 200) {
      bounced = false;

      // Read news feed (typical morning activity)
      sleep(randomIntBetween(2, 5));
      const feedRes = http.get(
        `${BASE_URL}${API_PREFIX}/post?page=1&limit=20`,
        { headers },
      );
      pageViews.add(1);

      // 60% chance: Check job referrals
      if (Math.random() < 0.6) {
        sleep(randomIntBetween(3, 8));
        const referralsRes = http.get(`${BASE_URL}${API_PREFIX}/referral`, {
          headers,
        });
        pageViews.add(1);

        // 30% apply to a referral (conversion)
        if (Math.random() < 0.3 && referralsRes.status === 200) {
          try {
            const body = JSON.parse(referralsRes.body);
            const data = body.data || body;
            const referrals = Array.isArray(data) ? data : data.items || [];

            if (referrals.length > 0) {
              const referral = referrals[0];
              sleep(randomIntBetween(5, 15));

              const applyRes = http.post(
                `${BASE_URL}${API_PREFIX}/referral/${referral.id}/apply`,
                JSON.stringify({ coverLetter: 'Interested in this position' }),
                { headers },
              );

              if (applyRes.status === 201) {
                converted = true;
                featureAdoption.add(true);
              }
            }
          } catch {}
        }
      }

      // 40% chance: Quick profile check
      if (Math.random() < 0.4) {
        sleep(randomIntBetween(1, 3));
        http.get(`${BASE_URL}${API_PREFIX}/profile/me`, { headers });
        pageViews.add(1);
      }
    }

    bounceRate.add(bounced);
    conversionRate.add(converted);

    const sessionDuration = (Date.now() - sessionStart) / 1000;
    userSessionDuration.add(sessionDuration);

    // Morning users are rushed - shorter sessions
    if (sessionDuration > 30) {
      userSatisfaction.add(70); // Decent but not long engagement
    } else {
      userSatisfaction.add(60);
    }
  });

  sleep(randomIntBetween(30, 120)); // Between sessions
}

// Lunch users: Social browsing, quick posts, networking
export function lunchUserBehavior(data) {
  const sessionStart = Date.now();
  const user = data.testUsers[__VU % data.testUsers.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user.token}`,
  };

  group('Lunch User Session', function () {
    let bounced = true;
    let converted = false;

    // Browse feed
    const feedRes = http.get(`${BASE_URL}${API_PREFIX}/post?page=1&limit=20`, {
      headers,
    });
    pageViews.add(1);

    if (feedRes.status === 200) {
      bounced = false;
      sleep(randomIntBetween(5, 10));

      // 70% interact with posts
      if (Math.random() < 0.7) {
        try {
          const body = JSON.parse(feedRes.body);
          const data = body.data || body;
          const posts = Array.isArray(data) ? data : data.items || [];

          if (posts.length > 0) {
            const post = posts[0];

            // Like a post
            sleep(randomIntBetween(1, 3));
            http.post(`${BASE_URL}${API_PREFIX}/post/${post.id}/like`, null, {
              headers,
            });
            featureAdoption.add(true);

            // 40% also comment
            if (Math.random() < 0.4) {
              sleep(randomIntBetween(5, 15));
              http.post(
                `${BASE_URL}${API_PREFIX}/post/${post.id}/comment`,
                JSON.stringify({ content: 'Great post!' }),
                { headers },
              );
              converted = true;
            }
          }
        } catch {}
      }

      // 50% create own post (lunch thoughts)
      if (Math.random() < 0.5) {
        sleep(randomIntBetween(10, 30));
        const postRes = http.post(
          `${BASE_URL}${API_PREFIX}/post`,
          JSON.stringify({
            subject: 'Lunch break thoughts',
            content: `Just finished a great session! #${Date.now()}`,
            type: 'UPDATE',
          }),
          { headers },
        );
        pageViews.add(1);

        if (postRes.status === 201) {
          converted = true;
          featureAdoption.add(true);
        }
      }

      // 30% check messages
      if (Math.random() < 0.3) {
        sleep(randomIntBetween(2, 5));
        http.get(`${BASE_URL}${API_PREFIX}/messaging/conversations`, {
          headers,
        });
        pageViews.add(1);
        featureAdoption.add(true);
      }
    }

    bounceRate.add(bounced);
    conversionRate.add(converted);

    const sessionDuration = (Date.now() - sessionStart) / 1000;
    userSessionDuration.add(sessionDuration);

    if (sessionDuration > 60) {
      userSatisfaction.add(85); // Good engagement
    } else {
      userSatisfaction.add(75);
    }
  });

  sleep(randomIntBetween(20, 90));
}

// Evening users: High engagement, networking, exploring
export function eveningUserBehavior(data) {
  const sessionStart = Date.now();
  const user = data.testUsers[__VU % data.testUsers.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user.token}`,
  };

  group('Evening User Session', function () {
    let bounced = true;
    let converted = false;
    let featuresUsed = 0;

    // Comprehensive session - profile first
    const profileRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
    });
    pageViews.add(1);

    if (profileRes.status === 200) {
      bounced = false;
      sleep(randomIntBetween(3, 7));

      // Browse feed thoroughly
      for (let page = 1; page <= 3; page++) {
        http.get(`${BASE_URL}${API_PREFIX}/post?page=${page}&limit=20`, {
          headers,
        });
        pageViews.add(1);
        sleep(randomIntBetween(10, 20));
      }

      // Networking activities (high evening engagement)
      sleep(randomIntBetween(5, 10));

      // Search for connections
      const searchRes = http.get(
        `${BASE_URL}${API_PREFIX}/user/search?q=engineer&limit=20`,
        { headers },
      );
      pageViews.add(1);
      featuresUsed++;

      if (searchRes.status === 200) {
        try {
          const body = JSON.parse(searchRes.body);
          const data = body.data || body;
          const users = Array.isArray(data) ? data : data.items || [];

          if (users.length > 0) {
            // Send connection requests
            for (let i = 0; i < Math.min(2, users.length); i++) {
              sleep(randomIntBetween(5, 10));
              const connectRes = http.post(
                `${BASE_URL}${API_PREFIX}/connection/send`,
                JSON.stringify({ recipientEmail: users[i].email }),
                { headers },
              );

              if (connectRes.status === 201) {
                converted = true;
                featuresUsed++;
              }
            }
          }
        } catch {}
      }

      // Explore showcase projects
      sleep(randomIntBetween(3, 7));
      const showcaseRes = http.get(
        `${BASE_URL}${API_PREFIX}/showcase/project`,
        { headers },
      );
      pageViews.add(1);
      featuresUsed++;

      // Check mentorship opportunities
      if (user.role === 'STUDENT') {
        sleep(randomIntBetween(5, 10));
        http.get(`${BASE_URL}${API_PREFIX}/mentorship/mentors`, { headers });
        pageViews.add(1);
        featuresUsed++;

        // 50% create mentorship request
        if (Math.random() < 0.5) {
          sleep(randomIntBetween(15, 30));
          const mentorshipRes = http.post(
            `${BASE_URL}${API_PREFIX}/mentorship/request`,
            JSON.stringify({
              description: 'Looking for career guidance',
              preferredAreas: ['Career', 'Technical Skills'],
            }),
            { headers },
          );

          if (mentorshipRes.status === 201) {
            converted = true;
            featuresUsed++;
          }
        }
      }

      // Update profile (evening reflection)
      if (Math.random() < 0.4) {
        sleep(randomIntBetween(10, 20));
        http.patch(
          `${BASE_URL}${API_PREFIX}/profile`,
          JSON.stringify({
            bio: `Updated bio - ${Date.now()}`,
          }),
          { headers },
        );
        featuresUsed++;
      }

      // Messaging (evening conversations)
      sleep(randomIntBetween(5, 10));
      const convoRes = http.get(
        `${BASE_URL}${API_PREFIX}/messaging/conversations`,
        { headers },
      );
      pageViews.add(1);

      if (convoRes.status === 200) {
        try {
          const body = JSON.parse(convoRes.body);
          const data = body.data || body;
          const convos = Array.isArray(data) ? data : data.items || [];

          if (convos.length > 0) {
            // Reply to messages
            const convo = convos[0];
            sleep(randomIntBetween(10, 30));

            http.post(
              `${BASE_URL}${API_PREFIX}/messaging/conversation/${convo.id}/message`,
              JSON.stringify({ content: 'Thanks for reaching out!' }),
              { headers },
            );
            featuresUsed++;
            converted = true;
          }
        } catch {}
      }
    }

    bounceRate.add(bounced);
    conversionRate.add(converted);
    featureAdoption.add(featuresUsed >= 3);

    const sessionDuration = (Date.now() - sessionStart) / 1000;
    userSessionDuration.add(sessionDuration);

    if (sessionDuration > 180 && featuresUsed >= 5) {
      userSatisfaction.add(95); // Highly engaged
    } else if (sessionDuration > 120) {
      userSatisfaction.add(88);
    } else {
      userSatisfaction.add(80);
    }
  });

  sleep(randomIntBetween(40, 180));
}

// Night users: Casual browsing, catching up
export function nightUserBehavior(data) {
  const sessionStart = Date.now();
  const user = data.testUsers[__VU % data.testUsers.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${user.token}`,
  };

  group('Night User Session', function () {
    let bounced = true;
    let converted = false;

    // Casual feed browsing
    const feedRes = http.get(`${BASE_URL}${API_PREFIX}/post?page=1&limit=20`, {
      headers,
    });
    pageViews.add(1);

    if (feedRes.status === 200) {
      bounced = false;
      sleep(randomIntBetween(10, 20)); // Slower, relaxed reading

      // 50% check notifications
      if (Math.random() < 0.5) {
        const notifRes = http.get(`${BASE_URL}${API_PREFIX}/notification`, {
          headers,
        });
        pageViews.add(1);
        sleep(randomIntBetween(5, 10));
      }

      // 40% like posts casually
      if (Math.random() < 0.4) {
        try {
          const body = JSON.parse(feedRes.body);
          const data = body.data || body;
          const posts = Array.isArray(data) ? data : data.items || [];

          if (posts.length > 0) {
            sleep(randomIntBetween(3, 7));
            http.post(
              `${BASE_URL}${API_PREFIX}/post/${posts[0].id}/like`,
              null,
              { headers },
            );
            converted = true;
            featureAdoption.add(true);
          }
        } catch {}
      }

      // 30% check profile stats
      if (Math.random() < 0.3) {
        sleep(randomIntBetween(5, 10));
        http.get(`${BASE_URL}${API_PREFIX}/profile/me`, { headers });
        pageViews.add(1);
      }
    }

    bounceRate.add(bounced);
    conversionRate.add(converted);

    const sessionDuration = (Date.now() - sessionStart) / 1000;
    userSessionDuration.add(sessionDuration);

    // Night users have varied satisfaction
    if (sessionDuration > 60) {
      userSatisfaction.add(78);
    } else {
      userSatisfaction.add(65);
    }
  });

  sleep(randomIntBetween(60, 300)); // Longer gaps at night
}

export function teardown(data) {
  console.log('\\n========== Realistic User Behavior Results ==========');
  console.log('Simulated full day of user activity patterns');
  console.log('Morning rush: Quick check-ins and job hunting');
  console.log('Lunch break: Social interaction and posting');
  console.log('Evening peak: High engagement and networking');
  console.log('Night time: Casual browsing and catching up');
  console.log('');
  console.log('Review metrics for:');
  console.log('- User session duration trends');
  console.log('- Bounce rates by time of day');
  console.log('- Feature adoption patterns');
  console.log('- Conversion rates for key actions');
  console.log('=====================================================\\n');
}
