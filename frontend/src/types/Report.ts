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
  commentId?: string;
  subCommunityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReportDto {
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}
