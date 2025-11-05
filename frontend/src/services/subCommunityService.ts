import api from './api';
import {
  SubCommunity,
  SubCommunityMember,
  JoinRequest,
  SubCommunityReport,
  SubCommunityCreationRequest,
  SubCommunityType,
  CreateSubCommunityRequestDto,
  ApproveJoinRequestDto,
  UpdateMemberRoleDto,
  PaginationData,
  UpdateSubCommunityDto,
  //   SubCommunityRole,
} from '../types/subCommunity';

export const subCommunityService = {
  // SubCommunity operations
  getAllSubCommunities: async (opts?: {
    compact?: boolean;
    page?: number;
    limit?: number;
  }): Promise<SubCommunity[]> => {
    const params: Record<string, unknown> = {};
    if (opts?.compact !== undefined) params.compact = opts.compact;
    if (opts?.page) params.page = opts.page;
    if (opts?.limit) params.limit = opts.limit;
    const response = await api.get('/sub-community', { params });
    console.log('Fetched all sub-communities:', response.data);
    return response.data;
  },

  getSubCommunity: async (id: string): Promise<SubCommunity> => {
    const response = await api.get(`/sub-community/${id}`);
    return response.data;
  },

  getSubCommunityByType: async (
    type: string,
    page: number = 1,
    limit: number = 20,
    q?: string
  ): Promise<{ data: SubCommunity[]; pagination: PaginationData }> => {
    const params: Record<string, unknown> = { page, limit };
    if (q) params.q = q;
    const response = await api.get(`/sub-community/type/${type}`, {
      params,
    });
    console.log(`Fetched sub-communities of type ${type}:`, response.data);
    return response.data;
  },

  createSubCommunity: async (data: {
    name: string;
    description: string;
    isPrivate: boolean;
    ownerId: string;
  }): Promise<SubCommunity> => {
    const response = await api.post('/sub-community', data);
    console.log('Created sub-community:', response.data);
    return response.data;
  },

  updateSubCommunity: async (
    id: string,
    data: UpdateSubCommunityDto
  ): Promise<SubCommunity> => {
    const response = await api.patch(`/sub-community/${id}`, data);
    console.log(`Updated sub-community with id: ${id}`, response.data);
    return response.data;
  },

  deleteSubCommunity: async (id: string): Promise<void> => {
    await api.delete(`/sub-community/${id}`);
    console.log(`Deleted sub-community with id: ${id}`);
  },

  banSubCommunity: async (id: string): Promise<void> => {
    await api.patch(`/sub-community/${id}/ban`);
    console.log(`Banned sub-community with id: ${id}`);
  },

  // Membership operations
  requestToJoin: async (subCommunityId: string): Promise<JoinRequest> => {
    const response = await api.post(
      `/sub-community/${subCommunityId}/join-request`
    );
    console.log(
      `Requested to join sub-community with id: ${subCommunityId}`,
      response.data
    );
    return response.data;
  },

  getPendingJoinRequests: async (
    subCommunityId: string
  ): Promise<JoinRequest[]> => {
    const response = await api.get(
      `/sub-community/${subCommunityId}/join-requests/pending`
    );
    console.log(
      `Fetched pending join requests for sub-community with id: ${subCommunityId}`,
      response.data
    );
    return response.data;
  },

  approveJoinRequest: async (
    subCommunityId: string,
    joinRequestId: string,
    dto: ApproveJoinRequestDto
  ): Promise<JoinRequest> => {
    const response = await api.patch(
      `/sub-community/${subCommunityId}/join-requests/${joinRequestId}/approve`,
      dto
    );
    console.log(
      `Approved join request with id: ${joinRequestId} for sub-community with id: ${subCommunityId}`,
      response.data
    );
    return response.data;
  },

  leaveSubCommunity: async (subCommunityId: string): Promise<void> => {
    await api.post(`/sub-community/${subCommunityId}/leave`);
  },

  removeMember: async (
    subCommunityId: string,
    memberId: string
  ): Promise<void> => {
    console.log(
      `Removing member with id: ${memberId} from sub-community with id: ${subCommunityId}`
    );
    await api.delete(`/sub-community/${subCommunityId}/members/${memberId}`);
  },

  updateMemberRole: async (
    subCommunityId: string,
    memberId: string,
    role: UpdateMemberRoleDto
  ): Promise<SubCommunityMember> => {
    const response = await api.patch(
      `/sub-community/${subCommunityId}/members/${memberId}/role`,
      role
    );
    console.log(
      `Updated role for member with id: ${memberId} in sub-community with id: ${subCommunityId}`,
      response.data
    );
    return response.data;
  },

  // Reports
  getReports: async (subCommunityId: string): Promise<SubCommunityReport[]> => {
    const response = await api.get(`/sub-community/${subCommunityId}/reports`);
    console.log(
      `Fetched reports for sub-community with id: ${subCommunityId}`,
      response.data
    );
    return response.data;
  },

  handleReport: async (
    subCommunityId: string,
    reportId: string,
    status: string
  ): Promise<void> => {
    console.log(
      `Handling report with id: ${reportId} for sub-community with id: ${subCommunityId} with status: ${status}`
    );
    await api.patch(`/sub-community/${subCommunityId}/reports/${reportId}`, {
      status,
    });
  },

  // SubCommunity creation requests
  createSubCommunityRequest: async (
    dto: CreateSubCommunityRequestDto
  ): Promise<SubCommunityCreationRequest> => {
    const response = await api.post('/sub-community-requests', dto);
    console.log('Created sub-community creation request:', response.data);
    return response.data;
  },

  getAllSubCommunityRequests: async (): Promise<
    SubCommunityCreationRequest[]
  > => {
    const response = await api.get('/sub-community-requests');
    console.log('Fetched all sub-community creation requests:', response.data);
    return response.data;
  },

  approveSubCommunityRequest: async (
    requestId: string
  ): Promise<SubCommunityCreationRequest> => {
    const response = await api.patch(
      `/sub-community-requests/${requestId}/approve`
    );
    console.log(
      `Approved sub-community creation request with id: ${requestId}`,
      response.data
    );
    return response.data;
  },

  rejectSubCommunityRequest: async (
    requestId: string
  ): Promise<SubCommunityCreationRequest> => {
    const response = await api.patch(
      `/sub-community-requests/${requestId}/reject`
    );
    console.log(
      `Rejected sub-community creation request with id: ${requestId}`,
      response.data
    );
    return response.data;
  },

  // Types
  getTypes: async (): Promise<SubCommunityType[]> => {
    const response = await api.get('/sub-community-types');
    console.log('Fetched sub-community types:', response.data);
    return response.data;
  },
  createType: async (data: {
    name: string;
    slug?: string;
    description?: string;
  }): Promise<SubCommunityType> => {
    const response = await api.post('/sub-community-types', data);
    console.log('Created sub-community type:', response.data);
    return response.data;
  },
  updateType: async (
    id: string,
    data: { name?: string; slug?: string; description?: string }
  ): Promise<SubCommunityType> => {
    const response = await api.patch(`/sub-community-types/${id}`, data);
    console.log(`Updated sub-community type with id: ${id}`, response.data);
    return response.data;
  },
  deleteType: async (id: string): Promise<void> => {
    console.log(`Deleting sub-community type with id: ${id}`);
    await api.delete(`/sub-community-types/${id}`);
  },
};
