// Export enums and types that will be used in other files
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profile?: Profile;
}

export interface Skill {
  id: string;
  name: string;
  endorsements: Endorsement[];
}

export interface Endorsement {
  id: string;
  endorser: User;
  createdAt: string;
}

export interface ProfileBadge {
  badge: {
    id: string;
    name: string;
    icon: string;
    assignedAt?: string;
  };
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
}
