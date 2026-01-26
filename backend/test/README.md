# Nexus Backend Testing Suite

## 🎯 Overview

This is a **production-grade testing framework** designed to catch critical bugs before deployment. All tests follow industry best practices and cover:

- ✅ **Business Logic Validation** - Ensure calculations and rules are correct
- ❌ **Edge Case Handling** - Test null, empty, boundary values
- 🔒 **API Contract Testing** - Validate response structures and status codes
- 🔄 **Idempotency Checks** - Prevent duplicate operations
- 🚀 **Integration Workflows** - Test complete user journeys
- 🛡️ **Security Validation** - Role-based access control, JWT verification

---

## 📁 Test Structure

```
test/
├── unit/                    # Unit tests for business logic
│   ├── auth.service.spec.ts
│   ├── gamification.service.spec.ts
│   └── referral.service.spec.ts
│
├── integration/             # Integration tests for workflows
│   ├── auth.integration.spec.ts
│   ├── referral.integration.spec.ts
│   └── edge-cases.spec.ts
│
├── contract/                # API contract tests
│   ├── auth.contract.spec.ts
│   └── referral.contract.spec.ts
│
├── helpers/                 # Test utilities
│   ├── test-database.helper.ts
│   └── test-module.helper.ts
│
├── fixtures/                # Test data fixtures
│   └── user.fixture.ts
│
└── setup.ts                 # Global test configuration
```

---

## 🚀 Running Tests

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Run Contract Tests Only

```bash
npm run test:contract
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:cov
```

### Run E2E Tests

```bash
npm run test:e2e
```

---

## 📊 Coverage Requirements

The project enforces **minimum 70% coverage** across:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

To view coverage:

```bash
npm run test:cov
open coverage/lcov-report/index.html
```

---

## 🧪 Test Categories

### 1. Unit Tests (`test/unit/`)

Tests individual service methods in isolation with mocked dependencies.

**Example:**

```typescript
describe('AuthService - Unit Tests', () => {
  it('should reject email from non-KIIT domain', async () => {
    await expect(
      service.registerWithDocuments(dto, '127.0.0.1', 'test-agent'),
    ).rejects.toThrow(ForbiddenException);
  });
});
```

**What it tests:**

- ✅ Business logic correctness
- ✅ Input validation
- ✅ Error handling
- ✅ Edge cases (null, empty, boundary values)

### 2. Integration Tests (`test/integration/`)

Tests complete workflows with real database interactions.

**Example:**

```typescript
describe('Referral Integration Tests', () => {
  it('should complete application submission workflow', async () => {
    const response = await request(app.getHttpServer())
      .post('/referral/apply')
      .set('Authorization', `Bearer ${token}`)
      .send(applicationData)
      .expect(201);

    // Verify notification sent to alumni
    const notifications = await prisma.notification.findMany({
      where: { userId: alumniUser.id },
    });

    expect(notifications.length).toBeGreaterThan(0);
  });
});
```

**What it tests:**

- 🔄 Multi-step workflows
- 🗄️ Database transactions
- 📧 Notifications and side effects
- 🎯 Business process completion

### 3. Contract Tests (`test/contract/`)

Tests API endpoints for correct response structure and status codes.

**Example:**

```typescript
describe('Auth API Contract Tests', () => {
  it('should return correct response structure on success', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register-with-documents')
      .send(validData)
      .expect(201)
      .expect('Content-Type', /json/);

    expect(response.body).toMatchObject({
      message: expect.any(String),
    });

    // Ensure no sensitive data exposed
    expect(response.body).not.toHaveProperty('password');
  });
});
```

**What it tests:**

- ✅ HTTP status codes (200, 400, 401, 403, 404, 500)
- ✅ Response structure consistency
- ✅ Data type validation
- ✅ Security (no sensitive data exposure)

### 4. Edge Case Tests (`test/integration/edge-cases.spec.ts`)

Tests boundary conditions and unusual inputs.

**What it tests:**

- ❌ Null and empty values
- ❌ Boundary values (0, max int, very long strings)
- ❌ Special characters and Unicode
- ❌ Concurrent operations
- ❌ SQL injection attempts
- ❌ Invalid data types

---

## 🛠️ Test Helpers

