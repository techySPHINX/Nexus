import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '@/services/api';
import { subCommunityService } from '@/services/subCommunityService';

const mockedApi = vi.mocked(api, true);

describe('api integration subcommunity: subCommunityService -> api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: {} } as never);
    mockedApi.post.mockResolvedValue({ data: {} } as never);
    mockedApi.patch.mockResolvedValue({ data: {} } as never);
    mockedApi.delete.mockResolvedValue({ data: {} } as never);
  });

  it('maps read/list endpoints with params', async () => {
    await subCommunityService.getAllSubCommunities({
      compact: true,
      page: 2,
      limit: 10,
    });
    await subCommunityService.getSubCommunity('sc-1');
    await subCommunityService.getSubCommunityByType('TECH', 1, 20, 'ml');

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/sub-community', {
      params: { compact: true, page: 2, limit: 10 },
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/sub-community/sc-1');
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      3,
      '/sub-community/type/TECH',
      {
        params: { page: 1, limit: 20, q: 'ml' },
      }
    );
  });

  it('maps community mutate endpoints', async () => {
    await subCommunityService.createSubCommunity({
      name: 'AI Hub',
      description: 'desc',
      isPrivate: false,
      ownerId: 'u1',
    });
    await subCommunityService.updateSubCommunity('sc-1', {
      name: 'AI Hub 2',
    } as never);
    await subCommunityService.deleteSubCommunity('sc-1');
    await subCommunityService.banSubCommunity('sc-2');

    expect(mockedApi.post).toHaveBeenCalledWith('/sub-community', {
      name: 'AI Hub',
      description: 'desc',
      isPrivate: false,
      ownerId: 'u1',
    });
    expect(mockedApi.patch).toHaveBeenCalledWith('/sub-community/sc-1', {
      name: 'AI Hub 2',
    });
    expect(mockedApi.delete).toHaveBeenCalledWith('/sub-community/sc-1');
    expect(mockedApi.patch).toHaveBeenCalledWith('/sub-community/sc-2/ban');
  });

  it('maps membership and moderation endpoints', async () => {
    await subCommunityService.requestToJoin('sc-1');
    await subCommunityService.getPendingJoinRequests('sc-1');
    await subCommunityService.approveJoinRequest('sc-1', 'jr-1', {
      action: 'APPROVE',
    } as never);
    await subCommunityService.leaveSubCommunity('sc-1');
    await subCommunityService.removeMember('sc-1', 'm1');
    await subCommunityService.updateMemberRole('sc-1', 'm1', {
      role: 'MODERATOR',
    } as never);

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/sub-community/sc-1/join-request'
    );
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/sub-community/sc-1/join-requests/pending'
    );
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/sub-community/sc-1/join-requests/jr-1/approve',
      { action: 'APPROVE' }
    );
    expect(mockedApi.post).toHaveBeenCalledWith('/sub-community/sc-1/leave');
    expect(mockedApi.delete).toHaveBeenCalledWith(
      '/sub-community/sc-1/members/m1'
    );
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/sub-community/sc-1/members/m1/role',
      { role: 'MODERATOR' }
    );
  });

  it('maps reports and request lifecycle endpoints', async () => {
    await subCommunityService.getReports('sc-1');
    await subCommunityService.handleReport('sc-1', 'r1', 'RESOLVED');
    await subCommunityService.createSubCommunityRequest({
      name: 'Req',
      description: 'd',
      typeId: 't1',
      rationale: 'r',
    } as never);
    await subCommunityService.getAllSubCommunityRequests();
    await subCommunityService.approveSubCommunityRequest('req-1');
    await subCommunityService.rejectSubCommunityRequest('req-2');

    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community/sc-1/reports');
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/sub-community/sc-1/reports/r1',
      {
        status: 'RESOLVED',
      }
    );
    expect(mockedApi.post).toHaveBeenCalledWith('/sub-community-requests', {
      name: 'Req',
      description: 'd',
      typeId: 't1',
      rationale: 'r',
    });
    expect(mockedApi.get).toHaveBeenCalledWith('/sub-community-requests');
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/sub-community-requests/req-1/approve'
    );
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/sub-community-requests/req-2/reject'
    );
  });

  it('maps type and my-community endpoints', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: {} } as never)
      .mockResolvedValueOnce({
        data: { moderated: { data: [], pagination: {} } },
      } as never)
      .mockResolvedValueOnce({
        data: { owned: { data: [], pagination: {} } },
      } as never)
      .mockResolvedValueOnce({
        data: { member: { data: [], pagination: {} } },
      } as never);

    await subCommunityService.getTypes();
    await subCommunityService.getMyModeratedSubCommunities(1, 20);
    await subCommunityService.getMyOwnedSubCommunities(1, 20);
    await subCommunityService.getMyMemberSubCommunities(1, 20);
    await subCommunityService.createType({ name: 'Tech' });
    await subCommunityService.updateType('type-1', { name: 'Tech+' });
    await subCommunityService.deleteType('type-2');

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/sub-community-types');
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      '/sub-community/my/moderated',
      {
        params: { page: 1, limit: 20 },
      }
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      3,
      '/sub-community/my/owned',
      {
        params: { page: 1, limit: 20 },
      }
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      4,
      '/sub-community/my/member',
      {
        params: { page: 1, limit: 20 },
      }
    );
    expect(mockedApi.post).toHaveBeenCalledWith('/sub-community-types', {
      name: 'Tech',
    });
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/sub-community-types/type-1',
      {
        name: 'Tech+',
      }
    );
    expect(mockedApi.delete).toHaveBeenCalledWith(
      '/sub-community-types/type-2'
    );
  });
});
