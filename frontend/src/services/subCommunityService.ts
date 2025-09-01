import api from './api';
import {
  SubCommunity,
  SubCommunityMember,
  JoinRequest,
  SubCommunityReport,
  SubCommunityCreationRequest,
  CreateSubCommunityRequestDto,
  ApproveJoinRequestDto,
  UpdateMemberRoleDto,
  PaginationData,
  //   SubCommunityRole,
} from '../types/subCommunity';

export const subCommunityService = {
  // SubCommunity operations
  getAllSubCommunities: async (): Promise<SubCommunity[]> => {
    const response = await api.get('/sub-community');
    return response.data;
  },

  getSubCommunity: async (id: string): Promise<SubCommunity> => {
    const response = await api.get(`/sub-community/${id}`);
    return response.data;
  },

  getSubCommunityByType: async (
    type: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: SubCommunity[]; pagination: PaginationData }> => {
    const response = await api.get(`/sub-community/type/${type}`, {
      params: { page, limit },
    });
    return response.data;
  },

  createSubCommunity: async (data: {
    name: string;
    description: string;
    isPrivate: boolean;
    ownerId: string;
  }): Promise<SubCommunity> => {
    const response = await api.post('/sub-community', data);
    return response.data;
  },

  updateSubCommunity: async (
    id: string,
    data: { name?: string; description?: string; isPrivate?: boolean }
  ): Promise<SubCommunity> => {
    const response = await api.patch(`/sub-community/${id}`, data);
    return response.data;
  },

  deleteSubCommunity: async (id: string): Promise<void> => {
    await api.delete(`/sub-community/${id}`);
  },

  banSubCommunity: async (id: string): Promise<void> => {
    await api.patch(`/sub-community/${id}/ban`);
  },

  // Membership operations
  requestToJoin: async (subCommunityId: string): Promise<JoinRequest> => {
    const response = await api.post(
      `/sub-community/${subCommunityId}/join-request`
    );
    return response.data;
  },

  getPendingJoinRequests: async (
    subCommunityId: string
  ): Promise<JoinRequest[]> => {
    const response = await api.get(
      `/sub-community/${subCommunityId}/join-requests/pending`
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
    return response.data;
  },

  leaveSubCommunity: async (subCommunityId: string): Promise<void> => {
    await api.post(`/sub-community/${subCommunityId}/leave`);
  },

  removeMember: async (
    subCommunityId: string,
    memberId: string
  ): Promise<void> => {
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
    return response.data;
  },

  // Reports
  getReports: async (subCommunityId: string): Promise<SubCommunityReport[]> => {
    const response = await api.get(`/sub-community/${subCommunityId}/reports`);
    return response.data;
  },

  handleReport: async (
    subCommunityId: string,
    reportId: string,
    status: string
  ): Promise<void> => {
    await api.patch(`/sub-community/${subCommunityId}/reports/${reportId}`, {
      status,
    });
  },

  // SubCommunity creation requests
  createSubCommunityRequest: async (
    dto: CreateSubCommunityRequestDto
  ): Promise<SubCommunityCreationRequest> => {
    const response = await api.post('/sub-community-requests', dto);
    return response.data;
  },

  getAllSubCommunityRequests: async (): Promise<
    SubCommunityCreationRequest[]
  > => {
    const response = await api.get('/sub-community-requests');
    return response.data;
  },

  approveSubCommunityRequest: async (
    requestId: string
  ): Promise<SubCommunityCreationRequest> => {
    const response = await api.patch(
      `/sub-community-requests/${requestId}/approve`
    );
    return response.data;
  },

  rejectSubCommunityRequest: async (
    requestId: string
  ): Promise<SubCommunityCreationRequest> => {
    const response = await api.patch(
      `/sub-community-requests/${requestId}/reject`
    );
    return response.data;
  },
};
