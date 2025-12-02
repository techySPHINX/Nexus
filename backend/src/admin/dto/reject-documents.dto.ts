import { IsArray, IsString, IsNotEmpty, IsOptional, ArrayMinSize, MinLength } from 'class-validator';

export class RejectDocumentsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one document ID is required' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  documentIds: string[];

  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters' })
  reason: string;

  @IsOptional()
  @IsString()
  adminComments?: string;
}
