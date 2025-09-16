import { User } from './profileType';

// import { Skill } from './profileType';
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
  seeking?: string;
}

export interface ProjectInterface extends CreateProjectInterface {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  owner: User;
  supporters?: supporters_followers_Interface[];
  followers?: supporters_followers_Interface[];
  collaborationRequests?: CollaborationRequestInterface[];
  comments?: ProjectComment[];
  teamMembers?: ProjectTeam[];
  updates?: ProjectUpdateInterface[];
}

interface supporters_followers_Interface {
  id: string;
  userId: string;
  projectId: string;
  createdAt: Date;
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
  personalize?: boolean;
}

export interface CreateProjectUpdateInterface {
  title: string;
  content: string;
}

export interface ProjectUpdateInterface extends CreateProjectUpdateInterface {
  id: string;
  projectId: string;
  createdAt: Date;
  authorId: string;
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
  projectId: string;
  userId: string;
  status: CollaborationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectComment {
  userId: string;
  comment: string;
}

export interface ProjectTeam {
  userId: string;
  role: string;
}
