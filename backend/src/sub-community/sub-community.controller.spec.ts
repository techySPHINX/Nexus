import { Test, TestingModule } from '@nestjs/testing';
import { SubCommunityController } from './sub-community.controller';
import { SubCommunityService } from './sub-community.service';

describe('SubCommunityController - findByType', () => {
  let controller: SubCommunityController;
  let service: SubCommunityService;

  const mockResponse = {
    data: [
      {
        id: 'sc-1',
        name: 'Test',
        description: 'Test community',
        isPrivate: false,
        type: { id: 'type-1', name: 'TECH' },
        owner: { id: 'user-1', name: 'Owner', role: 'ALUM' },
        _count: { members: 5, posts: 10 },
        members: [],
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubCommunityController],
      providers: [
        {
          provide: SubCommunityService,
          useValue: {
            findSubCommunityByType: jest.fn().mockResolvedValue(mockResponse),
            createSubCommunity: jest.fn(),
            findAllSubCommunities: jest.fn(),
            findOneSubCommunity: jest.fn(),
            updateSubCommunity: jest.fn(),
            removeSubCommunity: jest.fn(),
            banSubCommunity: jest.fn(),
            getReports: jest.fn(),
            handleReport: jest.fn(),
            requestToJoinSubCommunity: jest.fn(),
            getPendingJoinRequests: jest.fn(),
            approveJoinRequest: jest.fn(),
            updateMemberRole: jest.fn(),
            leaveSubCommunity: jest.fn(),
            removeSubCommunityMember: jest.fn(),
            findMyOwnedSubCommunities: jest.fn(),
            findMyModeratedSubCommunities: jest.fn(),
            findMyMemberSubCommunities: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SubCommunityController>(SubCommunityController);
    service = module.get<SubCommunityService>(SubCommunityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service with default values when no filters provided', async () => {
    const result = await controller.findByType('ALL', {}, 'user-1');

    expect(service.findSubCommunityByType).toHaveBeenCalledWith('ALL', {
      q: undefined,
      page: 1,
      limit: 20,
      userId: 'user-1',
      privacy: undefined,
      membership: undefined,
      sort: undefined,
      minMembers: undefined,
    });
    expect(result).toEqual(mockResponse);
  });

  it('should pass all filter params to service', async () => {
    await controller.findByType(
      'TECH',
      {
        q: 'test',
        page: '2',
        limit: '10',
        privacy: 'public',
        membership: 'joined',
        sort: 'popular',
        minMembers: '5',
      },
      'user-1',
    );

    expect(service.findSubCommunityByType).toHaveBeenCalledWith('TECH', {
      q: 'test',
      page: 2,
      limit: 10,
      userId: 'user-1',
      privacy: 'public',
      membership: 'joined',
      sort: 'popular',
      minMembers: 5,
    });
  });

  it('should convert string page/limit to numbers', async () => {
    await controller.findByType('ALL', { page: '3', limit: '15' }, 'user-1');

    expect(service.findSubCommunityByType).toHaveBeenCalledWith('ALL', {
      q: undefined,
      page: 3,
      limit: 15,
      userId: 'user-1',
      privacy: undefined,
      membership: undefined,
      sort: undefined,
      minMembers: undefined,
    });
  });

  it('should handle partial filter params', async () => {
    await controller.findByType(
      'ALL',
      { privacy: 'private', sort: 'active' },
      'user-1',
    );

    expect(service.findSubCommunityByType).toHaveBeenCalledWith('ALL', {
      q: undefined,
      page: 1,
      limit: 20,
      userId: 'user-1',
      privacy: 'private',
      membership: undefined,
      sort: 'active',
      minMembers: undefined,
    });
  });
});
