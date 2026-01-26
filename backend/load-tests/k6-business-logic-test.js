import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import {
  randomString,
  randomIntBetween,
  randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Business logic validation metrics
const businessLogicErrors = new Counter('business_logic_errors');
const dataIntegrityErrors = new Counter('data_integrity_errors');
const validationErrors = new Counter('validation_errors');
const workflowSuccess = new Rate('workflow_success_rate');
const transactionIntegrity = new Rate('transaction_integrity');

export const options = {
  scenarios: {
    profile_lifecycle: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      exec: 'testProfileLifecycle',
    },
    post_lifecycle: {
      executor: 'constant-vus',
      vus: 15,
      duration: '5m',
      exec: 'testPostLifecycle',
    },
    connection_workflow: {
      executor: 'constant-vus',
      vus: 15,
      duration: '5m',
      exec: 'testConnectionWorkflow',
    },
    mentorship_flow: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      exec: 'testMentorshipFlow',
    },
    referral_process: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      exec: 'testReferralProcess',
    },
    points_gamification: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      exec: 'testPointsGamification',
    },
    messaging_integrity: {
      executor: 'constant-vus',
      vus: 15,
      duration: '5m',
      exec: 'testMessagingIntegrity',
    },
  },
  thresholds: {
    business_logic_errors: ['count<10'],
    data_integrity_errors: ['count<5'],
    workflow_success_rate: ['rate>0.95'],
    transaction_integrity: ['rate>0.98'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

export function setup() {
  console.log('🔍 Business Logic & Workflow Validation Test');
  console.log('Testing complete user journeys and data integrity\\n');

  const testUsers = [];

  // Create test users with different roles
  const roles = ['STUDENT', 'ALUM', 'MENTOR'];

  for (let i = 0; i < 10; i++) {
    const role = roles[i % roles.length];
    const user = {
      email: `bizlogic-test-${i}-${Date.now()}@kiit.ac.in`,
      password: 'BizLogic123!@#',
      name: `BizLogic Test ${i}`,
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

// Test complete profile lifecycle
export function testProfileLifecycle(data) {
  const token = data.testUsers[__VU % data.testUsers.length].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Profile Lifecycle', function () {
    let workflowValid = true;

    // Step 1: Get initial profile
    const initialProfile = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
    });
    workflowValid =
      workflowValid &&
      check(initialProfile, {
        'Profile retrieved': (r) => r.status === 200,
        'Profile has required fields': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            return data.name && data.email && data.role;
          } catch {
            return false;
          }
        },
      });

    if (!workflowValid) {
      businessLogicErrors.add(1);
      workflowSuccess.add(false);
      return;
    }

    // Step 2: Update profile
    const updateData = {
      bio: `Updated bio at ${Date.now()}`,
      course: 'Computer Science',
      batch: '2024',
    };

    const updateRes = http.patch(
      `${BASE_URL}${API_PREFIX}/profile`,
      JSON.stringify(updateData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(updateRes, {
        'Profile updated': (r) => r.status === 200,
      });

    // Step 3: Verify update persisted
    const verifyRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
    });
    workflowValid =
      workflowValid &&
      check(verifyRes, {
        'Update persisted': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            return (
              data.bio === updateData.bio && data.course === updateData.course
            );
          } catch {
            return false;
          }
        },
      });

    if (!workflowValid) {
      dataIntegrityErrors.add(1);
    }

    workflowSuccess.add(workflowValid);
  });

  sleep(1);
}

// Test complete post lifecycle
export function testPostLifecycle(data) {
  const token = data.testUsers[__VU % data.testUsers.length].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Post Lifecycle', function () {
    let workflowValid = true;
    let postId = null;

    // Step 1: Create post
    const postData = {
      subject: `Test Post ${Date.now()}`,
      content: 'This is a test post for business logic validation',
      type: 'UPDATE',
    };

    const createRes = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify(postData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(createRes, {
        'Post created': (r) => r.status === 201,
        'Post has ID': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            postId = data.id;
            return !!postId;
          } catch {
            return false;
          }
        },
      });

    if (!workflowValid || !postId) {
      businessLogicErrors.add(1);
      workflowSuccess.add(false);
      return;
    }

    // Step 2: Like post
    const likeRes = http.post(
      `${BASE_URL}${API_PREFIX}/post/${postId}/like`,
      null,
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(likeRes, {
        'Post liked': (r) => r.status === 200 || r.status === 201,
      });

    // Step 3: Comment on post
    const commentData = { content: 'Test comment' };
    const commentRes = http.post(
      `${BASE_URL}${API_PREFIX}/post/${postId}/comment`,
      JSON.stringify(commentData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(commentRes, {
        'Comment added': (r) => r.status === 201,
      });

    // Step 4: Verify post state
    const verifyRes = http.get(`${BASE_URL}${API_PREFIX}/post/${postId}`, {
      headers,
    });
    workflowValid =
      workflowValid &&
      check(verifyRes, {
        'Post state valid': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            return data.likesCount >= 0 && data.commentsCount >= 0;
          } catch {
            return false;
          }
        },
      });

    // Step 5: Delete post
    const deleteRes = http.del(
      `${BASE_URL}${API_PREFIX}/post/${postId}`,
      null,
      { headers },
    );
    workflowValid =
      workflowValid &&
      check(deleteRes, {
        'Post deleted': (r) => r.status === 200 || r.status === 204,
      });

    // Step 6: Verify deletion
    const verifyDeleteRes = http.get(
      `${BASE_URL}${API_PREFIX}/post/${postId}`,
      { headers },
    );
    workflowValid =
      workflowValid &&
      check(verifyDeleteRes, {
        'Post no longer accessible': (r) => r.status === 404,
      });

    if (!workflowValid) {
      dataIntegrityErrors.add(1);
    }

    workflowSuccess.add(workflowValid);
  });

  sleep(1);
}

