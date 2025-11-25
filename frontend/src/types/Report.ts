export interface CreateReportDto {
  type:
    | 'POST'
    | 'COMMENT'
    | 'STARTUP'
    | 'PROJECT'
    | 'SUBCOMMUNITY'
    | 'USER'
    | 'OTHER';
  reason: string;
  postId?: string;
  commentId?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter?: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
  reason: string;
  type:
    | 'POST'
    | 'COMMENT'
    | 'STARTUP'
    | 'PROJECT'
    | 'SUBCOMMUNITY'
    | 'USER'
    | 'OTHER';
  postId?: string;
  post?: {
    id: string;
    subject: string;
    subCommunityId?: string | null;
  };
  commentId?: string;
  comment?: {
    id: string;
    content: string;
    postId?: string | null;
  };
  subCommunityId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReportDto {
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}
