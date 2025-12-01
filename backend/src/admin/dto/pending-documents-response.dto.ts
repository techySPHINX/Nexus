export class PendingDocumentsStatsDto {
  total: number;
  byRole: {
    STUDENT: number;
    ALUMNI: number;
  };
  byDepartment: Record<string, number>;
  byGraduationYear: Record<string, number>;
  byDocumentType: Record<string, number>;
  avgWaitingTime: number; // in hours
  oldestRequest: Date | null;
  newestRequest: Date | null;
}

export class PendingDocumentsResponseDto {
  data: any[]; // Will contain documents with user and profile info
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: PendingDocumentsStatsDto;
}
