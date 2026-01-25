import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../../src/profile/profile.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('ProfileService - Unit Tests', () => {
  let service: ProfileService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    skill: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    skillEndorsement: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    badge: {
      findUnique: jest.fn(),
    },
    userBadge: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('✅ getProfileCompletionStats() - Profile Completion Calculation', () => {
    const userId = 'user-123';

    it('should calculate 100% completion for fully filled profile', async () => {
      const fullProfile = {
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Full bio text',
        location: 'San Francisco, CA',
        interests: 'AI, ML, Web Dev, Cloud, Mobile',
        branch: 'CSE',
        year: '2024',
        course: 'BTech, MTech, MBA, PhD, MCA',
        dept: 'Computer Science',
        _count: { skills: 5 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(fullProfile);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.completionPercentage).toBe(100);
      expect(result).not.toHaveProperty('details');
    });

    it('should return details for incomplete profile', async () => {
      const incompleteProfile = {
        avatarUrl: null,
        bio: 'Bio only',
        location: null,
        interests: null,
        branch: null,
        year: null,
        course: null,
        dept: null,
        _count: { skills: 2 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(incompleteProfile);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.completionPercentage).toBeLessThan(100);
      expect(result.details).toHaveProperty('avatar', false);
      expect(result.details).toHaveProperty('bio', true);
      expect(result.details).toHaveProperty('skillsCount', 2);
    });

    it('should require at least 5 skills for completion', async () => {
      const profileWith4Skills = {
        avatarUrl: 'url',
        bio: 'bio',
        location: 'loc',
        interests: 'A, B, C, D, E',
        branch: 'CSE',
        year: '2024',
        course: 'A, B, C, D, E',
        dept: 'CS',
        _count: { skills: 4 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(profileWith4Skills);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.completionPercentage).toBeLessThan(100);
      expect(result.details.skillsCount).toBe(4);
    });

    it('should require at least 5 interests for completion', async () => {
      const profileWith3Interests = {
        avatarUrl: 'url',
        bio: 'bio',
        location: 'loc',
        interests: 'AI, ML, Web',
        branch: 'CSE',
        year: '2024',
        course: 'A, B, C, D, E',
        dept: 'CS',
        _count: { skills: 5 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(profileWith3Interests);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.completionPercentage).toBeLessThan(100);
      expect(result.details.interestsCount).toBe(3);
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.getProfileCompletionStats(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProfileCompletionStats(userId)).rejects.toThrow(
        'Profile not found',
      );
    });

    it('should treat empty strings as not filled', async () => {
      const profileWithEmptyStrings = {
        avatarUrl: '',
        bio: '   ',
        location: '',
        interests: '',
        branch: '',
        year: '',
        course: '',
        dept: '',
        _count: { skills: 0 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(profileWithEmptyStrings);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.completionPercentage).toBe(0);
    });
  });

  describe('✅ getProfile() - Profile Retrieval with Relations', () => {
    const userId = 'user-123';

    it('should retrieve profile with all relations', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId,
        bio: 'Test bio',
        skills: [
          {
            id: 'skill-1',
            name: 'JavaScript',
            endorsements: [],
          },
        ],
        user: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: 'STUDENT',
        },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile(userId);

      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('user');
      expect(result.skills).toBeInstanceOf(Array);
    });

    it('should include endorsements for each skill', async () => {
      const mockProfile = {
        userId,
        skills: [
          {
            id: 'skill-1',
            name: 'Python',
            endorsements: [
              {
                endorser: {
                  id: 'endorser-1',
                  name: 'Endorser',
                  role: 'ALUMNI',
                },
              },
            ],
          },
        ],
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile(userId);

      expect(result.skills[0].endorsements).toHaveLength(1);
      expect(result.skills[0].endorsements[0].endorser).toHaveProperty('name');
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProfile(userId)).rejects.toThrow(
        'Profile not found',
      );
    });

    it('should limit transactions to last 10', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        userId,
        user: { userPoints: { transactions: [] } },
      });

      await service.getProfile(userId);

      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.objectContaining({
              select: expect.objectContaining({
                userPoints: expect.objectContaining({
                  select: expect.objectContaining({
                    transactions: expect.objectContaining({
                      take: 10,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('✅ getFilteredProfiles() - Profile Search with Filters', () => {
    it('should filter profiles by name (case-insensitive)', async () => {
      const filterDto = { name: 'John' };
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      await service.getFilteredProfiles(filterDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              name: { contains: 'John', mode: 'insensitive' },
            }),
          }),
        }),
      );
    });

    it('should filter profiles by email (case-insensitive)', async () => {
      const filterDto = { email: 'test@example.com' };
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      await service.getFilteredProfiles(filterDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              email: { contains: 'test@example.com', mode: 'insensitive' },
            }),
          }),
        }),
      );
    });

    it('should filter profiles by roles', async () => {
      const filterDto = { roles: ['STUDENT', 'ALUMNI'] };
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      await service.getFilteredProfiles(filterDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              role: { in: ['STUDENT', 'ALUMNI'] },
            }),
          }),
        }),
      );
    });

    it('should filter profiles by location (case-insensitive)', async () => {
      const filterDto = { location: 'San Francisco' };
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      await service.getFilteredProfiles(filterDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: { contains: 'San Francisco', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter profiles by skills', async () => {
      const filterDto = { skills: ['JavaScript', 'Python'] };
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      await service.getFilteredProfiles(filterDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            skills: {
              some: {
                name: { in: ['JavaScript', 'Python'], mode: 'insensitive' },
              },
            },
          }),
        }),
      );
    });

    it('should support pagination with skip and take', async () => {
      const filterDto = { skip: 10, take: 20 };
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      await service.getFilteredProfiles(filterDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        }),
      );
    });

    it('should combine multiple filters', async () => {
      const filterDto = {
        name: 'John',
        roles: ['STUDENT'],
        location: 'CA',
        dept: 'CSE',
      };
      mockPrismaService.profile.findMany.mockResolvedValue([]);

      await service.getFilteredProfiles(filterDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.anything(),
            location: expect.anything(),
            dept: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('✅ updateProfile() - Profile Updates with Skills', () => {
    const userId = 'user-123';

    it('should update profile fields successfully', async () => {
      const updateDto = {
        bio: 'Updated bio',
        location: 'New York, NY',
        interests: 'Updated interests',
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.profile.update.mockResolvedValue({
        ...updateDto,
        userId,
      });

      const result = await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          data: expect.objectContaining(updateDto),
        }),
      );
    });

    it('should create or connect skills when provided', async () => {
      const updateDto = {
        bio: 'Test',
        skills: ['JavaScript', 'Python'],
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.skill.upsert.mockResolvedValue({ id: 'skill-1', name: 'JavaScript' });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.skill.upsert).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { bio: 'Test' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateProfile(userId, { bio: 'Test' }),
      ).rejects.toThrow('Profile not found');
    });

    it('should handle empty skills array', async () => {
      const updateDto = {
        bio: 'Test',
        skills: [],
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.skill.upsert).not.toHaveBeenCalled();
    });

    it('should not update skills if not provided', async () => {
      const updateDto = {
        bio: 'Test bio only',
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.skill.upsert).not.toHaveBeenCalled();
    });
  });

  describe('✅ endorseSkill() - Skill Endorsement Logic', () => {
    const endorserId = 'endorser-123';
    const skillId = 'skill-123';

    it('should create endorsement successfully', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue({ id: skillId });
      mockPrismaService.skillEndorsement.findUnique.mockResolvedValue(null);
      mockPrismaService.skillEndorsement.create.mockResolvedValue({
        endorserId,
        skillId,
      });

      await service.endorseSkill(endorserId, skillId);

      expect(mockPrismaService.skillEndorsement.create).toHaveBeenCalledWith({
        data: { endorserId, skillId },
      });
    });

    it('should throw NotFoundException if skill does not exist', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(null);

      await expect(service.endorseSkill(endorserId, skillId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already endorsed', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue({ id: skillId });
      mockPrismaService.skillEndorsement.findUnique.mockResolvedValue({
        endorserId,
        skillId,
      });

      await expect(service.endorseSkill(endorserId, skillId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.endorseSkill(endorserId, skillId)).rejects.toThrow(
        'You have already endorsed this skill',
      );
    });
  });

  describe('✅ removeEndorsement() - Endorsement Removal', () => {
    const endorserId = 'endorser-123';
    const skillId = 'skill-123';

    it('should remove endorsement successfully', async () => {
      mockPrismaService.skillEndorsement.findUnique.mockResolvedValue({
        endorserId,
        skillId,
      });
      mockPrismaService.skillEndorsement.delete.mockResolvedValue({});

      await service.removeEndorsement(endorserId, skillId);

      expect(mockPrismaService.skillEndorsement.delete).toHaveBeenCalledWith({
        where: { endorserId_skillId: { endorserId, skillId } },
      });
    });

    it('should throw NotFoundException if endorsement does not exist', async () => {
      mockPrismaService.skillEndorsement.findUnique.mockResolvedValue(null);

      await expect(
        service.removeEndorsement(endorserId, skillId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeEndorsement(endorserId, skillId),
      ).rejects.toThrow('Endorsement not found');
    });
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    const userId = 'user-123';

    it('should handle null values in profile fields', async () => {
      const profile = {
        avatarUrl: null,
        bio: null,
        location: null,
        interests: null,
        _count: { skills: 0 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(profile);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.completionPercentage).toBe(0);
    });

    it('should handle empty string in interests CSV', async () => {
      const profile = {
        avatarUrl: 'url',
        bio: 'bio',
        location: 'loc',
        interests: '',
        branch: 'CSE',
        year: '2024',
        course: 'BTech',
        dept: 'CS',
        _count: { skills: 5 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(profile);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.details.interestsCount).toBe(0);
    });

    it('should handle whitespace-only fields', async () => {
      const updateDto = {
        bio: '   ',
        location: '  ',
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.profile.update).toHaveBeenCalled();
    });
  });

  describe('❌ Edge Cases: Special Characters and Unicode', () => {
    const userId = 'user-123';

    it('should handle special characters in bio', async () => {
      const updateDto = {
        bio: "Bio with special chars: !@#$%^&*()_+ O'Brien <script>",
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.profile.update).toHaveBeenCalled();
    });

    it('should handle Unicode in profile fields', async () => {
      const updateDto = {
        bio: 'Bio with Unicode: 你好 مرحبا 🎉',
        location: 'São Paulo, Brasil',
        interests: 'AI 人工智能, ML 机器学习',
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.profile.update).toHaveBeenCalled();
    });

    it('should handle skill names with special characters', async () => {
      const updateDto = {
        skills: ['C++', 'C#', 'Node.js', 'Vue.js', 'ASP.NET'],
      };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.skill.upsert.mockResolvedValue({ id: 'skill-1', name: 'C++' });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.skill.upsert).toHaveBeenCalledTimes(5);
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    const userId = 'user-123';

    it('should handle exactly 5 skills (boundary for completion)', async () => {
      const profile = {
        avatarUrl: 'url',
        bio: 'bio',
        location: 'loc',
        interests: 'A, B, C, D, E',
        branch: 'CSE',
        year: '2024',
        course: 'A, B, C, D, E',
        dept: 'CS',
        _count: { skills: 5 },
      };

      mockPrismaService.profile.findUnique.mockResolvedValue(profile);

      const result = await service.getProfileCompletionStats(userId);

      expect(result.completionPercentage).toBe(100);
    });

    it('should handle large number of skills', async () => {
      const manySkills = Array.from({ length: 50 }, (_, i) => `Skill${i}`);
      const updateDto = { skills: manySkills };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.skill.upsert.mockResolvedValue({ id: 'skill-1', name: 'Test' });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.skill.upsert).toHaveBeenCalledTimes(50);
    });

    it('should handle very long bio (5000+ characters)', async () => {
      const longBio = 'A'.repeat(5000);
      const updateDto = { bio: longBio };

      mockPrismaService.profile.findUnique.mockResolvedValue({ userId });
      mockPrismaService.profile.update.mockResolvedValue({});

      await service.updateProfile(userId, updateDto);

      expect(mockPrismaService.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bio: longBio,
          }),
        }),
      );
    });
  });

  describe('🔒 Security: Data Validation', () => {
    const userId = 'user-123';

    it('should enforce profile existence before update', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { bio: 'Test' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.profile.update).not.toHaveBeenCalled();
    });

    it('should enforce skill existence before endorsement', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(null);

      await expect(service.endorseSkill('user-1', 'skill-1')).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.skillEndorsement.create).not.toHaveBeenCalled();
    });

    it('should prevent duplicate endorsements', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue({ id: 'skill-1' });
      mockPrismaService.skillEndorsement.findUnique.mockResolvedValue({
        endorserId: 'user-1',
        skillId: 'skill-1',
      });

      await expect(service.endorseSkill('user-1', 'skill-1')).rejects.toThrow(
        ConflictException,
      );

      expect(mockPrismaService.skillEndorsement.create).not.toHaveBeenCalled();
    });
  });
});
