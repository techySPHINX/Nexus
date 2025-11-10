import { Skill } from './profileType';

// src/types/connections.ts
export interface Profile {
  bio?: string;
  location?: string;
  interests?: string;
  avatarUrl?: string;
  skills: Skill[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  profile?: Profile;
}

export interface Connection {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt: string;
  user: User;
}

export interface PendingRequest {
  id: string;
  createdAt: string;
  requester?: User;
  recipient?: User;
}

export interface ConnectionSuggestion {
  user: User;
  matchScore: number;
  reasons: string[];
}

export interface ConnectionStats {
  total: number;
  pendingReceived: number;
  pendingSent: number;
  byRole: {
    students: number;
    alumni: number;
  };
  recent30Days: number;
}

export interface ConnectionResponse {
  connections?: Connection[];
  requests?: PendingRequest[];
  suggestions?: ConnectionSuggestion[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
