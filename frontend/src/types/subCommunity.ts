import { User } from './profileType';
import { Post } from './post';

export enum SubCommunityRole {
  OWNER = 'OWNER',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export enum SubCommunityStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
  PENDING = 'PENDING',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SubCommunityTypeEnum {
  ALL = 'ALL',
  TECH = 'TECH',
  GAME = 'GAME',
  MUSIC = 'MUSIC',
  SPORT = 'SPORT',
  ART = 'ART',
  SCIENCE = 'SCIENCE',
  EDUCATION = 'EDUCATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  LIFESTYLE = 'LIFESTYLE',
  OTHER = 'OTHER',
}

export interface SubCommunity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  isPrivate: boolean;
  status: SubCommunityStatus;
  ownerId: string;
  subCommunityCreationRequestId: string | null;
  owner: {
    id: string;
    name: string;
  };
  _count?: {
    members: number;
    posts: number;
  };
  members?: SubCommunityMember[];
  posts?: Post[];
  type: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// export interface SubCommunityType {
//   id: string;
//   type: string;
//   SubCommunity: SubCommunity[];
// }

export interface SubCommunityTypeResponse {
  data: SubCommunity[];
  pagination: PaginationData;
}

export interface SubCommunityMember {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  subCommunityId: string;
  role: SubCommunityRole;
  user: User;
  subCommunity?: SubCommunity;
}

export interface JoinRequest {
  id: string;
  userId: string;
  subCommunityId: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  subCommunity?: SubCommunity;
}

export interface SubCommunityCreationRequest {
  id: string;
  name: string;
  description: string;
  rules: string;
  type: string;
  status: RequestStatus;
  requesterId: string;
  adminId?: string;
  subCommunityId?: string;
  createdAt: Date;
  updatedAt: Date;
  requester: User;
  admin?: User;
  subCommunity?: SubCommunity;
}

export interface SubCommunityReport {
  id: string;
  subCommunityId: string;
  userId: string;
  reason: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  subCommunity?: SubCommunity;
}

export interface UpdateSubCommunityDto {
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  isPrivate: boolean;
}

export interface CreateSubCommunityRequestDto {
  name: string;
  description: string;
  rules: string;
  type: string;
}

export interface ApproveJoinRequestDto {
  approved: boolean;
  reason?: string;
}

export interface UpdateMemberRoleDto {
  role: SubCommunityRole;
}
