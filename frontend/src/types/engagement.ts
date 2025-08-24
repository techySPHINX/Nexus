export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  location?: string;
  interests?: string;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  flairId?: string;
  imageUrl?: string;
  type?: string;
  createdAt: string;
  status: PostStatus;
  subCommunityId?: string;
  updatedAt: string;
  author: User;
  subCommunity?: SubCommunity;
  comments: Comment[];
  Vote?: Vote[];
  _count?: {
    Vote: number;
    Comment: number;
  };
  userVote?: Vote | null;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  replies?: Comment[];
  Vote?: Vote[];
}

export interface Vote {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  type: VoteType;
  targetType: VoteTargetType;
}

export interface SubCommunity {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  isPrivate: boolean;
  status: SubCommunityStatus;
}

export enum Role {
  STUDENT = 'STUDENT',
  ALUM = 'ALUM',
  ADMIN = 'ADMIN',
  MENTOR = 'MENTOR',
}

export enum VoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
}

export enum VoteTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
}

export enum PostStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SubCommunityStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
}
