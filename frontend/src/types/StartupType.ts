// StartupType.ts
export enum StartupStatus {
  IDEA = 'IDEA',
  PROTOTYPING = 'PROTOTYPING',
  BETA = 'BETA',
  LAUNCHED = 'LAUNCHED',
}

export interface StartupStats {
  totalStartups: number;
  myStartups: number;
  followedStartups: number;
}

export interface StartupComment {
  id: string;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    profile?: { avatarUrl?: string };
  };
  pending?: boolean;
}

export interface StartupCommentsResponse {
  comments: StartupComment[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface StartupSummary {
  id: string;
  name: string;
  imageUrl?: string;
  websiteUrl?: string;
  status?: StartupStatus;
  founderId?: string;
  createdAt?: string;
  fundingGoal?: number;
  fundingRaised?: number;
  monetizationModel?: string[];
  isFollowing?: boolean;
  followersCount?: number;
}

export interface StartupDetail extends StartupSummary {
  description: string;
  founder?: {
    id: string;
    name?: string;
    profile?: { avatarUrl?: string };
  };
}

export interface CreateStartupSummary {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  websiteUrl?: string;
  status?: StartupStatus;
  founderId?: string;
  createdAt?: string;
  fundingGoal?: number;
  fundingRaised?: number;
  monetizationModel?: string[];
  isFollowing?: boolean;
  followersCount?: number;
}

export default StartupSummary;
