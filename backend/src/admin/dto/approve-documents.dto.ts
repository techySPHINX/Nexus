import { IsArray, IsString, IsOptional, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class ApproveDocumentsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one document ID is required' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  documentIds: string[];

  @IsOptional()
  @IsString()
  adminComments?: string;
}