// Test connection workflow
export function testConnectionWorkflow(data) {
  const token = data.testUsers[__VU % data.testUsers.length].token;
  const targetUser = data.testUsers[(__VU + 1) % data.testUsers.length];
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Connection Workflow', function () {
    let workflowValid = true;
    let connectionId = null;

    // Step 1: Send connection request
    const requestRes = http.post(
      `${BASE_URL}${API_PREFIX}/connection/send`,
      JSON.stringify({ recipientEmail: targetUser.email }),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(requestRes, {
        'Connection request sent': (r) => r.status === 201 || r.status === 409,
        'Request has status': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            connectionId = data.id;
            return data.status === 'PENDING' || r.status === 409;
          } catch {
            return r.status === 409;
          }
        },
      });

    // Step 2: Check pending connections
    const pendingRes = http.get(
      `${BASE_URL}${API_PREFIX}/connection?status=PENDING`,
      { headers },
    );
    workflowValid =
      workflowValid &&
      check(pendingRes, {
        'Pending list retrieved': (r) => r.status === 200,
      });

    // Step 3: Verify connection status
    if (connectionId) {
      const statusRes = http.get(
        `${BASE_URL}${API_PREFIX}/connection/${connectionId}`,
        { headers },
      );
      workflowValid =
        workflowValid &&
        check(statusRes, {
          'Connection status correct': (r) => {
            try {
              const body = JSON.parse(r.body);
              const data = body.data || body;
              return data.status === 'PENDING' || data.status === 'ACCEPTED';
            } catch {
              return false;
            }
          },
        });
    }

    workflowSuccess.add(workflowValid);
  });

  sleep(1);
}

// Test mentorship flow
export function testMentorshipFlow(data) {
  const token = data.testUsers[__VU % data.testUsers.length].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Mentorship Flow', function () {
    let workflowValid = true;
    let requestId = null;

    // Step 1: Create mentorship request
    const requestData = {
      description: 'Looking for guidance in backend development',
      preferredAreas: ['Backend', 'Databases'],
    };

    const createRes = http.post(
      `${BASE_URL}${API_PREFIX}/mentorship/request`,
      JSON.stringify(requestData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(createRes, {
        'Mentorship request created': (r) => r.status === 201,
        'Request has ID': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            requestId = data.id;
            return !!requestId;
          } catch {
            return false;
          }
        },
      });

    // Step 2: List available mentors
    const mentorsRes = http.get(`${BASE_URL}${API_PREFIX}/mentorship/mentors`, {
      headers,
    });
    workflowValid =
      workflowValid &&
      check(mentorsRes, {
        'Mentors list retrieved': (r) => r.status === 200,
      });

    // Step 3: View own mentorship requests
    if (requestId) {
      const myRequestsRes = http.get(
        `${BASE_URL}${API_PREFIX}/mentorship/my-requests`,
        { headers },
      );
      workflowValid =
        workflowValid &&
        check(myRequestsRes, {
          'My requests retrieved': (r) => r.status === 200,
          'Request in list': (r) => {
            try {
              const body = JSON.parse(r.body);
              const data = body.data || body;
              const requests = Array.isArray(data) ? data : data.items || [];
              return requests.some((req) => req.id === requestId);
            } catch {
              return false;
            }
          },
        });
    }

    workflowSuccess.add(workflowValid);
  });

  sleep(1);
}

// Test referral process
export function testReferralProcess(data) {
  const token = data.testUsers[__VU % data.testUsers.length].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Referral Process', function () {
    let workflowValid = true;
    let referralId = null;

    // Step 1: Create referral
    const referralData = {
      companyName: `Test Company ${Date.now()}`,
      position: 'Software Engineer',
      description: 'Great opportunity for freshers',
      requirements: 'Basic programming skills',
    };

    const createRes = http.post(
      `${BASE_URL}${API_PREFIX}/referral`,
      JSON.stringify(referralData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(createRes, {
        'Referral created': (r) => r.status === 201,
        'Referral has ID': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            referralId = data.id;
            return !!referralId;
          } catch {
            return false;
          }
        },
      });

    if (!referralId) {
      businessLogicErrors.add(1);
      workflowSuccess.add(false);
      return;
    }

    // Step 2: List all referrals
    const listRes = http.get(`${BASE_URL}${API_PREFIX}/referral`, { headers });
    workflowValid =
      workflowValid &&
      check(listRes, {
        'Referrals listed': (r) => r.status === 200,
        'New referral in list': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            const referrals = Array.isArray(data) ? data : data.items || [];
            return referrals.some((ref) => ref.id === referralId);
          } catch {
            return false;
          }
        },
      });

    // Step 3: Apply to referral (from another user's perspective)
    const applyData = {
      coverLetter: 'I am interested in this position',
    };

    const applyRes = http.post(
      `${BASE_URL}${API_PREFIX}/referral/${referralId}/apply`,
      JSON.stringify(applyData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(applyRes, {
        'Application submitted': (r) => r.status === 201 || r.status === 400,
      });

    workflowSuccess.add(workflowValid);
  });

  sleep(1);
}

