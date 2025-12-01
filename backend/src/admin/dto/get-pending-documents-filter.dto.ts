import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsArray, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortBy {
  SUBMITTED_AT = 'submittedAt',
  USER_NAME = 'userName',
  GRADUATION_YEAR = 'graduationYear',
  ROLE = 'role',
  DEPARTMENT = 'department',
}

export enum DocumentTypeFilter {
  ALL = 'ALL',
  STUDENT_ID = 'STUDENT_ID',
  ALUMNI_PROOF = 'ALUMNI_PROOF',
  GRADUATION_CERTIFICATE = 'GRADUATION_CERTIFICATE',
  ENROLLMENT_LETTER = 'ENROLLMENT_LETTER',
  OTHERS = 'OTHERS',
}

export class GetPendingDocumentsFilterDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Sorting
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.SUBMITTED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  // Filters - User fields
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  graduationYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  graduationYearFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  graduationYearTo?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase().trim())
  role?: string; // STUDENT or ALUMNI

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  searchName?: string; // Search by user name

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  searchEmail?: string; // Search by email

  // Filters - Profile fields
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  department?: string; // dept field

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  branch?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  course?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  year?: string; // Academic year

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  location?: string;

  // Filters - Document specific
  @IsOptional()
  @IsEnum(DocumentTypeFilter)
  documentType?: DocumentTypeFilter = DocumentTypeFilter.ALL;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  documentTypes?: string[]; // Multiple document types

  // Date range filters
  @IsOptional()
  @IsDateString()
  submittedAfter?: string;

  @IsOptional()
  @IsDateString()
  submittedBefore?: string;

  // Account status filter
  @IsOptional()
  @IsString()
  accountStatus?: string;

  // Batch operations support
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeStats?: boolean = false; // Include statistics in response
}
