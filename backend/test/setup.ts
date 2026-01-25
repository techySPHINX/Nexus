/**
 * Global test setup and configuration
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nexus_test';

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Mock external services by default
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn().mockReturnValue({
    send: jest.fn().mockResolvedValue('message-id'),
    sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
  }),
}));

// Global test utilities
global.testUtils = {
  generateMockUserId: () => `test-user-${Date.now()}-${Math.random()}`,
  generateMockEmail: () => `test-${Date.now()}@kiit.ac.in`,
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Suppress console logs in tests unless DEBUG=true
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
}
