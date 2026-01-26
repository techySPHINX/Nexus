# Load Testing Suite for Nexus Backend

Comprehensive k6-based load testing suite covering performance, security, business logic, and realistic user behavior scenarios.

## 📋 Test Files Overview

### 1. **k6-advanced-load-test.js** - Comprehensive Load Test

**Duration:** 13 minutes  
**Peak Users:** 300 concurrent users  
**Purpose:** Multi-stage load testing with varied user workflows

**User Distribution:**

- 80% Normal users (basic browsing, posting, networking)
- 15% Power users (heavy feature usage, complex queries)
- 5% Edge case users (boundary testing, validation checks)

**Key Metrics:**

- Response times across all stages
- Business logic errors
- Cache hit rates
- Concurrent user handling
- Performance degradation tracking

**Run Command:**

```bash
k6 run k6-advanced-load-test.js
```

---

### 2. **k6-advanced-spike-test.js** - Extreme Spike Test

**Duration:** 8 minutes  
**Peak Users:** 1,500 concurrent users (sudden spike)  
**Purpose:** Test system behavior under extreme sudden load

**Test Phases:**

- Baseline: 10 users
- Sudden spike: 1,000 users (10s)
- Extreme spike: 1,500 users (10s)
- Recovery analysis: Back to 50 users

**Key Metrics:**

- Service degradation rate
- Recovery time after spike
- Circuit breaker effectiveness
- Error rate under extreme load

**Run Command:**

```bash
k6 run k6-advanced-spike-test.js
```

---

### 3. **k6-advanced-soak-test.js** - Extended Stability Test

**Duration:** 4+ hours  
**Users:** 75-100 concurrent users (sustained)  
**Purpose:** Identify memory leaks and long-term stability issues

**User Profiles:**

- 40% Casual users (light activity)
- 35% Regular users (moderate activity)
- 20% Active users (frequent actions)
- 5% Power users (intensive operations)

**Key Metrics:**

- Response time drift over time
- Memory leak indicators
- Connection pool exhaustion
- Resource cleanup validation

**Run Command:**

```bash
k6 run k6-advanced-soak-test.js
```

---

### 4. **k6-stress-test.js** - Breaking Point Test

**Duration:** 24 minutes  
**Peak Users:** 600+ concurrent users  
**Purpose:** Find system breaking point and maximum capacity

**Test Phases:**

- Warm-up: 50 users
- Gradual increase: 100 → 200 → 300 → 400 → 500 → 600
- Recovery test: Back to 50 users

**Focus Areas:**

- Database connection limits
- API endpoint capacity
- File operation handling
- Concurrent write operations
- System recovery capability

**Key Metrics:**

- System breakpoint VU count
- Recovery success rate
- Resource bottleneck identification

**Run Command:**

```bash
k6 run k6-stress-test.js
```

---

### 5. **k6-business-logic-test.js** - Workflow Validation

**Duration:** 5 minutes per scenario (7 parallel scenarios)  
**Users:** 5-20 per scenario  
**Purpose:** Validate complete user workflows and data integrity

**Tested Workflows:**

1. **Profile Lifecycle:** Create → Update → Verify persistence
2. **Post Lifecycle:** Create → Like → Comment → Delete → Verify deletion
3. **Connection Workflow:** Send request → Check status → Verify state
4. **Mentorship Flow:** Create request → List mentors → Verify in list
5. **Referral Process:** Create → List → Apply → Validate
6. **Points & Gamification:** Check points → Earn points → Verify update → Leaderboard
7. **Messaging Integrity:** Start conversation → Send message → Retrieve → Mark read

**Key Metrics:**

- Business logic errors
- Data integrity errors
- Workflow success rate
- Transaction integrity

**Run Command:**

```bash
k6 run k6-business-logic-test.js
```

---

### 6. **k6-security-test.js** - Security Validation

**Duration:** 3 minutes per scenario (7 parallel scenarios)  
**Users:** 5-10 per scenario  
**Purpose:** Validate security mechanisms and protection layers

**Test Categories:**

#### SQL Injection Tests

- Various SQL injection payloads
- Path traversal attempts
- Database error exposure check

#### XSS Tests

- Script tag injection
- Event handler injection
- HTML sanitization validation

#### Authentication Bypass

- No token access attempts
- Invalid token validation
- Malformed token handling

#### Privilege Escalation

- Admin endpoint access attempts
- Role escalation attempts
- Cross-user data access

#### Rate Limiting

- Rapid request testing
- Rate limit threshold validation
- Retry-after header verification

#### Input Validation