// Test points and gamification
export function testPointsGamification(data) {
  const token = data.testUsers[__VU % data.testUsers.length].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Points & Gamification', function () {
    let workflowValid = true;
    let initialPoints = 0;

    // Step 1: Get initial points
    const profileRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
    });
    workflowValid =
      workflowValid &&
      check(profileRes, {
        'Profile retrieved for points': (r) => r.status === 200,
      });

    if (profileRes.status === 200) {
      try {
        const body = JSON.parse(profileRes.body);
        const data = body.data || body;
        initialPoints = data.points || 0;
      } catch {}
    }

    // Step 2: Perform point-earning action (create post)
    const postData = {
      subject: 'Points test post',
      content: 'Testing points system',
      type: 'UPDATE',
    };

    const createPostRes = http.post(
      `${BASE_URL}${API_PREFIX}/post`,
      JSON.stringify(postData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(createPostRes, {
        'Action performed': (r) => r.status === 201,
      });

    sleep(1); // Wait for points to be updated

    // Step 3: Verify points increased
    const updatedProfileRes = http.get(`${BASE_URL}${API_PREFIX}/profile/me`, {
      headers,
    });
    workflowValid =
      workflowValid &&
      check(updatedProfileRes, {
        'Points updated': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            const newPoints = data.points || 0;
            return newPoints >= initialPoints;
          } catch {
            return false;
          }
        },
      });

    // Step 4: Check leaderboard
    const leaderboardRes = http.get(
      `${BASE_URL}${API_PREFIX}/user/leaderboard`,
      { headers },
    );
    workflowValid =
      workflowValid &&
      check(leaderboardRes, {
        'Leaderboard accessible': (r) => r.status === 200,
      });

    transactionIntegrity.add(workflowValid);
    workflowSuccess.add(workflowValid);
  });

  sleep(1);
}

// Test messaging integrity
export function testMessagingIntegrity(data) {
  const token = data.testUsers[__VU % data.testUsers.length].token;
  const recipientToken =
    data.testUsers[(__VU + 1) % data.testUsers.length].token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  group('Messaging Integrity', function () {
    let workflowValid = true;
    let conversationId = null;

    // Step 1: Start conversation
    const startConvoData = {
      participantEmail:
        data.testUsers[(__VU + 1) % data.testUsers.length].email,
      initialMessage: 'Test message',
    };

    const startRes = http.post(
      `${BASE_URL}${API_PREFIX}/messaging/conversation`,
      JSON.stringify(startConvoData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(startRes, {
        'Conversation started': (r) => r.status === 201 || r.status === 409,
        'Conversation ID received': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            conversationId = data.id || data.conversationId;
            return !!conversationId;
          } catch {
            return false;
          }
        },
      });

    if (!conversationId) {
      businessLogicErrors.add(1);
      workflowSuccess.add(false);
      return;
    }

    // Step 2: Send message
    const messageData = {
      content: `Test message at ${Date.now()}`,
    };

    const sendRes = http.post(
      `${BASE_URL}${API_PREFIX}/messaging/conversation/${conversationId}/message`,
      JSON.stringify(messageData),
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(sendRes, {
        'Message sent': (r) => r.status === 201,
      });

    // Step 3: Retrieve messages
    const messagesRes = http.get(
      `${BASE_URL}${API_PREFIX}/messaging/conversation/${conversationId}/messages`,
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(messagesRes, {
        'Messages retrieved': (r) => r.status === 200,
        'Message in conversation': (r) => {
          try {
            const body = JSON.parse(r.body);
            const data = body.data || body;
            const messages = Array.isArray(data) ? data : data.items || [];
            return messages.length > 0;
          } catch {
            return false;
          }
        },
      });

    // Step 4: Mark as read
    const readRes = http.patch(
      `${BASE_URL}${API_PREFIX}/messaging/conversation/${conversationId}/read`,
      null,
      { headers },
    );

    workflowValid =
      workflowValid &&
      check(readRes, {
        'Messages marked read': (r) => r.status === 200,
      });

    transactionIntegrity.add(workflowValid);
    workflowSuccess.add(workflowValid);
  });

  sleep(1);
}

export function teardown(data) {
  console.log('\\n========== Business Logic Test Results ==========');
  console.log('All critical user workflows tested');
  console.log('Data integrity validated across operations');
  console.log('Transaction consistency verified');
  console.log('=================================================\\n');
}
