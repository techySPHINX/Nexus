import { Role, VoteType } from './engagement';

export interface Post {
  id: string;
  authorId: string;
  subject: string;
  content: string;
  flairId?: string;
  imageUrl?: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  Vote?: [{ id: string; type: VoteType }];
  author: {
    id: string;
    name: string;
    role: Role;
    profile: {
      bio?: string;
      avatarUrl?: string;
    };
  };
  _count: {
    Vote: number;
    Comment: number;
  };
  subCommunityId?: string;
  subCommunity?: {
    id: string;
    name: string;
    description: string;
  };
}