- Oversized input handling
- Invalid format rejection
- Special character sanitization
- Null/undefined value handling

#### Session Security

- JWT expiration validation
- Token invalidation after logout
- Session hijacking prevention

**Key Metrics:**

- Security violations count
- SQL injection blocked rate
- XSS blocked rate
- Rate limit effectiveness
- CSRF protection rate

**Run Command:**

```bash
k6 run k6-security-test.js
```

---

### 7. **k6-realistic-user-behavior.js** - Real User Simulation

**Duration:** ~4 hours (full day simulation)  
**Peak Users:** 150 concurrent users  
**Purpose:** Simulate realistic user behavior patterns throughout the day

**Time-Based Scenarios:**

#### Morning Users (8 AM - 10 AM)

- Quick check-ins
- News feed reading
- Job referral browsing
- Short session duration

#### Lunch Users (12 PM - 2 PM)

- Social browsing
- Post interactions (likes, comments)
- Quick post creation
- Message checking

#### Evening Users (5 PM - 8 PM) - Peak Activity

- Comprehensive profile browsing
- Active networking
- Connection requests
- Mentorship exploration
- Project showcase viewing
- Messaging conversations
- Profile updates

#### Night Users (10 PM - 12 AM)

- Casual feed browsing
- Notification checking
- Light interactions
- Profile stats viewing

**Key Metrics:**

- User session duration
- Page views per session
- Bounce rate by time of day
- Conversion rate
- Feature adoption rate
- User satisfaction score

**Run Command:**

```bash
k6 run k6-realistic-user-behavior.js
```

---

## 🚀 Getting Started

### Prerequisites

```bash
# Install k6
# Windows (via Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo apt-get install k6
```

### Environment Variables

```bash
# Set base URL (default: http://localhost:3000)
export BASE_URL=http://localhost:3000

# For Windows PowerShell
$env:BASE_URL="http://localhost:3000"
```

### Running Tests

#### Individual Test

```bash
k6 run k6-advanced-load-test.js
```

#### With Custom VUs and Duration

```bash
k6 run --vus 100 --duration 5m k6-advanced-load-test.js
```

#### Output to File

```bash
k6 run --out json=test-results.json k6-advanced-load-test.js
```

#### With Detailed Logging

```bash
k6 run --http-debug="full" k6-security-test.js
```

---

## 📊 Test Suite Recommendations

### Development Testing

```bash
# Quick validation (5-10 minutes)
k6 run k6-business-logic-test.js
k6 run k6-security-test.js
```

### Pre-Production Testing

```bash
# Comprehensive validation (30-60 minutes)
k6 run k6-advanced-load-test.js
k6 run k6-stress-test.js
k6 run k6-business-logic-test.js
k6 run k6-security-test.js
```

### Production Readiness

```bash
# Full validation (4-8 hours)
k6 run k6-advanced-soak-test.js
k6 run k6-realistic-user-behavior.js
k6 run k6-advanced-spike-test.js
```

### Post-Deployment Validation

```bash
# Smoke test (10-15 minutes)
k6 run k6-advanced-load-test.js
k6 run k6-security-test.js
```

---

## 📈 Metrics & Thresholds

### Response Time Thresholds

- **Normal Load:** p(95) < 500ms, p(99) < 1000ms
- **Heavy Load:** p(95) < 1500ms, p(99) < 3000ms
- **Spike/Stress:** p(95) < 2000ms, p(99) < 5000ms
- **Edge Cases:** p(95) < 3000ms

### Error Rate Thresholds

- **Normal Operations:** < 1%
- **Heavy Load:** < 5%
- **Stress Testing:** < 10%
- **Spike Testing:** < 20% (during spike)

### Business Logic Thresholds

- **Workflow Success Rate:** > 95%
- **Transaction Integrity:** > 98%
- **Data Integrity Errors:** < 5 total

### Security Thresholds

- **Security Violations:** < 5 total
- **SQL Injection Blocked:** > 99%
- **XSS Blocked:** > 99%
- **Rate Limit Effective:** > 90%

---

## 🔍 Analyzing Results

### Key Metrics to Monitor

#### Performance Metrics

- `http_req_duration`: Response time distribution
- `http_req_waiting`: Time to first byte
- `http_req_blocked`: Connection establishment time
- `http_req_connecting`: TCP connection time

#### Reliability Metrics

- `http_req_failed`: Failed request rate
- `http_reqs`: Total requests per second
- `vus`: Active virtual users
- `iterations`: Completed iterations

#### Custom Metrics

