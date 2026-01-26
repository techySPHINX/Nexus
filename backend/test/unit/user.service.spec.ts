import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from '../../src/user/user.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CacheService } from '../../src/common/services/cache.service';
import { UpdateUserDto } from '../../src/user/dto/update-user.dto';
import { Role, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UserService - Unit Tests', () => {
  let service: UserService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    profile: { upsert: jest.Mock; deleteMany: jest.Mock };
    skill: { findFirst: jest.Mock; create: jest.Mock };
  };
  let cacheService: jest.Mocked<CacheService>;

  const mockUserId = 'user-uuid-123';
  const mockUser = {
    id: mockUserId,
    name: 'Test User',
    email: 'test@kiit.ac.in',
    password: 'hashed_password',
    role: Role.STUDENT,
    accountStatus: AccountStatus.ACTIVE,
    isAccountActive: true,
    graduationYear: 2024,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'profile-uuid-123',
      userId: mockUserId,
      bio: 'Test bio',
      location: 'Test location',
      interests: 'coding, reading',
      avatarUrl: null,
      dept: 'CSE',
      branch: 'IT',
      studentId: '12345',
      skills: [
        { id: 'skill-1', name: 'JavaScript' },
        { id: 'skill-2', name: 'TypeScript' },
      ],
    },
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      profile: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      skill: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockCacheService = {
      getCachedUser: jest.fn(),
      cacheUser: jest.fn(),
      invalidateUser: jest.fn(),
      invalidateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService) as any;
    cacheService = module.get(CacheService) as jest.Mocked<CacheService>;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('✅ Business Logic: Find All Users', () => {
    it('should return all users with profiles and skills', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 'user-2' }];
      prisma.user.findMany.mockResolvedValue(mockUsers as any);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        include: {
          profile: {
            include: {
              skills: true,
            },
          },
        },
      });
    });

    it('should return empty array when no users exist', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('✅ Business Logic: Search Users', () => {
    it('should search users by name case-insensitively', async () => {
      const mockSearchResults = [mockUser];
      prisma.user.findMany.mockResolvedValue(mockSearchResults as any);

      const result = await service.searchUsers('test');

      expect(result).toEqual(mockSearchResults);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              name: {
                contains: 'test',
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: 'test',
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: {
            select: {
              bio: true,
              location: true,
              avatarUrl: true,
            },
          },
        },
        take: 20,
      });
    });

    it('should search users by email', async () => {
      const mockSearchResults = [mockUser];
      prisma.user.findMany.mockResolvedValue(mockSearchResults as any);

      await service.searchUsers('test@kiit.ac.in');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              expect.objectContaining({
                email: {
                  contains: 'test@kiit.ac.in',
                  mode: 'insensitive',
                },
              }),
            ]),
          },
        }),
      );
    });

    it('should return empty array for queries less than 2 characters', async () => {
      const result1 = await service.searchUsers('a');
      const result2 = await service.searchUsers('');
      const result3 = await service.searchUsers(' ');

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should trim whitespace from search query', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.searchUsers('  test  ');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: {
                  contains: 'test',
                  mode: 'insensitive',
                },
              }),
            ]),
          },
        }),
      );
    });

    it('should limit search results to 20 users', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.searchUsers('test');

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });
  });

  describe('✅ Business Logic: Find One User with Caching', () => {
    it('should return cached user when available', async () => {
      cacheService.getCachedUser.mockResolvedValue(mockUser as any);

      const result = await service.findOne(mockUserId);

      expect(result).toEqual(mockUser);
      expect(cacheService.getCachedUser).toHaveBeenCalledWith(mockUserId);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache miss', async () => {
      cacheService.getCachedUser.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findOne(mockUserId);

      expect(result).toEqual(mockUser);
      expect(cacheService.getCachedUser).toHaveBeenCalledWith(mockUserId);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: {
          profile: {
            include: {
              skills: true,
            },
          },
        },
      });
      expect(cacheService.cacheUser).toHaveBeenCalledWith(
        mockUserId,
        mockUser,
        3600,
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      cacheService.getCachedUser.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'User not found',
      );

      expect(cacheService.cacheUser).not.toHaveBeenCalled();
    });
  });

  describe('✅ Business Logic: Update User', () => {
    it('should update user name successfully', async () => {
      const dto: UpdateUserDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(updatedUser as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      const result = await service.update(mockUserId, dto);

      expect(result.name).toBe('Updated Name');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { name: 'Updated Name' },
      });
      expect(cacheService.invalidateUser).toHaveBeenCalledWith(mockUserId);
      expect(cacheService.invalidateProfile).toHaveBeenCalledWith(mockUserId);
    });

    it('should hash password before updating', async () => {
      const dto: UpdateUserDto = { password: 'newpassword123' };
      const hashedPassword = 'hashed_new_password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { password: hashedPassword },
      });
    });

    it('should throw BadRequestException for password less than 6 characters', async () => {
      const dto: UpdateUserDto = { password: '12345' };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.update(mockUserId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(mockUserId, dto)).rejects.toThrow(
        'Password must be at least 6 characters long',
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const dto: UpdateUserDto = { name: 'New Name' };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('non-existent-id', dto)).rejects.toThrow(
        'User not found',
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should update profile bio and location', async () => {
      const dto: UpdateUserDto = {
        bio: 'New bio',
        location: 'New location',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.profile.upsert.mockResolvedValue({
        ...mockUser.profile,
        bio: 'New bio',
        location: 'New location',
      } as any);

      const result = await service.update(mockUserId, dto);

      expect(result).toBeDefined();
      expect(prisma.profile.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: {
          userId: mockUserId,
          bio: 'New bio',
          location: 'New location',
          interests: undefined,
          skills: {
            connect: [],
          },
        },
        update: {
          bio: 'New bio',
          location: 'New location',
          interests: undefined,
          skills: {
            set: [],
          },
        },
        include: {
          skills: true,
        },
      });
    });

    it('should create new skills if they do not exist', async () => {
      const dto: UpdateUserDto = {
        skills: ['NewSkill1', 'NewSkill2'],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.skill.findFirst.mockResolvedValue(null);
      prisma.skill.create
        .mockResolvedValueOnce({ id: 'skill-new-1', name: 'NewSkill1' } as any)
        .mockResolvedValueOnce({ id: 'skill-new-2', name: 'NewSkill2' } as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(prisma.skill.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.skill.create).toHaveBeenCalledWith({
        data: { name: 'NewSkill1' },
      });
      expect(prisma.skill.create).toHaveBeenCalledWith({
        data: { name: 'NewSkill2' },
      });
    });

    it('should use existing skills if they already exist', async () => {
      const dto: UpdateUserDto = {
        skills: ['JavaScript'],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.skill.findFirst.mockResolvedValue({
        id: 'existing-skill-id',
        name: 'JavaScript',
      } as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(prisma.skill.findFirst).toHaveBeenCalledWith({
        where: { name: 'JavaScript' },
      });
      expect(prisma.skill.create).not.toHaveBeenCalled();
    });

    it('should invalidate cache after successful update', async () => {
      const dto: UpdateUserDto = { name: 'Updated' };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(cacheService.invalidateUser).toHaveBeenCalledWith(mockUserId);
      expect(cacheService.invalidateProfile).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('✅ Business Logic: Remove User', () => {
    it('should delete user and profile successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.profile.deleteMany.mockResolvedValue({ count: 1 } as any);
      prisma.user.delete.mockResolvedValue(mockUser as any);

      await service.remove(mockUserId);

      expect(prisma.profile.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        'User not found',
      );

      expect(prisma.profile.deleteMany).not.toHaveBeenCalled();
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should invalidate cache after deletion', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.profile.deleteMany.mockResolvedValue({ count: 1 } as any);
      prisma.user.delete.mockResolvedValue(mockUser as any);

      await service.remove(mockUserId);

      expect(cacheService.invalidateUser).toHaveBeenCalledWith(mockUserId);
      expect(cacheService.invalidateProfile).toHaveBeenCalledWith(mockUserId);
    });

    it('should delete profile before deleting user', async () => {
      const callOrder: string[] = [];

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.profile.deleteMany.mockImplementation(async () => {
        callOrder.push('profile');
        return { count: 1 } as any;
      });
      prisma.user.delete.mockImplementation(async () => {
        callOrder.push('user');
        return mockUser as any;
      });

      await service.remove(mockUserId);

      expect(callOrder).toEqual(['profile', 'user']);
    });
  });

  describe('✅ Business Logic: FCM Token Management', () => {
    it('should register FCM device token', async () => {
      const deviceToken = 'fcm-token-123';
      const updatedUser = {
        id: mockUserId,
        name: mockUser.name,
        email: mockUser.email,
        fcmDeviceToken: deviceToken,
      };

      prisma.user.update.mockResolvedValue(updatedUser as any);

      const result = await service.registerFcmToken(mockUserId, deviceToken);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { fcmDeviceToken: deviceToken },
        select: {
          id: true,
          name: true,
          email: true,
          fcmDeviceToken: true,
        },
      });
      expect(cacheService.invalidateUser).toHaveBeenCalledWith(mockUserId);
    });

    it('should unregister FCM device token', async () => {
      const updatedUser = {
        id: mockUserId,
        name: mockUser.name,
        email: mockUser.email,
        fcmDeviceToken: null,
      };

      prisma.user.update.mockResolvedValue(updatedUser as any);

      const result = await service.unregisterFcmToken(mockUserId);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { fcmDeviceToken: null },
        select: {
          id: true,
          name: true,
          email: true,
          fcmDeviceToken: true,
        },
      });
      expect(cacheService.invalidateUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    it('should handle null values in update DTO', async () => {
      const dto: UpdateUserDto = {
        name: undefined,
        bio: undefined,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {},
      });
    });

    it('should handle empty string in search query', async () => {
      const result = await service.searchUsers('');

      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should handle empty skills array in update', async () => {
      const dto: UpdateUserDto = {
        skills: [],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(prisma.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            skills: {
              connect: [],
            },
          }),
          update: expect.objectContaining({
            skills: {
              set: [],
            },
          }),
        }),
      );
    });
  });

  describe('❌ Edge Cases: Special Characters and Boundaries', () => {
    it('should handle special characters in search query', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.searchUsers('<script>alert("XSS")</script>');

      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should handle Unicode characters in user name', async () => {
      const dto: UpdateUserDto = { name: '你好 مرحبا' };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        name: '你好 مرحبا',
      } as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { name: '你好 مرحبا' },
      });
    });

    it('should handle very long bio text', async () => {
      const longBio = 'A'.repeat(10000);
      const dto: UpdateUserDto = { bio: longBio };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(prisma.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            bio: longBio,
          }),
        }),
      );
    });

    it('should handle password exactly 6 characters', async () => {
      const dto: UpdateUserDto = { password: '123456' };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      prisma.profile.upsert.mockResolvedValue(mockUser.profile as any);

      await service.update(mockUserId, dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    });
  });

  describe('🔒 Security: Data Sanitization', () => {
    it('should not return password in user query results', async () => {
      const searchResults = [
        {
          id: mockUserId,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          profile: mockUser.profile,
        },
      ];

      prisma.user.findMany.mockResolvedValue(searchResults as any);

      const result = await service.searchUsers('test');

      result.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should validate password minimum length before hashing', async () => {
      const dto: UpdateUserDto = { password: '12345' };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.update(mockUserId, dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });
});
