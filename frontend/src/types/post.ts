export interface Post {
  id: string;
  authorId: string;
  content: string;
  flairId?: string;
  imageUrl?: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
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
