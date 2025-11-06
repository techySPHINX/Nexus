import { VoteType } from './engagement';

// profileType.ts
export enum Role {
  STUDENT = 'STUDENT',
  ALUM = 'ALUM',
  ADMIN = 'ADMIN',
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

export enum PostStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ProjectStatus {
  IDEA = 'IDEA',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum StartupStatus {
  IDEA = 'IDEA',
  PROTOTYPING = 'PROTOTYPING',
  BETA = 'BETA',
  LAUNCHED = 'LAUNCHED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  bannerUrl?: string;
  description?: string;
  createdAt: string;
  profile?: Profile;
  ownedSubCommunities?: SubCommunity[];
  subCommunityMemberships?: SubCommunityMembership[];
  Comment?: UserComment[];
  Post?: UserPost[];
  badges?: UserBadge[];
  projects?: Project[];
  startups?: Startup[];
  userPoints?: UserPoints;
  postedReferrals?: Referral[];
  projectUpdates?: ProjectUpdate[];
  events?: Event[];
  _count: {
    Post: number;
    Comment: number;
    projects: number;
    ownedSubCommunities: number;
    subCommunityMemberships: number;
    startups: number;
    postedReferrals: number;
    events: number;
  };
}

export interface SubCommunity {
  id: string;
  name: string;
  description?: string;
  type: string;
  iconUrl?: string;
  status: string;
  createdAt: string;
}

export interface SubCommunityMembership {
  role: string;
  subCommunity: SubCommunity;
}

export interface UserComment {
  id: string;
  content: string;
  postId: string;
  createdAt: string;
  post?: {
    subject: string;
  };
}

export interface UserPost {
  id: string;
  subject: string;
  type?: string;
  createdAt: Date;
  subCommunity?: {
    id: string;
    name: string;
    description?: string;
  };
  Comment?: { id: string }[];
  Vote?: [{ id: string; type: VoteType }];
}

export interface UserBadge {
  assignedAt: string;
  badge: Badge;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  githubUrl?: string;
  websiteUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  tags: string[];
  status: ProjectStatus;
  seeking: string[];
  skills: string[];
  createdAt: string;
  supporters?: ProjectSupport[];
  followers?: ProjectFollower[];
}

export interface ProjectSupport {
  user: {
    id: string;
    name: string;
  };
}

export interface ProjectFollower {
  user: {
    id: string;
    name: string;
  };
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  websiteUrl: string;
  status: StartupStatus;
  fundingGoal?: number;
  fundingRaised?: number;
  monetizationModel?: string[];
  createdAt: string;
}

export interface UserPoints {
  points: number;
  transactions: PointTransaction[];
}

export interface PointTransaction {
  points: number;
  type: string;
  entityId?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  company: string;
  jobTitle: string;
  description: string;
  requirements: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  applications?: ReferralApplication[];
}

export interface ReferralApplication {
  id: string;
  status: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
  };
}

export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
  };
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  registrationLink?: string;
  date: string;
  status: string;
  category: string;
  tags: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  endorsements?: Endorsement[];
}

export interface Endorsement {
  id: string;
  endorser: {
    id: string;
    name: string;
    role: Role;
    profile?: {
      avatarUrl?: string;
    };
  };
  skill?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface ProfileBadge {
  badge: Badge;
  assignedAt: string;
}

export interface Connection {
  id: string;
  status: ConnectionStatus;
  createdAt: string;
  recipient: User;
  requester: User;
}

export interface Profile {
  id: string;
  bio?: string | null;
  location?: string | null;
  interests?: string | null;
  avatarUrl?: string | null;
  dept?: string | null;
  year?: string | null;
  branch?: string | null;
  course?: string | null;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
  endorsements: Endorsement[];
  user: User;
}

export interface UpdateProfileInput {
  bio: string;
  location: string;
  interests: string;
  avatarUrl: string;
  skills: string[];
  dept?: string;
  year?: string;
  branch?: string;
  course?: string;
}