- `business_logic_errors`: Business rule violations
- `data_integrity_errors`: Data consistency issues
- `security_violations`: Security mechanism bypasses
- `cache_hit_rate`: Cache effectiveness
- `response_time_drift`: Performance degradation over time

### Interpreting Results

#### Success Indicators ✅

- All thresholds passed
- Error rate < 1% (normal load)
- p(95) response time < 500ms
- No security violations
- Business logic success rate > 95%

#### Warning Signs ⚠️

- p(95) > 1000ms under normal load
- Error rate 1-5%
- Occasional security violations
- Response time drift > 50%

#### Critical Issues ❌

- p(95) > 2000ms under normal load
- Error rate > 5%
- Multiple security violations
- Business logic failures
- System breakpoint < expected capacity

---

## 🛠️ Troubleshooting

### Common Issues

#### High Error Rates

**Symptoms:** http_req_failed > 5%  
**Possible Causes:**

- Database connection pool exhausted
- API rate limiting too aggressive
- Memory issues
- Unhandled exceptions

**Solutions:**

- Check database connection pool size
- Review rate limiting configuration
- Monitor memory usage
- Review application logs

#### Slow Response Times

**Symptoms:** p(95) > 1500ms  
**Possible Causes:**

- Unoptimized database queries
- Missing indexes
- N+1 query problems
- Large payload sizes

**Solutions:**

- Use database query profiling
- Add missing indexes
- Implement eager loading
- Paginate large responses

#### Security Test Failures

**Symptoms:** Security violations > 0  
**Possible Causes:**

- Missing input validation
- Inadequate sanitization
- Weak authentication checks
- Missing authorization guards

**Solutions:**

- Implement DTO validation
- Use sanitization libraries
- Strengthen JWT validation
- Add role-based guards

---

## 📝 Best Practices

### Before Running Tests

1. ✅ Ensure backend is running
2. ✅ Database is seeded with test data
3. ✅ Redis is running (if using caching)
4. ✅ All services are healthy
5. ✅ Set appropriate BASE_URL

### During Tests

1. ✅ Monitor system resources (CPU, memory, disk)
2. ✅ Watch application logs for errors
3. ✅ Track database connection pool
4. ✅ Monitor network bandwidth
5. ✅ Check for memory leaks

### After Tests

1. ✅ Review all metrics and thresholds
2. ✅ Analyze failed requests
3. ✅ Check for resource leaks
4. ✅ Document performance baselines
5. ✅ Create action items for improvements

---

## 🎯 Test Coverage

### Endpoints Tested

- ✅ Authentication (signup, login, logout, verify)
- ✅ Profile (create, read, update, endorsements)
- ✅ Posts (CRUD, like, comment, share)
- ✅ Connections (send, accept, reject, list)
- ✅ Messaging (conversations, messages, read status)
- ✅ Referrals (create, list, apply)
- ✅ Mentorship (create request, list mentors)
- ✅ Showcase (projects, list, view)
- ✅ Notifications (list, mark read)
- ✅ User Search (search, filters, pagination)
- ✅ Gamification (points, leaderboard, badges)

### Edge Cases Tested

- ✅ SQL injection attempts
- ✅ XSS injection attempts
- ✅ Invalid pagination values
- ✅ Oversized payloads
- ✅ Special characters in IDs
- ✅ Concurrent operations
- ✅ Rate limiting boundaries
- ✅ Authentication bypass attempts
- ✅ Privilege escalation attempts

### Business Logic Tested

- ✅ Complete user workflows
- ✅ Data integrity across operations
- ✅ Transaction consistency
- ✅ Cascade effects
- ✅ State management
- ✅ Permission enforcement
- ✅ Resource ownership

---

## 📚 Additional Resources

### k6 Documentation

- [k6 Official Docs](https://k6.io/docs/)
- [k6 Metrics Guide](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)

### Performance Testing Best Practices

- [Web Performance Testing Guide](https://developer.mozilla.org/en-US/docs/Learn/Performance)
- [API Load Testing](https://www.blazemeter.com/blog/api-load-testing)

### Security Testing

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

---

## 📞 Support

For issues or questions:

1. Review test output and metrics
2. Check application logs
3. Verify system resources
4. Consult backend README.md
5. Review Prisma schema for data models

---

## 🔄 Continuous Improvement

This test suite should be:

- ✅ Run before each major release
- ✅ Updated when new features are added
- ✅ Enhanced with new edge cases
- ✅ Optimized based on production patterns
- ✅ Reviewed quarterly for relevance

---

**Last Updated:** December 2024  
**Maintainer:** Nexus Development Team  
**Version:** 1.0.0
