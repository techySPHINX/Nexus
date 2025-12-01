import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  MaxLength,
  MinLength,
} from 'class-validator';

export class BatchResolveReportsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one report ID must be provided' })
  @IsString({ each: true })
  reportIds: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Resolution reason must be at least 10 characters' })
  @MaxLength(1000, { message: 'Resolution reason cannot exceed 1000 characters' })
  reason: string;
}

export class BatchDismissReportsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one report ID must be provided' })
  @IsString({ each: true })
  reportIds: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Dismissal reason must be at least 10 characters' })
  @MaxLength(1000, { message: 'Dismissal reason cannot exceed 1000 characters' })
  reason: string;
}
