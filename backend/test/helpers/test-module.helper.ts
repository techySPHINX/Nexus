import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Helper to create testing modules with common mocks
 */
export class TestModuleHelper {
  /**
   * Create a mock Prisma service
   */
  static createMockPrismaService() {
    return {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      profile: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      post: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      referral: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      referralApplication: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      mentorshipRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      connection: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userPoints: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      pointTransaction: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback({
        user: { findUnique: jest.fn(), update: jest.fn() },
        userPoints: { upsert: jest.fn(), updateMany: jest.fn() },
        pointTransaction: { create: jest.fn(), delete: jest.fn(), findFirst: jest.fn() },
      })),
      $executeRawUnsafe: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
  }

  /**
   * Create a mock JWT service
   */
  static createMockJwtService() {
    return {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@kiit.ac.in' }),
      decode: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@kiit.ac.in' }),
    };
  }

  /**
   * Create a test module with common providers
   */
  static async createTestingModule(
    providers: any[],
    imports: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      imports,
      providers: [
        ...providers,
        {
          provide: PrismaService,
          useValue: TestModuleHelper.createMockPrismaService(),
        },
        {
          provide: JwtService,
          useValue: TestModuleHelper.createMockJwtService(),
        },
      ],
    }).compile();
  }

  /**
   * Generate mock JWT token for testing
   */
  static generateMockToken(userId: string, role: string = 'STUDENT') {
    return `Bearer mock-token-${userId}-${role}`;
  }
}
