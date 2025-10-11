import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
  IsArray,
  ValidateNested,
  Matches,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

/**
 * DTO for uploading verification documents
 */
export class DocumentUploadDto {
  @IsEnum([
    'STUDENT_ID',
    'TRANSCRIPT',
    'DEGREE_CERTIFICATE',
    'ALUMNI_CERTIFICATE',
    'EMPLOYMENT_PROOF',
  ])
  documentType: string;

  @IsNotEmpty()
  documentUrl: string;
}

/**
 * Enhanced registration DTO with document verification
 */
export class RegisterWithDocumentsDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentUploadDto)
  documents: DocumentUploadDto[];

  @IsOptional()
  studentId?: string;

  @IsOptional()
  graduationYear?: number;

  @IsOptional()
  department?: string;
}
