// StartupType.ts
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
  description: string;
  imageUrl?: string;
  websiteUrl?: string;
  status?: string;
  founderId?: string;
  createdAt?: string;
  fundingGoal?: number;
  fundingRaised?: number;
  monetizationModel?: string;
  isFollowing?: boolean;
  followersCount?: number;
}

export interface StartupDetail extends StartupSummary {
  founder?: {
    id: string;
    name?: string;
    profile?: { avatarUrl?: string };
  };
}

export default StartupSummary;
