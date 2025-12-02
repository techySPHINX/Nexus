import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class DeleteContentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Deletion reason must be at least 10 characters' })
  @MaxLength(500, { message: 'Deletion reason cannot exceed 500 characters' })
  reason: string;
}
