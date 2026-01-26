import { PrismaClient } from '@prisma/client';

/**
 * Database helper for tests
 * Handles database cleanup and seeding
 */
export class TestDatabaseHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ||
            'postgresql://test:test@localhost:5432/nexus_test',
        },
      },
    });
  }

  async connect() {
    await this.prisma.$connect();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  /**
   * Clean all test data from database
   * Order matters due to foreign key constraints
   */
  async cleanup() {
    const tables = [
      'PointTransaction',
      'UserPoints',
      'Message',
      'Conversation',
      'Report',
      'Notification',
      'ReferralApplication',
      'Referral',
      'MentorshipRequest',
      'MentorSettings',
      'Connection',
      'Comment',
      'Like',
      'Post',
      'Profile',
      'User',
    ];

    for (const table of tables) {
      try {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${table}" CASCADE;`,
        );
      } catch (error) {
        // Table might not exist in some test scenarios
        console.warn(`Failed to truncate ${table}:`, error.message);
      }
    }
  }

  /**
   * Create test user with profile
   */
  async createTestUser(overrides?: any) {
    const defaultUser = {
      email: `test-${Date.now()}@kiit.ac.in`,
      password: '$2b$10$abcdefghijklmnopqrstuv', // bcrypt hash of "password123"
      name: 'Test User',
      role: 'STUDENT',
      isEmailVerified: true,
      isAccountActive: true,
      accountStatus: 'ACTIVE',
      ...overrides,
    };

    return this.prisma.user.create({
      data: {
        ...defaultUser,
        profile: {
          create: {
            bio: 'Test bio',
            location: 'Test Location',
            interests: 'Testing',
            avatarUrl: '',
            dept: 'Computer Science',
            studentId: `TEST${Date.now()}`,
          },
        },
      },
      include: { profile: true },
    });
  }

  /**
   * Create multiple test users
   */
  async createTestUsers(count: number, overrides?: any) {
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        email: `test-user-${i}-${Date.now()}@kiit.ac.in`,
        name: `Test User ${i}`,
        ...overrides,
      });
      users.push(user);
    }
    return users;
  }

  /**
   * Get Prisma client instance
   */
  getClient() {
    return this.prisma;
  }
}