### TestDatabaseHelper

Manages database cleanup and test data creation.

```typescript
const dbHelper = new TestDatabaseHelper();

// Create test user
const user = await dbHelper.createTestUser({
  email: 'test@kiit.ac.in',
  role: Role.STUDENT,
});

// Clean all test data
await dbHelper.cleanup();
```

### TestModuleHelper

Creates testing modules with common mocks.

```typescript
const module = await TestModuleHelper.createTestingModule([
  MyService,
  AnotherService,
]);
```

---

## 🔧 Configuration

### Environment Variables

Tests use separate test environment:

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/nexus_test
JWT_SECRET=test-jwt-secret-key-for-testing-only
```

### Jest Configuration (`jest.config.js`)

- **Test Pattern**: `*.spec.ts`
- **Setup File**: `test/setup.ts`
- **Coverage Directory**: `coverage/`
- **Timeout**: 30 seconds for integration tests

---

## ✅ Production Readiness Checklist

Before deploying to production, ensure:

- [ ] All tests pass: `npm test`
- [ ] Coverage meets 70% threshold: `npm run test:cov`
- [ ] No console errors or warnings
- [ ] Integration tests with real database succeed
- [ ] Contract tests validate all API endpoints
- [ ] Edge cases are handled gracefully
- [ ] Idempotency is enforced for critical operations
- [ ] Security tests prevent unauthorized access

---

## 🚨 Critical Test Areas

### Must-Test Before Production

#### 1. Authentication

- ✅ Domain validation (kiit.ac.in only)
- ✅ Password hashing (never plain text)
- ✅ JWT token validation
- ✅ Rate limiting on login attempts
- ✅ Account status transitions

#### 2. Gamification

- ✅ Point calculations are correct
- ✅ Point accumulation is accurate
- ✅ Point revocation works correctly
- ✅ Concurrent point awards are safe
- ✅ No negative points possible

#### 3. Referrals

- ✅ Only alumni/admins can create referrals
- ✅ Deadline validation
- ✅ No duplicate applications
- ✅ Status transitions are correct
- ✅ Notifications are sent

#### 4. API Responses

- ✅ Correct status codes (200, 400, 401, 403, 404)
- ✅ No sensitive data exposure
- ✅ Consistent error format
- ✅ Proper data types

---

## 🐛 Debugging Tests

### Run Single Test File

```bash
npm test -- auth.service.spec.ts
```

### Run Tests with Verbose Output

```bash
npm test -- --verbose
```

### Debug Tests in VS Code

Add breakpoints and use "Jest: Debug" in VS Code.

### Enable Console Logs in Tests

```bash
DEBUG=true npm test
```

---

## 📚 Writing New Tests

### Template for Unit Tests

```typescript
describe('ServiceName - Unit Tests', () => {
  let service: ServiceName;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ServiceName /* mock providers */],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    prisma = module.get(PrismaService);
  });

  describe('✅ Business Logic: Feature Name', () => {
    it('should do something correctly', async () => {
      // Arrange
      const input = {
        /* test data */
      };
      prisma.model.method.mockResolvedValue(/* mock response */);

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toBeDefined();
      expect(prisma.model.method).toHaveBeenCalledWith(/* expected args */);
    });
  });

  describe('❌ Edge Cases: Null Values', () => {
    it('should reject null input', async () => {
      await expect(service.method(null)).rejects.toThrow();
    });
  });
});
```

### Template for Integration Tests

```typescript
describe('Feature Integration Tests', () => {
  let app: INestApplication;
  let dbHelper: TestDatabaseHelper;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    dbHelper = new TestDatabaseHelper();
    await app.init();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  it('should complete workflow', async () => {
    const user = await dbHelper.createTestUser();
    const token = jwtService.sign({ sub: user.id });

    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(201);

    expect(response.body).toBeDefined();
  });
});
```

---

## 🔗 Related Documentation

- [Backend README](../README.md)
- [API Documentation](../docs/API.md)
- [Security Guidelines](../Security.md)

---

## 📞 Support

For testing issues or questions:

1. Check existing tests for examples
2. Review this README
3. Contact the development team

---

**Last Updated**: January 2026
**Maintained By**: Nexus QA Team
