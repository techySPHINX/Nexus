import { User } from './engagement';
import { Role } from './profileType';

export enum status {
  IDEA = 'IDEA',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface CreateProjectInterface {
  title: string;
  description: string;
  githubUrl?: string;
  websiteUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  skills: string[];
  tags: string[];
  status: status;
  seekingCollaboration?: boolean;
  seeking?: string[];
}

export interface PaginatedProjectsInterface {
  data: ProjectInterface[];
  pagination: ProjectPaginationResponse;
}

export interface ProjectInterface {
  id: string;
  title: string;
  imageUrl?: string;
  githubUrl?: string;
  tags: string[];
  status: status;
  seekingCollaboration?: string[];
  seeking?: string[];
  createdAt: Date;
  updatedAt?: Date;
  owner: {
    id: string;
    name: string;
    role?: string;
    profile: {
      avatarUrl?: string;
    };
  };
  _count: {
    supporters: number;
    followers: number;
    collaborationRequests?: number;
  };
  supporters?: { userId: string }[];
  followers?: { userId: string }[];
  collaborationRequests?: { userId: string }[];
  teamMembers?: { userId: string }[];
}

export interface ProjectDetailInterface extends ProjectInterface {
  description: string;
  videoUrl?: string;
  websiteUrl?: string;
  skills: string[];
  _count: {
    supporters: number;
    followers: number;
    comments: number;
    teamMembers: number;
    updates: number;
  };
}

export interface ProjectComment {
  id: string;
  comment: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    role?: Role;
    profile: {
      avatarUrl?: string;
    };
  };
}

export interface ProjectCommentsResponse {
  comments: ProjectComment[];
  pagination: CommentPaginationResponse;
}

export enum sortBy {
  SUPPORTERS = 'supporters',
  FOLLOWERS = 'followers',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  COMMENTS = 'comments',
}

export interface FilterProjectInterface {
  tags?: string[];
  sortBy?: sortBy;
  search?: string;
  status?: status;
  seeking?: string[];
  seekingCollaboration?: boolean;
  personalize?: boolean;
  pageSize?: number;
  cursor?: string;
}

export interface CreateProjectUpdateInterface {
  title: string;
  content: string;
}

export interface ProjectUpdateInterface extends CreateProjectUpdateInterface {
  id: string;
  createdAt: Date;
}

export enum CollaborationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface CreateCollaborationRequestInterface {
  message?: string;
}

export interface CollaborationRequestInterface
  extends CreateCollaborationRequestInterface {
  id: string;
  user: User;
  status: CollaborationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTeam {
  id: string;
  role: string;
  createdAt: Date;
  user?: {
    id?: string;
    name: string;
    role?: string;
    profile: {
      avatarUrl?: string;
    };
  };
}

export interface CommentPaginationResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProjectPaginationResponse {
  nextCursor?: string;
  hasNext: boolean;
}

export interface Tags {
  id: string;
  name: string;
}
